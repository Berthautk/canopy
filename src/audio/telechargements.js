// Téléchargement des audios pour l'écoute hors ligne (Cache Storage + liste dans IndexedDB).
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

export const CACHE_AUDIO = 'yeshaya-audio';      // lu par le service worker (vite.config.js), avec gestion des « Range »
const CLE = 'yeshaya:telechargements';
export const telecharges = signal({});            // { id: { piste, taille, date } }
export const enCours = signal({});                // { id: pourcentage }

export async function chargerTelechargements() { try { telecharges.valeur = (await get(CLE)) || {}; } catch {} }
const enregistrer = (t) => { telecharges.valeur = t; return set(CLE, t).catch(() => {}); };

export async function telecharger(piste) {
  if (telecharges.valeur[piste.id] || enCours.valeur[piste.id] !== undefined) return;
  enCours.valeur = { ...enCours.valeur, [piste.id]: 0 };
  try {
    const rep = await fetch(piste.url, { cache: 'no-store' });
    if (!rep.ok) throw new Error('réseau');
    const total = +rep.headers.get('content-length') || 0;
    const morceaux = []; let recu = 0;
    if (rep.body?.getReader) {
      const r = rep.body.getReader();
      for (;;) {
        const { done, value } = await r.read(); if (done) break;
        morceaux.push(value); recu += value.length;
        if (total) enCours.valeur = { ...enCours.valeur, [piste.id]: Math.round((recu / total) * 100) };
      }
    } else { morceaux.push(new Uint8Array(await rep.arrayBuffer())); recu = morceaux[0].length; }
    const blob = new Blob(morceaux, { type: rep.headers.get('content-type') || 'audio/mpeg' });
    const cache = await caches.open(CACHE_AUDIO);
    await cache.put(piste.url, new Response(blob, { headers: { 'Content-Type': blob.type, 'Content-Length': String(blob.size) } }));
    await enregistrer({ ...telecharges.valeur, [piste.id]: { piste, taille: blob.size, date: new Date().toISOString() } });
    return true;
  } catch {
    return false;
  } finally {
    const e = { ...enCours.valeur }; delete e[piste.id]; enCours.valeur = e;
  }
}

export async function supprimer(id) {
  const t = { ...telecharges.valeur }; const x = t[id]; if (!x) return;
  try { await (await caches.open(CACHE_AUDIO)).delete(x.piste.url); } catch {}
  delete t[id]; await enregistrer(t);
}

export async function toutSupprimer() {
  try { await caches.delete(CACHE_AUDIO); } catch {}
  await enregistrer({});
}

export const tailleTotale = (t = telecharges.valeur) => Object.values(t).reduce((n, x) => n + (x.taille || 0), 0);
export function formatTaille(o) {
  if (o < 1e6) return `${Math.max(1, Math.round(o / 1e3))} Ko`;
  if (o < 1e9) return `${(o / 1e6).toFixed(1).replace('.', ',')} Mo`;
  return `${(o / 1e9).toFixed(2).replace('.', ',')} Go`;
}
