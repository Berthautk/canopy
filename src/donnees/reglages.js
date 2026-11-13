// Réglages de l'application, stockés uniquement sur le téléphone.
// IndexedDB (via idb-keyval) est la source de vérité ; une copie dans localStorage
// permet d'appliquer le thème et la taille du texte dès le premier affichage, sans clignotement.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

export const TAILLES = { normal: 1, grand: 1.15, 'tres-grand': 1.3 };
const DEFAUT = { taille: 'normal', theme: 'auto', premierLancementVu: false };
const CLE = 'yeshaya:reglages';

function lireCopie() {
  try { return { ...DEFAUT, ...JSON.parse(localStorage.getItem(CLE) || '{}') }; } catch { return { ...DEFAUT }; }
}

export const reglages = signal(lireCopie());

export function appliquer(r = reglages.valeur) {
  const html = document.documentElement;
  const sombre = r.theme === 'sombre' || (r.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  html.dataset.theme = sombre ? 'sombre' : 'clair';
  html.style.setProperty('--echelle', TAILLES[r.taille] ?? 1);
  html.dataset.taille = r.taille;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sombre ? '#0A1322' : '#172B49');
}

export async function chargerReglages() {
  try {
    const stockes = await get(CLE);
    if (stockes) reglages.valeur = { ...DEFAUT, ...stockes };
  } catch { /* IndexedDB indisponible : on garde la copie locale */ }
  appliquer();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => appliquer());
}

export async function modifierReglages(changements) {
  const r = { ...reglages.valeur, ...changements };
  reglages.valeur = r;
  appliquer(r);
  try { localStorage.setItem(CLE, JSON.stringify(r)); } catch {}
  try { await set(CLE, r); } catch {}
}

// Demande au navigateur de ne pas effacer nos données (Bible, favoris, journal…).
export async function demanderStockagePersistant() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {}
}
