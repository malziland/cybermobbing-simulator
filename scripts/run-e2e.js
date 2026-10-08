#!/usr/bin/env node
/**
 * End-to-end test of the critical user flow plus accessibility checks
 * (UI profile duties, see docs/adr/ADR-0005 and ADR-0006).
 *
 * Flow under test (keyboard-driven, hermetic - no Firebase backend):
 *   1. Start screen loads; axe-core scan of the start screen (WCAG 2.x AA).
 *   2. Impressum opens via Enter on the footer link, closes via Escape.
 *   3. Simulation starts via Enter on the focused start button (testspeed=10).
 *   4. First scene (WhatsApp) activates; pause/resume works via keyboard.
 *   5. Final CTA screen appears; axe-core scan of the CTA screen.
 *   6. CTA buttons are keyboard-reachable; share shows the toast.
 *   7. Projector view (ADR-0007): choose it on the start screen via keyboard
 *      (axe scan with it chosen), toggle with the B key and the in-run
 *      button while the run continues, the phone stays beside the stage,
 *      and after a full run every scene text must have appeared on it.
 *   8. Sound control: M key, mute button and volume slider via keyboard.
 *   9. Projector view keeps its proportions in several window sizes and
 *      zoom levels; nothing sticks out of the picture, picture and counters
 *      sit at the same place in every app, controls scale with the stage.
 *
 * Hermetic setup: js/config.js is replaced by js/config.example.js via route
 * interception, and all firebaseio/googleapis requests are blocked, so the
 * test never touches the production database or counts a view.
 * Usage: npm run test:e2e
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const { createStaticServer } = require('./static-server');

const ROOT = path.resolve(__dirname, '..');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

const failures = [];
function check(ok, label) {
  console.log((ok ? '  ok  ' : '  FAIL') + ' ' + label);
  if (!ok) failures.push(label);
}

/** Presses Tab until the active element has the given id (bounded). */
async function tabTo(page, id, maxTabs) {
  for (let i = 0; i < (maxTabs || 10); i++) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(function () {
      return document.activeElement ? document.activeElement.id : '';
    });
    if (active === id) return true;
  }
  return false;
}

async function axeScan(page, includeSelector, label) {
  const results = await new AxeBuilder({ page })
    .include(includeSelector)
    .withTags(AXE_TAGS)
    .analyze();
  check(results.violations.length === 0, 'axe ' + label + ' (WCAG 2.x A/AA)');
  results.violations.forEach(function (v) {
    console.log(
      '       - ' + v.id + ' [' + v.impact + '] ' + v.help + ' (' + v.nodes.length + ' node(s))'
    );
    v.nodes.slice(0, 5).forEach(function (n) {
      const detail = n.any && n.any[0] && n.any[0].data ? JSON.stringify(n.any[0].data) : '';
      console.log('         ' + n.target.join(' ') + ' ' + detail);
    });
  });
}

/** Placeholder config instead of the real one, no Firebase traffic. */
async function makeHermetic(context) {
  const exampleConfig = fs.readFileSync(path.join(ROOT, 'js', 'config.example.js'), 'utf8');
  await context.route('**/js/config.js*', function (route) {
    route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: exampleConfig });
  });
  await context.route(
    function (url) {
      return /firebaseio\.com|googleapis\.com/.test(url.href);
    },
    function (route) {
      route.abort();
    }
  );
}

/**
 * What is actually on screen right now. In the projector view the phone
 * stays visible at the left edge of the stage; `phoneBeside` says whether it
 * sits completely inside the stage, left of the large content.
 */
function visibleView(page) {
  return page.evaluate(function () {
    var phone = document.getElementById('phone').getBoundingClientRect();
    var frame = document.querySelector('.st-frame').getBoundingClientRect();
    var stageShown = getComputedStyle(document.getElementById('stage')).display !== 'none';
    var col = document.querySelector('#stage .st-scene.on .st-col');
    var colLeft = col ? col.getBoundingClientRect().left : Infinity;
    return {
      stage: stageShown,
      phone: getComputedStyle(document.getElementById('phone')).visibility === 'visible',
      phoneBeside:
        stageShown &&
        phone.left >= frame.left - 1 &&
        phone.top >= frame.top - 1 &&
        phone.bottom <= frame.bottom + 1 &&
        phone.right <= colLeft,
      phoneCentered: Math.abs(phone.left + phone.width / 2 - window.innerWidth / 2) < 2,
      beamerPressed: document.getElementById('runBeamerBtn').getAttribute('aria-pressed'),
      phonePressed: document.getElementById('runPhoneBtn').getAttribute('aria-pressed'),
    };
  });
}

// Scene texts that must show up large in the projector view during a full run
const STAGE_ITEM_KEYS = [
  'wa.marco1',
  'wa.sara1',
  'wa.tim1',
  'wa.leon1',
  'wa.sara2',
  'wa.marco2',
  'ig.sara',
  'ig.tim',
  'ig.leon',
  'ig.tom1',
  'ig.marco',
  'ig.lukas',
  'ig.tom2',
  'ig.hype',
  'tk.lukas',
  'tk.sara',
  'tk.noah',
  'tk.anon',
  'tk.tom',
  'tk.aggro',
  'tk.marco',
  'tk.troll',
  'tk.stickerLabel',
  'hs.n1',
  'hs.n2',
  'hs.n3',
  'hs.n4',
  'hs.n5',
  'hs.n6',
  'hs.n7',
  'hs.n8',
  'im.mama',
  'im.tom',
];
const STAGE_NOTICE_KEYS = [
  'wa.tomLeaves',
  'wa.toastScreenshot',
  'wa.toastEditing',
  'wa.toastPosted',
  'ig.toastScreenshot',
  'ig.toastReaction',
  'ig.toastTiktok',
  'tk.toastReport',
  'tk.toastVideos',
];

/** Records everything that ever appears on the stage (test side only). */
function installStageRecorder() {
  window.__seen = { items: {}, notices: {}, sticker: false, typingWa: false, typingIm: false };
  new MutationObserver(function () {
    var i;
    var items = document.querySelectorAll('#stage .st-item');
    for (i = 0; i < items.length; i++) window.__seen.items[items[i].textContent] = true;
    var notices = document.querySelectorAll('#stNote, #stWaSys, #stTkRpt');
    for (i = 0; i < notices.length; i++) window.__seen.notices[notices[i].textContent] = true;
    if (document.querySelector('#stWaList .st-sticker img')) window.__seen.sticker = true;
    if (document.querySelector('#stWaList .st-typing')) window.__seen.typingWa = true;
    if (document.querySelector('#stImList .st-typing')) window.__seen.typingIm = true;
  }).observe(document.getElementById('stage'), {
    subtree: true,
    childList: true,
    characterData: true,
  });
}

/** Returns the scene keys whose text never appeared on the stage. */
function missingOnStage(keys) {
  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent;
  }
  var seenItems = Object.keys(window.__seen.items);
  var seenNotices = Object.keys(window.__seen.notices);
  function has(list, text) {
    return list.some(function (s) {
      return s.indexOf(text) !== -1;
    });
  }
  return {
    items: keys.items.filter(function (k) {
      return !has(seenItems, plain(window.t(k)));
    }),
    notices: keys.notices.filter(function (k) {
      return !has(seenNotices, plain(window.t(k)));
    }),
  };
}

(async function main() {
  const server = await createStaticServer(ROOT);
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', function (err) {
    pageErrors.push(String(err));
  });

  // Hermetic: placeholder config instead of the real one, no Firebase traffic
  await makeHermetic(context);

  console.log('E2E: start screen');
  await page.goto('http://127.0.0.1:' + server.port + '/?testspeed=10');
  await page.waitForSelector('#startBtn');
  check(
    (await page.title()).indexOf('| malziland') !== -1,
    'runtime title keeps the brand suffix (BIZ-01)'
  );
  await axeScan(page, '#start', 'start screen');

  console.log('E2E: impressum via keyboard');
  check(await tabTo(page, 'impLinkGlobal', 10), 'impressum link reachable via Tab');
  await page.keyboard.press('Enter');
  check(
    await page.evaluate(function () {
      return document.getElementById('impModal').classList.contains('show');
    }),
    'impressum opens on Enter'
  );
  await page.keyboard.press('Escape');
  check(
    await page.evaluate(function () {
      return !document.getElementById('impModal').classList.contains('show');
    }),
    'impressum closes on Escape'
  );

  console.log('E2E: start simulation via keyboard');
  check(await tabTo(page, 'startBtn', 10), 'start button reachable via Tab');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#aWa.on', { timeout: 5000 });
  check(true, 'simulation starts, WhatsApp scene activates');

  console.log('E2E: pause/resume via keyboard');
  check(await tabTo(page, 'pauseBtn', 10), 'pause button reachable via Tab');
  await page.keyboard.press('Enter');
  check(
    await page.evaluate(function () {
      return !document.getElementById('pauseOverlay').classList.contains('hidden');
    }),
    'pause overlay shows'
  );
  await page.keyboard.press('Enter');
  check(
    await page.evaluate(function () {
      return document.getElementById('pauseOverlay').classList.contains('hidden');
    }),
    'simulation resumes'
  );
  check(
    await page.evaluate(function () {
      return (
        getComputedStyle(document.querySelector('.sound-mini')).display === 'flex' &&
        getComputedStyle(document.querySelector('.view-mini')).display === 'flex'
      );
    }),
    'phone view: sound control and view picker are shown'
  );

  console.log('E2E: full run to CTA screen (time-lapse x10)');
  await page.waitForSelector('#aCta:not(.hidden)', { timeout: 40000 });
  check(true, 'CTA screen appears after full simulation');
  // Let the staggered fade-in transitions finish, otherwise axe samples
  // half-transparent intermediate colors and reports false contrast failures
  await page.waitForFunction(
    function () {
      var els = document.querySelectorAll('#aCta, #aCta *');
      for (var i = 0; i < els.length; i++) {
        var style = getComputedStyle(els[i]);
        if (style.display !== 'none' && style.opacity !== '1') return false;
      }
      return true;
    },
    { timeout: 15000 }
  );
  await axeScan(page, '#aCta', 'CTA screen');

  console.log('E2E: CTA keyboard operability');
  check(await tabTo(page, 'footerShareBtn', 15), 'share button reachable via Tab');
  await page.keyboard.press('Enter');
  check(
    await page.evaluate(function () {
      return document.getElementById('toast').classList.contains('show');
    }),
    'share shows confirmation toast'
  );
  check(await tabTo(page, 'footerReplayBtn', 5), 'replay button reachable via Tab');

  // ---------- Projector view (ADR-0007) ----------
  console.log('E2E: projector view - switch on the start screen via keyboard');
  const stagePage = await context.newPage();
  stagePage.on('pageerror', function (err) {
    pageErrors.push(String(err));
  });
  await stagePage.goto('http://127.0.0.1:' + server.port + '/?testspeed=10');
  await stagePage.waitForSelector('#startBtn');
  check(
    await stagePage.evaluate(function () {
      return (
        !document.body.classList.contains('beamer') &&
        getComputedStyle(document.getElementById('stage')).display === 'none'
      );
    }),
    'phone view is the default, stage hidden'
  );
  check(await tabTo(stagePage, 'viewBeamerBtn', 10), 'projector option reachable via Tab');
  await stagePage.keyboard.press('Enter');
  check(
    await stagePage.evaluate(function () {
      return (
        document.body.classList.contains('beamer') &&
        document.getElementById('viewBeamerBtn').getAttribute('aria-pressed') === 'true' &&
        document.getElementById('viewPhoneBtn').getAttribute('aria-pressed') === 'false' &&
        /[?&]beamer=1(&|$)/.test(window.location.search)
      );
    }),
    'Enter chooses the projector view and keeps it in the address bar'
  );
  check(
    await stagePage.evaluate(function () {
      var ok = true;
      var buttons = document.querySelectorAll('[data-view]');
      for (var i = 0; i < buttons.length; i++) {
        if (!buttons[i].getAttribute('aria-label')) ok = false;
      }
      return ok && buttons.length === 4;
    }),
    'all four view buttons carry an accessible name'
  );
  await axeScan(stagePage, '#start', 'start screen with projector switch on');

  console.log('E2E: projector view - run, toggle with B key and button');
  await stagePage.evaluate(installStageRecorder);
  check(await tabTo(stagePage, 'startBtn', 10), 'start button reachable via Tab');
  await stagePage.keyboard.press('Enter');
  // the phone is invisible in the projector view: wait for the scene class, not visibility
  await stagePage.waitForSelector('#aWa.on', { timeout: 5000, state: 'attached' });
  let view = await visibleView(stagePage);
  check(view.stage && view.phone && view.phoneBeside, 'stage is shown with the phone beside it');

  const timersBefore = await stagePage.evaluate(function () {
    return window.simTimers.length;
  });
  await stagePage.keyboard.press('b');
  view = await visibleView(stagePage);
  check(
    !view.stage && view.phone && view.phoneCentered && view.phonePressed === 'true',
    'B key switches to the phone view (phone back in the centre)'
  );
  check(
    await stagePage.evaluate(function (n) {
      return window.simTimers.length === n && window.simPaused === false;
    }, timersBefore),
    'switching does not touch the running timers'
  );
  check(await tabTo(stagePage, 'runBeamerBtn', 10), 'in-run projector button reachable via Tab');
  await stagePage.keyboard.press('Enter');
  view = await visibleView(stagePage);
  check(
    view.stage && view.phoneBeside && view.beamerPressed === 'true',
    'button switches back to the stage'
  );

  console.log('E2E: sound control - M key, button and slider');
  function soundState() {
    return stagePage.evaluate(function () {
      var bgm = document.getElementById('bgm');
      var btn = document.getElementById('soundBtn');
      return {
        muted: bgm.muted,
        volume: bgm.volume,
        marked: btn.classList.contains('muted'),
        label: btn.getAttribute('aria-label'),
        mute: window.t('ui.soundMute'),
        unmute: window.t('ui.soundUnmute'),
        slider: document.getElementById('volSlider').value,
      };
    });
  }
  let sound = await soundState();
  check(
    !sound.muted && Math.abs(sound.volume - 0.4) < 0.001 && sound.label === sound.mute,
    'music starts audible at 40%'
  );
  await stagePage.keyboard.press('m');
  sound = await soundState();
  check(
    sound.muted && sound.marked && sound.label === sound.unmute,
    'M key switches the sound off'
  );
  check(await tabTo(stagePage, 'soundBtn', 10), 'sound button reachable via Tab');
  await stagePage.keyboard.press('Enter');
  sound = await soundState();
  check(!sound.muted && !sound.marked, 'sound button switches the sound back on');
  check(await tabTo(stagePage, 'volSlider', 5), 'volume slider reachable via Tab');
  await stagePage.keyboard.press('ArrowLeft');
  await stagePage.keyboard.press('ArrowLeft');
  sound = await soundState();
  check(
    sound.slider === '90' && Math.abs(sound.volume - 0.36) < 0.001,
    'two steps down on the slider: 90%, music at 0.36 (measured ' + sound.volume + ')'
  );

  console.log('E2E: projector view - full run, every scene text appears on the stage');
  await stagePage.waitForSelector('#aCta:not(.hidden)', { timeout: 40000 });
  const missing = await stagePage.evaluate(missingOnStage, {
    items: STAGE_ITEM_KEYS,
    notices: STAGE_NOTICE_KEYS,
  });
  check(
    missing.items.length === 0,
    'all ' +
      STAGE_ITEM_KEYS.length +
      ' messages appeared on the stage' +
      (missing.items.length ? ' - missing: ' + missing.items.join(', ') : '')
  );
  check(
    missing.notices.length === 0,
    'all ' +
      STAGE_NOTICE_KEYS.length +
      ' notices appeared on the stage' +
      (missing.notices.length ? ' - missing: ' + missing.notices.join(', ') : '')
  );
  const extras = await stagePage.evaluate(function () {
    return {
      sticker: window.__seen.sticker,
      typingWa: window.__seen.typingWa,
      typingIm: window.__seen.typingIm,
      photoLayers: document.querySelectorAll('#stTkPh .e3.on').length,
      finale: document.querySelectorAll('#stFn .st-fl.show').length,
      likes: parseInt(document.getElementById('stIgLk').textContent, 10),
      tkCounters: ['stTkLk', 'stTkCm', 'stTkSh'].every(function (id) {
        return document.getElementById(id).textContent !== '0';
      }),
      badge: document.getElementById('stXW').textContent !== '23',
      clock: /^\d\d:\d\d$/.test(document.getElementById('stHsClock').textContent),
    };
  });
  check(extras.sticker, 'WhatsApp sticker appeared on the stage');
  check(extras.typingWa && extras.typingIm, 'typing indicators appeared (WhatsApp and Messages)');
  check(extras.photoLayers === 5, 'stage photo carries all scribble layers at the end');
  check(extras.finale === 5, 'all five finale lines were revealed on the stage');
  check(extras.likes > 100 && extras.tkCounters && extras.badge, 'counters ran along on the stage');
  check(extras.clock, 'homescreen clock mirrored');
  check(
    await stagePage.evaluate(function () {
      return (
        getComputedStyle(document.getElementById('stage')).display === 'none' &&
        !document.getElementById('aCta').classList.contains('hidden')
      );
    }),
    'help screen replaces the stage at the end'
  );
  await stagePage.close();

  console.log('E2E: phone view - pause symbol and legal notice are large enough and clear');
  // [width, height]: laptop, Full HD, two phone sizes
  const phoneViewSizes = [
    [1280, 720],
    [1920, 1080],
    [393, 852],
    [375, 667],
  ];
  for (const size of phoneViewSizes) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: size[0], height: size[1] },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10');
    await p.waitForSelector('#startBtn');
    const startScreen = await p.evaluate(function () {
      var impr = document.querySelector('.impr-link').getBoundingClientRect();
      var disc = document.querySelector('.disclaimer').getBoundingClientRect();
      return { clear: disc.bottom <= impr.top + 1 && impr.bottom <= window.innerHeight };
    });
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000 });
    await p.evaluate(function () {
      window.togglePause();
    });
    const m = await p.evaluate(function () {
      function rect(sel) {
        return document.querySelector(sel).getBoundingClientRect();
      }
      function shown(sel) {
        return getComputedStyle(document.querySelector(sel)).display !== 'none';
      }
      var unit = Math.min(window.innerWidth / 100, window.innerHeight / 56.25);
      var items = [rect('#pauseBtn'), rect('.impr-link'), rect('.pause-text'), rect('#phone')];
      if (shown('.sound-mini')) items.push(rect('.sound-mini'));
      if (shown('.view-mini')) items.push(rect('.view-mini'));
      var clear = true;
      for (var a = 0; a < items.length; a++) {
        var c = items[a];
        if (c.left < -1 || c.right > window.innerWidth + 1 || c.bottom > window.innerHeight + 1) {
          clear = false;
        }
        for (var b = a + 1; b < items.length; b++) {
          var d = items[b];
          if (c.left < d.right && c.right > d.left && c.top < d.bottom && c.bottom > d.top) {
            clear = false;
          }
        }
      }
      return {
        pause: parseFloat(getComputedStyle(document.getElementById('pauseBtn')).fontSize),
        impr: parseFloat(getComputedStyle(document.querySelector('.impr-link')).fontSize),
        wantPause: Math.max(22, unit * 2),
        wantImpr: Math.max(15, unit * 1.2),
        clear: clear,
      };
    });
    const label = size[0] + 'x' + size[1];
    check(
      Math.abs(m.pause - m.wantPause) < 0.5 && Math.abs(m.impr - m.wantImpr) < 0.5,
      label +
        ': pause symbol ' +
        m.pause.toFixed(1) +
        'px, legal notice ' +
        m.impr.toFixed(1) +
        'px (at least 22px / 15px)'
    );
    check(
      m.clear,
      label + ': paused - pause symbol, pause text, legal notice, controls and phone do not overlap'
    );
    check(startScreen.clear, label + ': start screen - disclaimer does not cover the legal notice');
    await ctx.close();
  }

  console.log('E2E: projector view - same proportions in every window size and zoom');
  // [width, height, deviceScaleFactor]: classic 4:3, 16:10, Full HD, 4K,
  // and Full HD at browser zoom 200% / 50%
  const sizes = [
    [1024, 768, 1],
    [1280, 800, 1],
    [1920, 1080, 1],
    [3840, 2160, 1],
    [960, 540, 2],
    [3840, 2160, 0.5],
  ];
  for (const size of sizes) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: size[0], height: size[1] },
      deviceScaleFactor: size[2],
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10&beamer=1');
    await p.click('#startBtn');
    await p.waitForSelector('#stWaList .st-item', { timeout: 5000 });
    await p.waitForTimeout(500); // let the entry animation finish
    const m = await p.evaluate(function () {
      var frame = document.querySelector('.st-frame').getBoundingClientRect();
      var text = document.querySelector('#stWaList .st-text');
      var inside = true;
      var els = document.querySelectorAll(
        '#stage .st-scene.on .st-item:not(.out), #stage .st-scene.on .st-photo, #stage .st-scene.on .st-head'
      );
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (
          r.left < frame.left - 1 ||
          r.right > frame.right + 1 ||
          r.top < frame.top - 1 ||
          r.bottom > frame.bottom + 1
        ) {
          inside = false;
        }
      }
      var phone = document.getElementById('phone').getBoundingClientRect();
      function rect(sel) {
        return document.querySelector(sel).getBoundingClientRect();
      }
      // Panels of the other apps are invisible but laid out, so they can be compared
      var photos = [rect('#stWa .st-photo'), rect('#stIg .st-photo'), rect('#stTk .st-photo')];
      var samePhotoPlace = photos.every(function (r) {
        return (
          Math.abs(r.top - photos[0].top) <= 1 &&
          Math.abs(r.left - photos[0].left) <= 1 &&
          Math.abs(r.width - photos[0].width) <= 1
        );
      });
      var igCounts = rect('#stIg .st-counts');
      var tkCounts = rect('#stTk .st-counts');
      var controls = [
        rect('#pauseBtn'),
        rect('.impr-link'),
        rect('.view-mini'),
        rect('.sound-mini'),
        phone,
      ];
      var controlsClear = true;
      for (var a = 0; a < controls.length; a++) {
        var c = controls[a];
        if (c.left < frame.left - 1 || c.right > frame.right + 1 || c.bottom > frame.bottom + 1) {
          controlsClear = false;
        }
        for (var b = a + 1; b < controls.length; b++) {
          var d = controls[b];
          if (c.left < d.right && c.right > d.left && c.top < d.bottom && c.bottom > d.top) {
            controlsClear = false;
          }
        }
      }
      return {
        samePhotoPlace: samePhotoPlace,
        sameCounterPlace:
          Math.abs(igCounts.right - tkCounts.right) <= 1 &&
          Math.abs(igCounts.top - tkCounts.top) <= 1,
        pauseRatio:
          parseFloat(getComputedStyle(document.getElementById('pauseBtn')).fontSize) / frame.width,
        imprRatio:
          parseFloat(getComputedStyle(document.querySelector('.impr-link')).fontSize) / frame.width,
        controlsClear: controlsClear,
        phoneRatio: phone.height / frame.width,
        phoneInside:
          phone.left >= frame.left - 1 &&
          phone.top >= frame.top - 1 &&
          phone.right <= frame.right + 1 &&
          phone.bottom <= frame.bottom + 1,
        ratio: parseFloat(getComputedStyle(text).fontSize) / frame.width,
        expectedWidth: Math.min(window.innerWidth, (window.innerHeight * 16) / 9),
        width: frame.width,
        frameInWindow:
          frame.left >= -1 &&
          frame.top >= -1 &&
          frame.right <= window.innerWidth + 1 &&
          frame.bottom <= window.innerHeight + 1,
        inside: inside,
        scrollbars:
          document.documentElement.scrollWidth > window.innerWidth ||
          document.documentElement.scrollHeight > window.innerHeight,
      };
    });
    const label = size[0] + 'x' + size[1] + ' @' + size[2];
    check(
      Math.abs(m.ratio - 0.035) < 0.00035,
      label +
        ': message size is 3.5% of the stage width (measured ' +
        (m.ratio * 100).toFixed(3) +
        '%)'
    );
    check(
      Math.abs(m.width - m.expectedWidth) <= 1 && m.frameInWindow,
      label + ': stage fills the window as a 16:9 area'
    );
    check(m.inside && !m.scrollbars, label + ': nothing sticks out, no scrollbars');
    check(
      m.samePhotoPlace && m.sameCounterPlace,
      label + ': picture and counters sit at the same place in WhatsApp, Instagram and TikTok'
    );
    check(
      Math.abs(m.pauseRatio - 0.022) < 0.0005 && Math.abs(m.imprRatio - 0.013) < 0.0005,
      label + ': pause symbol is 2.2% and legal notice 1.3% of the stage width'
    );
    check(m.controlsClear, label + ': controls are inside the picture and do not overlap');
    check(
      Math.abs(m.phoneRatio - 0.49) < 0.005 && m.phoneInside,
      label + ': phone beside the stage is 49% of the stage width high and fully visible'
    );
    await ctx.close();
  }

  await browser.close();
  server.close();

  if (pageErrors.length) {
    console.log('Page errors:\n- ' + pageErrors.join('\n- '));
  }
  const failed = failures.length > 0 || pageErrors.length > 0;
  console.log(failed ? 'E2E: FAILED (' + failures.length + ' check(s))' : 'E2E: all checks passed');
  process.exit(failed ? 1 : 0);
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
