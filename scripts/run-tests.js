#!/usr/bin/env node
/**
 * Headless QUnit runner.
 * Serves the repository over a local HTTP server, opens tests/test-runner.html
 * in headless Chromium (Playwright) and exits non-zero if any test fails.
 * Usage: npm run test
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
};

function serve(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filePath = path.normalize(path.join(ROOT, urlPath === '/' ? '/index.html' : urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
    });
    res.end(data);
  });
}

(async function main() {
  const server = http.createServer(serve);
  await new Promise(function (resolve) {
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', function (err) {
    pageErrors.push(String(err));
  });

  await page.goto('http://127.0.0.1:' + port + '/tests/test-runner.html');
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
