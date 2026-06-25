/* server.js — serves the app AND persists all app state to state.json in the repo.
 *   GET  /api/state  -> the saved state JSON ({} if none yet)
 *   POST /api/state  -> overwrite state.json with the posted JSON
 * Everything else is served as a static file from this directory.
 * Run: node server.js   (or: npm start). Port via PORT env, default 8731.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const STATE_FILE = path.join(ROOT, 'state.json');
const PORT = process.env.PORT || 8731;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.map': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

const server = http.createServer(function (req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/state') {
    if (req.method === 'GET') {
      fs.readFile(STATE_FILE, 'utf8', function (err, data) {
        send(res, 200, err ? '{}' : data, 'application/json');
      });
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', function (c) { body += c; if (body.length > 8e6) req.destroy(); });
      req.on('end', function () {
        try { JSON.parse(body); } catch (e) { return send(res, 400, '{"error":"invalid json"}', 'application/json'); }
        // atomic-ish write: tmp then rename, so a crash can't truncate the file
        const tmp = STATE_FILE + '.tmp';
        fs.writeFile(tmp, body, 'utf8', function (err) {
          if (err) return send(res, 500, '{"error":"write failed"}', 'application/json');
          fs.rename(tmp, STATE_FILE, function (err2) {
            if (err2) return send(res, 500, '{"error":"rename failed"}', 'application/json');
            send(res, 200, '{"ok":true}', 'application/json');
          });
        });
      });
      return;
    }
    return send(res, 405, 'method not allowed');
  }

  // static files
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const fp = path.join(ROOT, pathname);
  if (path.relative(ROOT, fp).startsWith('..')) return send(res, 403, 'forbidden');
  fs.readFile(fp, function (err, data) {
    if (err) return send(res, 404, 'not found');
    send(res, 200, data, MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream');
  });
});

server.listen(PORT, function () {
  console.log('virtual_cube running at http://localhost:' + PORT + '  (state -> ' + STATE_FILE + ')');
});
