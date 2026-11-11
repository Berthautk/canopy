import { createBackend } from './backend.js';
import { runCandidate } from './candidate.js';
import { runStaff } from './staff.js';
import { IMG } from './ui.js';

const root = document.getElementById('root');
let backend, candStarted = false;

function landing() {
  root.innerHTML = `<div class="cand"><header class="chead"><img class="logo" src="${IMG.logo}" alt=""><div class="vsep"></div><div><div class="t1">Valérie Language Academy (VLA)</div><div class="t2" style="font-style:italic">Learn · Practice · Succeed</div></div></header>
  <main class="cmain"><div class="ccard hero" style="background:linear-gradient(120deg,#fff 35%,#E8F1FC)"><div><div class="herotitle">Bienvenue à<b>Valérie Language Academy</b></div>
    <div class="rule2">Test de placement d’anglais</div>
    <p class="qbig" style="text-align:center;font-weight:500;line-height:1.5">Ce test sert à trouver le bon cours pour vous.<br>Il est normal de ne pas tout réussir.<br><i style="font-weight:700">Faites de votre mieux !</i></p>
    <a class="btn primary big" href="#/c">▶ &nbsp;Accéder au test &nbsp;❯</a><a class="btn big mt" style="min-height:52px;font-size:1.05rem" href="#/staff">🔐 Espace de Valérie (formateurs)</a></div>
    <img class="ph" src="assets/people/formatrice.jpg" alt=""></div><p class="muted" style="text-align:center;font-style:italic">Votre avenir commence ici !</p></main></div>`;
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
