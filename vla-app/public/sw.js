// Service worker : l'app et les énoncés fonctionnent hors ligne. Les audios sont gérés par l'app (IndexedDB).
const V = 'vla-v4';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/main.js', 'js/backend.js', 'js/idb.js', 'js/candidate.js', 'js/staff.js', 'js/correct.js', 'js/scoring.js', 'js/ui.js', 'js/identity.js', 'js/attestation.js', 'js/centre.js', 'js/train.js', 'js/learn.js', 'js/practice.js', 'data/bank.json', 'js/vendor/jspdf.umd.min.js', 'js/vendor/html2canvas.min.js', 'assets/swoosh.svg', ...['apprenante','ordinateur','ecoute','enfants','enfant_classe','groupe','cours','equipe','sortie','visite','diplome','accueil','tablette','etudiant'].map((n) => `assets/photos/${n}.jpg`), 'assets/seal.png', 'js/firebase-config.js', 'js/vendor/qrcode.js',
  'assets/logo_vla.png', 'data/public_ADU.json', 'data/public_ENF.json', 'data/public_IEL.json', 'manifest.webmanifest',
  ...['formatrice', 'candidat1', 'candidat4', 'enfant1', 'enfant2', 'valerie'].map((n) => `assets/people/${n}.jpg`)];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.pathname.startsWith('/__dev') || /firestore|identitytoolkit|securetoken|googleapis\.com\/(v1|google\.firestore)/.test(u.host + u.pathname)) return;
  if (u.host.endsWith('jsdelivr.net') && u.pathname.endsWith('.mp3')) return; // audios : IndexedDB
  // réseau d'abord (pour recevoir les mises à jour), cache en secours hors ligne
  e.respondWith(fetch(r).then((res) => { if (res.ok && (u.origin === location.origin || u.host === 'www.gstatic.com' || u.host.includes('fonts.g'))) { const c = res.clone(); caches.open(V).then((ca) => ca.put(r, c)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined))));
});
