// Statistiques de jeu et badges : uniquement personnels, gardés sur le téléphone, sans classement.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';
import { aujourdhui } from './hasard.js';

const CLE = 'yeshaya:jeux';
const VIDE = { quizJoues: 0, bonnes: 0, parfaits: 0, joursQuizDuJour: [], quiSuisJe: 0, ordre: 0, complete: 0, duels: 0, badges: {} };
export const stats = signal({ ...VIDE });
export async function chargerStats() { try { stats.valeur = { ...VIDE, ...((await get(CLE)) || {}) }; } catch {} }

// Badges : [id, nom, description, icône, (stats, autres) => progression 0..1]
export const BADGES = [
  ['premiers-pas', 'Premiers pas', 'Terminer un premier quiz', 'etoile', (s) => Math.min(1, s.quizJoues)],
  ['sans-faute', 'Sans faute', 'Obtenir 10 sur 10 à un quiz', 'trophee', (s) => Math.min(1, s.parfaits)],
  ['fidele', 'Fidèle au rendez-vous', 'Faire le quiz du jour 7 jours (pas forcément de suite)', 'calendrier', (s) => Math.min(1, s.joursQuizDuJour.length / 7)],
  ['connaisseur', 'Bon connaisseur', 'Donner 50 bonnes réponses aux quiz', 'ampoule', (s) => Math.min(1, s.bonnes / 50)],
  ['detective', 'Détective biblique', 'Trouver 5 personnages dans « Qui suis-je ? »', 'recherche', (s) => Math.min(1, s.quiSuisJe / 5)],
  ['historien', 'Historien', 'Remettre 3 histoires dans le bon ordre', 'liste', (s) => Math.min(1, s.ordre / 3)],
  ['memoire', 'Mémoire de la Parole', 'Compléter 10 versets', 'bible', (s) => Math.min(1, s.complete / 10)],
  ['equipe', 'Esprit d\'équipe', 'Jouer un duel à deux', 'groupe', (s) => Math.min(1, s.duels)],
];

async function enregistrer(changement) {
  const avant = stats.valeur, s = { ...avant, ...changement(avant) };
  const nouveaux = [];
  for (const [id, , , , prog] of BADGES) if (!s.badges[id] && prog(s) >= 1) { s.badges = { ...s.badges, [id]: new Date().toISOString() }; nouveaux.push(id); }
  stats.valeur = s; try { await set(CLE, s); } catch {}
  return nouveaux;   // badges débloqués par cette action
}

export const finQuiz = (bonnes, total, duJour) => enregistrer((s) => ({
  quizJoues: s.quizJoues + 1, bonnes: s.bonnes + bonnes, parfaits: s.parfaits + (total >= 10 && bonnes === total ? 1 : 0),
  joursQuizDuJour: duJour && !s.joursQuizDuJour.includes(aujourdhui()) ? [...s.joursQuizDuJour, aujourdhui()] : s.joursQuizDuJour,
}));
export const ajouter = (champ, n = 1) => enregistrer((s) => ({ [champ]: s[champ] + n }));
export const badge = (id) => BADGES.find((b) => b[0] === id);
