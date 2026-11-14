// Journal de prière, « J'ai prié » et parcours Nouveau converti : tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';
import { compter } from './mesure.js';

const CLE_JOURNAL = 'yeshaya:journal';       // [{ id, titre, detail, date, exaucee: null | { date, temoignage } }]
const CLE_PRIE = 'yeshaya:j-ai-prie';         // { themeId: [dates ISO] }
const CLE_PARCOURS = 'yeshaya:parcours-nc';
const CLE_STATS = 'yeshaya:statistiques';     // { sujets: { 'AAAA-MM-JJ': nombre de sujets priés ce jour-là } }   // { faits: [jours Nouveau converti], dj: [leçons Découvrir Jésus], decision: date ISO }

export const journal = signal([]);
export const aiPrie = signal({});
export const parcours = signal({ faits: [], dj: [], decision: null });
export const statistiques = signal({ sujets: {} });

export async function chargerPriere() {
  try {
    journal.valeur = (await get(CLE_JOURNAL)) || [];
    aiPrie.valeur = (await get(CLE_PRIE)) || {};
    parcours.valeur = { faits: [], dj: [], decision: null, ...((await get(CLE_PARCOURS)) || {}) };
    statistiques.valeur = { sujets: {}, ...((await get(CLE_STATS)) || {}) };
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
export const noterPriere = (themeId) => (compter('j-ai-prie', themeId), sauver(CLE_PRIE, aiPrie, { ...aiPrie.valeur, [themeId]: [...(aiPrie.valeur[themeId] || []), new Date().toISOString()] }));

// ----- Statistiques personnelles (restent sur le téléphone) -----
const aujourdhui = () => new Date().toISOString().slice(0, 10);
export function noterSujetPrie(n = 1) {
  compter('sujet-prie');
  const j = aujourdhui(), st = statistiques.valeur;
  return sauver(CLE_STATS, statistiques, { ...st, sujets: { ...st.sujets, [j]: (st.sujets[j] || 0) + n } });
}

// ----- Parcours Nouveau converti : un jour se débloque quand le précédent est terminé -----
export const terminerJour = (n, cle = 'faits') => sauver(CLE_PARCOURS, parcours, { ...parcours.valeur, [cle]: [...new Set([...(parcours.valeur[cle] || []), n])].sort((a, b) => a - b) });
export const jourDebloque = (n, faits = parcours.valeur.faits) => n === 1 || faits.includes(n - 1);
export const noterDecision = (source = 'app') => (parcours.valeur.decision || compter('decision', source), sauver(CLE_PARCOURS, parcours, { ...parcours.valeur, decision: parcours.valeur.decision || new Date().toISOString() }));
export const dateCourte = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
