import { urlAudio } from './config.js';

// Contenus éditoriaux (dossier /content) : ajoutés sans toucher au code, simplement en déposant un fichier JSON.
// Ces fichiers ne contiennent que des RÉFÉRENCES bibliques : le texte est toujours lu dans la Bible LSG 1910.
import INDEX_ENSEIGNEMENTS from 'virtual:enseignements-index';
// Les enseignements ne sont pas chargés ici (voir INDEX_ENSEIGNEMENTS et chargerEnseignement) : seuls les autres contenus le sont.
const fichiers = import.meta.glob(['/content/**/*.json', '!/content/_modeles/**', '!/content/enseignements/**', '!/content/orizon/**'], { eager: true, import: 'default' });
const corpsEnseignements = import.meta.glob('/content/enseignements/**/*.json', { import: 'default' });   // un fichier séparé par enseignement
const dossier = (d) => Object.entries(fichiers).filter(([k]) => k.startsWith(`/content/${d}/`)).map(([, v]) => v);

export const SUJETS = dossier('sujets-versets').sort((a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || a.titre.localeCompare(b.titre));
export const MEDITATIONS = dossier('meditations').sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
export const CHEMIN_DU_SALUT = fichiers['/content/chemin-du-salut.json'];
export const VERSETS_DU_JOUR = fichiers['/content/versets-du-jour.json']?.versets ?? [];
export const PLANS = fichiers['/content/plans/plans.json']?.plans ?? [];
export const ENSEIGNEMENTS = [...INDEX_ENSEIGNEMENTS].sort((a, b) => (b.date_ajout || '').localeCompare(a.date_ajout || '') || a.titre.localeCompare(b.titre));
export const AUTEURS = fichiers['/content/auteurs.json']?.auteurs ?? [];
const parOrdre = (a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || a.titre.localeCompare(b.titre);
export const PRIERES = dossier('prieres').sort(parOrdre);
export const NOUVEAU_CONVERTI = dossier('nouveau-converti').sort((a, b) => a.jour - b.jour);
export const EVANGELISATION = dossier('evangelisation').sort(parOrdre);
export const DIALOGUES = dossier('dialogues').sort(parOrdre);
export const OUTILS = dossier('outils-evangelisation').sort(parOrdre);
export const APPROCHES = dossier('approches').sort(parOrdre);
export const JOURS_PARCOURS = 30;
export const DECOUVRIR_JESUS = dossier('decouvrir-jesus').sort((a, b) => a.jour - b.jour);
export const VEILLES = dossier('veilles').filter((v) => Array.isArray(v.phases)).sort((a, b) => a.ordre - b.ordre);
export const GUIDE_PHASES = fichiers['/content/veilles/guide-des-phases.json'];
export const COMBAT = dossier('combat').sort((a, b) => a.ordre - b.ordre);
export const PLAN_THEMATIQUE = fichiers['/content/plans/thematique.json'];
// Veille du moment selon l'heure : aube (3h-11h), midi (11h-18h), soir (18h-3h).
export function veilleDuMoment(d = new Date()) {
  const h = d.getHours(); const k = h >= 3 && h < 11 ? 'aube' : h >= 11 && h < 18 ? 'midi' : 'soir';
  return VEILLES.find((v) => v.id === 'veille-' + k) || VEILLES[0];
}
export const QUIZ = dossier('quiz').sort((a, b) => a.theme.localeCompare(b.theme, 'fr'));
export const QUI_SUIS_JE = fichiers['/content/jeux/qui-suis-je.json']?.personnages ?? [];
export const ORIZON = fichiers['/content/orizon-index.json'];
const corpsOrizon = import.meta.glob('/content/orizon/*.json', { import: 'default' });   // texte du parcours, chargé à l'ouverture
export const chargerOrizon = (nom) => corpsOrizon[`/content/orizon/${nom}.json`]?.() ?? Promise.reject(new Error('introuvable'));
export const NIVEAUX_CHEMIN = fichiers['/content/jeux/chemin-de-la-foi.json']?.niveaux ?? [];
export const HISTOIRES = fichiers['/content/jeux/remets-dans-l-ordre.json']?.histoires ?? [];

// Catalogue de tous les contenus qui ont un audio : id -> piste prête pour le lecteur.
const TYPES = { enseignements: 'Enseignement', meditations: 'Méditation', prieres: 'Prière', dialogues: 'Dialogue', evangelisation: 'Évangélisation', 'nouveau-converti': 'Nouveau converti' };
export const AUDIOS = Object.fromEntries([...Object.entries(fichiers), ...INDEX_ENSEIGNEMENTS.map((e) => [e.chemin, e])]
  .filter(([, v]) => v && v.audio && v.id)
  .map(([k, v]) => [v.id, {
    id: v.id, titre: v.titre, auteur: v.auteur || 'Auteur inconnu', autorisation: v.autorisation === 'oui',
    url: urlAudio(v.audio), image: v.image || '/assets/audio/casque-et-bible.webp', duree: v.duree || null,
    type: TYPES[k.split('/')[2]] || 'Audio', exemple: !!v.exemple,
  }]));
export const audioDuJour = (d) => { const l = ENSEIGNEMENTS.filter((e) => AUDIOS[e.id]); return l.length ? AUDIOS[l[(jourDeLAnnee(d) - 1) % l.length].id] : null; };

// Numéro du jour dans l'année (1 à 366), pour faire tourner versets et méditations.
export function jourDeLAnnee(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
}
export const versetDuJour = (d) => VERSETS_DU_JOUR[(jourDeLAnnee(d) - 1) % VERSETS_DU_JOUR.length];
export const meditationDuJour = (d) => MEDITATIONS[(jourDeLAnnee(d) - 1) % MEDITATIONS.length];

// Texte complet d'un enseignement (téléchargé à la première ouverture, puis lu depuis le téléphone).
export async function chargerEnseignement(id) {
  const e = INDEX_ENSEIGNEMENTS.find((x) => x.id === id);
  if (!e || !corpsEnseignements[e.chemin]) return null;
  return corpsEnseignements[e.chemin]();
}
