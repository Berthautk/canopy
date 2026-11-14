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

export const aller = (chemin) => { location.hash = '#/' + chemin; };
export const remplacer = (chemin) => { history.replaceState(null, '', '#/' + chemin); route.valeur = lire(); };
export const retour = (defaut = 'accueil') => {
  if (history.length > 1) history.back(); else aller(defaut);
};

// Onglet principal auquel appartient chaque écran (premier segment de la route).
export const ONGLET_DE = {
  accueil: 'accueil', jouer: 'accueil', parametres: 'accueil', 'a-propos': 'accueil', telechargements: 'accueil', ecouter: 'accueil',
  priere: 'priere', grandir: 'grandir', evangeliser: 'evangeliser', bible: 'bible', montrer: 'bible',
};
