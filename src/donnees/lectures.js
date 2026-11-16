// Enseignements ouverts et lus, gardés sur ce téléphone seulement (coches ✓ et « Reprendre » dans Grandir).
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:lectures';
const lire = () => { try { return { lus: [], dernier: null, ...JSON.parse(localStorage.getItem(CLE) || '{}') }; } catch { return { lus: [], dernier: null }; } };
export const lectures = signal(lire());
const sauver = (v) => { lectures.valeur = v; try { localStorage.setItem(CLE, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

export const marquerOuvert = (id) => { const v = lectures.valeur; if (v.dernier !== id) sauver({ ...v, dernier: id }); };
export const marquerLu = (id) => { const v = lectures.valeur; if (!v.lus.includes(id)) sauver({ ...v, lus: [...v.lus, id] }); };
export const estLu = (id) => lectures.valeur.lus.includes(id);
