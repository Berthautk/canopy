// Favoris, surlignages et notes, par verset (clé « JHN.3.16 »). Stockés sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:annotations';
export const COULEURS = { jaune: '#FCE9A6', vert: '#CFEBD3', bleu: '#CFE3F7', rose: '#F8D4DD' };
export const annotations = signal({});          // { "JHN.3.16": { couleur, favori: date, note, noteDate } }

export async function chargerAnnotations() {
  try { annotations.valeur = (await get(CLE)) || {}; } catch {}
}

async function modifier(cle, changement) {
  const tout = { ...annotations.valeur };
  const a = { ...(tout[cle] || {}), ...changement };
  Object.keys(a).forEach((k) => (a[k] === null || a[k] === undefined || a[k] === '') && delete a[k]);
  if (Object.keys(a).length) tout[cle] = a; else delete tout[cle];
  annotations.valeur = tout;
  try { await set(CLE, tout); } catch {}
}

// Une clé ou plusieurs (sélection de plusieurs versets).
export const surligner = async (cles, couleur) => { for (const k of [].concat(cles)) await modifier(k, { couleur }); };
export const basculerFavori = async (cles, mettre) => {
  const l = [].concat(cles), d = new Date().toISOString();
  const ajouter = mettre ?? !annotations.valeur[l[0]]?.favori;
  for (const k of l) await modifier(k, { favori: ajouter ? annotations.valeur[k]?.favori || d : null });
};
export const ecrireNote = (cle, note) => modifier(cle, { note: note.trim().slice(0, 500), noteDate: note.trim() ? new Date().toISOString() : null });

// Position de lecture (« Reprendre ma lecture »)
const CLE_LECTURE = 'yeshaya:lecture';
export const positionLecture = signal(null);
export async function chargerPosition() { try { positionLecture.valeur = (await get(CLE_LECTURE)) || null; } catch {} }
export async function memoriserPosition(code, c) { positionLecture.valeur = { code, c }; try { await set(CLE_LECTURE, { code, c }); } catch {} }
