import { reglages } from '../donnees/reglages.js';
// Lecture à voix haute avec la voix de synthèse du téléphone (Web Speech API) :
// aucun fichier à télécharger, fonctionne hors ligne si une voix française est installée.
import { signal } from '../outils/signal.js';
import { lireReference, ecrireReference } from '../bible/references.js';
import { textePassage } from '../bible/bible.js';
import { pause as pauseAudio } from './lecteur.js';

export const VITESSES_VOIX = [0.8, 1, 1.2];
export const voix = signal({ id: null, index: 0, total: 0, lecture: false, termine: false, phrases: [], iPhrase: 0, mot: null, vitesse: 1, disponible: typeof speechSynthesis !== 'undefined', aucuneVoixFr: false });
const maj = (c) => { voix.valeur = { ...voix.valeur, ...c }; };

let blocs = [], phrases = [], iPhrase = 0, generation = 0;

// Garder l'écran allumé pendant la lecture : le navigateur coupe la voix de synthèse quand le téléphone se met en veille.
let eveil = null;
async function garderEveille() {
  try { if ('wakeLock' in navigator && !eveil && document.visibilityState === 'visible') { eveil = await navigator.wakeLock.request('screen'); eveil.addEventListener?.('release', () => { eveil = null; }); } } catch { eveil = null; }
}
function relacherEveil() { try { eveil?.release(); } catch {} eveil = null; }
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && voix.valeur.lecture) garderEveille(); });

// Le navigateur ne dit pas si une voix est d'homme ou de femme : on le devine par son nom.
const FEMMES = /amélie|amelie|audrey|aurélie|aurelie|marie|julie|denise|hortense|céline|celine|léa|lea|virginie|chantal|sylvie|eloise|éloïse|vivienne|brigitte|claire|charline|ariane|josephine|joséphine|coralie|yvette|female|femme|wavenet-a|wavenet-c|wavenet-e|neural2-a|neural2-c|fr-fr-x-fra|fr-fr-x-frc|fr-fr-x-vlf/i;
const HOMMES = /thomas|paul|henri|nicolas|daniel|claude|mathieu|jacques|antoine|guillaume|jérôme|jerome|alain|remy|rémy|yves|fabrice|gérard|gerard|jean|louis|maxime|male|homme|wavenet-b|wavenet-d|neural2-b|neural2-d|fr-fr-x-frb|fr-fr-x-frd|fr-fr-x-vlm/i;
export function genreVoix(v) { const n = `${v.name} ${v.voiceURI}`; return HOMMES.test(n) && !/female/i.test(n) ? 'homme' : FEMMES.test(n) ? 'femme' : '?'; }
export function voixFr() { try { return speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('fr')); } catch { return []; } }
function voixFrancaise() {
  const l = voixFr(), r = reglages.valeur;
  const choisie = r.voix && l.find((v) => v.voiceURI === r.voix);
  if (choisie) return choisie;
  const fr = l.filter((v) => /fr[-_]FR/i.test(v.lang)).concat(l);
  if (r.genreVoix === 'homme' || r.genreVoix === 'femme') { const g = fr.find((v) => genreVoix(v) === r.genreVoix); if (g) return g; }
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

// Position d'écoute gardée pour chaque contenu (passage + phrase), pour reprendre là où l'on s'était arrêté,
// même après avoir quitté la page ou fermé l'application.
const CLE_POS = 'yeshaya:voix-positions';
const lirePos = () => { try { return JSON.parse(localStorage.getItem(CLE_POS) || '{}'); } catch { return {}; } };
export function positionVoix(id) { const p = lirePos()[id]; return p && p.index > 0 ? p : null; }
function garderPos(id, index, phrase) {
  if (!id) return; const t = lirePos();
  if (index == null) delete t[id]; else t[id] = { index, phrase: phrase || 0, total: blocs.length, quand: Date.now() };
  const cles = Object.keys(t).sort((a, b) => t[b].quand - t[a].quand).slice(0, 60);   // on garde les 60 plus récents
  try { localStorage.setItem(CLE_POS, JSON.stringify(Object.fromEntries(cles.map((k) => [k, t[k]])))); } catch {}
}

async function lireBloc(i, g, debutPhrase = 0) {
  if (g !== generation) return;
  if (i >= blocs.length) { garderPos(voix.valeur.id, null); maj({ lecture: false, index: 0, termine: true }); relacherEveil(); return; }
  maj({ index: i, lecture: true });
  phrases = await preparerBloc(i); iPhrase = Math.max(0, Math.min(debutPhrase, phrases.length - 1));
  if (g !== generation) return;
  maj({ phrases, iPhrase, mot: null });
  direPhrase(i, g);
}

// Vitesse de parole mesurée (caractères par seconde à la vitesse 1) : sert à deviner le mot prononcé
// quand la voix du téléphone ne signale pas les mots (fréquent sur Android).
let cps = 14, minuteurMot = null;
const motsDe = (p) => { const l = []; const re = /[^\s]+/g; let m; while ((m = re.exec(p))) l.push([m.index, m[0].length]); return l; };
function suivreMot(p, g) {
  clearInterval(minuteurMot);
  const mots = motsDe(p); let t0 = Date.now(), recu = false, dernier = -1;
  const u = { debut: () => { t0 = Date.now(); }, recu: () => { recu = true; }, fin: (ok) => {
    clearInterval(minuteurMot); const d = (Date.now() - t0) / 1000;
    if (ok && d > 0.8 && p.length > 12) cps = Math.max(8, Math.min(24, cps * 0.7 + (p.length / (d * voix.valeur.vitesse)) * 0.3));
  } };
  minuteurMot = setInterval(() => {
    if (g !== generation) { clearInterval(minuteurMot); return; }
    if (recu || !voix.valeur.lecture) return;
    const pos = ((Date.now() - t0) / 1000) * cps * voix.valeur.vitesse;
    let k = 0; while (k + 1 < mots.length && mots[k + 1][0] <= pos) k++;
    if (k !== dernier && mots[k]) { dernier = k; maj({ mot: { debut: mots[k][0], longueur: mots[k][1] } }); }
  }, 120);
  return u;
}

function direPhrase(i, g) {
  if (g !== generation) return;
  if (iPhrase >= phrases.length) { lireBloc(i + 1, g); return; }
  const u = new SpeechSynthesisUtterance(phrases[iPhrase]);
  maj({ iPhrase, mot: null });
  garderPos(voix.valeur.id, i, iPhrase);
  const suivi = suivreMot(phrases[iPhrase], g);
  u.onstart = () => suivi.debut();
  // Mot prononcé (si la voix du téléphone le signale) : sert à colorer le texte au rythme de la voix.
  u.onboundary = (e) => { if (g !== generation || e.name === 'sentence') return; suivi.recu(); maj({ mot: { debut: e.charIndex, longueur: e.charLength || 0 } }); };
  const v = voixFrancaise(); if (v) u.voice = v; u.lang = v?.lang || 'fr-FR'; u.rate = voix.valeur.vitesse;
  u.onend = () => { suivi.fin(true); if (g !== generation) return; iPhrase++; direPhrase(i, g); };
  u.onerror = (e) => { suivi.fin(); if (g !== generation || e.error === 'interrupted' || e.error === 'canceled') return; iPhrase++; direPhrase(i, g); };
  speechSynthesis.speak(u);
}

export function lireAVoixHaute(id, listeBlocs, depuis = 0, depuisPhrase = 0) {
  if (!voix.valeur.disponible) return;
  pauseAudio();                                   // pas deux sons en même temps
  speechSynthesis.cancel(); generation++;
  blocs = listeBlocs.map((b) => b || {});   // les blocs vides sont sautés à la lecture, sans décaler la numérotation
  garderEveille();
  maj({ id, total: blocs.length, termine: false, aucuneVoixFr: speechSynthesis.getVoices().length > 0 && !voixFrancaise() });
  lireBloc(depuis, generation, depuisPhrase);
}
// Reprendre un contenu là où on l'avait laissé (même après avoir quitté la page).
export function reprendreDepuisMemoire(id, listeBlocs) { const p = positionVoix(id); lireAVoixHaute(id, listeBlocs, p ? Math.min(p.index, listeBlocs.length - 1) : 0, p ? p.phrase : 0); }
// « Pause » = arrêt en gardant la position exacte (passage et phrase) ; la vraie pause est peu fiable sur Android.
let pausePhrase = 0;
export function pauseVoix() { pausePhrase = iPhrase; generation++; speechSynthesis.cancel(); maj({ lecture: false }); relacherEveil(); }
export function reprendreVoix() { if (voix.valeur.id) { garderEveille(); speechSynthesis.cancel(); generation++; lireBloc(voix.valeur.index, generation, pausePhrase); pausePhrase = 0; } }
export function arreterVoix() { relacherEveil(); generation++; if (voix.valeur.disponible) speechSynthesis.cancel(); maj({ id: null, lecture: false, index: 0, total: 0 }); }
export function sauterVoix(sens) { pausePhrase = 0; const i = Math.max(0, Math.min(blocs.length - 1, voix.valeur.index + sens)); speechSynthesis.cancel(); generation++; lireBloc(i, generation); }
export function vitesseVoix(v) { maj({ vitesse: v }); if (voix.valeur.lecture) { pausePhrase = iPhrase; reprendreVoix(); } }
if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => {};   // charge la liste des voix
