/**
 * iPhone and iPad check in Apple's simulator, i.e. in real mobile Safari.
 *
 * Why: only here the page meets a browser that says of itself that it runs on
 * a phone or a tablet, and the test browsers of Playwright take "vh" as the visible height. Mobile
 * Safari does not (there vh is the height with the browser's own bars
 * retracted), and exactly there the phone ran under the control bar in
 * v2.0.0. This run measures the page where that difference exists.
 *
 * Hermetic like the E2E run: js/config.js is answered with
 * js/config.example.js, so the real view counter is never touched. The page
 * gets a small probe appended that starts the run, jumps to a scene, pauses
 * and posts the measured layout back.
 *
 * Needs macOS with Xcode's simulators. A missing tool is a failure (exit 2),
 * not a skipped check.
 *
 * Usage: node scripts/check-ios.js [--iphone "iPhone 17"] [--ipad "iPad mini"]
 *        [--shots <dir>]   also writes a screenshot per station
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createStaticServer } = require('./static-server.js');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

/** Value of a command line option, or the fallback. */
function option(name, fallback) {
  const at = args.indexOf(name);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
}

/** Simulators this run has started itself; they are shut down again at the end. */
const booted = [];
function shutdownBooted() {
  booted.splice(0).forEach(function (device) {
    simctl(['shutdown', device.udid], true);
  });
}

let failures = 0;
function check(ok, label) {
  console.log((ok ? '  ok   ' : '  FAIL ') + label);
  if (!ok) failures++;
}

/** Runs simctl and returns its output; a missing tool ends the run with exit 2. */
function simctl(list, quiet) {
  try {
    return execFileSync('xcrun', ['simctl'].concat(list), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', quiet ? 'ignore' : 'pipe'],
    });
  } catch (err) {
    if (quiet) return null;
    shutdownBooted();
    console.error(
      'iOS: simctl ' + list.join(' ') + ' failed: ' + String(err.message).split('\n')[0]
    );
    process.exit(2);
  }
}

/**
 * Picks a device of the newest iOS runtime: the one named exactly `wanted`,
 * otherwise the first whose name starts with it.
 */
function pickDevice(wanted) {
  const runtimes = JSON.parse(simctl(['list', 'devices', 'available', '-j'])).devices;
  const names = Object.keys(runtimes)
    .filter(function (key) {
      return /SimRuntime\.iOS-/.test(key) && runtimes[key].length;
    })
    .sort(function (a, b) {
      function version(key) {
        return key
          .replace(/^.*iOS-/, '')
          .split('-')
          .map(Number);
      }
      const x = version(a);
      const y = version(b);
      return y[0] - x[0] || (y[1] || 0) - (x[1] || 0);
    });
  for (const runtime of names) {
    const hit =
      runtimes[runtime].filter(function (device) {
        return device.name === wanted;
      })[0] ||
      runtimes[runtime].filter(function (device) {
        return device.name.indexOf(wanted) === 0;
      })[0];
    if (hit) {
      return {
        udid: hit.udid,
        name: hit.name,
        os: runtime.replace(/^.*iOS-/, 'iOS ').replace(/-/g, '.'),
        wasBooted: hit.state === 'Booted',
      };
    }
  }
  console.error('iOS: no simulator found whose name starts with "' + wanted + '"');
  process.exit(2);
}

/**
 * Runs inside the page. Starts the simulation (unless nostart is given),
 * jumps to second t, pauses and posts what it measured to /__report.
 */
function probe() {
  var query = new URLSearchParams(location.search);
  var label = query.get('probe');
  if (!label) return;
  function height(value) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:0;top:0;width:0;visibility:hidden;height:' + value;
    document.body.appendChild(el);
    var h = el.getBoundingClientRect().height;
    el.remove();
    return Math.round(h * 10) / 10;
  }
  function rect(selector) {
    var el = document.querySelector(selector);
    if (!el || getComputedStyle(el).display === 'none') return null;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return {
      top: Math.round(r.top * 10) / 10,
      bottom: Math.round(r.bottom * 10) / 10,
      left: Math.round(r.left * 10) / 10,
      right: Math.round(r.right * 10) / 10,
    };
  }
  function report() {
    var seek = document.getElementById('ctlSeek');
    var app = document.querySelector('#phone .app.on');
    var request = new XMLHttpRequest();
    request.open('POST', '/__report');
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(
      JSON.stringify({
        label: label,
        width: window.innerWidth,
        visible: window.innerHeight,
        vh: height('100vh'),
        coarse: window.matchMedia('(pointer:coarse)').matches,
        sec: window.sec,
        app: app ? app.id : null,
        beamer: document.body.classList.contains('beamer'),
        stageLive: document.body.classList.contains('stage-live'),
        seekAllowed: window.ctlSeekAllowed(),
        phoneDevice: document.documentElement.classList.contains('phone-device'),
        seek: rect('#ctlSeek'),
        sound: rect('.ctl-sound'),
        sign: rect('#pauseBtn .ico-pause'),
        role: seek.getAttribute('role'),
        phone: rect('#phone'),
        bar: rect('#ctlBar'),
        knob: rect('.ctl-knob'),
        viewSwitch: rect('.ctl-view'),
        tiles: rect('.view-pick'),
        frame: rect('.st-frame'),
        legal: rect('.impr-link-bar .impr-link') || rect('#impLinkRun'),
        replay: rect('#aCta .footer-replay'),
      })
    );
  }
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (query.get('nostart')) return report();
      document.getElementById('startBtn').click();
      setTimeout(function () {
        window.simSeek(Number(query.get('t')));
        if (!window.simPaused && !window.ctlEnded() && !query.get('run')) window.togglePause();
        setTimeout(report, 900);
      }, 1500);
    }, 800);
  });
}

(async function main() {
  const reports = {};
  const exampleConfig = fs.readFileSync(path.join(ROOT, 'js', 'config.example.js'));
  let configRequests = 0;
  const server = await createStaticServer(ROOT, function (req, res, urlPath) {
    const noStore = { 'Cache-Control': 'no-store' };
    if (urlPath === '/js/config.js') {
      configRequests++;
      res.writeHead(
        200,
        Object.assign({ 'Content-Type': 'text/javascript; charset=utf-8' }, noStore)
      );
      res.end(exampleConfig);
      return true;
    }
    if (urlPath === '/__probe.js') {
      res.writeHead(
        200,
        Object.assign({ 'Content-Type': 'text/javascript; charset=utf-8' }, noStore)
      );
      res.end('(' + probe.toString() + ')();');
      return true;
    }
    if (urlPath === '/__report' && req.method === 'POST') {
      let body = '';
      req.on('data', function (chunk) {
        body += chunk;
      });
      req.on('end', function () {
        const data = JSON.parse(body);
        reports[data.label] = data;
        res.writeHead(204);
        res.end();
      });
      return true;
    }
    if (urlPath === '/' || urlPath === '/index.html') {
      const html = fs
        .readFileSync(path.join(ROOT, 'index.html'), 'utf8')
        .replace('</body>', '<script src="/__probe.js"></script></body>');
      res.writeHead(200, Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, noStore));
      res.end(html);
      return true;
    }
    return false;
  });

  /** Opens one station in the simulator's Safari and waits for its report. */
  async function station(device, label, query) {
    const url = 'http://127.0.0.1:' + server.port + '/?probe=' + label + (query ? '&' + query : '');
    // Right after booting, Safari may not take a link yet: try for a while
    let opened = false;
    for (let attempt = 0; attempt < 20 && !opened; attempt++) {
      opened = simctl(['openurl', device.udid, url], true) !== null;
      if (!opened) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 3000);
        });
      }
    }
    if (!opened) simctl(['openurl', device.udid, url]);
    const until = Date.now() + 45000;
    while (!reports[label] && Date.now() < until) {
      await new Promise(function (resolve) {
        setTimeout(resolve, 250);
      });
    }
    const shots = option('--shots', '');
    if (shots && reports[label]) {
      fs.mkdirSync(shots, { recursive: true });
      await new Promise(function (resolve) {
        setTimeout(resolve, 1200);
      });
      simctl(['io', device.udid, 'screenshot', path.join(shots, label + '.png')], true);
    }
    if (!reports[label]) check(false, label + ': the page reported within 45 s');
    return reports[label];
  }

  /** Everything the page draws at the bottom lies inside what can be seen. */
  function insideWindow(m) {
    return (
      !!m.bar &&
      m.bar.bottom <= m.visible + 0.5 &&
      m.bar.left >= -0.5 &&
      m.bar.right <= m.width + 0.5 &&
      (!m.legal || m.legal.bottom <= m.visible + 0.5)
    );
  }

  const scenes = [
    ['whatsapp', 10, 'aWa'],
    ['instagram', 45, 'aIg'],
    ['tiktok', 70, 'aTk'],
    ['notifications', 88, 'aHs'],
    ['messages', 105, 'aIm'],
  ];
  // ---------- iPhone ----------
  const iphone = pickDevice(option('--iphone', 'iPhone'));
  console.log('iOS: ' + iphone.name + ', ' + iphone.os + ' (mobile Safari)');
  if (!iphone.wasBooted) {
    simctl(['boot', iphone.udid]);
    booted.push(iphone);
  }
  simctl(['bootstatus', iphone.udid, '-b']);

  const startPhone = await station(iphone, 'iphone-start', 'nostart=1&beamer=1');
  if (startPhone) {
    console.log(
      '       window ' +
        startPhone.width +
        ' x ' +
        startPhone.visible +
        ' px visible, 100vh = ' +
        startPhone.vh +
        ' px'
    );
    check(
      startPhone.phoneDevice && startPhone.coarse,
      'iPhone: Safari in the simulator is recognised as a phone (' + startPhone.width + ' px wide)'
    );
    check(
      !startPhone.tiles && !startPhone.beamer,
      'iPhone start screen with ?beamer=1: no view tiles, projector view off'
    );
  }
  for (const scene of scenes) {
    const m = await station(iphone, 'iphone-' + scene[0], 't=' + scene[1]);
    if (!m) continue;
    check(
      m.app === scene[2],
      'iPhone ' + scene[0] + ': the station shows this scene (' + m.app + ')'
    );
    const fits =
      !!m.phone &&
      !!m.legal &&
      m.phone.top >= -0.5 &&
      m.phone.bottom <= m.legal.top + 0.5 &&
      m.legal.bottom <= m.visible + 0.5;
    check(
      fits,
      'iPhone ' +
        scene[0] +
        ': the phone lies inside the visible window and ends above the legal notice (phone ' +
        (m.phone ? m.phone.top + ' to ' + m.phone.bottom : 'missing') +
        ', legal notice from ' +
        (m.legal ? m.legal.top : '?') +
        ', visible ' +
        m.visible +
        ', 100vh ' +
        m.vh +
        ')'
    );
    check(
      !m.seek && !m.sound && !m.viewSwitch && !m.knob && !m.beamer && !m.seekAllowed && !!m.sign,
      'iPhone ' + scene[0] + ': no control bar and no jumping; paused, the pause sign is shown'
    );
  }
  const helpPhone = await station(iphone, 'iphone-help', 't=138');
  if (helpPhone) {
    check(
      !helpPhone.bar &&
        !!helpPhone.replay &&
        !!helpPhone.legal &&
        helpPhone.replay.bottom <= helpPhone.legal.top + 0.5 &&
        helpPhone.legal.bottom <= helpPhone.visible + 0.5,
      'iPhone help page: no tap area; "again" button and legal notice inside the visible window'
    );
  }

  // ---------- iPad ----------
  const ipad = pickDevice(option('--ipad', 'iPad mini'));
  console.log('iOS: ' + ipad.name + ', ' + ipad.os + ' (mobile Safari)');
  if (!ipad.wasBooted) {
    simctl(['boot', ipad.udid]);
    booted.push(ipad);
  }
  simctl(['bootstatus', ipad.udid, '-b']);

  const stagePad = await station(ipad, 'ipad-beamer', 'beamer=1&t=45');
  if (stagePad) {
    console.log(
      '       window ' +
        stagePad.width +
        ' x ' +
        stagePad.visible +
        ' px visible, 100vh = ' +
        stagePad.vh +
        ' px'
    );
    // one stage unit: 1% of the width of the 16:9 area that fits into the visible window
    const padUnit = Math.min(stagePad.width / 100, stagePad.visible / 56.25);
    check(
      !stagePad.phoneDevice &&
        stagePad.beamer &&
        stagePad.stageLive &&
        stagePad.role === 'slider' &&
        !!stagePad.knob,
      'iPad with ?beamer=1: not a phone; projector view on, jumping on'
    );
    check(
      insideWindow(stagePad) &&
        !!stagePad.frame &&
        stagePad.frame.top >= -0.5 &&
        stagePad.frame.bottom <= stagePad.visible + 0.5 &&
        Math.abs(stagePad.frame.bottom - stagePad.bar.bottom - padUnit * 0.8) < 1 &&
        !!stagePad.phone &&
        stagePad.phone.bottom <= stagePad.bar.top + 0.5 &&
        stagePad.phone.top >= stagePad.frame.top - 0.5,
      'iPad projector view: stage inside the visible window, bar at the lower edge of the stage, phone above the bar (stage ' +
        (stagePad.frame ? stagePad.frame.top + ' to ' + stagePad.frame.bottom : 'missing') +
        ', bar ' +
        (stagePad.bar ? stagePad.bar.top + ' to ' + stagePad.bar.bottom : 'missing') +
        ', phone ' +
        (stagePad.phone ? stagePad.phone.top + ' to ' + stagePad.phone.bottom : 'missing') +
        ', visible ' +
        stagePad.visible +
        ', 100vh ' +
        stagePad.vh +
        ')'
    );
  }
  const phonePad = await station(ipad, 'ipad-phoneview', 't=45');
  if (phonePad) {
    check(
      !!phonePad.phone &&
        phonePad.phone.bottom <= phonePad.bar.top + 0.5 &&
        phonePad.phone.top >= -0.5 &&
        insideWindow(phonePad) &&
        phonePad.role === 'slider' &&
        !!phonePad.viewSwitch,
      'iPad phone view: the phone ends above the bar, jumping and view switch are there'
    );
  }

  check(
    configRequests > 0,
    'the page got the placeholder config, never the real one (' + configRequests + ' requests)'
  );

  shutdownBooted();
  server.close();
  console.log(failures ? 'iOS: FAILED (' + failures + ' check(s))' : 'iOS: all checks passed');
  process.exit(failures ? 1 : 0);
})().catch(function (err) {
  console.error('iOS: aborted - ' + err);
  shutdownBooted();
  process.exit(2);
});
