// Assemble le site Netlify complet :  dist/  =  VLA Gestion (existant, légèrement complété)  +  dist/placement/ (ce module).
// Aucun corrigé n'est copié : public/ ne contient que les énoncés ; les corrigés sont importés dans l'app.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const dist = root + 'dist/';
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist, { recursive: true });

// 1) VLA Gestion : fichiers d'origine + 3 ajouts minimaux et additifs
let html = readFileSync(root + 'host/index.html', 'utf8');
const patch = (from, to, count = 1) => {
  const n = html.split(from).length - 1;
  if (n !== count) throw new Error(`Patch introuvable ou ambigu (${n} occurrence(s)) : ${from.slice(0, 60)}`);
  html = html.split(from).join(to);
};
// a) menu : accès aux deux modules (manager : les deux ; secrétariat : tests de placement)
const LEARN = '["learners","Apprenants","people"],';
const idx = html.indexOf(LEARN), idx2 = html.indexOf(LEARN, idx + 1);
html = html.slice(0, idx2) + LEARN + '["placement","Tests de placement","check"],' + html.slice(idx2 + LEARN.length);
html = html.slice(0, idx) + LEARN + '["placement","Tests de placement","check"],["train","Entraînement","book"],' + html.slice(idx + LEARN.length);
// b) ces deux entrées ouvrent le module (même site) au lieu d'une vue interne
patch('function go(v) { if (S.view !== v', 'function go(v) { if (v === "placement" || v === "train") { location.href = "placement/#/" + (v === "train" ? "train" : "staff"); return; } if (S.view !== v');
// c) si le module modifie la base (nouvel apprenant testé) dans un autre onglet, la gestion se met à jour
patch('function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e) {} }',
  'function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e) {} }\nwindow.addEventListener("storage", e => { if (e.key === KEY && e.newValue) { try { const d = JSON.parse(e.newValue); if (d && d.v === 7) { DB = d; if (S.user && !S.modal) render(); } } catch(err) {} } });');
writeFileSync(dist + 'index.html', html);
for (const f of ['sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) cpSync(root + 'host/' + f, dist + f);

// 2) Module : public/ → dist/placement/
cpSync(root + 'public', dist + 'placement', { recursive: true });

// 3) En-têtes de sécurité : ceux d'origine + ce dont le module a besoin (audio, Firebase, caméra)
writeFileSync(dist + '_headers', `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(self), microphone=(self), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob: https://cdn.jsdelivr.net; connect-src 'self' https://cdn.jsdelivr.net https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
/placement/sw.js
  Cache-Control: no-cache
/sw.js
  Cache-Control: no-cache
`);
console.log('dist/ prêt :', dist);
