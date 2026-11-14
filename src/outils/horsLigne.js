// « Tout rendre disponible sans internet » : télécharge toutes les illustrations (le service worker les garde).
// Les textes de l'application sont déjà gardés automatiquement ; la Bible a son propre téléchargement.
import { signal } from './signal.js';
export const etatImages = signal({ statut: 'inconnu', fait: 0, total: 0 });
const CACHE = 'yeshaya-images';
export async function verifierImages() {
  try {
    const liste = await (await fetch('/liste-assets.json')).json();
    const c = await caches.open(CACHE); const cles = new Set((await c.keys()).map((r) => new URL(r.url).pathname));
    const fait = liste.filter((u) => cles.has(u)).length;
    etatImages.valeur = { statut: fait >= liste.length ? 'complet' : 'partiel', fait, total: liste.length };
  } catch { etatImages.valeur = { statut: 'inconnu', fait: 0, total: 0 }; }
}
export async function telechargerImages() {
  const liste = await (await fetch('/liste-assets.json')).json();
  const c = await caches.open(CACHE); const cles = new Set((await c.keys()).map((r) => new URL(r.url).pathname));
  let fait = liste.filter((u) => cles.has(u)).length;
  etatImages.valeur = { statut: 'encours', fait, total: liste.length };
  for (const u of liste) {
    if (cles.has(u)) continue;
    try { const r = await fetch(u); if (r.ok) await c.put(u, r); } catch {}
    fait++; if (fait % 5 === 0 || fait === liste.length) etatImages.valeur = { statut: 'encours', fait, total: liste.length };
  }
  await verifierImages();
}
