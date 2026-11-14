import { urlAudio } from './config.js';

// Contenus éditoriaux (dossier /content) : ajoutés sans toucher au code, simplement en déposant un fichier JSON.
// Ces fichiers ne contiennent que des RÉFÉRENCES bibliques : le texte est toujours lu dans la Bible LSG 1910.
const fichiers = import.meta.glob(['/content/**/*.json', '!/content/_modeles/**'], { eager: true, import: 'default' });   // les modèles ne sont pas chargés
const dossier = (d) => Object.entries(fichiers).filter(([k]) => k.startsWith(`/content/${d}/`)).map(([, v]) => v);

export const SUJETS = dossier('sujets-versets').sort((a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || a.titre.localeCompare(b.titre));
export const MEDITATIONS = dossier('meditations').sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
export const CHEMIN_DU_SALUT = fichiers['/content/chemin-du-salut.json'];
export const VERSETS_DU_JOUR = fichiers['/content/versets-du-jour.json']?.versets ?? [];
export const PLANS = fichiers['/content/plans/plans.json']?.plans ?? [];
export const ENSEIGNEMENTS = dossier('enseignements').sort((a, b) => (b.date_ajout || '').localeCompare(a.date_ajout || '') || a.titre.localeCompare(b.titre));
export const AUTEURS = fichiers['/content/auteurs.json']?.auteurs ?? [];
const parOrdre = (a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || a.titre.localeCompare(b.titre);
export const PRIERES = dossier('prieres').sort(parOrdre);
export const NOUVEAU_CONVERTI = dossier('nouveau-converti').sort((a, b) => a.jour - b.jour);
export const EVANGELISATION = dossier('evangelisation').sort(parOrdre);
export const DIALOGUES = dossier('dialogues').sort(parOrdre);
export const JOURS_PARCOURS = 30;
export const QUIZ = dossier('quiz').sort((a, b) => a.theme.localeCompare(b.theme, 'fr'));
export const QUI_SUIS_JE = fichiers['/content/jeux/qui-suis-je.json']?.personnages ?? [];
export const HISTOIRES = fichiers['/content/jeux/remets-dans-l-ordre.json']?.histoires ?? [];

// Catalogue de tous les contenus qui ont un audio : id -> piste prête pour le lecteur.
const TYPES = { enseignements: 'Enseignement', meditations: 'Méditation', prieres: 'Prière', dialogues: 'Dialogue', evangelisation: 'Évangélisation', 'nouveau-converti': 'Nouveau converti' };
export const AUDIOS = Object.fromEntries(Object.entries(fichiers)
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
