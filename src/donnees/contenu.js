// Contenus éditoriaux (dossier /content) : ajoutés sans toucher au code, simplement en déposant un fichier JSON.
// Ces fichiers ne contiennent que des RÉFÉRENCES bibliques : le texte est toujours lu dans la Bible LSG 1910.
const fichiers = import.meta.glob('/content/**/*.json', { eager: true, import: 'default' });
const dossier = (d) => Object.entries(fichiers).filter(([k]) => k.startsWith(`/content/${d}/`)).map(([, v]) => v);

export const SUJETS = dossier('sujets-versets').sort((a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || a.titre.localeCompare(b.titre));
export const MEDITATIONS = dossier('meditations').sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
export const CHEMIN_DU_SALUT = fichiers['/content/chemin-du-salut.json'];
export const VERSETS_DU_JOUR = fichiers['/content/versets-du-jour.json']?.versets ?? [];
export const PLANS = fichiers['/content/plans/plans.json']?.plans ?? [];

// Numéro du jour dans l'année (1 à 366), pour faire tourner versets et méditations.
export function jourDeLAnnee(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
}
export const versetDuJour = (d) => VERSETS_DU_JOUR[(jourDeLAnnee(d) - 1) % VERSETS_DU_JOUR.length];
export const meditationDuJour = (d) => MEDITATIONS[(jourDeLAnnee(d) - 1) % MEDITATIONS.length];
