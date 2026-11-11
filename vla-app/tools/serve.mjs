// Serveur de développement : sert public/ et, UNIQUEMENT en local (localhost), les corrigés de source-data/
// via /__dev/key/<CODE>.json afin de tester sans Firebase. Ne pas utiliser en production.
import http from 'node:http'; import { readFileSync, existsSync, statSync } from 'node:fs'; import { extname, join, normalize } from 'node:path';
import { splitTest } from '../public/js/scoring.js';
const root = new URL('../public/', import.meta.url).pathname, src = new URL('../source-data/', import.meta.url).pathname;
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 8080);
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
  const m = /^\/__dev\/key\/(\w+)\.json$/.exec(p);
  if (m) { const f = `${src}test_${m[1]}.json`; if (!existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(splitTest(JSON.parse(readFileSync(f, 'utf8'))).key)); }
  if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(root, p));
  if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(readFileSync(f));
}).listen(port, () => console.log('VLA sur http://localhost:' + port));
