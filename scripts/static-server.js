/**
 * Minimal static file server for the test runners (no dependencies).
 * Serves the repository root on an ephemeral localhost port.
 * Answers byte ranges like the live hosting does: without them a browser
 * cannot jump inside the music file, and the timeline tests would measure
 * a behaviour the live page does not have.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
};

/**
 * Starts a static server for `root`.
 * @param {string} root - Absolute directory to serve
 * @param {Function} [intercept] - Called first with (req, res, urlPath); if it
 *   returns true it has answered the request itself (scripts/check-ios.js)
 * @returns {Promise<{port: number, close: Function}>}
 */
function createStaticServer(root, intercept) {
  const server = http.createServer(function (req, res) {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (intercept && intercept(req, res, urlPath)) return;
    const filePath = path.normalize(path.join(root, urlPath === '/' ? '/index.html' : urlPath));
    if (!filePath.startsWith(root)) {
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
      const type = MIME[path.extname(filePath)] || 'application/octet-stream';
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (range && (range[1] || range[2])) {
        // "a-b", "a-" (to the end) or "-n" (the last n bytes)
        const last = data.length - 1;
        const start = range[1] ? Number(range[1]) : Math.max(data.length - Number(range[2]), 0);
        const end = range[1] && range[2] ? Math.min(Number(range[2]), last) : last;
        if (start > end || start > last) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + data.length });
          res.end();
          return;
        }
        res.writeHead(206, {
          'Content-Type': type,
          'Accept-Ranges': 'bytes',
          'Content-Range': 'bytes ' + start + '-' + end + '/' + data.length,
          'Content-Length': end - start + 1,
        });
        res.end(data.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes' });
      res.end(data);
    });
  });
  return new Promise(function (resolve) {
    server.listen(0, '127.0.0.1', function () {
      resolve({
        port: server.address().port,
        close: function () {
          server.close();
        },
      });
    });
  });
}

module.exports = { createStaticServer };
