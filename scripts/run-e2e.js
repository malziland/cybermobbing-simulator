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
 *      (axe scan with it chosen), toggle with the B key and the control bar
 *      while the run continues, the phone stays beside the stage, and after
 *      a full run every scene text must have appeared on the stage.
 *   8. Sound control: M key, mute button and volume slider via keyboard.
 *   9. Timeline (ADR-0008): clicking a scene, dragging and the keyboard jump
 *      forwards and backwards; after a jump the phone shows exactly what a
 *      normal run shows at that second, the stage shows the same newest
 *      message, and a paused run stays paused.
 *  10. Layout: the control bar is the same in both views, nothing overlaps
 *      or sticks out in several window sizes and zoom levels, the start
 *      screen has no overlaps, and wider fallback fonts do not cut messages.
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
 * What is actually on screen right now. `phone` is true only if the phone is
 * the top-most element at its own centre (so a phone hidden behind the stage
 * does not count). In the projector view the phone stays visible at the left
 * edge; `phoneBeside` says whether it sits completely inside the stage, left
 * of the large content.
 */
function visibleView(page) {
  return page.evaluate(function () {
    var phoneEl = document.getElementById('phone');
    var phone = phoneEl.getBoundingClientRect();
    var frame = document.querySelector('.st-frame').getBoundingClientRect();
    var stageShown = getComputedStyle(document.getElementById('stage')).display !== 'none';
    var col = document.querySelector('#stage .st-scene.on .st-col');
    var colLeft = col ? col.getBoundingClientRect().left : Infinity;
    var top = document.elementFromPoint(phone.left + phone.width / 2, phone.top + phone.height / 2);
    return {
      stage: stageShown,
      phone: !!top && phoneEl.contains(top),
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

/**
 * Records, during a normal run, the simulation second at which every chat
 * entry appears in the phone (test side only). Reference for the timeline.
 */
function installPhoneRecorder() {
  window.__phoneLog = [];
  var kinds = { wm: 'wa', 'wm-photo': 'wa', 'ig-c': 'ig', tc: 'tk', 'hs-n': 'hs', 'im-bub': 'im' };
  new MutationObserver(function (records) {
    records.forEach(function (r) {
      for (var i = 0; i < r.addedNodes.length; i++) {
        var n = r.addedNodes[i];
        if (!n.classList) continue;
        for (var cls in kinds) {
          if (n.classList.contains(cls))
            window.__phoneLog.push({ t: window.sec, kind: kinds[cls] });
        }
      }
    });
  }).observe(document.querySelector('#phone .scr'), { subtree: true, childList: true });
}

/** Snapshot of what the phone and the stage show right now. */
function simSnapshot() {
  function clean(el) {
    var c = el.cloneNode(true);
    var drop = c.querySelectorAll('.meta,.who,.ig-av-inline,b,.av-circle,.nm,.st-name');
    for (var i = 0; i < drop.length; i++) drop[i].parentNode.removeChild(drop[i]);
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  var on = document.querySelector('#phone .app.on');
  var panel = document.querySelector('#stage .st-scene.on');
  var phoneItems = document.querySelectorAll(
    '#phone .app.on .wm, #phone .app.on .wm-photo .cap, #phone .app.on .ig-c, #phone .app.on .tc .tx, #phone .app.on .im-bub'
  );
  var stageItems = document.querySelectorAll('#stage .st-scene.on .st-item:not(.out) .st-text');
  return {
    sec: window.sec,
    paused: window.simPaused,
    app: on ? on.id : null,
    panel: panel ? panel.getAttribute('data-app') : null,
    scene: document.getElementById('ctlScene').textContent,
    now: document.getElementById('ctlNow').textContent,
    counts: {
      wa: document.querySelectorAll('#wC .wm, #wC .wm-photo').length,
      ig: document.querySelectorAll('#igCm .ig-c').length,
      tk: document.querySelectorAll('#tkCl .tc').length,
      hs: window.__hsSeen === undefined ? null : window.__hsSeen,
      im: document.querySelectorAll('#imC .im-bub').length,
    },
    phoneNewest: phoneItems.length ? clean(phoneItems[phoneItems.length - 1]) : '',
    stageNewest: stageItems.length ? clean(stageItems[stageItems.length - 1]) : '',
    likes: parseInt(document.getElementById('igLk').textContent, 10),
    flashing: document.getElementById('fl').classList.contains('go'),
    timers: window.simTimers.length,
  };
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
        getComputedStyle(document.getElementById('ctlBar')).display === 'flex' &&
        getComputedStyle(document.querySelector('.ctl-sound')).display !== 'none' &&
        getComputedStyle(document.querySelector('.ctl-view')).display !== 'none' &&
        getComputedStyle(document.querySelector('.pause-overlay')).display === 'none' &&
        getComputedStyle(document.querySelector('.tbar')).display === 'none'
      );
    }),
    'phone view: control bar with sound and view picker is shown, old controls are not'
  );
  // The start screen fades out for 0.8 s and is then taken out for the keyboard too
  const startHidden = await page
    .waitForFunction(
      function () {
        return getComputedStyle(document.getElementById('start')).visibility === 'hidden';
      },
      { timeout: 3000 }
    )
    .then(
      function () {
        return true;
      },
      function () {
        return false;
      }
    );
  check(startHidden, 'start screen is hidden for the keyboard once the simulation runs');

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

  // The B key must not act while the legal notice is open
  await stagePage.evaluate(function () {
    document.getElementById('impLinkGlobal').click();
  });
  await stagePage.keyboard.press('b');
  check(
    await stagePage.evaluate(function () {
      return (
        document.getElementById('impModal').classList.contains('show') &&
        document.body.classList.contains('beamer')
      );
    }),
    'B key does nothing while the legal notice is open'
  );
  await stagePage.keyboard.press('Escape');

  console.log('E2E: projector view - run, toggle with B key and control bar');
  await stagePage.evaluate(installStageRecorder);
  await stagePage.evaluate(installPhoneRecorder);
  check(await tabTo(stagePage, 'startBtn', 10), 'start button reachable via Tab');
  await stagePage.keyboard.press('Enter');
  await stagePage.waitForSelector('#aWa.on', { timeout: 5000, state: 'attached' });
  let view = await visibleView(stagePage);
  check(view.stage && view.phone && view.phoneBeside, 'stage is shown with the phone beside it');
  check(
    await stagePage.evaluate(function () {
      return (
        parseFloat(getComputedStyle(document.getElementById('phone')).height) ===
        window.STAGE_PHONE_PX
      );
    }),
    'pixel height of the phone in the stylesheet matches STAGE_PHONE_PX in stage.js'
  );

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
    await stagePage.evaluate(function () {
      return !/[?&]beamer=1(&|$)/.test(window.location.search);
    }),
    'B key takes the projector switch out of the address bar again'
  );
  check(
    await stagePage.evaluate(function (n) {
      return window.simTimers.length === n && window.simPaused === false;
    }, timersBefore),
    'switching does not touch the running timers'
  );
  // Holding the key down sends repeats; they must not toggle back and forth.
  // Exactly two key-down events: one real press and one repeat. Without the
  // guard that is two toggles and the view would be back where it started.
  await stagePage.keyboard.down('b');
  await stagePage.keyboard.down('b');
  await stagePage.keyboard.up('b');
  view = await visibleView(stagePage);
  check(
    view.stage && view.beamerPressed === 'true',
    'holding the B key toggles once, not on every repeat'
  );
  await stagePage.keyboard.press('b');
  check(
    await tabTo(stagePage, 'runBeamerBtn', 12),
    'projector button in the bar reachable via Tab'
  );
  await stagePage.keyboard.press('Enter');
  view = await visibleView(stagePage);
  check(
    view.stage && view.phone && view.phoneBeside && view.beamerPressed === 'true',
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
  check(await tabTo(stagePage, 'soundBtn', 12), 'sound button reachable via Tab');
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
        getComputedStyle(document.getElementById('ctlBar')).display === 'none' &&
        !document.getElementById('aCta').classList.contains('hidden')
      );
    }),
    'help screen replaces the stage and the control bar at the end'
  );
  // Reference for the timeline: when did each chat entry appear in this normal run?
  const reference = await stagePage.evaluate(function () {
    return window.__phoneLog;
  });
  await stagePage.close();

  // ---------- Timeline (ADR-0008) ----------
  console.log('E2E: timeline - jumps forwards and backwards match a normal run');
  const seekPage = await context.newPage();
  seekPage.on('pageerror', function (err) {
    pageErrors.push(String(err));
  });
  await seekPage.goto('http://127.0.0.1:' + server.port + '/?testspeed=10&beamer=1');
  await seekPage.click('#startBtn');
  await seekPage.waitForSelector('#aWa.on', { timeout: 5000, state: 'attached' });
  // Paused, so the state cannot move on while it is compared
  await seekPage.evaluate(function () {
    window.togglePause();
    // The homescreen keeps only the last four notifications; count them as they come
    window.__hsSeen = 0;
    window.__countHs = function () {
      window.__hsSeen = 0;
      new MutationObserver(function (records) {
        records.forEach(function (r) {
          for (var i = 0; i < r.addedNodes.length; i++) {
            if (r.addedNodes[i].classList && r.addedNodes[i].classList.contains('hs-n')) {
              window.__hsSeen++;
            }
          }
        });
      }).observe(document.getElementById('hsN'), { childList: true });
    };
  });
  check(reference.length >= 33, 'reference run recorded ' + reference.length + ' chat entries');

  // Targets sit in quiet moments, at least 0.8 s away from any scene event,
  // and are visited in an order that jumps both forwards and backwards
  const targets = [62.8, 13.5, 100, 34.5, 87.2];
  for (const target of targets) {
    const snap = await seekPage.evaluate(function (t) {
      // Count homescreen notifications during this jump: wire the counter right
      // after the restart inside simSeek() by wrapping p1() for one call
      var original = window.p1;
      window.p1 = function () {
        window.p1 = original;
        window.__countHs();
        return original.apply(this, arguments);
      };
      window.simSeek(t);
      return null;
    }, target);
    void snap;
    await seekPage.waitForTimeout(60); // let the observers of the stage run
    const got = await seekPage.evaluate(simSnapshot);
    const want = { wa: 0, ig: 0, tk: 0, hs: 0, im: 0 };
    reference.forEach(function (entry) {
      if (entry.t <= target) want[entry.kind]++;
    });
    const same = ['wa', 'ig', 'tk', 'hs', 'im'].every(function (kind) {
      return got.counts[kind] === want[kind];
    });
    check(
      same,
      'jump to ' +
        target +
        ' s: phone shows the same entries as a normal run (' +
        JSON.stringify(got.counts) +
        (same ? '' : ' instead of ' + JSON.stringify(want)) +
        ')'
    );
    check(
      got.app === got.panel && got.phoneNewest === got.stageNewest,
      'jump to ' +
        target +
        ' s: stage shows the same scene and the same newest message as the phone' +
        (got.phoneNewest === got.stageNewest
          ? ''
          : ' (phone "' + got.phoneNewest + '", stage "' + got.stageNewest + '")')
    );
    check(
      got.paused && Math.abs(got.sec - target) < 0.01 && !got.flashing,
      'jump to ' + target + ' s: stays paused at that second, no camera flash'
    );
  }

  // Every mark on the timeline must be the real scene switch
  const marks = await seekPage.evaluate(function () {
    var out = [];
    window.CTL_SCENES.forEach(function (scene, index) {
      window.simSeek(scene.at);
      var at = document.querySelector('#phone .app.on').id;
      var before = null;
      if (index > 0) {
        window.simSeek(scene.at - 0.5);
        before = document.querySelector('#phone .app.on').id;
      }
      out.push({
        at: scene.at,
        app: scene.app,
        atMark: at,
        justBefore: before,
        previous: index > 0 ? window.CTL_SCENES[index - 1].app : null,
        label: window.t(scene.key),
      });
    });
    return out;
  });
  check(
    marks.every(function (m) {
      return m.atMark === m.app && m.justBefore === m.previous;
    }),
    'all six scene marks sit exactly on the scene switches (' +
      marks
        .map(function (m) {
          return m.at;
        })
        .join(', ') +
      ' s)'
  );

  console.log('E2E: timeline - mouse and keyboard');
  const track = await seekPage.evaluate(function () {
    var r = document.getElementById('ctlTrack').getBoundingClientRect();
    return { left: r.left, width: r.width, y: r.top + r.height / 2 };
  });
  function trackX(second) {
    return track.left + (track.width * second) / 120;
  }
  // Pointing shows where a click goes; a click snaps to the start of the scene
  await seekPage.mouse.move(trackX(70), track.y);
  const tip = await seekPage.evaluate(function () {
    var el = document.getElementById('ctlTip');
    return { shown: el.classList.contains('show'), text: el.textContent };
  });
  check(
    tip.shown && /TikTok/.test(tip.text) && /0:56/.test(tip.text),
    'pointing at a scene names it (' + tip.text + ')'
  );
  await seekPage.mouse.click(trackX(70), track.y);
  let after = await seekPage.evaluate(simSnapshot);
  check(
    after.app === 'aTk' && Math.abs(after.sec - 56) < 0.01 && after.now === '0:56',
    'click inside the TikTok part jumps to its start (0:56)'
  );
  await seekPage.mouse.click(trackX(10), track.y);
  after = await seekPage.evaluate(simSnapshot);
  check(
    after.app === 'aWa' && Math.abs(after.sec) < 0.01 && after.counts.ig === 0 && after.likes === 0,
    'click inside the WhatsApp part jumps back to the start, counters are back at zero'
  );
  // Dragging lands exactly where the pointer is released
  await seekPage.mouse.move(trackX(5), track.y);
  await seekPage.mouse.down();
  await seekPage.mouse.move(trackX(20), track.y, { steps: 4 });
  await seekPage.mouse.move(trackX(40), track.y, { steps: 4 });
  await seekPage.mouse.up();
  after = await seekPage.evaluate(simSnapshot);
  check(
    after.app === 'aIg' && Math.abs(after.sec - 40) < 1,
    'dragging to 0:40 lands there (' + after.sec.toFixed(1) + ' s, Instagram)'
  );
  // Keyboard on the focused timeline
  await seekPage.focus('#ctlSeek');
  await seekPage.keyboard.press('ArrowRight');
  after = await seekPage.evaluate(simSnapshot);
  const afterArrow = after.sec;
  await seekPage.keyboard.press('PageUp');
  after = await seekPage.evaluate(simSnapshot);
  const afterPage = { sec: after.sec, app: after.app };
  await seekPage.keyboard.press('Home');
  after = await seekPage.evaluate(simSnapshot);
  check(
    Math.abs(afterArrow - 45) < 1.1 &&
      afterPage.app === 'aTk' &&
      afterPage.sec === 56 &&
      after.sec === 0,
    'keyboard: arrow +5 s, Page Up next scene, Home back to the start'
  );
  check(
    await seekPage.evaluate(function () {
      var seek = document.getElementById('ctlSeek');
      return (
        seek.getAttribute('role') === 'slider' &&
        seek.getAttribute('aria-valuemax') === '120' &&
        seek.getAttribute('aria-valuenow') === '0' &&
        !!seek.getAttribute('aria-label') &&
        !!document.getElementById('pauseBtn').getAttribute('aria-label')
      );
    }),
    'timeline and pause button carry role, value and accessible names'
  );
  // After a jump the run really continues from there
  await seekPage.evaluate(function () {
    window.simSeek(30);
    window.togglePause();
  });
  await seekPage.waitForFunction(
    function () {
      return window.sec > 34 && document.querySelectorAll('#igCm .ig-c').length >= 2;
    },
    { timeout: 5000 }
  );
  after = await seekPage.evaluate(simSnapshot);
  check(
    !after.paused && after.app === 'aIg' && after.phoneNewest === after.stageNewest,
    'after a jump and resume the run continues, phone and stage stay together'
  );
  await seekPage.close();

  console.log('E2E: timeline - on a phone it only shows the progress');
  const phoneCtx = await browser.newContext({
    locale: 'de-DE',
    viewport: { width: 393, height: 852 },
  });
  await makeHermetic(phoneCtx);
  const phonePage = await phoneCtx.newPage();
  phonePage.on('pageerror', function (err) {
    pageErrors.push(String(err));
  });
  await phonePage.goto('http://127.0.0.1:' + server.port + '/?testspeed=10');
  await phonePage.click('#startBtn');
  await phonePage.waitForSelector('#aWa.on', { timeout: 5000 });
  await phonePage.evaluate(function () {
    window.togglePause();
  });
  const narrow = await phonePage.evaluate(function () {
    var r = document.getElementById('ctlTrack').getBoundingClientRect();
    var seek = document.getElementById('ctlSeek');
    return {
      x: r.left + r.width * 0.6,
      y: r.top + r.height / 2,
      role: seek.getAttribute('role'),
      tabIndex: seek.tabIndex,
      knob: getComputedStyle(document.querySelector('.ctl-knob')).display,
      viewPicker: getComputedStyle(document.querySelector('.ctl-view')).display,
      before: window.sec,
    };
  });
  await phonePage.mouse.click(narrow.x, narrow.y);
  const narrowAfter = await phonePage.evaluate(function () {
    return { sec: window.sec, app: document.querySelector('#phone .app.on').id };
  });
  check(
    narrow.role === 'progressbar' &&
      narrow.tabIndex === -1 &&
      narrow.knob === 'none' &&
      narrow.viewPicker === 'none' &&
      narrowAfter.app === 'aWa' &&
      narrowAfter.sec === narrow.before,
    '393 px wide: timeline is a progress display, a tap does not jump, no view picker'
  );
  await phoneCtx.close();

  // ---------- Layout ----------
  /** True if no two rectangles of the list overlap and all lie inside `box`. */
  function layoutProbe() {
    function rect(sel) {
      var el = document.querySelector(sel);
      if (!el || getComputedStyle(el).display === 'none') return null;
      var r = el.getBoundingClientRect();
      return r.width && r.height ? r : null;
    }
    function overlaps(names, box) {
      var hits = [];
      var list = names
        .map(function (n) {
          return { name: n, r: rect(n) };
        })
        .filter(function (x) {
          return x.r;
        });
      for (var a = 0; a < list.length; a++) {
        var c = list[a].r;
        if (
          box &&
          (c.left < box.left - 1 ||
            c.right > box.right + 1 ||
            c.top < box.top - 1 ||
            c.bottom > box.bottom + 1)
        ) {
          hits.push(list[a].name + ' outside');
        }
        for (var b = a + 1; b < list.length; b++) {
          var d = list[b].r;
          if (
            c.left < d.right - 0.5 &&
            c.right - 0.5 > d.left &&
            c.top < d.bottom - 0.5 &&
            c.bottom - 0.5 > d.top
          ) {
            hits.push(list[a].name + ' / ' + list[b].name);
          }
        }
      }
      return hits;
    }
    var windowBox = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    var live = document.body.classList.contains('stage-live');
    var frame = document.querySelector('.st-frame').getBoundingClientRect();
    var bar = document.getElementById('ctlBar').getBoundingClientRect();
    var unit = Math.min(window.innerWidth / 100, window.innerHeight / 56.25);
    return {
      // parts inside the bar: next to each other, inside the bar
      insideBar: overlaps(
        ['#pauseBtn', '.ctl-time', '#ctlSeek', '#ctlEnd', '.ctl-sound', '.ctl-view', '#impLinkRun'],
        bar
      ),
      // bar against everything around it
      around: overlaps(
        ['#ctlBar', '#phone', '.impr-link-bar .impr-link'],
        live ? frame : windowBox
      ),
      bar: {
        left: bar.left,
        right: bar.right,
        top: bar.top,
        bottom: bar.bottom,
        height: bar.height,
      },
      wantHeight: window.innerWidth <= 500 ? 36 : Math.max(40, unit * 3.6),
      scrollbars:
        document.documentElement.scrollWidth > window.innerWidth ||
        document.documentElement.scrollHeight > window.innerHeight,
    };
  }

  console.log('E2E: start screen - nothing overlaps in any window size');
  // [width, height]: laptop, low windows, Full HD, phones, a very low phone window
  const startSizes = [
    [1280, 720],
    [1280, 600],
    [1366, 657],
    [1920, 1080],
    [393, 852],
    [375, 667],
    [375, 553],
  ];
  for (const size of startSizes) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: size[0], height: size[1] },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/');
    await p.waitForSelector('#startBtn');
    const hits = await p.evaluate(function () {
      function rect(sel) {
        var el = document.querySelector(sel);
        if (!el || getComputedStyle(el).display === 'none') return null;
        return el.getBoundingClientRect();
      }
      var names = [
        '#start h1',
        '#start .sub1',
        '#startBtn',
        '.view-pick',
        '.beamer-hint',
        '#startShareBtn',
        '.start-views',
        '.start-credit',
        '.disclaimer',
        '.impr-link',
      ];
      var list = names
        .map(function (n) {
          return { name: n, r: rect(n) };
        })
        .filter(function (x) {
          return x.r;
        });
      var out = [];
      for (var a = 0; a < list.length; a++) {
        var c = list[a].r;
        if (c.top < -1 || c.bottom > window.innerHeight + 1) out.push(list[a].name + ' outside');
        for (var b = a + 1; b < list.length; b++) {
          var d = list[b].r;
          if (
            c.left < d.right &&
            c.right > d.left &&
            c.top < d.bottom - 0.5 &&
            c.bottom - 0.5 > d.top
          ) {
            out.push(list[a].name + ' / ' + list[b].name);
          }
        }
      }
      return out;
    });
    check(
      hits.length === 0,
      size[0] +
        'x' +
        size[1] +
        ': start screen has no overlaps' +
        (hits.length ? ' - ' + hits.join(', ') : '')
    );
    await ctx.close();
  }

  console.log('E2E: control bar - fits in the phone view in every window size');
  const phoneViewSizes = [
    [1280, 720],
    [1920, 1080],
    [1024, 768],
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
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000 });
    await p.evaluate(function () {
      window.togglePause();
    });
    const m = await p.evaluate(layoutProbe);
    const label = size[0] + 'x' + size[1];
    check(
      m.insideBar.length === 0 && m.around.length === 0 && !m.scrollbars,
      label +
        ': bar, phone and legal notice do not overlap, parts of the bar sit side by side' +
        (m.insideBar.concat(m.around).length ? ' - ' + m.insideBar.concat(m.around).join(', ') : '')
    );
    check(
      Math.abs(m.bar.height - m.wantHeight) < 0.6,
      label +
        ': bar is ' +
        m.bar.height.toFixed(1) +
        ' px high (expected ' +
        m.wantHeight.toFixed(1) +
        ')'
    );
    await ctx.close();
  }

  console.log('E2E: switching views keeps the newest chat message in sight');
  {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1024, height: 768 },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10&beamer=1');
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000, state: 'attached' });
    await p.evaluate(function () {
      window.togglePause();
      window.simSeek(24);
    });
    await p.keyboard.press('b'); // projector -> phone view, the phone gets lower
    const hidden = await p.evaluate(function () {
      var box = document.getElementById('wC').getBoundingClientRect();
      var last = document.querySelector('#wC').lastElementChild.getBoundingClientRect();
      return Math.round(last.bottom - box.bottom);
    });
    check(
      hidden <= 1,
      '1024x768: after switching to the phone view the newest message is inside the chat (' +
        hidden +
        ' px below its edge)'
    );
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
    await p.evaluate(function () {
      window.togglePause();
    });
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
      return {
        samePhotoPlace: samePhotoPlace,
        sameCounterPlace:
          Math.abs(igCounts.right - tkCounts.right) <= 1 &&
          Math.abs(igCounts.top - tkCounts.top) <= 1,
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
      };
    });
    const bar = await p.evaluate(layoutProbe);
    // Same window in the phone view: on 16:9 the bar must not move at all
    await p.keyboard.press('b');
    const barPhoneView = await p.evaluate(layoutProbe);
    const label = size[0] + 'x' + size[1] + ' @' + size[2];
    // Identical bars need a 16:9 window that is large enough for the phone
    // view's minimum bar height (40 px) not to apply
    const wide = Math.abs(size[0] / size[1] - 16 / 9) < 0.01 && (size[0] / 100) * 3.6 >= 40;
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
    check(m.inside && !bar.scrollbars, label + ': nothing sticks out, no scrollbars');
    check(
      m.samePhotoPlace && m.sameCounterPlace,
      label + ': picture and counters sit at the same place in WhatsApp, Instagram and TikTok'
    );
    check(
      Math.abs(m.phoneRatio - 0.49) < 0.005 && m.phoneInside,
      label + ': phone beside the stage is 49% of the stage width high and fully visible'
    );
    check(
      bar.insideBar.length === 0 &&
        bar.around.length === 0 &&
        Math.abs(bar.bar.height / m.width - 0.036) < 0.0006,
      label +
        ': control bar is 3.6% of the stage width high, inside the stage, clear of the phone' +
        (bar.insideBar.concat(bar.around).length
          ? ' - ' + bar.insideBar.concat(bar.around).join(', ')
          : '')
    );
    if (wide) {
      check(
        Math.abs(bar.bar.left - barPhoneView.bar.left) < 0.6 &&
          Math.abs(bar.bar.right - barPhoneView.bar.right) < 0.6 &&
          Math.abs(bar.bar.top - barPhoneView.bar.top) < 0.6 &&
          Math.abs(bar.bar.bottom - barPhoneView.bar.bottom) < 0.6,
        label + ': the bar sits at exactly the same place in phone view and projector view'
      );
    }
    await ctx.close();
  }

  console.log('E2E: projector view - wider text does not cut messages off');
  {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1920, height: 1080 },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=4&beamer=1');
    await p.waitForSelector('#startBtn');
    // Much wider text than any real fallback font (about 30%): without the fit
    // check in stage.js two long messages no longer fit and the older one
    // would be cut off at the top
    await p.addStyleTag({ content: '#stage .st-text,#stage .st-name{letter-spacing:.16em}' });
    await p.evaluate(function () {
      window.__clip = { worst: 0, emptyWhileItems: 0, samples: 0 };
      setInterval(function () {
        var lists = document.querySelectorAll('#stage .st-scene.on .st-list');
        for (var i = 0; i < lists.length; i++) {
          var live = lists[i].querySelectorAll('.st-item:not(.out)');
          if (!live.length) {
            if (lists[i].querySelector('.st-item')) window.__clip.emptyWhileItems++;
            continue;
          }
          window.__clip.samples++;
          // only settled states count: an item that is still fading out may stick out
          if (
            lists[i].querySelector('.st-item.out') &&
            lists[i].scrollHeight > lists[i].clientHeight + 1
          )
            continue;
          var cut = lists[i].getBoundingClientRect().top - live[0].getBoundingClientRect().top;
          if (cut > window.__clip.worst) window.__clip.worst = cut;
        }
      }, 40);
    });
    await p.click('#startBtn');
    await p.waitForSelector('#aCta:not(.hidden)', { timeout: 90000 });
    const clip = await p.evaluate(function () {
      return window.__clip;
    });
    check(
      clip.samples > 100 && clip.worst <= 1.5 && clip.emptyWhileItems === 0,
      'with 30% wider text no live message is cut off at the top (worst ' +
        clip.worst.toFixed(1) +
        ' px in ' +
        clip.samples +
        ' samples)'
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
