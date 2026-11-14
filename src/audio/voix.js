// Lecture à voix haute avec la voix de synthèse du téléphone (Web Speech API) :
// aucun fichier à télécharger, fonctionne hors ligne si une voix française est installée.
import { signal } from '../outils/signal.js';
import { lireReference, ecrireReference } from '../bible/references.js';
import { textePassage } from '../bible/bible.js';
import { pause as pauseAudio } from './lecteur.js';

export const VITESSES_VOIX = [0.8, 1, 1.2];
export const voix = signal({ id: null, index: 0, total: 0, lecture: false, termine: false, vitesse: 1, disponible: typeof speechSynthesis !== 'undefined', aucuneVoixFr: false });
const maj = (c) => { voix.valeur = { ...voix.valeur, ...c }; };

let blocs = [], phrases = [], iPhrase = 0, generation = 0;

function voixFrancaise() {
  const l = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('fr'));
  return l.find((v) => v.localService && /fr[-_]FR/i.test(v.lang)) || l.find((v) => v.localService) || l[0] || null;
}

// Texte prêt à être dit : références lues en clair, symboles retirés.
const NOMS_LONGS = (r) => `${r.code === 'PSA' ? 'Psaume' : ecrireReference({ code: r.code, c: 1 }).replace(/ 1$/, '')} ${r.c}${r.v ? `, verset ${r.v}${r.fin ? ' à ' + r.fin : ''}` : ''}`;
export function pourLaVoix(t) {
  return (t || '')
    .replace(/((?:[1-3]\s?)?[A-ZÉÈ][a-zéèëêïîôûüç]+\.?\s\d{1,3}:\d{1,3}(?:\s?[-–]\s?\d{1,3})?)/g, (m) => { const r = lireReference(m); return r ? NOMS_LONGS(r) : m; })
    .replace(/\[(?:\.\.\.|…|nom[^\]]*)\]/gi, '…').replace(/[«»"“”]/g, '').replace(/\s—\s|\s–\s/g, ', ').replace(/[✅✦§]/g, '').replace(/([.!?…])\s*\.+/g, '$1').replace(/\s+/g, ' ').trim();
}
// Découpe en phrases courtes : les longues phrases sont coupées par certains téléphones.
function decouper(t) {
  const out = [];
  for (const p of t.match(/[^.!?;:]+[.!?;:]*/g) || [t]) {
    let s = p.trim(); while (s.length > 220) { const k = s.lastIndexOf(',', 200); const c = k > 60 ? k + 1 : 200; out.push(s.slice(0, c)); s = s.slice(c).trim(); }
    if (s) out.push(s);
  }
  return out;
}

// Un bloc = { texte } ou { reference } (texte lu dans la Bible LSG au moment de la lecture).
async function preparerBloc(i) {
  const b = blocs[i]; if (!b) return [];
  if (b.reference) {
    const r = lireReference(b.reference); if (!r) return [];
    try { const vs = await textePassage(r); return decouper(pourLaVoix(`${NOMS_LONGS(r)}. ${vs.map((x) => x.texte.replace(/\n/g, ' ')).join(' ')}`)); } catch { return []; }
  }
  return decouper(pourLaVoix(b.texte));
}

async function lireBloc(i, g) {
  if (g !== generation) return;
  if (i >= blocs.length) { maj({ lecture: false, index: 0, termine: true }); return; }
  maj({ index: i, lecture: true });
  phrases = await preparerBloc(i); iPhrase = 0;
  if (g !== generation) return;
  document.querySelector(`[data-voix="${i}"]`)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  direPhrase(i, g);
}

function direPhrase(i, g) {
  if (g !== generation) return;
  if (iPhrase >= phrases.length) { lireBloc(i + 1, g); return; }
  const u = new SpeechSynthesisUtterance(phrases[iPhrase]);
  const v = voixFrancaise(); if (v) u.voice = v; u.lang = v?.lang || 'fr-FR'; u.rate = voix.valeur.vitesse;
  u.onend = () => { if (g !== generation) return; iPhrase++; direPhrase(i, g); };
  u.onerror = (e) => { if (g !== generation || e.error === 'interrupted' || e.error === 'canceled') return; iPhrase++; direPhrase(i, g); };
  speechSynthesis.speak(u);
}

export function lireAVoixHaute(id, listeBlocs, depuis = 0) {
  if (!voix.valeur.disponible) return;
  pauseAudio();                                   // pas deux sons en même temps
  speechSynthesis.cancel(); generation++;
  blocs = listeBlocs.map((b) => b || {});   // les blocs vides sont sautés à la lecture, sans décaler la numérotation
  maj({ id, total: blocs.length, termine: false, aucuneVoixFr: speechSynthesis.getVoices().length > 0 && !voixFrancaise() });
  lireBloc(depuis, generation);
}
// « Pause » = arrêt en gardant la position (la vraie pause est peu fiable sur Android).
export function pauseVoix() { generation++; speechSynthesis.cancel(); maj({ lecture: false }); }
export function reprendreVoix() { if (voix.valeur.id) { speechSynthesis.cancel(); generation++; lireBloc(voix.valeur.index, generation); } }
export function arreterVoix() { generation++; if (voix.valeur.disponible) speechSynthesis.cancel(); maj({ id: null, lecture: false, index: 0, total: 0 }); }
export function sauterVoix(sens) { const i = Math.max(0, Math.min(blocs.length - 1, voix.valeur.index + sens)); speechSynthesis.cancel(); generation++; lireBloc(i, generation); }
export function vitesseVoix(v) { maj({ vitesse: v }); if (voix.valeur.lecture) reprendreVoix(); }
if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => {};   // charge la liste des voix
