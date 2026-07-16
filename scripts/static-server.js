/**
 * Minimal static file server for the test runners (no dependencies).
 * Serves the repository root on an ephemeral localhost port.
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
 * @returns {Promise<{port: number, close: Function}>}
 */
function createStaticServer(root) {
  const server = http.createServer(function (req, res) {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
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
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      });
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
