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
  const exampleConfig = fs.readFileSync(path.join(ROOT, 'js', 'config.example.js'), 'utf8');
  await page.route('**/js/config.js*', function (route) {
    route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: exampleConfig });
  });
  await page.route(
    function (url) {
      return /firebaseio\.com|googleapis\.com/.test(url.href);
    },
    function (route) {
      route.abort();
    }
  );

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
