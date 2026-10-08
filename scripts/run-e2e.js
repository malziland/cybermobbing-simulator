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
  // Present is not the same as visible: entries fade in from opacity 0
  function hiddenIn(selector, rootId) {
    var root = document.getElementById(rootId);
    var list = document.querySelectorAll(selector);
    var hidden = 0;
    for (var i = 0; i < list.length; i++) {
      var opacity = 1;
      for (var n = list[i]; n && n !== root.parentNode; n = n.parentNode) {
        opacity *= parseFloat(getComputedStyle(n).opacity);
      }
      if (opacity < 0.99) hidden++;
    }
    return { all: list.length, hidden: hidden };
  }
  var phoneSeen = hiddenIn(
    '#phone .app.on .wm, #phone .app.on .wm-photo, #phone .app.on .wm-sticker, #phone .app.on .wa-sys, #phone .app.on .ig-c, #phone .app.on .tc, #phone .app.on .hs-n, #phone .app.on .im-bub, #phone .app.on .fl.show',
    'phone'
  );
  // Older messages on the stage are dimmed on purpose (.old): count the newest ones only
  var stageSeen = hiddenIn(
    '#stage .st-scene.on .st-item:not(.out):not(.old), #stage .st-scene.on .st-fl.show',
    'stage'
  );
  // Nothing may still be fading inside phone or stage (endless ones like typing dots aside)
  var fading = 0;
  if (document.getAnimations) {
    document.getAnimations().forEach(function (a) {
      var target = a.effect && a.effect.target;
      var timing = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (!target || !timing || timing.iterations === Infinity) return;
      if (
        !document.getElementById('phone').contains(target) &&
        !document.getElementById('stage').contains(target)
      )
        return;
      if (a.playState === 'running') fading++;
    });
  }
  return {
    sec: window.sec,
    paused: window.simPaused,
    // The help page replaces the phone; the last app stays marked underneath
    app: !document.getElementById('aCta').classList.contains('hidden') ? 'aCta' : on ? on.id : null,
    panel: panel ? panel.getAttribute('data-app') : null,
    scene: document.getElementById('ctlScene').textContent,
    phoneEntries: phoneSeen.all,
    phoneHidden: phoneSeen.hidden,
    stageEntries: stageSeen.all,
    stageHidden: stageSeen.hidden,
    fading: fading,
    barText: document.getElementById('ctlBar').innerText,
    help: !document.getElementById('aCta').classList.contains('hidden'),
    scrubbing: window.ctlScrubbing === true && document.body.classList.contains('scrubbing'),
    music: window.bgMusic ? (window.bgMusic.paused ? 'paused' : 'playing') : 'none',
    musicAt: window.bgMusic ? window.bgMusic.currentTime : -1,
    musicLen: window.bgMusic ? window.bgMusic.duration : 0,
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
  /** Where the legal notice stands after opening: its text must begin at the top. */
  function impTop() {
    var scroll = document.querySelector('#impModal .imp-scroll');
    var head = scroll.querySelector('h2').getBoundingClientRect();
    var box = scroll.getBoundingClientRect();
    return {
      scrolled: Math.round(scroll.scrollTop),
      room: Math.round(scroll.scrollHeight - scroll.clientHeight),
      headSeen: head.top >= box.top - 1 && head.bottom <= box.bottom + 1,
      focus: document.activeElement ? document.activeElement.id : '',
    };
  }
  const impAtStart = await page.evaluate(impTop);
  check(
    impAtStart.room > 100 &&
      impAtStart.scrolled === 0 &&
      impAtStart.headSeen &&
      impAtStart.focus === 'impCloseBtn',
    'the legal notice opens at its beginning, heading in sight, focus on the close button (scrolled ' +
      impAtStart.scrolled +
      ' of ' +
      impAtStart.room +
      ' px)'
  );
  const impStart = await page.evaluate(function () {
    var now = new Date();
    var shown = document.getElementById('impTime').textContent;
    var parts = shown.split(':');
    var links = document.querySelectorAll('#impModal a[href^="mailto:"]');
    var mails = [];
    for (var i = 0; i < links.length; i++) {
      mails.push(links[i].getAttribute('href') + '|' + links[i].textContent);
    }
    return {
      shown: shown,
      // minutes between the shown time and the real one (0 or 1 around a minute change)
      off: Math.abs(
        Number(parts[0]) * 60 + Number(parts[1]) - (now.getHours() * 60 + now.getMinutes())
      ),
      mails: mails,
      oldAddress: /malzi\.me/.test(document.documentElement.innerHTML),
    };
  });
  check(
    /^\d\d:\d\d$/.test(impStart.shown) && (impStart.off <= 1 || impStart.off >= 1439),
    'legal notice on the start screen shows the real time (' + impStart.shown + ')'
  );
  check(
    impStart.mails.length === 2 &&
      impStart.mails.every(function (m) {
        return m === 'mailto:info@malziland.at|info@malziland.at';
      }) &&
      !impStart.oldAddress,
    'legal notice gives info@malziland.at as contact, twice, the old address is gone'
  );
  await page.keyboard.press('Escape');
  check(
    await page.evaluate(function () {
      return !document.getElementById('impModal').classList.contains('show');
    }),
    'impressum closes on Escape'
  );
  /** Presses Tab `count` times from `startId` and names every stop. */
  async function tabOrder(p, startId, count) {
    await p.focus('#' + startId);
    const stops = [startId];
    for (let i = 0; i < count; i++) {
      await p.keyboard.press('Tab');
      stops.push(
        await p.evaluate(function () {
          var el = document.activeElement;
          return el.id || el.tagName.toLowerCase() + ':' + el.textContent.trim();
        })
      );
    }
    return stops;
  }
  const startStops = await tabOrder(page, 'startBtn', 5);
  check(
    startStops.join(' | ') ===
      'startBtn | viewPhoneBtn | viewBeamerBtn | startShareBtn | a:Open-Source | impLinkGlobal',
    'Tab runs through the start screen in reading order (' + startStops.join(', ') + ')'
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
      return (
        window.simPaused === true &&
        document.getElementById('pauseBtn').classList.contains('paused') &&
        document.getElementById('ctlScene').textContent === window.t('ctl.paused')
      );
    }),
    'pause: the control bar shows the paused state'
  );
  function pauseSymbols() {
    var btn = document.getElementById('pauseBtn');
    function box(sel) {
      var el = btn.querySelector(sel);
      if (getComputedStyle(el).display === 'none') return null;
      var r = el.getBoundingClientRect();
      var b = btn.getBoundingClientRect();
      return {
        size: r.width,
        offX: r.left + r.width / 2 - (b.left + b.width / 2),
        offY: r.top + r.height / 2 - (b.top + b.height / 2),
      };
    }
    return { pause: box('.ico-pause'), play: box('.ico-play'), text: btn.textContent.trim() };
  }
  const symPaused = await page.evaluate(pauseSymbols);
  await page.keyboard.press('Enter');
  check(
    await page.evaluate(function () {
      return (
        window.simPaused === false &&
        !document.getElementById('pauseBtn').classList.contains('paused') &&
        document.getElementById('ctlScene').textContent === window.t('ctl.wa')
      );
    }),
    'simulation resumes, the bar shows the scene again'
  );
  const symRunning = await page.evaluate(pauseSymbols);
  check(
    !!symPaused.play &&
      !symPaused.pause &&
      !!symRunning.pause &&
      !symRunning.play &&
      symPaused.text === '' &&
      Math.abs(symPaused.play.size - symRunning.pause.size) < 0.5 &&
      Math.abs(symPaused.play.offX) < 0.6 &&
      Math.abs(symPaused.play.offY) < 0.6,
    'the play symbol is drawn, as large as the pause symbol and centred in the button (' +
      (symPaused.play ? symPaused.play.size.toFixed(1) : '?') +
      ' px, off by ' +
      (symPaused.play
        ? symPaused.play.offX.toFixed(1) + '/' + symPaused.play.offY.toFixed(1)
        : '?') +
      ' px)'
  );
  check(
    await page.evaluate(function () {
      return (
        getComputedStyle(document.getElementById('ctlBar')).display === 'flex' &&
        getComputedStyle(document.querySelector('.ctl-sound')).display !== 'none' &&
        getComputedStyle(document.querySelector('.ctl-view')).display !== 'none' &&
        !document.getElementById('pauseOverlay') &&
        !document.querySelector('.tbar, .pause-text, #tf, #tl')
      );
    }),
    'phone view: control bar with sound and view picker is shown, the old controls are gone'
  );

  const barStops = await tabOrder(page, 'pauseBtn', 6);
  check(
    barStops.join(' | ') ===
      'pauseBtn | ctlSeek | soundBtn | volSlider | runPhoneBtn | runBeamerBtn | impLinkRun',
    'Tab runs through the control bar in reading order (' + barStops.join(', ') + ')'
  );

  console.log('E2E: legal notice pauses the run');
  function impState() {
    return {
      show: document.getElementById('impModal').classList.contains('show'),
      paused: window.simPaused,
      button: document.getElementById('pauseBtn').classList.contains('paused'),
      sec: window.sec,
    };
  }
  // The phone of the simulation gets a time no real clock shows right now
  await page.evaluate(function () {
    var other = (new Date().getHours() + 7) % 24;
    document.getElementById('sbTime').textContent = String(other).padStart(2, '0') + ':03';
  });
  await page.click('#impLinkRun');
  const impClock = await page.evaluate(function () {
    return {
      imp: document.getElementById('impTime').textContent,
      sim: document.getElementById('sbTime').textContent,
    };
  });
  check(
    impClock.imp === impClock.sim && /:03$/.test(impClock.imp),
    'during the run the legal notice shows the same time as the phone (' + impClock.imp + ')'
  );
  const impOpen = await page.evaluate(impState);
  await page.waitForTimeout(300); // three simulated seconds at x10
  const impHeld = await page.evaluate(impState);
  check(
    impOpen.show && impOpen.paused && impOpen.button && impHeld.sec === impOpen.sec,
    'opening the legal notice during the run pauses it (stands at ' + impHeld.sec.toFixed(1) + ' s)'
  );
  await page.keyboard.press('Escape');
  const impClosed = await page.evaluate(impState);
  const impRanOn = await page
    .waitForFunction(
      function (from) {
        return window.sec > from + 1;
      },
      impHeld.sec,
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
  check(
    !impClosed.show && !impClosed.paused && !impClosed.button && impRanOn,
    'closing it lets the run continue by itself'
  );
  // Paused before opening: closing must not start it
  await page.evaluate(function () {
    window.togglePause();
  });
  await page.click('#impLinkRun');
  const impOpenPaused = await page.evaluate(impState);
  await page.click('#impCloseBtn');
  const impClosedPaused = await page.evaluate(impState);
  await page.waitForTimeout(200);
  const impStillPaused = await page.evaluate(impState);
  check(
    impOpenPaused.show &&
      impOpenPaused.paused &&
      !impClosedPaused.show &&
      impClosedPaused.paused &&
      impStillPaused.sec === impOpenPaused.sec,
    'if the run was paused before, it stays paused after the legal notice is closed'
  );
  await page.evaluate(function () {
    window.togglePause();
  });
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
  await axeScan(page, '#ctlBar', 'control bar on the help page');
  await page.click('#impLinkRun');
  check(
    await page.evaluate(function () {
      return (
        document.getElementById('impModal').classList.contains('show') && window.simPaused === false
      );
    }),
    'on the help page the legal notice opens without pausing anything'
  );
  await page.keyboard.press('Escape');

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
        getComputedStyle(document.getElementById('ctlBar')).display !== 'none' &&
        document.getElementById('pauseBtn').disabled &&
        !document.getElementById('aCta').classList.contains('hidden')
      );
    }),
    'help screen replaces the stage at the end, the control bar stays, pause is switched off'
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
    check(
      got.musicLen > 0 && Math.abs(got.musicAt - (target % got.musicLen)) < 0.5,
      'jump to ' +
        target +
        ' s: the music jumps along (' +
        got.musicAt.toFixed(1) +
        ' s of ' +
        got.musicLen.toFixed(0) +
        ')'
    );
    check(
      got.phoneEntries > 0 &&
        got.phoneHidden === 0 &&
        got.stageEntries > 0 &&
        got.stageHidden === 0,
      'jump to ' +
        target +
        ' s: every entry can be seen at once, in the phone (' +
        (got.phoneEntries - got.phoneHidden) +
        ' of ' +
        got.phoneEntries +
        ') and on the stage (' +
        (got.stageEntries - got.stageHidden) +
        ' of ' +
        got.stageEntries +
        ')'
    );
  }

  // Every mark on the timeline must be the real scene switch
  const marks = await seekPage.evaluate(function () {
    var out = [];
    window.CTL_SCENES.forEach(function (scene, index) {
      function showing() {
        if (!document.getElementById('aCta').classList.contains('hidden')) return 'aCta';
        return document.querySelector('#phone .app.on').id;
      }
      window.simSeek(scene.at);
      var at = showing();
      var before = null;
      if (index > 0) {
        window.simSeek(scene.at - 0.5);
        before = showing();
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
    'all seven marks sit exactly on the switches, the help page included (' +
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
    return { left: r.left, width: r.width, y: r.top + r.height / 2, total: window.CTL_TOTAL };
  });
  function trackX(second) {
    return track.left + (track.width * second) / track.total;
  }
  /** Waits until the pending jump of a drag has been drawn and mirrored. */
  async function settle(p) {
    await p.evaluate(function () {
      return new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(resolve);
        });
      });
    });
    await p.waitForTimeout(60);
  }
  let after = await seekPage.evaluate(simSnapshot);
  check(
    !/\d/.test(after.barText) && !(await seekPage.$('#ctlNow, #ctlEnd')),
    'the bar shows no time (its visible text: "' + after.barText.replace(/\s+/g, ' ').trim() + '")'
  );
  // Pointing names the scene
  await seekPage.mouse.move(trackX(70), track.y);
  const tip = await seekPage.evaluate(function () {
    var el = document.getElementById('ctlTip');
    return { shown: el.classList.contains('show'), text: el.textContent, want: window.t('ctl.tk') };
  });
  check(
    tip.shown && tip.text === tip.want,
    'pointing at the timeline names the scene, without a time (' + tip.text + ')'
  );
  // A click goes exactly where it was made: forwards ...
  await seekPage.mouse.click(trackX(70), track.y);
  after = await seekPage.evaluate(simSnapshot);
  check(
    after.app === 'aTk' && Math.abs(after.sec - 70) < 0.5,
    'a click lands where it was made (' +
      after.sec.toFixed(1) +
      ' s), not on the start of the scene'
  );
  // ... and backwards inside the same scene, left of the knob
  await seekPage.mouse.click(trackX(62), track.y);
  after = await seekPage.evaluate(simSnapshot);
  check(
    after.app === 'aTk' && Math.abs(after.sec - 62) < 0.5,
    'a click before the knob inside the same scene goes back to that spot (' +
      after.sec.toFixed(1) +
      ' s), not to the scene start'
  );
  // Next to a mark it lands on the mark, so a scene can be started from its first moment
  await seekPage.mouse.click(trackX(57), track.y);
  after = await seekPage.evaluate(simSnapshot);
  check(
    after.app === 'aTk' && after.sec === 56,
    'a click one second next to a mark lands on the mark (' + after.sec + ' s)'
  );
  await seekPage.mouse.click(trackX(10), track.y);
  after = await seekPage.evaluate(simSnapshot);
  check(
    after.app === 'aWa' &&
      Math.abs(after.sec - 10) < 0.5 &&
      after.counts.ig === 0 &&
      after.likes === 0,
    'a click into the WhatsApp part goes back there, the later scenes are back at zero'
  );
  // Only the main button jumps
  await seekPage.mouse.click(trackX(100), track.y, { button: 'right' });
  const afterRight = await seekPage.evaluate(simSnapshot);
  await seekPage.mouse.click(trackX(100), track.y, { button: 'middle' });
  const afterMiddle = await seekPage.evaluate(simSnapshot);
  await seekPage.keyboard.press('Escape');
  check(
    afterRight.sec === after.sec &&
      afterMiddle.sec === after.sec &&
      !afterMiddle.scrubbing &&
      (await seekPage.evaluate(function () {
        return window.ctlDragging === false;
      })),
    'right and middle click do not jump (stays at ' + afterMiddle.sec.toFixed(1) + ' s)'
  );
  // Dragging: the picture follows the knob while the button is still held
  await seekPage.mouse.move(trackX(5), track.y);
  await seekPage.mouse.down();
  await seekPage.mouse.move(trackX(40), track.y, { steps: 6 });
  await settle(seekPage);
  const held1 = await seekPage.evaluate(simSnapshot);
  await seekPage.mouse.move(trackX(100), track.y, { steps: 6 });
  await settle(seekPage);
  const held2 = await seekPage.evaluate(simSnapshot);
  check(
    held1.scrubbing &&
      held1.app === 'aIg' &&
      held1.panel === 'aIg' &&
      Math.abs(held1.sec - 40) < 0.5 &&
      held1.phoneNewest === held1.stageNewest &&
      held2.app === 'aIm' &&
      held2.panel === 'aIm' &&
      Math.abs(held2.sec - 100) < 0.5 &&
      held2.phoneNewest === held2.stageNewest &&
      held1.phoneEntries > 0 &&
      held1.phoneHidden === 0 &&
      held1.stageHidden === 0 &&
      held2.phoneEntries > 0 &&
      held2.phoneHidden === 0 &&
      held2.stageHidden === 0,
    'while dragging, phone and stage already show the spot under the pointer, every entry visible (' +
      held1.sec.toFixed(1) +
      ' s ' +
      held1.app +
      ', then ' +
      held2.sec.toFixed(1) +
      ' s ' +
      held2.app +
      ')'
  );
  await seekPage.mouse.move(trackX(40), track.y, { steps: 6 });
  await seekPage.mouse.up();
  await settle(seekPage);
  after = await seekPage.evaluate(simSnapshot);
  check(
    !after.scrubbing && after.paused && after.app === 'aIg' && Math.abs(after.sec - 40) < 0.5,
    'releasing lands there (' + after.sec.toFixed(1) + ' s, Instagram) and it stays paused'
  );
  // Keyboard on the focused timeline
  await seekPage.focus('#ctlSeek');
  const keyStart = after.sec;
  const keySteps = [];
  for (const key of [
    'ArrowRight',
    'ArrowUp',
    'ArrowLeft',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'End',
    'ArrowRight',
    'Home',
  ]) {
    await seekPage.keyboard.press(key);
    const s = await seekPage.evaluate(simSnapshot);
    keySteps.push({ key: key, sec: s.sec, app: s.app });
  }
  const near = function (value, want) {
    return Math.abs(value - want) < 0.01;
  };
  check(
    near(keySteps[0].sec, keyStart + 5) &&
      near(keySteps[1].sec, keyStart + 10) &&
      near(keySteps[2].sec, keyStart + 5) &&
      near(keySteps[3].sec, keyStart) &&
      keySteps[4].sec === 56 &&
      keySteps[4].app === 'aTk' &&
      keySteps[5].sec === 28 &&
      keySteps[5].app === 'aIg' &&
      keySteps[6].sec === 134 &&
      keySteps[6].app === 'aCta' &&
      keySteps[7].sec === 139 &&
      keySteps[7].app === 'aCta' &&
      keySteps[8].sec === 0 &&
      keySteps[8].app === 'aWa',
    'keyboard: arrows right/up +5 s, left/down -5 s, Page Up next and Page Down previous scene, End the help page, Home the start (' +
      keySteps
        .map(function (k) {
          return k.sec.toFixed(0);
        })
        .join(', ') +
      ')'
  );
  check(
    await seekPage.evaluate(function () {
      var seek = document.getElementById('ctlSeek');
      return (
        seek.getAttribute('role') === 'slider' &&
        seek.getAttribute('aria-valuemax') === String(window.CTL_TOTAL) &&
        seek.getAttribute('aria-valuenow') === '0' &&
        seek.getAttribute('aria-valuetext') === window.t('ctl.wa') &&
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

  console.log('E2E: timeline - dragging while the run is going');
  const musicBefore = after.music;
  await seekPage.mouse.move(trackX(50), track.y);
  await seekPage.mouse.down();
  await seekPage.mouse.move(trackX(70), track.y, { steps: 6 });
  await settle(seekPage);
  const hold1 = await seekPage.evaluate(simSnapshot);
  await seekPage.waitForTimeout(400); // four simulated seconds at x10
  const hold2 = await seekPage.evaluate(simSnapshot);
  check(
    hold1.scrubbing &&
      !hold1.paused &&
      hold1.app === 'aTk' &&
      Math.abs(hold1.sec - 70) < 0.5 &&
      hold2.sec === hold1.sec &&
      JSON.stringify(hold2.counts) === JSON.stringify(hold1.counts) &&
      hold1.phoneEntries > 0 &&
      hold1.phoneHidden === 0 &&
      hold2.phoneHidden === 0 &&
      hold1.stageHidden === 0,
    'while the knob is held the simulation stands still (' +
      hold1.sec.toFixed(1) +
      ' s, ' +
      JSON.stringify(hold1.counts) +
      ' unchanged after 400 ms)'
  );
  await seekPage.mouse.up();
  const ranOn = await seekPage
    .waitForFunction(
      function (from) {
        return window.sec > from + 2 && !document.body.classList.contains('scrubbing');
      },
      hold1.sec,
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
  after = await seekPage.evaluate(simSnapshot);
  check(
    ranOn && !after.paused && after.phoneNewest === after.stageNewest,
    'after releasing, the run continues from there by itself'
  );
  // A jump while it is running: the clock must run on, and only once
  await seekPage.mouse.click(trackX(30), track.y);
  const speedA = await seekPage.evaluate(function () {
    return { sec: window.sec, at: performance.now() };
  });
  await seekPage.waitForTimeout(500);
  const speedB = await seekPage.evaluate(function () {
    var out = { sec: window.sec, at: performance.now() };
    window.togglePause();
    out.paused = window.sec;
    return out;
  });
  await seekPage.waitForTimeout(300);
  const speedC = await seekPage.evaluate(function () {
    var sec = window.sec;
    window.togglePause();
    return sec;
  });
  const rate = ((speedB.sec - speedA.sec) / (speedB.at - speedA.at)) * 100; // 1 = single speed at x10
  check(
    Math.abs(speedA.sec - 30) < 0.6 && rate > 0.7 && rate < 1.3 && speedC === speedB.paused,
    'after a jump while running the clock runs on at single speed (' +
      rate.toFixed(2) +
      ') and stands still when paused'
  );
  check(
    musicBefore === 'playing' && hold1.music === 'paused' && after.music === 'playing',
    'the music waits while the knob is held and plays again afterwards (' +
      [musicBefore, hold1.music, after.music].join(' -> ') +
      ')'
  );

  console.log('E2E: timeline - the help page is its last part');
  await seekPage.evaluate(function () {
    if (!window.simPaused) window.togglePause();
  });
  function helpState() {
    function shown(id) {
      var el = document.getElementById(id);
      var o = 1;
      for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
        var cs = getComputedStyle(n);
        if (cs.display === 'none') return 0;
        o *= parseFloat(cs.opacity);
      }
      return o;
    }
    var phone = document.getElementById('phone');
    return {
      help: shown('aCta') > 0.99,
      text: shown('ctaMsg'),
      phone: !phone.classList.contains('hidden'),
      pauseBtn: getComputedStyle(document.getElementById('pauseBtn')).display !== 'none',
      bar: getComputedStyle(document.getElementById('ctlBar')).display !== 'none',
      scene: document.getElementById('ctlScene').textContent,
      wantScene: window.t('ctl.help'),
      links: document.getElementById('ctaLinks').children.length,
      logos: document.getElementById('ctaLogo').children.length,
      pos: parseFloat(document.getElementById('ctlSeek').style.getPropertyValue('--pos')),
      sec: window.sec,
      paused: window.simPaused,
      app: document.querySelector('#phone .app.on')
        ? document.querySelector('#phone .app.on').id
        : '',
    };
  }
  // Dragging into the last part shows the help page while the button is still held ...
  await seekPage.mouse.move(trackX(110), track.y);
  await seekPage.mouse.down();
  await seekPage.mouse.move(trackX(137), track.y, { steps: 6 });
  await settle(seekPage);
  const heldHelp = await seekPage.evaluate(helpState);
  // ... and dragging back brings the run back
  await seekPage.mouse.move(trackX(100), track.y, { steps: 6 });
  await settle(seekPage);
  const heldBack = await seekPage.evaluate(helpState);
  const heldBackSnap = await seekPage.evaluate(simSnapshot);
  await seekPage.mouse.up();
  await settle(seekPage);
  check(
    heldHelp.help &&
      !heldHelp.phone &&
      heldHelp.bar &&
      heldHelp.scene === heldHelp.wantScene &&
      heldHelp.text > 0.99 &&
      heldHelp.links > 0,
    'dragging into the last part shows the help page, complete, and the bar stays (' +
      heldHelp.scene +
      ', text opacity ' +
      heldHelp.text.toFixed(2) +
      ', ' +
      heldHelp.links +
      ' links)'
  );
  check(
    !heldBack.help &&
      heldBack.phone &&
      heldBack.pauseBtn &&
      heldBack.app === 'aIm' &&
      heldBack.links === 0 &&
      heldBackSnap.phoneEntries > 0 &&
      heldBackSnap.phoneHidden === 0 &&
      heldBackSnap.stageHidden === 0,
    'dragging back from the help page brings the run back, phone and stage filled (100 s)'
  );
  // Without a jump: the run reaches the help page, the bar fills up and stays
  await seekPage.evaluate(function () {
    window.simSeek(131);
    window.togglePause();
  });
  // A run that never gets there must show up as a failed check, not as an aborted script
  const reachedEnd = await seekPage
    .waitForFunction(
      function () {
        return (
          !document.getElementById('aCta').classList.contains('hidden') &&
          window.sec >= window.CTL_TOTAL &&
          parseFloat(getComputedStyle(document.getElementById('ctaMsg')).opacity) > 0.99
        );
      },
      { timeout: 8000 }
    )
    .then(
      function () {
        return true;
      },
      function () {
        return false;
      }
    );
  check(
    reachedEnd,
    'without a jump the run reaches the help page and the clock reaches the end of the timeline'
  );
  const ended = await seekPage.evaluate(helpState);
  await seekPage.waitForTimeout(300);
  const endedLater = await seekPage.evaluate(helpState);
  check(
    ended.help &&
      ended.bar &&
      ended.pos === 100 &&
      endedLater.sec === ended.sec &&
      ended.text > 0.99 &&
      ended.links === heldHelp.links &&
      ended.logos === heldHelp.logos,
    'at the end the bar is full and the clock stops; links and logo are there once (' +
      ended.links +
      ' links, ' +
      ended.logos +
      ' logo)'
  );
  // One click goes back into the run, no restart needed
  await seekPage.mouse.click(trackX(70), track.y);
  const backRunning = await seekPage.evaluate(helpState);
  const backRan = await seekPage
    .waitForFunction(
      function () {
        return window.sec > 72;
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
  after = await seekPage.evaluate(simSnapshot);
  check(
    !backRunning.help &&
      backRunning.phone &&
      backRunning.pauseBtn &&
      backRunning.app === 'aTk' &&
      Math.abs(backRunning.sec - 70) < 0.6 &&
      backRan &&
      !after.paused &&
      after.music === 'playing' &&
      after.phoneNewest === after.stageNewest,
    'from the help page one click goes back into the run (70 s, TikTok) and it runs on'
  );
  // Paused: a jump onto the help page still shows it complete, and the way back is paused
  await seekPage.evaluate(function () {
    window.togglePause();
    window.simSeek(window.CTL_SCENES[6].at);
  });
  await seekPage.waitForTimeout(80);
  const pausedHelp = await seekPage.evaluate(helpState);
  await seekPage.mouse.click(trackX(20), track.y);
  const pausedBack = await seekPage.evaluate(helpState);
  check(
    pausedHelp.help &&
      pausedHelp.text > 0.99 &&
      pausedHelp.scene === pausedHelp.wantScene &&
      pausedBack.phone &&
      pausedBack.paused &&
      pausedBack.pauseBtn &&
      Math.abs(pausedBack.sec - 20) < 0.6,
    'paused: the help page is complete and reads "' +
      pausedHelp.scene +
      '", the way back stays paused with the pause button there'
  );
  await seekPage.close();

  console.log('E2E: help page - the bar does not move when the run ends');
  for (const size of [
    [1280, 720, '?beamer=1'],
    [1024, 768, '?beamer=1'],
    [1024, 768, ''],
    [640, 700, ''],
  ]) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: size[0], height: size[1] },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto(
      'http://127.0.0.1:' + server.port + '/' + (size[2] ? size[2] + '&' : '?') + 'testspeed=10'
    );
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000, state: 'attached' });
    const boxes = await p.evaluate(function () {
      function box(id) {
        var r = document.getElementById(id).getBoundingClientRect();
        return [r.left, r.top, r.width, r.height];
      }
      window.togglePause();
      window.simSeek(120);
      var before = { bar: box('ctlBar'), track: box('ctlTrack') };
      window.simSeek(window.CTL_TOTAL);
      window.stageSync();
      var after = { bar: box('ctlBar'), track: box('ctlTrack') };
      var worst = 0;
      ['bar', 'track'].forEach(function (k) {
        for (var i = 0; i < 4; i++) worst = Math.max(worst, Math.abs(before[k][i] - after[k][i]));
      });
      return { worst: worst, help: !document.getElementById('aCta').classList.contains('hidden') };
    });
    check(
      boxes.help && boxes.worst < 0.5,
      size[0] +
        'x' +
        size[1] +
        (size[2] ? ' projector view' : ' phone view') +
        ': bar and timeline stand exactly where they stood during the run (moved ' +
        boxes.worst.toFixed(1) +
        ' px)'
    );
    await ctx.close();
  }

  console.log('E2E: help page - bar, disclaimer and buttons do not overlap');
  const helpSizes = [
    [1280, 720],
    [1280, 600],
    [1024, 768],
    [820, 1180],
    [640, 700],
    [560, 1210],
    [393, 852],
    [375, 667],
  ];
  for (const size of helpSizes) {
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
      window.simSeek(window.CTL_TOTAL);
    });
    await p.waitForTimeout(250);
    const hits = await p.evaluate(function () {
      function rect(sel) {
        var el = document.querySelector(sel);
        if (!el || getComputedStyle(el).display === 'none') return null;
        var r = el.getBoundingClientRect();
        return r.width && r.height ? r : null;
      }
      var names = [
        '#ctaLogo',
        '#ctaLinks',
        '#ctaHelpline',
        '#ctaMsg',
        '.fin-actions',
        '.disclaimer',
        '#ctlBar',
        '.impr-link-bar',
      ];
      var list = names
        .map(function (n) {
          return { name: n, r: rect(n) };
        })
        .filter(function (x) {
          return x.r;
        });
      var out = [];
      if (!rect('#ctlBar')) out.push('bar missing');
      if (!rect('.disclaimer')) out.push('disclaimer missing');
      for (var a = 0; a < list.length; a++) {
        var c = list[a].r;
        if (
          c.top < -1 ||
          c.bottom > window.innerHeight + 1 ||
          c.left < -1 ||
          c.right > window.innerWidth + 1
        ) {
          out.push(list[a].name + ' outside');
        }
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
        ': help page with the bar has no overlaps' +
        (hits.length ? ' - ' + hits.join(', ') : '')
    );
    await ctx.close();
  }

  console.log('E2E: timeline - on a phone it only shows the progress');
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
  const phoneImpr = await phonePage.evaluate(function () {
    var el = document.getElementById('impLinkGlobal');
    var r = el.getBoundingClientRect();
    var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { w: r.width, h: r.height, onTop: !!top && (top === el || el.contains(top)) };
  });
  check(
    phoneImpr.w > 20 && phoneImpr.h > 10 && phoneImpr.onTop,
    '393 px wide: the legal notice below the bar is there during the run and can be tapped'
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
        ['#pauseBtn', '#ctlScene', '#ctlSeek', '.ctl-sound', '.ctl-view', '#impLinkRun'],
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
    // In between the disclaimer wraps onto up to five lines
    [530, 900],
    [560, 1210],
    [640, 700],
    [701, 640],
    [820, 1180],
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

  console.log('E2E: start screen - the two view tiles only where the projector view makes sense');
  const tileProbes = [
    [1280, 720, '', true],
    [701, 800, '', true],
    [700, 800, '', false],
    [393, 852, '', false],
    [701, 800, '?beamer=1', true],
    [700, 800, '?beamer=1', false],
    [393, 852, '?beamer=1', false],
  ];
  for (const probe of tileProbes) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: probe[0], height: probe[1] },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/' + probe[2]);
    await p.waitForSelector('#startBtn');
    const shown = await p.evaluate(function () {
      var el = document.querySelector('.view-pick');
      return {
        tiles: getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0,
        beamer: document.body.classList.contains('beamer'),
      };
    });
    check(
      shown.tiles === probe[3] && shown.beamer === (probe[3] && !!probe[2]),
      probe[0] +
        ' px wide' +
        (probe[2] ? ' with ' + probe[2] : '') +
        ': view tiles are ' +
        (probe[3] ? 'shown' : 'hidden') +
        ', projector view is ' +
        (probe[3] && probe[2] ? 'on' : 'off')
    );
    await ctx.close();
  }

  console.log('E2E: control bar - fits in the phone view in every window size');
  const phoneViewSizes = [
    [1280, 720],
    [1920, 1080],
    [1024, 768],
    [901, 700],
    [900, 700],
    [768, 1024],
    [701, 900],
    [700, 900],
    [570, 1210],
    [501, 800],
    [500, 800],
    [393, 852],
    [375, 667],
    // phones held sideways
    [852, 393],
    [932, 430],
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
    // What the bar holds depends on the width; the timeline must keep its room
    const parts = await p.evaluate(function () {
      function width(sel) {
        var el = document.querySelector(sel);
        if (!el || getComputedStyle(el).display === 'none') return 0;
        return el.getBoundingClientRect().width;
      }
      return {
        bar: width('#ctlBar'),
        track: width('#ctlTrack'),
        slider: width('#volSlider') > 0,
        mute: width('#soundBtn') > 0,
        views: width('.ctl-view') > 0,
        knob: width('.ctl-knob') > 0,
        role: document.getElementById('ctlSeek').getAttribute('role'),
      };
    });
    const wantSlider = size[0] > 900;
    const wantViews = size[0] > 700;
    const wantKnob = size[0] > 500;
    const share = parts.track / parts.bar;
    check(
      parts.slider === wantSlider &&
        parts.views === wantViews &&
        parts.knob === wantKnob &&
        parts.role === (wantKnob ? 'slider' : 'progressbar') &&
        parts.mute &&
        share >= 0.3,
      label +
        ': ' +
        (wantViews ? 'view switch' : 'no view switch') +
        ', ' +
        (wantSlider ? 'volume slider' : 'sound button only') +
        ', ' +
        (wantKnob ? 'jumping on' : 'jumping off') +
        ', timeline takes ' +
        Math.round(share * 100) +
        '% of the bar (' +
        Math.round(parts.track) +
        ' px)'
    );
    await ctx.close();
  }

  console.log('E2E: control bar - target sizes where the bar is smallest');
  for (const probe of [
    [393, 852, '?beamer=1&testspeed=10', 'phone opened with ?beamer=1'],
    [800, 600, '?beamer=1&testspeed=10', 'projector view on an 800 x 600 projector'],
    [701, 640, '?beamer=1&testspeed=10', 'projector view in the narrowest window'],
    [852, 393, '?testspeed=10', 'phone held sideways'],
  ]) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: probe[0], height: probe[1] },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/' + probe[2]);
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000, state: 'attached' });
    await p.evaluate(function () {
      window.togglePause();
    });
    await axeScan(p, '#ctlBar', probe[0] + 'x' + probe[1] + ' ' + probe[3] + ': control bar');
    await ctx.close();
  }

  console.log('E2E: the simulation starts without the view counter');
  for (const mode of ['SDK host refused', 'SDK host does not answer', 'config.js missing']) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
    });
    await makeHermetic(ctx);
    if (mode === 'SDK host refused') {
      await ctx.route(/www\.gstatic\.com/, function (route) {
        route.abort();
      });
    }
    if (mode === 'SDK host does not answer') {
      // The request is neither answered nor refused: it stays open for good
      await ctx.route(/www\.gstatic\.com/, function () {});
    }
    if (mode === 'config.js missing') {
      await ctx.route('**/js/config.js*', function (route) {
        route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
      });
    }
    const p = await ctx.newPage();
    const modeErrors = [];
    p.on('pageerror', function (err) {
      modeErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10', { waitUntil: 'commit' });
    await p.waitForSelector('#startBtn', { timeout: 5000 });
    await p.click('#startBtn');
    const started = await p.waitForSelector('#aWa.on', { timeout: 3000 }).then(
      function () {
        return true;
      },
      function () {
        return false;
      }
    );
    const state = await p.evaluate(function () {
      return {
        startGone: document.getElementById('start').classList.contains('gone'),
        phone: !document.getElementById('phone').classList.contains('hidden'),
        readyState: document.readyState,
        counter:
          typeof window.counterReady === 'undefined' ? 'not loaded' : String(window.counterReady),
      };
    });
    check(
      started && state.startGone && state.phone && modeErrors.length === 0,
      mode +
        ': the start button works, the phone appears (page is "' +
        state.readyState +
        '", counter ' +
        state.counter +
        ', page errors ' +
        modeErrors.length +
        ')'
    );
    await ctx.close();
  }

  console.log('E2E: view counter with a stand-in for the Firebase SDK');
  {
    // The real SDK never runs in these tests (no traffic to the live database). A small
    // stand-in with the same calls records what the counter script does with it. The page
    // pins the SDK by checksum, so the test serves index.html without those attributes.
    const sdkStub =
      'window.__fb = window.__fb || { init: 0, tx: [], on: [], once: [] };' +
      'window.firebase = {' +
      '  initializeApp: function () { window.__fb.init++; },' +
      '  database: function () { return { ref: function (path) { return {' +
      '    transaction: function (fn) { window.__fb.tx.push(path + "=" + fn(41)); return Promise.resolve(); },' +
      '    on: function (ev, cb) { window.__fb.on.push(path); setTimeout(function () { cb({ val: function () { return 1234; } }); }, 0); },' +
      '    once: function (ev, cb) { window.__fb.once.push(path); var v = Number(new URLSearchParams(location.search).get("daily") || 0);' +
      '      setTimeout(function () { cb({ val: function () { return v; } }); }, 0); }' +
      '  }; } }; }' +
      '};';
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
    });
    await makeHermetic(ctx);
    const rawIndex = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const indexNoSri = rawIndex
      .replace(/ integrity="[^"]*"/g, '')
      .replace(/ crossorigin="anonymous"/g, '');
    await ctx.route(
      function (url) {
        return url.pathname === '/' || url.pathname === '/index.html';
      },
      function (route) {
        route.fulfill({ contentType: 'text/html; charset=utf-8', body: indexNoSri });
      }
    );
    await ctx.route(/www\.gstatic\.com\/.*firebase-app-compat\.js/, function (route) {
      route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: sdkStub });
    });
    await ctx.route(/www\.gstatic\.com\/.*firebase-database-compat\.js/, function (route) {
      route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: '/* stand-in */' });
    });
    const p = await ctx.newPage();
    const stubErrors = [];
    p.on('pageerror', function (err) {
      stubErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10');
    await p
      .waitForFunction(
        function () {
          return document.getElementById('viewCountStart').textContent !== '--';
        },
        { timeout: 5000 }
      )
      .catch(function () {});
    const shown = await p.evaluate(function () {
      return {
        start: document.getElementById('viewCountStart').textContent,
        ready: window.counterReady,
        init: window.__fb ? window.__fb.init : -1,
        boxHidden: getComputedStyle(document.querySelector('.start-views')).display === 'none',
      };
    });
    check(
      shown.ready === true && shown.init === 1 && shown.start === '1.234' && !shown.boxHidden,
      'counter: with the SDK there, the number of views is shown on the start screen (' +
        shown.start +
        ')'
    );
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000 });
    // Jumps, the help page and the way back must not count again
    await p.evaluate(function () {
      window.togglePause();
      window.simSeek(60);
      window.simSeek(window.CTL_TOTAL);
      window.simSeek(20);
      window.simSeek(window.CTL_TOTAL);
    });
    const counted = await p.evaluate(function () {
      return {
        tx: window.__fb.tx.slice().sort(),
        today: new Date().toISOString().slice(0, 10),
        end: document.getElementById('viewCount').textContent,
      };
    });
    check(
      counted.tx.length === 2 &&
        counted.tx[0] === 'daily/' + counted.today + '=42' &&
        counted.tx[1] === 'views=42' &&
        counted.end === '1.234',
      'counter: one start counts exactly once, +1 on /views and on /daily/<today>; jumps and the help page do not count again (' +
        counted.tx.join(', ') +
        ')'
    );
    // Same browser, same day: a second visit does not count
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10');
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000 });
    const second = await p.evaluate(function () {
      return window.__fb.tx.length;
    });
    check(
      second === 0 && stubErrors.length === 0,
      'counter: a second start in the same browser on the same day does not count (' +
        second +
        ' writes)'
    );
    // Daily limit reached: the limit page replaces the start screen
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10&daily=1000000');
    const limit = await p
      .waitForFunction(
        function () {
          return (
            document.getElementById('limitPage').classList.contains('show') &&
            document.getElementById('start').classList.contains('hidden')
          );
        },
        { timeout: 5000 }
      )
      .then(
        function () {
          return true;
        },
        function () {
          return false;
        }
      );
    check(
      limit,
      'counter: when the daily limit is reached, the limit page replaces the start screen'
    );
    await ctx.close();

    // The counter script arrives late (slow SDK host) and the start is clicked before that
    const lateCtx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
    });
    await makeHermetic(lateCtx);
    await lateCtx.route(
      function (url) {
        return url.pathname === '/' || url.pathname === '/index.html';
      },
      function (route) {
        route.fulfill({ contentType: 'text/html; charset=utf-8', body: indexNoSri });
      }
    );
    await lateCtx.route(/www\.gstatic\.com\/.*firebase-app-compat\.js/, function (route) {
      setTimeout(function () {
        route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: sdkStub });
      }, 900);
    });
    await lateCtx.route(/www\.gstatic\.com\/.*firebase-database-compat\.js/, function (route) {
      route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: '/* stand-in */' });
    });
    const late = await lateCtx.newPage();
    late.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await late.goto('http://127.0.0.1:' + server.port + '/?testspeed=10', { waitUntil: 'commit' });
    await late.waitForSelector('#startBtn', { timeout: 5000 });
    await late.click('#startBtn');
    const early = await late.evaluate(function () {
      return {
        started: window.simStarted === true,
        counterThere: typeof window.incrementCounters === 'function',
      };
    });
    await late
      .waitForFunction(
        function () {
          return window.__fb && window.__fb.tx.length >= 2;
        },
        { timeout: 4000 }
      )
      .catch(function () {});
    await late.waitForTimeout(300);
    const lateTx = await late.evaluate(function () {
      return window.__fb ? window.__fb.tx.slice().sort() : null;
    });
    check(
      early.started &&
        !early.counterThere &&
        !!lateTx &&
        lateTx.length === 2 &&
        /^daily\//.test(lateTx[0]) &&
        lateTx[1] === 'views=42',
      'counter: a start before the counter script arrived is counted once when it arrives (' +
        (lateTx ? lateTx.length + ' writes' : 'no counter') +
        ')'
    );
    await lateCtx.close();
  }

  console.log('E2E: pause right after the start (real time)');
  {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/');
    await p.click('#startBtn');
    await p.waitForTimeout(150); // inside the 500 ms start delay
    await p.evaluate(function () {
      window.togglePause();
    });
    await p.waitForTimeout(150);
    await p.evaluate(function () {
      window.togglePause();
    });
    await p.waitForTimeout(900); // the start delay has run out by now
    const c1 = await p.evaluate(function () {
      return { sec: window.sec, at: performance.now() };
    });
    await p.waitForTimeout(1000);
    const c2 = await p.evaluate(function () {
      var out = { sec: window.sec, at: performance.now() };
      window.togglePause();
      out.paused = window.sec;
      return out;
    });
    await p.waitForTimeout(500);
    const c3 = await p.evaluate(function () {
      return window.sec;
    });
    const perSecond = ((c2.sec - c1.sec) / (c2.at - c1.at)) * 1000;
    check(
      perSecond > 0.8 && perSecond < 1.2 && c3 === c2.paused,
      'pause and resume inside the start delay: the clock runs once (' +
        perSecond.toFixed(2) +
        ' s per second) and stands still when paused'
    );
    await ctx.close();
  }

  console.log('E2E: narrow window - phone version, the chosen view comes back when widened');
  {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
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
    const wide1 = await visibleView(p);
    await p.setViewportSize({ width: 700, height: 720 });
    await p.waitForTimeout(150);
    const narrow1 = await visibleView(p);
    await p.keyboard.press('b'); // must not switch anything here
    const narrowState = await p.evaluate(function () {
      var box = document.getElementById('wC').getBoundingClientRect();
      var last = document.querySelector('#wC').lastElementChild.getBoundingClientRect();
      return {
        live: document.body.classList.contains('stage-live'),
        switchShown: getComputedStyle(document.querySelector('.ctl-view')).display !== 'none',
        url: window.location.search,
        below: Math.round(last.bottom - box.bottom),
        sec: window.sec,
      };
    });
    await p.setViewportSize({ width: 701, height: 720 });
    await p.waitForTimeout(150);
    const wide2 = await visibleView(p);
    const wideState = await p.evaluate(function () {
      return {
        live: document.body.classList.contains('stage-live'),
        switchShown: getComputedStyle(document.querySelector('.ctl-view')).display !== 'none',
      };
    });
    check(
      wide1.stage &&
        !narrow1.stage &&
        narrow1.phone &&
        !narrowState.live &&
        !narrowState.switchShown,
      '700 px wide: the projector view gives way to the phone view, the switch is gone'
    );
    check(
      /beamer=1/.test(narrowState.url) && narrowState.below <= 1 && narrowState.sec === 24,
      '700 px wide: the choice is kept, the B key does nothing, the run stands where it was, newest message in sight'
    );
    check(
      wide2.stage && wideState.live && wideState.switchShown,
      '701 px wide: the projector view and the switch are back'
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

  console.log('E2E: gaps the deep audit found (2026-10-08)');
  {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
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
    /** After a jump: is the photo of that app really there, with its picture? */
    function photoState(id) {
      var el = document.querySelector('#' + id + ' .real-photo');
      if (!el) return { there: false, w: 0, h: 0, image: '' };
      var r = el.getBoundingClientRect();
      return { there: true, w: r.width, h: r.height, image: getComputedStyle(el).backgroundImage };
    }
    const igPhoto = await p.evaluate(function () {
      window.simSeek(40);
      return null;
    });
    void igPhoto;
    const ig = await p.evaluate(photoState, 'igPh');
    await p.evaluate(function () {
      window.simSeek(70);
    });
    const tk = await p.evaluate(photoState, 'tkBg');
    check(
      ig.there &&
        ig.w > 100 &&
        ig.h > 100 &&
        /photo/.test(ig.image) &&
        tk.there &&
        tk.w > 100 &&
        tk.h > 100 &&
        /photo/.test(tk.image),
      'after a jump the photo is there in Instagram (' +
        Math.round(ig.w) +
        'x' +
        Math.round(ig.h) +
        ') and in TikTok (' +
        Math.round(tk.w) +
        'x' +
        Math.round(tk.h) +
        ')'
    );
    // A jump away from a spot with a notice takes the notice along
    await p.evaluate(function () {
      window.simSeek(18.5);
    });
    await p.waitForTimeout(80);
    const noteOn = await p.evaluate(function () {
      var el = document.getElementById('toast');
      return {
        show: el.classList.contains('show'),
        opacity: parseFloat(getComputedStyle(el).opacity),
      };
    });
    await p.evaluate(function () {
      window.simSeek(10);
    });
    const noteOff = await p.evaluate(function () {
      return document.getElementById('toast').classList.contains('show');
    });
    check(
      noteOn.show && noteOn.opacity > 0.99 && !noteOff,
      'a jump onto a notice shows it at once (opacity ' +
        noteOn.opacity.toFixed(2) +
        '), a jump away removes it'
    );
    // The clock of the notification scene is set again after a jump
    const clocks = await p.evaluate(function () {
      window.simSeek(85);
      return {
        home: document.getElementById('hsClock').textContent,
        bar: document.getElementById('sbTime').textContent,
      };
    });
    check(
      /^\d\d:\d\d$/.test(clocks.home) && clocks.home === clocks.bar,
      'after a jump the clock on the lock screen shows the time of the status bar (' +
        clocks.home +
        ')'
    );
    // A window change keeps the chat at its newest message
    await p.evaluate(function () {
      window.simSeek(24);
    });
    await p.setViewportSize({ width: 1280, height: 560 });
    await p.waitForTimeout(150);
    const below = await p.evaluate(function () {
      var box = document.getElementById('wC').getBoundingClientRect();
      var last = document.getElementById('wC').lastElementChild.getBoundingClientRect();
      return Math.round(last.bottom - box.bottom);
    });
    check(
      below <= 1,
      'after the window got lower the newest chat message is still in sight (' +
        below +
        ' px below)'
    );
    await p.setViewportSize({ width: 1280, height: 720 });
    await p.waitForTimeout(150);
    check(
      (await p.evaluate(function () {
        return getComputedStyle(document.getElementById('ctlSeek')).touchAction;
      })) === 'none',
      'the timeline takes finger drags itself (touch-action: none)'
    );
    // Dragging in the phone view: a notice under the pointer is visible while held
    const bar = await p.evaluate(function () {
      var r = document.getElementById('ctlTrack').getBoundingClientRect();
      return { left: r.left, width: r.width, y: r.top + r.height / 2, total: window.CTL_TOTAL };
    });
    const barX = function (second) {
      return bar.left + (bar.width * second) / bar.total;
    };
    const frames = function () {
      return new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(resolve);
        });
      });
    };
    await p.mouse.move(barX(5), bar.y);
    await p.mouse.down();
    await p.mouse.move(barX(12), bar.y, { steps: 4 });
    await p.mouse.move(barX(18.6), bar.y, { steps: 4 });
    await p.evaluate(frames);
    const heldNote = await p.evaluate(function () {
      var el = document.getElementById('toast');
      return {
        show: el.classList.contains('show'),
        opacity: parseFloat(getComputedStyle(el).opacity),
        sec: window.sec,
      };
    });
    await p.mouse.up();
    check(
      heldNote.show && heldNote.opacity > 0.99,
      'phone view: a notice is visible while the knob is held on it (' +
        heldNote.sec.toFixed(1) +
        ' s, opacity ' +
        heldNote.opacity.toFixed(2) +
        ')'
    );
    // Running: the pause key does nothing while dragging, and a drag that loses
    // its pointer ends by itself instead of leaving the simulation held
    await p.evaluate(function () {
      window.simSeek(30);
      window.togglePause();
    });
    await p.mouse.move(barX(32), bar.y);
    await p.mouse.down();
    await p.mouse.move(barX(40), bar.y, { steps: 4 });
    await p.evaluate(frames);
    const whileHeld = await p.evaluate(function () {
      window.togglePause();
      return { paused: window.simPaused, scrubbing: window.ctlScrubbing };
    });
    await p.evaluate(function () {
      document
        .getElementById('ctlSeek')
        .dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
    });
    const afterCancel = await p.evaluate(function () {
      return { scrubbing: window.ctlScrubbing, dragging: window.ctlDragging, sec: window.sec };
    });
    const ranAfterCancel = await p
      .waitForFunction(
        function (from) {
          return window.sec > from + 2;
        },
        afterCancel.sec,
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
    await p.mouse.up();
    check(
      whileHeld.scrubbing && !whileHeld.paused,
      'while the knob is held the pause function is ignored, the simulation is held anyway'
    );
    check(
      !afterCancel.scrubbing && !afterCancel.dragging && ranAfterCancel,
      'a drag whose pointer is taken away ends by itself and the run continues'
    );
    await p.mouse.move(barX(50), bar.y);
    await p.mouse.down();
    await p.mouse.move(barX(60), bar.y, { steps: 4 });
    await p.evaluate(frames);
    const afterBlur = await p.evaluate(function () {
      window.dispatchEvent(new Event('blur'));
      return { scrubbing: window.ctlScrubbing, dragging: window.ctlDragging, sec: window.sec };
    });
    const ranAfterBlur = await p
      .waitForFunction(
        function (from) {
          return window.sec > from + 2;
        },
        afterBlur.sec,
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
    await p.mouse.up();
    check(
      !afterBlur.scrubbing && !afterBlur.dragging && ranAfterBlur,
      'leaving the window in the middle of a drag ends it, the run continues'
    );
    // The button was released where the page could not see it: the next move without a button ends the drag
    await p.mouse.move(barX(70), bar.y);
    await p.mouse.down();
    await p.mouse.move(barX(80), bar.y, { steps: 4 });
    await p.evaluate(frames);
    const afterLostButton = await p.evaluate(function () {
      var seek = document.getElementById('ctlSeek');
      var r = seek.getBoundingClientRect();
      var held = window.ctlScrubbing;
      seek.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          buttons: 0,
          clientX: r.left + r.width / 2,
          clientY: r.top + 5,
        })
      );
      return { held: held, scrubbing: window.ctlScrubbing, dragging: window.ctlDragging };
    });
    await p.mouse.up();
    check(
      afterLostButton.held && !afterLostButton.scrubbing && !afterLostButton.dragging,
      'a pointer move without a pressed button ends the drag (released outside the window)'
    );
    // Legal notice: keyboard focus goes into the dialog and comes back; nothing behind it can be used
    await p.focus('#impLinkRun');
    await p.keyboard.press('Enter');
    const dlgOpen = await p.evaluate(function () {
      var scroll = document.querySelector('#impModal .imp-scroll');
      return {
        focus: document.activeElement ? document.activeElement.id : '',
        barOff: document.getElementById('ctlBar').inert === true,
        phoneOff: document.getElementById('phone').inert === true,
        scrolled: Math.round(scroll.scrollTop),
        room: Math.round(scroll.scrollHeight - scroll.clientHeight),
      };
    });
    await axeScan(p, '#impModal', 'legal notice opened from the control bar');
    await p.keyboard.press('Escape');
    const dlgClosed = await p.evaluate(function () {
      return {
        focus: document.activeElement ? document.activeElement.id : '',
        barOff: document.getElementById('ctlBar').inert === true,
      };
    });
    check(
      dlgOpen.focus === 'impCloseBtn' &&
        dlgOpen.barOff &&
        dlgOpen.phoneOff &&
        dlgOpen.room > 100 &&
        dlgOpen.scrolled === 0 &&
        dlgClosed.focus === 'impLinkRun' &&
        !dlgClosed.barOff,
      'legal notice: opens at its beginning, focus moves to its close button, the bar behind is switched off, focus returns afterwards (' +
        dlgOpen.focus +
        ' -> ' +
        dlgClosed.focus +
        ')'
    );
    // Paused on the help page: the "link copied" note still goes away.
    // On the way there the focus sits on the pause button, which is switched off on that page.
    await p.evaluate(function () {
      if (!window.simPaused) window.togglePause();
    });
    await p.focus('#pauseBtn');
    await p.evaluate(function () {
      window.simSeek(window.CTL_TOTAL);
    });
    const focusAtEnd = await p.evaluate(function () {
      return {
        id: document.activeElement ? document.activeElement.id : '',
        pauseOff: document.getElementById('pauseBtn').disabled,
      };
    });
    check(
      focusAtEnd.pauseOff && focusAtEnd.id === 'ctlSeek',
      'when the pause button is switched off on the help page, a focus on it moves to the timeline (' +
        focusAtEnd.id +
        ')'
    );
    await p.waitForTimeout(100);
    await p.click('#footerShareBtn');
    const copiedOn = await p.evaluate(function () {
      return document.getElementById('toast').classList.contains('show');
    });
    await p.waitForTimeout(3000);
    const copiedOff = await p.evaluate(function () {
      return {
        show: document.getElementById('toast').classList.contains('show'),
        paused: window.simPaused,
      };
    });
    check(
      copiedOn && !copiedOff.show && copiedOff.paused,
      'paused on the help page: the note of the share button appears and is gone 3 s later'
    );
    await ctx.close();
  }
  {
    // Projector view: after a jump the picture is there and nothing fades in
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10&beamer=1');
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000, state: 'attached' });
    const stagePhoto = await p.evaluate(function () {
      window.togglePause();
      window.simSeek(40);
      return new Promise(function (resolve) {
        // the stage mirrors the jump in a microtask
        Promise.resolve().then(function () {
          Promise.resolve().then(function () {
            var el = document.querySelector('#stIgPh .real-photo');
            var r = el ? el.getBoundingClientRect() : { width: 0, height: 0 };
            var items = document.querySelectorAll('#stage .st-scene.on .st-item');
            var still = document.querySelectorAll('#stage .st-scene.on .st-item.st-still');
            resolve({
              w: r.width,
              h: r.height,
              image: el ? getComputedStyle(el).backgroundImage : '',
              items: items.length,
              still: still.length,
            });
          });
        });
      });
    });
    check(
      stagePhoto.w > 100 && stagePhoto.h > 100 && /photo/.test(stagePhoto.image),
      'projector view: after a jump the picture of the scene is there (' +
        Math.round(stagePhoto.w) +
        'x' +
        Math.round(stagePhoto.h) +
        ')'
    );
    check(
      stagePhoto.items > 0 && stagePhoto.still === stagePhoto.items,
      'projector view: messages created by a jump stand at once, without a fade-in (' +
        stagePhoto.still +
        ' of ' +
        stagePhoto.items +
        ')'
    );
    await ctx.close();
  }
  for (const probe of [
    ['', 'de'],
    ['?lang=en', 'en'],
  ]) {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
    });
    await makeHermetic(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/' + probe[0]);
    await p.waitForSelector('#startBtn');
    const lang = await p.evaluate(function () {
      return document.documentElement.lang;
    });
    check(
      lang === probe[1],
      'page language for screen readers is "' +
        lang +
        '" with "' +
        (probe[0] || 'no parameter') +
        '"'
    );
    if (probe[1] === 'de') {
      // The room for the disclaimer follows a window change
      await p.setViewportSize({ width: 560, height: 1210 });
      await p.waitForTimeout(250);
      const gap = await p.evaluate(function () {
        var credit = document.querySelector('.start-credit').getBoundingClientRect();
        var disc = document.querySelector('.disclaimer').getBoundingClientRect();
        var start = document.getElementById('start').getBoundingClientRect();
        return {
          credit: Math.round(disc.top - credit.bottom),
          page: Math.round(disc.top - start.bottom),
          room: document.documentElement.style.getPropertyValue('--disc-h'),
          height: Math.round(disc.height),
        };
      });
      check(
        gap.credit >= 0 && gap.page >= 0 && gap.room === gap.height + 'px',
        'start screen narrowed from 1280 to 560 px: the page ends above the disclaimer, whose measured height (' +
          gap.height +
          ' px) is the room kept free (' +
          gap.room +
          ')'
      );
    }
    await ctx.close();
  }
  {
    // The example configuration has no logo and one link. The live page has a logo and two
    // links, and one audit finding only showed with them: run the help page that way too.
    const ctx = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 720 },
    });
    await makeHermetic(ctx);
    const liveLike =
      fs.readFileSync(path.join(ROOT, 'js', 'config.example.js'), 'utf8') +
      "\nhelplineConfig = { logo: 'assets/sticker.png', logoAlt: 'Logo', link: 'https://example.org/', linkLabel: 'example.org', infoLink: 'https://example.org/info', infoLabel: 'Weitere Infos', slogan: 'Slogan' };\n";
    await ctx.route('**/js/config.js*', function (route) {
      route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: liveLike });
    });
    const p = await ctx.newPage();
    p.on('pageerror', function (err) {
      pageErrors.push(String(err));
    });
    await p.goto('http://127.0.0.1:' + server.port + '/?testspeed=10');
    await p.click('#startBtn');
    await p.waitForSelector('#aWa.on', { timeout: 5000 });
    await p.waitForFunction(
      function () {
        return getComputedStyle(document.getElementById('start')).visibility === 'hidden';
      },
      { timeout: 3000 }
    );
    const liveHelp = await p.evaluate(function () {
      window.togglePause();
      // there, back into the run, and there again: nothing may double
      window.simSeek(window.CTL_TOTAL);
      window.simSeek(30);
      window.simSeek(window.CTL_TOTAL);
      var links = document.querySelectorAll('#ctaLinks a');
      var heights = [];
      for (var i = 0; i < links.length; i++) {
        heights.push(Math.round(links[i].getBoundingClientRect().height));
      }
      var logo = document.querySelector('#ctaLogo img');
      return {
        logos: document.querySelectorAll('#ctaLogo img').length,
        logoShown: !!logo && logo.getBoundingClientRect().height > 10,
        links: links.length,
        heights: heights,
      };
    });
    check(
      liveHelp.logos === 1 && liveHelp.logoShown && liveHelp.links === 2,
      'help page like the live one: after going there twice it has one logo and two links (' +
        liveHelp.logos +
        ', ' +
        liveHelp.links +
        ')'
    );
    check(
      liveHelp.heights.length === 2 &&
        liveHelp.heights.every(function (h) {
          return h >= 24;
        }),
      'help page like the live one: each link is at least 24 px high (' +
        liveHelp.heights.join(', ') +
        ')'
    );
    await p.waitForTimeout(150);
    await axeScan(p, '#aCta', 'help page with a logo and two links');
    await ctx.close();
  }
  for (const size of [
    [852, 393],
    [667, 375],
  ]) {
    // Help page in a low window: every part can be brought into view and is then uncovered
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
      window.simSeek(window.CTL_TOTAL);
    });
    await p.waitForTimeout(250);
    const covered = await p.evaluate(function () {
      var out = [];
      // The page itself ends above the disclaimer, and the disclaimer above the bar
      var page = document.getElementById('aCta').getBoundingClientRect();
      var disc = document.querySelector('.disclaimer').getBoundingClientRect();
      var bar = document.getElementById('ctlBar').getBoundingClientRect();
      if (page.bottom > disc.top + 1) {
        out.push('page reaches ' + Math.round(page.bottom - disc.top) + ' px under the disclaimer');
      }
      if (disc.bottom > bar.top + 1) {
        out.push('disclaimer reaches ' + Math.round(disc.bottom - bar.top) + ' px under the bar');
      }
      ['#ctaLinks a', '#ctaHelpline', '#ctaMsg', '#footerShareBtn', '#footerReplayBtn'].forEach(
        function (sel) {
          var el = document.querySelector(sel);
          if (!el) {
            out.push(sel + ' missing');
            return;
          }
          el.scrollIntoView({ block: 'center' });
          var r = el.getBoundingClientRect();
          var points = [
            [r.left + r.width / 2, r.top + 2],
            [r.left + r.width / 2, r.bottom - 2],
          ];
          points.forEach(function (pt) {
            var top = document.elementFromPoint(pt[0], pt[1]);
            if (!top || !(el === top || el.contains(top))) out.push(sel + ' covered');
          });
        }
      );
      return out;
    });
    check(
      covered.length === 0,
      size[0] +
        'x' +
        size[1] +
        ': every part of the help page can be scrolled into view and is not covered' +
        (covered.length ? ' - ' + covered.join(', ') : '')
    );
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
    // The same after jumps: many messages arrive at once, the fit check must still hold
    const jumpClip = await p.evaluate(async function () {
      var worst = 0;
      var at = -1;
      var targets = 0;
      for (var t = 2; t < 114; t += 0.5) {
        window.simSeek(t);
        await new Promise(function (resolve) {
          requestAnimationFrame(function () {
            requestAnimationFrame(resolve);
          });
        });
        var lists = document.querySelectorAll('#stage .st-scene.on .st-list');
        for (var i = 0; i < lists.length; i++) {
          var live = lists[i].querySelectorAll('.st-item:not(.out)');
          if (!live.length) continue;
          var cut = lists[i].getBoundingClientRect().top - live[0].getBoundingClientRect().top;
          if (cut > worst) {
            worst = cut;
            at = t;
          }
        }
        targets++;
      }
      return { worst: worst, at: at, targets: targets, paused: window.simPaused };
    });
    check(
      jumpClip.targets > 200 && jumpClip.worst <= 1.5,
      'with 30% wider text no message is cut off after a jump either (worst ' +
        jumpClip.worst.toFixed(1) +
        ' px' +
        (jumpClip.worst > 1.5 ? ' at ' + jumpClip.at + ' s' : '') +
        ', ' +
        jumpClip.targets +
        ' targets)'
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
