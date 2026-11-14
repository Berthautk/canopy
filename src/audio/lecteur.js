// Lecteur audio unique de l'application : continue de jouer quand on change d'écran,
// reprend là où on s'était arrêté, et se pilote depuis l'écran verrouillé (Media Session).
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

export const VITESSES = [0.75, 1, 1.25, 1.5];
const CLE_POS = 'yeshaya:positions';            // { id: secondes }
const CLE_DERNIERE = 'yeshaya:derniere-ecoute';  // { piste, position }

const audio = typeof Audio !== 'undefined' ? new Audio() : null;
if (audio) audio.preload = 'metadata';

export const lecteur = signal({ piste: null, lecture: false, position: 0, duree: 0, vitesse: 1, chargement: false, erreur: null });
const maj = (c) => { lecteur.valeur = { ...lecteur.valeur, ...c }; };

let positions = {};
export const derniereEcoute = signal(null);
export async function chargerLecteur() {
  try { positions = (await get(CLE_POS)) || {}; derniereEcoute.valeur = (await get(CLE_DERNIERE)) || null; } catch {}
}
let dernierEnregistrement = 0;
function memoriser(force) {
  const { piste } = lecteur.valeur; if (!piste) return;
  const now = Date.now(); if (!force && now - dernierEnregistrement < 5000) return;
  dernierEnregistrement = now;
  const pos = audio.ended ? 0 : Math.floor(audio.currentTime);
  positions[piste.id] = pos;
  derniereEcoute.valeur = { piste, position: pos, duree: Math.floor(audio.duration || 0) };
  set(CLE_POS, positions).catch(() => {}); set(CLE_DERNIERE, derniereEcoute.valeur).catch(() => {});
}
export const positionMemorisee = (id) => positions[id] || 0;

export async function jouer(piste, { depuisDebut = false } = {}) {
  if (!audio || !piste?.url) return;
  if (lecteur.valeur.piste?.id === piste.id) { if (audio.paused) audio.play().catch(erreurLecture); return; }
  memoriser(true);
  maj({ piste, lecture: false, position: 0, duree: 0, chargement: true, erreur: null });
  audio.src = piste.url;
  audio.playbackRate = lecteur.valeur.vitesse;
  const reprise = depuisDebut ? 0 : positions[piste.id] || 0;
  audio.addEventListener('loadedmetadata', () => { if (reprise && reprise < audio.duration - 3) audio.currentTime = reprise; }, { once: true });
  majMediaSession(piste);
  try { await audio.play(); } catch (e) { erreurLecture(e); }
}

function erreurLecture(e) {
  if (e?.name === 'NotAllowedError') { maj({ chargement: false }); return; }   // lecture automatique bloquée : l'utilisateur appuiera sur ▶
  maj({ chargement: false, lecture: false,
    erreur: navigator.onLine ? 'Impossible de lire cet audio pour le moment.' : 'Pas de connexion : téléchargez cet audio pour l\'écouter hors ligne.' });
}

export const basculer = () => { if (!audio?.src) return; audio.paused ? audio.play().catch(erreurLecture) : audio.pause(); };
export const pause = () => audio?.pause();
export const deplacer = (s) => { if (audio?.src) audio.currentTime = Math.max(0, Math.min((audio.duration || 0) - 0.5, audio.currentTime + s)); };
export const allerA = (t) => { if (audio?.src && isFinite(t)) audio.currentTime = t; };
export function changerVitesse(v) { if (audio) audio.playbackRate = v; maj({ vitesse: v }); }
export function fermer() { memoriser(true); audio?.pause(); audio?.removeAttribute('src'); audio?.load(); maj({ piste: null, lecture: false, position: 0, duree: 0 }); }

if (audio) {
  const etatSession = (e) => { try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = e; } catch {} };
  audio.addEventListener('play', () => { maj({ lecture: true, erreur: null }); etatSession('playing'); });
  audio.addEventListener('playing', () => maj({ chargement: false }));
  audio.addEventListener('waiting', () => maj({ chargement: true }));
  audio.addEventListener('pause', () => { maj({ lecture: false }); memoriser(true); etatSession('paused'); });
  audio.addEventListener('loadedmetadata', () => maj({ duree: audio.duration }));
  audio.addEventListener('ratechange', () => maj({ vitesse: audio.playbackRate }));
  audio.addEventListener('error', () => lecteur.valeur.piste && erreurLecture());
  audio.addEventListener('ended', () => { maj({ lecture: false, position: 0 }); memoriser(true); });
  let derniereMaj = 0;
  audio.addEventListener('timeupdate', () => {
    const t = Date.now(); if (t - derniereMaj < 250) return; derniereMaj = t;
    maj({ position: audio.currentTime }); memoriser(false);
    if ('mediaSession' in navigator && audio.duration) {
      try { navigator.mediaSession.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: audio.playbackRate }); } catch {}
    }
  });
  addEventListener('pagehide', () => memoriser(true));
}

function majMediaSession(p) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: p.titre, artist: p.auteur, album: 'Yeshaya',
    artwork: [{ src: new URL(p.image, location.href).href, sizes: '512x512', type: 'image/webp' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
  });
  const h = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
  const actions = {
    play: () => audio.play(), pause: () => audio.pause(),
    seekbackward: (d) => deplacer(-(d.seekOffset || 15)), seekforward: (d) => deplacer(d.seekOffset || 15),
    seekto: (d) => allerA(d.seekTime),
  };
  for (const [k, f] of Object.entries(actions)) { try { h(k, f); } catch {} }
}

export function formatTemps(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
