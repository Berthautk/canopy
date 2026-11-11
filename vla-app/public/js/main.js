import { createBackend } from './backend.js';
import { runCandidate } from './candidate.js';
import { runStaff } from './staff.js';
import { IMG } from './ui.js';

const root = document.getElementById('root');
let backend, candStarted = false;

function landing() {
  root.innerHTML = `<div class="cand"><header class="chead"><img src="${IMG.logo}" alt=""><div class="grow"><div class="t1">Valérie Language Academy (VLA)</div><div class="t2">Learn · Practice · Succeed</div></div></header>
  <main class="cmain"><div class="ccard hero"><div><h1>Bienvenue à<br>Valérie Language Academy</h1><p class="qbig">Test de placement d'anglais</p>
    <p>Ce test sert à trouver le bon cours pour vous. Il est normal de ne pas tout réussir.</p>
    <a class="btn primary big" href="#/c">▶ Accéder à mon test</a><a class="btn big mt" href="#/staff">🔐 Espace de Valérie (formateurs)</a></div>
    <img class="ph" src="assets/people/formatrice.jpg" alt=""></div></main></div>`;
}

async function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  window.__vlaCleanup?.forEach((f) => f()); window.__vlaCleanup = [];
  if (!parts.length) return landing();
  if (parts[0] === 'c') {
    if (candStarted) return location.reload();
    candStarted = true;
    return runCandidate(root, backend, parts[1]);
  }
  if (parts[0] === 'staff') return runStaff(root, backend, parts.slice(1));
  landing();
}

(async () => {
  backend = await createBackend();
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
