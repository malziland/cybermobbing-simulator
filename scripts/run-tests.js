#!/usr/bin/env node
/**
 * Headless QUnit runner.
 * Serves the repository over a local HTTP server, opens tests/test-runner.html
 * in headless Chromium (Playwright) and exits non-zero if any test fails.
 * Usage: npm run test
 */
'use strict';

const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('./static-server');

const ROOT = path.resolve(__dirname, '..');

(async function main() {
  const server = await createStaticServer(ROOT);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', function (err) {
    pageErrors.push(String(err));
  });

  await page.goto('http://127.0.0.1:' + server.port + '/tests/test-runner.html');
  await page.waitForSelector('#qunit-banner.qunit-pass, #qunit-banner.qunit-fail', {
    timeout: 60000,
  });

  const result = await page.evaluate(function () {
    const el = document.getElementById('qunit-testresult');
    return {
      passed: Number(el.querySelector('.passed').textContent),
      failed: Number(el.querySelector('.failed').textContent),
      total: Number(el.querySelector('.total').textContent),
    };
  });
  const failures = await page.evaluate(function () {
    return Array.from(document.querySelectorAll('#qunit-tests > li.fail > strong')).map(
      function (el) {
        return el.textContent;
      }
    );
  });

  await browser.close();
  server.close();

  console.log(
    'QUnit: ' +
      result.passed +
      '/' +
      result.total +
      ' assertions passed, ' +
      result.failed +
      ' failed'
  );
  if (failures.length) {
    console.log('Failed tests:\n- ' + failures.join('\n- '));
  }
  if (pageErrors.length) {
    console.log('Page errors:\n- ' + pageErrors.join('\n- '));
  }
  process.exit(result.failed > 0 || pageErrors.length > 0 ? 1 : 0);
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
