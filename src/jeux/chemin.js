// « Le Chemin de la foi » : progression par niveaux (étoiles, points, rangs), gardée sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';
import { aujourdhui } from './hasard.js';

const CLE = 'yeshaya:chemin';
const VIDE = { etoiles: {}, xp: 0, meilleurCombo: 0, jours: [] };
export const chemin = signal({ ...VIDE });
export async function chargerChemin() { try { chemin.valeur = { ...VIDE, ...((await get(CLE)) || {}) }; } catch {} }

export const RANGS = [
  [0, 'Apprenti', 'Tu commences le chemin.'],
  [150, 'Disciple', 'Tu suis Jésus pas à pas.'],
  [400, 'Serviteur fidèle', 'Fidèle dans les petites choses.'],
  [800, 'Sentinelle', 'Tu veilles et tu tiens ferme.'],
  [1300, 'Ancien sage', 'La Parole habite en toi.'],
  [2000, 'Ambassadeur du Royaume', 'Tu portes la lumière autour de toi.'],
  [3000, 'Gardien de la Parole', 'Tu caches la Parole dans ton cœur.'],
  [4500, 'Bâtisseur', 'Tu construis sur le roc.'],
  [6500, 'Moissonneur', 'Les champs blanchissent pour la moisson.'],
  [9000, 'Colonne du temple', 'Celui qui vaincra, je ferai de lui une colonne.'],
  [12500, 'Vainqueur', 'Plus que vainqueur par celui qui nous a aimés.'],
];
export function rang(xp) {
  let i = 0; RANGS.forEach(([min], k) => { if (xp >= min) i = k; });
  // Après le dernier rang, les degrés continuent sans fin : « Vainqueur 2 », « Vainqueur 3 »…
  if (i === RANGS.length - 1 && xp >= RANGS[i][0] + 4000) {
    const k = Math.floor((xp - RANGS[i][0]) / 4000), min = RANGS[i][0] + k * 4000;
    return { i, nom: `Vainqueur ${k + 1}`, desc: RANGS[i][2], min, prochain: min + 4000, nomSuivant: `Vainqueur ${k + 2}`, progression: (xp - min) / 4000 };
  }
  const [min, nom, desc] = RANGS[i], suivant = RANGS[i + 1] || [RANGS[i][0] + 4000, 'Vainqueur 2'];
  return { i, nom, desc, min, prochain: suivant?.[0] ?? null, nomSuivant: suivant?.[1], progression: suivant ? (xp - min) / (suivant[0] - min) : 1 };
}

// Série : nombre de jours consécutifs (jusqu'à aujourd'hui ou hier) où l'on a joué au chemin.
export function serie(jours = chemin.valeur.jours) {
  const ens = new Set(jours); let n = 0; const d = new Date();
  if (!ens.has(aujourdhui())) d.setDate(d.getDate() - 1);
  for (;;) { const j = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (!ens.has(j)) break; n++; d.setDate(d.getDate() - 1); }
  return n;
}

// Fin d'un niveau : garde le meilleur nombre d'étoiles, ajoute les points. Renvoie ce qui a changé.
export async function terminerNiveau(id, etoiles, xpGagne, combo) {
  const avant = chemin.valeur, rAvant = rang(avant.xp);
  const meilleur = Math.max(avant.etoiles[id] || 0, etoiles);
  const s = { ...avant, xp: avant.xp + xpGagne, meilleurCombo: Math.max(avant.meilleurCombo, combo),
    etoiles: etoiles > 0 ? { ...avant.etoiles, [id]: meilleur } : avant.etoiles,
    jours: avant.jours.includes(aujourdhui()) ? avant.jours : [...avant.jours.slice(-60), aujourdhui()] };
  chemin.valeur = s; try { await set(CLE, s); } catch {}
  const rApres = rang(s.xp);
  return { nouveauRang: rApres.i > rAvant.i ? rApres : null, record: etoiles > (avant.etoiles[id] || 0) && (avant.etoiles[id] || 0) > 0 };
}
export const totalEtoiles = (e = chemin.valeur.etoiles) => Object.values(e).reduce((a, b) => a + b, 0);

// Petits sons générés (aucun fichier), désactivables.
let ctx = null;
export const sonsActifs = () => { try { return localStorage.getItem('yeshaya:sons') !== 'non'; } catch { return true; } };
export const basculerSons = () => { try { localStorage.setItem('yeshaya:sons', sonsActifs() ? 'non' : 'oui'); } catch {} };
export function son(type) {
  if (!sonsActifs()) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { juste: [660, 880], faux: [220, 160], niveau: [523, 659, 784, 1046], rang: [392, 523, 659, 784, 1046] }[type] || [440];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.12;
      o.type = type === 'faux' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.25);
    });
  } catch {}
}
