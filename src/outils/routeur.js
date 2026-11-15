// Routeur par ancre (#/...) : fonctionne hors ligne et sur n'importe quel hébergement statique.
// La route est un chemin complet, ex. « bible/lire/JHN/3/16 », avec paramètres éventuels « ?q=paix ».
import { signal } from './signal.js';

function lire() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [chemin, requete = ''] = h.split('?');
  const segments = (chemin || 'accueil').split('/').filter(Boolean);
  return { chemin: segments.join('/'), segments, params: Object.fromEntries(new URLSearchParams(requete)) };
}

export const route = signal(lire());
addEventListener('hashchange', () => {
  route.valeur = lire();
  scrollTo(0, 0);
});

// Passer d'un chapitre ou d'un jour à son voisin (même écran, même profondeur) remplace l'entrée
// de l'historique : « Retour » ramène alors à la page d'avant, pas au chapitre précédent.
export const aller = (chemin) => {
  const a = route.valeur.segments, b = chemin.split('?')[0].split('/').filter(Boolean);
  if (a.length >= 3 && a.length === b.length && a[0] === b[0] && a[1] === b[1]) { history.replaceState(null, '', '#/' + chemin); route.valeur = lire(); scrollTo(0, 0); return; }
  location.hash = '#/' + chemin;
};
export const remplacer = (chemin) => { history.replaceState(null, '', '#/' + chemin); route.valeur = lire(); };
export const retour = (defaut = 'accueil') => {
  if (history.length > 1) history.back(); else aller(defaut);
};

// Onglet principal auquel appartient chaque écran (premier segment de la route).
export const ONGLET_DE = {
  accueil: 'accueil', jouer: 'jouer', parametres: 'accueil', 'a-propos': 'accueil', telechargements: 'accueil', ecouter: 'accueil',
  priere: 'priere', grandir: 'grandir', orizon: 'grandir', disciple: 'grandir', evangeliser: 'evangeliser', bible: 'bible', montrer: 'bible',
};
