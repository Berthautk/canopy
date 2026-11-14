// Progression du parcours ORIZON (90 jours) : jours vécus, réponses au journal de bord. Tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:orizon';
export const orizon = signal({ debut: null, faits: [], journal: {}, chutes: [], lus: [], dates: {} });
export async function chargerProgressionOrizon() {
  try { orizon.valeur = { debut: null, faits: [], journal: {}, chutes: [], lus: [], dates: {}, ...((await get(CLE)) || {}) }; } catch {}
}
const sauver = (v) => { orizon.valeur = v; return set(CLE, v).catch(() => {}); };
export const commencerOrizon = () => sauver({ ...orizon.valeur, debut: orizon.valeur.debut || new Date().toISOString() });
export const terminerJourOrizon = (j) => sauver({ ...orizon.valeur, faits: [...new Set([...orizon.valeur.faits, j])].sort((a, b) => a - b), dates: { ...orizon.valeur.dates, [j]: aujourdhui() } });

// Parcours guidé : d'abord les textes « Avant de commencer » et la partie 1, dans l'ordre ; puis un jour à la fois,
// le jour suivant s'ouvrant après minuit.
export const PREALABLES = ['avant-propos', 'avertissement', 'introduction', 'chapitre-1', 'chapitre-2', 'chapitre-3', 'chapitre-4'];
const aujourdhui = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const marquerLu = (id) => sauver({ ...orizon.valeur, debut: orizon.valeur.debut || new Date().toISOString(), lus: [...new Set([...(orizon.valeur.lus || []), id])] });
export const estLu = (id, o = orizon.valeur) => (o.lus || []).includes(id) || o.faits.length > 0;
export const docOuvert = (id, o = orizon.valeur) => { const i = PREALABLES.indexOf(id); return i < 0 || PREALABLES.slice(0, i).every((x) => estLu(x, o)); };
export const prealablesFinis = (o = orizon.valeur) => PREALABLES.every((x) => estLu(x, o));
// « ouvert » : jour accessible ; « demain » : jour précédent fait aujourd'hui, ouvre après minuit ; « ferme » sinon.
export function etatJour(j, o = orizon.valeur) {
  if (o.faits.includes(j)) return 'ouvert';
  if (!prealablesFinis(o)) return 'ferme';
  if (j === 1) return 'ouvert';
  if (!o.faits.includes(j - 1)) return 'ferme';
  const d = (o.dates || {})[j - 1];
  return d && d >= aujourdhui() ? 'demain' : 'ouvert';
}
export const prochainPrealable = (o = orizon.valeur) => PREALABLES.find((x) => !estLu(x, o));
export const noterJournal = (j, i, texte) => {
  const jr = { ...(orizon.valeur.journal[j] || {}), [i]: texte.slice(0, 4000) };
  return sauver({ ...orizon.valeur, journal: { ...orizon.valeur.journal, [j]: jr } });
};
// Une chute ne remet pas à zéro : on la note, et on continue au jour suivant (règle du manuel).
export const noterChute = () => sauver({ ...orizon.valeur, chutes: [...orizon.valeur.chutes, new Date().toISOString()] });
export const jourCourant = () => { const f = orizon.valeur.faits; for (let j = 1; j <= 90; j++) if (!f.includes(j)) return j; return 90; };

// Jours sans enseignement dans les phases 2 et 3 : pratique libre ou sabbat (le jour 31 est un lundi).
export function typeJour(j, redige) {
  if (redige) return 'structure';
  if (j <= 30) return 'structure';
  return (j - 31) % 7 === 6 ? 'sabbat' : 'pratique';
}
export const phaseDe = (j) => (j <= 30 ? 1 : j <= 60 ? 2 : 3);
