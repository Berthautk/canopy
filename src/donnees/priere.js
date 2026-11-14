// Journal de prière, « J'ai prié » et parcours Nouveau converti : tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE_JOURNAL = 'yeshaya:journal';       // [{ id, titre, detail, date, exaucee: null | { date, temoignage } }]
const CLE_PRIE = 'yeshaya:j-ai-prie';         // { themeId: [dates ISO] }
const CLE_PARCOURS = 'yeshaya:parcours-nc';   // { faits: [numéros de jours] }

export const journal = signal([]);
export const aiPrie = signal({});
export const parcours = signal({ faits: [] });

export async function chargerPriere() {
  try {
    journal.valeur = (await get(CLE_JOURNAL)) || [];
    aiPrie.valeur = (await get(CLE_PRIE)) || {};
    parcours.valeur = (await get(CLE_PARCOURS)) || { faits: [] };
  } catch {}
}
const sauver = (cle, sig, v) => { sig.valeur = v; return set(cle, v).catch(() => {}); };

// ----- Journal -----
export function ajouterRequete(titre, detail) {
  const r = { id: Date.now().toString(36), titre: titre.trim().slice(0, 80), detail: detail.trim().slice(0, 1000), date: new Date().toISOString(), exaucee: null };
  return sauver(CLE_JOURNAL, journal, [r, ...journal.valeur]);
}
export const marquerExaucee = (id, temoignage = '') =>
  sauver(CLE_JOURNAL, journal, journal.valeur.map((r) => (r.id === id ? { ...r, exaucee: { date: new Date().toISOString(), temoignage: temoignage.trim().slice(0, 1000) } } : r)));
export const remettreEnPriere = (id) => sauver(CLE_JOURNAL, journal, journal.valeur.map((r) => (r.id === id ? { ...r, exaucee: null } : r)));
export const supprimerRequete = (id) => sauver(CLE_JOURNAL, journal, journal.valeur.filter((r) => r.id !== id));

// ----- « J'ai prié » -----
export const noterPriere = (themeId) => sauver(CLE_PRIE, aiPrie, { ...aiPrie.valeur, [themeId]: [...(aiPrie.valeur[themeId] || []), new Date().toISOString()] });

// ----- Parcours Nouveau converti : un jour se débloque quand le précédent est terminé -----
export const terminerJour = (n) => sauver(CLE_PARCOURS, parcours, { faits: [...new Set([...parcours.valeur.faits, n])].sort((a, b) => a - b) });
export const jourDebloque = (n, faits = parcours.valeur.faits) => n === 1 || faits.includes(n - 1);
export const dateCourte = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
