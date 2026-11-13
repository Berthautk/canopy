// Routeur par ancre (#/...) : fonctionne hors ligne et sur n'importe quel hébergement statique.
import { signal } from './signal.js';

function lire() {
  const h = location.hash.replace(/^#\/?/, '');
  const [chemin] = h.split('?');
  return chemin || 'accueil';
}

export const route = signal(lire());
addEventListener('hashchange', () => {
  route.valeur = lire();
  scrollTo(0, 0);
});

export const aller = (chemin) => { location.hash = '#/' + chemin; };
export const retour = (defaut = 'accueil') => {
  if (history.length > 1) history.back(); else aller(defaut);
};

// Onglet principal auquel appartient chaque écran (pour la barre du bas).
export const ONGLET_DE = {
  accueil: 'accueil', jouer: 'accueil', parametres: 'accueil', 'a-propos': 'accueil', telechargements: 'accueil',
  priere: 'priere', grandir: 'grandir', evangeliser: 'evangeliser', bible: 'bible',
};
