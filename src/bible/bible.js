// Accès au texte de la Bible : cache mémoire -> Cache Storage (hors ligne) -> réseau.
import { LIVRES, PAR_CODE } from './references.js';
import { signal } from '../outils/signal.js';

export const CACHE_BIBLE = 'yeshaya-bible';          // partagé avec le service worker (vite.config.js)
const memoire = new Map();
const url = (code) => '/bible/' + PAR_CODE[code].fichier;

export async function chargerLivre(code) {
  if (memoire.has(code)) return memoire.get(code);
  const promesse = (async () => {
    let rep = null;
    try { rep = await (await caches.open(CACHE_BIBLE)).match(url(code)); } catch {}
    if (!rep) {
      rep = await fetch(url(code));
      if (!rep.ok) throw new Error('Livre indisponible');
      try { (await caches.open(CACHE_BIBLE)).put(url(code), rep.clone()); } catch {}
    }
    return rep.json();
  })();
  memoire.set(code, promesse);
  promesse.catch(() => memoire.delete(code));
  return promesse;
}

export async function texteVerset(code, c, v) {
  const l = await chargerLivre(code);
  return l.chapitres[c - 1]?.[v - 1] ?? null;
}

// Texte d'une référence (avec plage éventuelle) : [{v, texte}]
export async function textePassage({ code, c, v, fin }) {
  const l = await chargerLivre(code); const ch = l.chapitres[c - 1] || [];
  const de = v || 1, a = fin || v || ch.length;
  const r = []; for (let n = de; n <= a; n++) if (ch[n - 1]) r.push({ v: n, texte: ch[n - 1] });
  return r;
}

// ===== Téléchargement complet pour l'usage hors ligne =====
export const etatTelechargement = signal({ statut: 'inconnu', fait: 0, total: LIVRES.length });

export async function verifierHorsLigne() {
  try {
    const cache = await caches.open(CACHE_BIBLE);
    const presents = await Promise.all(LIVRES.map((l) => cache.match(url(l.code)).then(Boolean)));
    const fait = presents.filter(Boolean).length;
    etatTelechargement.valeur = { statut: fait === LIVRES.length ? 'complet' : 'partiel', fait, total: LIVRES.length };
  } catch { etatTelechargement.valeur = { statut: 'indisponible', fait: 0, total: LIVRES.length }; }
  return etatTelechargement.valeur;
}

export async function telechargerBible() {
  const cache = await caches.open(CACHE_BIBLE);
  let fait = 0;
  etatTelechargement.valeur = { statut: 'en-cours', fait, total: LIVRES.length };
  try {
    for (const l of LIVRES) {                               // un livre à la fois : doux pour un réseau lent
      if (!(await cache.match(url(l.code)))) {
        const rep = await fetch(url(l.code), { cache: 'no-cache' });
        if (!rep.ok) throw new Error('réseau');
        await cache.put(url(l.code), rep);
      }
      fait++;
      etatTelechargement.valeur = { statut: 'en-cours', fait, total: LIVRES.length };
    }
    etatTelechargement.valeur = { statut: 'complet', fait, total: LIVRES.length };
  } catch {
    etatTelechargement.valeur = { statut: 'erreur', fait, total: LIVRES.length };
  }
}

// ===== Recherche par mot (Web Worker) =====
let worker = null, compteur = 0;
const attentes = new Map();
export function chercherMot(q, limite = 300, champ = null) {
  if (!worker) {
    worker = new Worker(new URL('./recherche.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => { const f = attentes.get(e.data.id); if (f) { attentes.delete(e.data.id); f(e.data); } };
  }
  const id = ++compteur;
  return new Promise((ok) => { attentes.set(id, ok); worker.postMessage({ id, q, limite, champ }); });
}
