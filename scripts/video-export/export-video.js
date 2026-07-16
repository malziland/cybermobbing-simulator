#!/usr/bin/env node
/**
 * export-video.js — vollständige Variante
 *
 * Filmt die Cybermobbing-Simulation als MP4 (Hochformat 1080x1920, ~123 Sek).
 * Audio = BGM + alle Web-Audio-Pling-/Tipp-Sounds, im Browser via
 * MediaRecorder + AudioContext-Hook eingefangen — kein BlackHole nötig.
 *
 * Verwendung:
 *   cd scripts/video-export
 *   npm install                          # einmalig
 *   npx playwright install chromium      # einmalig
 *   node export-video.js
 *
 * Output: ./output/cybermobbing-simulation.mp4
 */

const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ---------- KONFIG ----------
// 4K-Hochformat (~2160x4680). Die Page wird nativ in dieser Auflösung gerendert,
// und das .phone-Element per CSS-Transform skaliert. So ist nichts hochskaliertes
// Matsch — der Browser zeichnet jeden Pixel scharf.
const PHONE_W = 393;
const PHONE_H = 852;
const VIEW_W = 2160;
const VIEW_H = 4680;
// SCALE so wählen, dass Phone den Frame voll füllt (kleinste Überdeckung)
const PHONE_SCALE = Math.max(VIEW_W / PHONE_W, VIEW_H / PHONE_H);
const OUT_W = VIEW_W;
const OUT_H = VIEW_H;
// Die Simulation läuft tatsächlich länger als 120s:
//   0-112s: WhatsApp -> Instagram -> TikTok -> Homescreen -> Messages
//   112-132s: Dramatic Text (p5)
//   132s+: CTA mit Helpline-Logo (p6)
// Mit Puffer → 165s reichen für komplettes Finale.
const SIM_SECONDS = 132;
const TAIL_SECONDS = 33;
const TOTAL_SECONDS = SIM_SECONDS + TAIL_SECONDS;
const PORT = 8765;

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(__dirname, 'output');
const TMP_DIR = path.join(__dirname, '_tmp');
const FINAL_MP4 = path.join(OUT_DIR, 'cybermobbing-simulation.mp4');
const FINAL_MP4_FHD = path.join(OUT_DIR, 'cybermobbing-simulation_FHD.mp4');
const FHD_W = 1080;
const FHD_H = 2340;

function log(msg) { console.log(`[export] ${msg}`); }
function fail(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function which(cmd) {
  const r = spawnSync('which', [cmd], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

function checkDeps() {
  if (!which('ffmpeg')) fail('ffmpeg fehlt. Installiere mit: brew install ffmpeg');
  if (!fs.existsSync(path.join(__dirname, 'node_modules', 'playwright'))) {
    fail('playwright fehlt. Im Ordner scripts/video-export ausführen: npm install');
  }
}

const CONFIG_STUB = `
var firebaseConfig = { databaseURL: 'http://offline.local' };
var DAILY_LIMIT = 0;
var helplineConfig = {
  logo: '', logoAlt: '',
  link: 'https://rataufdraht.at', linkLabel: 'rataufdraht.at',
  infoLink: '', infoLabel: 'Weiterführende Infos', infoLabelEn: 'More information',
  slogan: 'Hilfe holen. Jetzt.', sloganEn: 'Get help. Now.'
};
(function () {
  var noop = function () {};
  var ref = {
    once: function (_, cb) { cb({ val: function () { return 0; } }); return Promise.resolve({ val: function () { return 0; } }); },
    on: noop, off: noop, transaction: noop, set: noop, update: noop, remove: noop,
  };
  var db = { ref: function () { return ref; } };
  if (window.firebase) {
    window.firebase.initializeApp = function () { return { name: 'stub' }; };
    window.firebase.database = function () { return db; };
  }
})();
`;

/**
 * Wird VOR allen Page-Scripts injiziert.
 * - Wrappt AudioContext: alles, was die Simulation per Web Audio API erzeugt
 *   (Plings, Typing-Ticks), läuft durch einen Proxy-Knoten — der spielt es
 *   sowohl zum normalen Output als auch in einen MediaStreamDestination.
 * - Hängt das <audio id="bgm"> Element via createMediaElementSource in
 *   denselben Context → BGM landet im selben gemixten Track.
 * - CSS-Override: das Handy (.phone) füllt den ganzen Viewport, damit kein
 *   schwarzer Rand drumherum entsteht.
 * - Stellt window.__startCap()/__stopCap() bereit, die Node aus Playwright triggert.
 */
const FULLSCREEN_CSS = `
html, body { margin: 0 !important; padding: 0 !important; background: #000 !important; overflow: hidden !important; }
/* Start-Screen, Phone und CTA-Endseite alle auf Phone-Format (393x852)
   zwingen und dann gleich skalieren, damit alle drei Bildschirme den
   gleichen sauberen Look haben. */
#start, .cta-screen {
  inset: auto !important;
  top: 0 !important;
  left: 0 !important;
  width: ${PHONE_W}px !important;
  height: ${PHONE_H}px !important;
  transform: scale(${PHONE_SCALE}) !important;
  transform-origin: 0 0 !important;
  position: fixed !important;
}
.phone {
  top: 0 !important;
  left: 0 !important;
  transform: scale(${PHONE_SCALE}) !important;
  transform-origin: 0 0 !important;
  position: fixed !important;
  max-width: none !important;
  max-height: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
/* UI-Elemente ausblenden, die für das Workshop-Backup nicht gebraucht werden */
#startBtn,
#start .start-footer,
.fin-actions,
.cta-links,
.disclaimer,
.impr-link-bar { display: none !important; }
`;
const INIT_SCRIPT = `
(function () {
  if (window.__captureSetupDone) return;
  window.__captureSetupDone = true;

  // Fullscreen-CSS einfügen, sobald <head> existiert
  function injectCss() {
    try {
      if (!document || !(document.head || document.documentElement)) return;
      if (document.getElementById && document.getElementById('__fs_css')) return;
      var s = document.createElement('style');
      s.id = '__fs_css';
      s.textContent = ${JSON.stringify(FULLSCREEN_CSS)};
      (document.head || document.documentElement).appendChild(s);
    } catch (e) { /* ignore — wird beim DOMContentLoaded nochmal versucht */ }
  }
  injectCss();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCss);
  }

  var RealAC = window.AudioContext || window.webkitAudioContext;
  if (!RealAC) return;

  var combinedStream = new MediaStream();
  window.__getStream = function () { return combinedStream; };

  function WrappedAC() {
    var ctx = new RealAC();
    try {
      var captureDest = ctx.createMediaStreamDestination();
      var realDest = ctx.destination;
      var proxy = ctx.createGain();
      proxy.gain.value = 1.0;
      proxy.connect(realDest);
      proxy.connect(captureDest);
      // ctx.destination ist ein Getter im Prototype — wir shadowen ihn instance-level,
      // sodass alle nachfolgenden node.connect(ctx.destination) durch unseren Proxy laufen
      Object.defineProperty(ctx, 'destination', {
        value: proxy, writable: false, configurable: true,
      });

      // BGM jetzt in DIESEN ctx einhängen, damit es durch denselben Proxy läuft
      // und damit auch im captureDest landet → ein einziger gemischter Track.
      var bgm = document.getElementById('bgm');
      if (bgm && !bgm.__hookedToCtx) {
        bgm.__hookedToCtx = true;
        try {
          var src = ctx.createMediaElementSource(bgm);
          src.connect(proxy); // direkt an Proxy = an realDest + captureDest
        } catch (e) {
          console.warn('BGM in ctx failed:', e);
        }
      }

      // Den einen captureDest-Track als unseren Aufnahme-Stream merken
      captureDest.stream.getAudioTracks().forEach(function (t) {
        combinedStream.addTrack(t);
      });
      window.__synthCtx = ctx;
    } catch (e) {
      console.warn('AudioContext wrap failed:', e);
    }
    return ctx;
  }
  WrappedAC.prototype = RealAC.prototype;
  window.AudioContext = WrappedAC;
  window.webkitAudioContext = WrappedAC;

  // MediaRecorder API
  window.__audioChunks = [];
  window.__startCap = function () {
    return new Promise(function (resolve, reject) {
      if (!combinedStream.getAudioTracks().length) {
        return reject('Keine Audio-Tracks im MediaStream');
      }
      var mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];
      var mime = mimeCandidates.find(function (m) {
        return window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m);
      });
      if (!mime) return reject('Kein passender MediaRecorder-MIME-Type');
      try {
        var mr = new MediaRecorder(combinedStream, { mimeType: mime, audioBitsPerSecond: 192000 });
        mr.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) window.__audioChunks.push(e.data);
        };
        mr.start(250);
        window.__mr = mr;
        resolve(mime);
      } catch (e) { reject(String(e)); }
    });
  };

  window.__stopCap = function () {
    return new Promise(function (resolve) {
      var mr = window.__mr;
      if (!mr) return resolve(null);
      mr.onstop = function () {
        var blob = new Blob(window.__audioChunks, { type: 'audio/webm' });
        var reader = new FileReader();
        reader.onloadend = function () {
          // base64 abschneiden (data:audio/webm;base64,XXX → nur XXX)
          var s = reader.result || '';
          var i = s.indexOf(',');
          resolve(i >= 0 ? s.substring(i + 1) : s);
        };
        reader.readAsDataURL(blob);
      };
      mr.stop();
    });
  };
})();
`;

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    let rel = url === '/' ? '/index.html' : url;
    const filePath = path.join(ROOT_DIR, rel);
    if (!filePath.startsWith(ROOT_DIR)) { res.writeHead(403).end(); return; }
    // Always serve the stub (never the real config), so filming can never
    // touch the production database or inflate the live view counter (OPS-01)
    if (rel === '/js/config.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(CONFIG_STUB);
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      const ext = path.extname(filePath).toLowerCase();
      const ct = {
        '.html': 'text/html; charset=utf-8',
        '.js':   'application/javascript; charset=utf-8',
        '.css':  'text/css; charset=utf-8',
        '.mp3':  'audio/mpeg',
        '.png':  'image/png',
        '.jpg':  'image/jpeg',
        '.svg':  'image/svg+xml',
        '.json': 'application/json',
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function main() {
  checkDeps();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  let server, browser;
  const cleanup = () => {
    try { if (browser) browser.close(); } catch (_) {}
    try { if (server) server.close(); } catch (_) {}
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });

  // Wieviel Sekunden Startseite VOR dem Klick im Video sichtbar sind
  const PRE_CLICK_SEC = 3;
  let audioOffsetSec;

  try {
    server = await startStaticServer();
    log(`Static-Server: http://127.0.0.1:${PORT}`);

    // Headless Chromium mit Audio aktiviert
    browser = await chromium.launch({
      headless: true,
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-ui-for-media-stream',
        '--lang=de-DE',
      ],
    });
    const tRecordingStart = Date.now();
    const context = await browser.newContext({
      viewport: { width: VIEW_W, height: VIEW_H },
      deviceScaleFactor: 1,
      locale: 'de-DE',
      timezoneId: 'Europe/Vienna',
      recordVideo: { dir: TMP_DIR, size: { width: VIEW_W, height: VIEW_H } },
    });
    await context.addInitScript({ content: INIT_SCRIPT });
    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`  [browser ${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      console.log(`  [page error] ${err.message}`);
    });

    log('Lade Simulation …');
    await page.goto(`http://127.0.0.1:${PORT}/?lang=de`);
    await page.waitForSelector('#startBtn', { state: 'attached' });

    log(`Startseite ${PRE_CLICK_SEC}s anzeigen …`);
    await sleep(PRE_CLICK_SEC * 1000);

    log('Simulation starten (über JS-Click, Button ist ausgeblendet) …');
    await page.evaluate(() => document.getElementById('startBtn').click());

    // initAudio() läuft jetzt → AudioContext entsteht → unser Wrap registriert ihn
    await sleep(500);

    // Audio-Capture starten
    const mime = await page.evaluate(() => window.__startCap());
    audioOffsetSec = (Date.now() - tRecordingStart) / 1000;
    log(`Audio-Capture läuft (${mime}, Offset ${audioOffsetSec.toFixed(2)}s) — filme ${TOTAL_SECONDS}s …`);

    const tStart = Date.now();
    await sleep(TOTAL_SECONDS * 1000);
    const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
    log(`Aufnahme beendet nach ${elapsed}s`);

    // Audio-Capture stoppen + Daten holen
    const audioB64 = await page.evaluate(() => window.__stopCap());
    const audioWebm = path.join(TMP_DIR, 'audio.webm');
    if (audioB64) {
      fs.writeFileSync(audioWebm, Buffer.from(audioB64, 'base64'));
      const aSize = (fs.statSync(audioWebm).size / 1024).toFixed(0);
      log(`Audio-Spur: ${aSize} KB`);
    } else {
      log('⚠ Kein Audio aufgenommen — Video wird ohne Ton gebaut');
    }

    await context.close();
    await browser.close();
    browser = null;
    server.close(); server = null;

    const webm = fs.readdirSync(TMP_DIR).find(f => f.endsWith('.webm') && f !== 'audio.webm');
    if (!webm) fail('Kein Playwright-Video gefunden');
    const webmPath = path.join(TMP_DIR, webm);

    log('Mische Bild + Ton zu MP4 …');
    const hasAudio = fs.existsSync(audioWebm) && fs.statSync(audioWebm).size > 1024;
    // Erste 0.2 Sek vom Video wegschneiden (CSS-Override greift erst nach
    // DOMContentLoaded, davor blitzt der unmodifizierte Start-Screen kurz auf)
    const VIDEO_TRIM_SEC = 0.2;
    const effectiveAudioOffset = Math.max(0, audioOffsetSec - VIDEO_TRIM_SEC);

    const mergeArgs = ['-y', '-ss', VIDEO_TRIM_SEC.toString(), '-i', webmPath];
    if (hasAudio) mergeArgs.push('-itsoffset', effectiveAudioOffset.toFixed(3), '-i', audioWebm);
    mergeArgs.push(
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
      '-vf', `fps=30`,
    );
    if (hasAudio) {
      mergeArgs.push('-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-map', '0:v:0', '-map', '1:a:0', '-shortest');
    } else {
      mergeArgs.push('-an');
    }
    mergeArgs.push('-movflags', '+faststart', FINAL_MP4);

    const merge = spawnSync('ffmpeg', mergeArgs, { stdio: 'inherit' });
    if (merge.status !== 0) fail('ffmpeg-Merge fehlgeschlagen');

    fs.rmSync(TMP_DIR, { recursive: true, force: true });

    // FHD-Variante: 4K-MP4 nach 1080x2340 runterskalieren, stärker komprimieren,
    // Audio einfach kopieren (kein Reencode)
    log('Erzeuge zusätzlich FHD-Version (1080x2340) …');
    const fhdArgs = [
      '-y',
      '-i', FINAL_MP4,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
      '-vf', `scale=${FHD_W}:${FHD_H}:flags=lanczos`,
      '-c:a', 'copy',
      '-movflags', '+faststart',
      FINAL_MP4_FHD,
    ];
    const fhdRes = spawnSync('ffmpeg', fhdArgs, { stdio: 'inherit' });
    if (fhdRes.status !== 0) fail('FHD-Encoding fehlgeschlagen');

    const sizeMb = (fs.statSync(FINAL_MP4).size / 1024 / 1024).toFixed(1);
    const sizeFhdMb = (fs.statSync(FINAL_MP4_FHD).size / 1024 / 1024).toFixed(1);
    console.log('\n✓ Fertig.');
    console.log(`  4K-Datei:  ${FINAL_MP4}`);
    console.log(`             ${OUT_W}x${OUT_H}, ${sizeMb} MB`);
    console.log(`  FHD-Datei: ${FINAL_MP4_FHD}`);
    console.log(`             ${FHD_W}x${FHD_H}, ${sizeFhdMb} MB`);
    console.log(`  Länge:     ~${TOTAL_SECONDS}s, H.264/AAC`);
    console.log(`  Audio:     ${hasAudio ? 'BGM + alle Pling-/Tipp-Sounds' : 'KEINS — Capture fehlgeschlagen'}\n`);
  } catch (err) {
    cleanup();
    fail(err.message || String(err));
  }
}

main();
