// Ce que la personne écrit pendant une veille : « Ce que Dieu m'a dit » (aube, midi) et « Ce qu'il a fait aujourd'hui » (soir).
// Une note par veille et par jour. Tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:notes-veilles';          // { 'AAAA-MM-JJ|veille-aube': { texte, maj } }
export const notesVeilles = signal({});
export async function chargerNotesVeilles() { try { notesVeilles.valeur = (await get(CLE)) || {}; } catch { /* stockage indisponible */ } }

const jour = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const cleNote = (veille, d = new Date()) => `${jour(d)}|${veille}`;
export const noteDuJour = (veille, notes = notesVeilles.valeur) => notes[cleNote(veille)]?.texte || '';

let minuteur = null;
export function ecrireNote(veille, texte) {
  const n = { ...notesVeilles.valeur }, k = cleNote(veille), t = texte.slice(0, 2000);
  if (t.trim()) n[k] = { texte: t, maj: new Date().toISOString() }; else delete n[k];
  notesVeilles.valeur = n;
  clearTimeout(minuteur); minuteur = setTimeout(() => set(CLE, notesVeilles.valeur).catch(() => {}), 500);
}

// Les dernières notes, de la plus récente à la plus ancienne.
export const dernieresNotes = (notes = notesVeilles.valeur, max = 6) =>
  Object.entries(notes).map(([k, v]) => { const [date, veille] = k.split('|'); return { date, veille, ...v }; })
    .sort((a, b) => b.date.localeCompare(a.date) || b.maj.localeCompare(a.maj)).slice(0, max);

export const supprimerNote = (k) => { const n = { ...notesVeilles.valeur }; delete n[k]; notesVeilles.valeur = n; set(CLE, n).catch(() => {}); };
