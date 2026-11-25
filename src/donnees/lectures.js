// Enseignements ouverts et lus, gardés sur ce téléphone seulement (coches ✓ et « Reprendre » dans Grandir).
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:lectures';
const lire = () => { try { return { lus: [], dernier: null, parties: {}, ...JSON.parse(localStorage.getItem(CLE) || '{}') }; } catch { return { lus: [], dernier: null, parties: {} }; } };
export const lectures = signal(lire());
const sauver = (v) => { lectures.valeur = v; try { localStorage.setItem(CLE, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

export const marquerOuvert = (id) => { const v = lectures.valeur; if (v.dernier !== id) sauver({ ...v, dernier: id }); };
export const marquerLu = (id) => { const v = lectures.valeur; if (!v.lus.includes(id)) sauver({ ...v, lus: [...v.lus, id] }); };
export const estLu = (id) => lectures.valeur.lus.includes(id);
// Dernière partie atteinte dans un enseignement (pour « Reprendre à la partie 3 »).
export const retenirPartie = (id, n) => { const v = lectures.valeur; if ((v.parties?.[id] || 0) < n) sauver({ ...v, parties: { ...v.parties, [id]: n } }); };
export const effacerPartie = (id) => { const v = lectures.valeur; if (v.parties?.[id]) { const { [id]: _, ...reste } = v.parties; sauver({ ...v, parties: reste }); } };
