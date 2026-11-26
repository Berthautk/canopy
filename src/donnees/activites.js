// Journal des choses commencées et terminées (enseignement, prière, nuit…), gardé sur ce téléphone seulement.
// Sert à : « Reprendre là où tu étais », au message quand on quitte avant la fin, et à « Ma fidélité ».
import { signal } from '../outils/signal.js';
import { compter } from './mesure.js';

const CLE = 'yeshaya:activites';
const lire = () => { try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch { return {}; } };
export const activites = signal(lire());
const sauver = (v) => {
  const l = Object.values(v).sort((a, b) => b.maj.localeCompare(a.maj)).slice(0, 150);
  const n = Object.fromEntries(l.map((x) => [x.cle, x]));
  activites.valeur = n;
  try { localStorage.setItem(CLE, JSON.stringify(n)); } catch { /* stockage plein ou bloqué */ }
};

export const TYPES = {
  veille: { nom: 'Veille de prière', icone: 'priere' },
  nuit: { nom: 'Nuit de prière', icone: 'lune' },
  priere: { nom: 'Prière', icone: 'priere' },
  enseignement: { nom: 'Enseignement', icone: 'grandir' },
  jeune: { nom: 'Jeûne', icone: 'soleil' },
};

// Une activité avance : on la crée si besoin, sans jamais la « défaire » si elle est déjà terminée.
export function avancer({ cle, type, titre, lien, fraction = 0, libelle = '' }) {
  const v = activites.valeur, a = v[cle], t = new Date().toISOString();
  if (a?.fini) return;
  if (!a) compter('commence', type);
  sauver({ ...v, [cle]: { cle, type, titre, lien, fraction: Math.max(a?.fraction || 0, fraction), libelle: libelle || a?.libelle || '', debut: a?.debut || t, maj: t, fini: false } });
}
export function terminer(cle) {
  const v = activites.valeur, a = v[cle]; if (!a || a.fini) return;
  compter('termine', a.type);
  sauver({ ...v, [cle]: { ...a, fraction: 1, fini: true, finiLe: new Date().toISOString() } });
}
export function oublier(cle) { const { [cle]: _, ...reste } = activites.valeur; sauver(reste); }

const JOURS = 864e5;
// Ce qui est commencé et pas fini (depuis moins de trois semaines), le plus récent d'abord.
export const enCours = (v = activites.valeur, maintenant = Date.now()) =>
  Object.values(v).filter((a) => !a.fini && maintenant - new Date(a.maj) < 21 * JOURS).sort((a, b) => b.maj.localeCompare(a.maj));

// Ma fidélité : sur les 30 derniers jours, combien de choses commencées, combien terminées.
export function fidelite(v = activites.valeur, maintenant = Date.now()) {
  const recentes = Object.values(v).filter((a) => maintenant - new Date(a.debut) < 30 * JOURS);
  const finies = recentes.filter((a) => a.fini).length, commencees = recentes.length;
  const jours = new Set(Object.values(v).flatMap((a) => [a.debut, a.finiLe].filter(Boolean).map((d) => d.slice(0, 10)))).size;
  return { commencees, finies, pasFinies: commencees - finies, taux: commencees ? finies / commencees : 0, jours };
}

// Un mot d'encouragement selon la fidélité : sans reproche, avec un seul pas à faire.
export function motFidelite(f) {
  if (f.commencees < 3) return "Tu viens de commencer. Choisis une chose et va jusqu'au bout : c'est ainsi que naît une vie fidèle.";
  if (f.taux >= 0.8) return 'Tu vas jusqu’au bout de ce que tu commences. Continue : Jésus dit que celui qui est fidèle dans les petites choses l’est aussi dans les grandes (Luc 16:10).';
  if (f.taux >= 0.5) return "Tu termines plus de la moitié de ce que tu commences. Choisis, cette semaine, une chose en cours et finis-la.";
  return "Tu commences beaucoup de choses et tu en termines peu. Ce n'est pas grave : reprends une seule chose, la plus petite, et va jusqu'au bout.";
}

// Le message d'au revoir, quand on quitte avant la fin : court, chaleureux, jamais de reproche.
const AU_REVOIR = {
  priere: ["Reviens-nous vite. Quelques minutes devant Dieu changent toute une journée.", "Dieu ne se lasse pas de t'attendre. Reviens vite finir ta prière.", "Ton temps avec Dieu n'est pas perdu. Reviens le terminer : il t'y attend."],
  nuit: ["Ta nuit de prière t'attend. Reviens vite : Dieu a encore des choses à te dire.", "Reviens-nous vite. Un cœur qui veille est un cœur que Dieu visite."],
  enseignement: ["Cet enseignement t'attend. Reviens vite : la suite va t'affermir.", "Reviens-nous vite. Ce que tu apprends aujourd'hui te tiendra debout demain."],
  veille: ["Reviens-nous vite. Quelques minutes devant Dieu changent toute une journée.", "Ta veille t'attend. Reviens vite la terminer avec Dieu."],
};
export const auRevoir = (type) => { const l = AU_REVOIR[type] || AU_REVOIR.priere; return l[Math.floor(Date.now() / 1000) % l.length]; };
