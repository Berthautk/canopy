// Routeur par ancre (#/...) : fonctionne hors ligne et sur n'importe quel hébergement statique.
// La route est un chemin complet, ex. « bible/lire/JHN/3/16 », avec paramètres éventuels « ?q=paix ».
import { signal } from './signal.js';

function lire() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [chemin, requete = ''] = h.split('?');
  const segments = (chemin || 'accueil').split('/').filter(Boolean);
  return { chemin: segments.join('/'), segments, params: Object.fromEntries(new URLSearchParams(requete)), hash: location.hash || '#/accueil' };
}

export const route = signal(lire());

// Mémoire du chemin : position de défilement de chaque page, et page d'où l'on est parti pour lire la Bible.
const positions = {};
let restaurerAuProchain = false;
addEventListener('scroll', () => { positions[route.valeur.hash] = scrollY; }, { passive: true });
const estBible = (seg) => seg[0] === 'bible' || seg[0] === 'montrer';
const lireProvenance = () => { try { return JSON.parse(sessionStorage.getItem('yeshaya:provenance')) || null; } catch { return null; } };
export const provenance = signal(lireProvenance());
const fixerProvenance = (v) => { provenance.valeur = v; try { v ? sessionStorage.setItem('yeshaya:provenance', JSON.stringify(v)) : sessionStorage.removeItem('yeshaya:provenance'); } catch {} };
const titrePage = () => {
  const t = document.querySelector('.page h2, .sous-titre h1');
  return (t?.textContent || '').trim().slice(0, 60);
};
// Remet la page à la position où on l'avait laissée (le contenu peut arriver un peu après).
const restaurer = (y) => {
  let n = 0;
  const essai = () => { scrollTo(0, y); if (Math.abs(scrollY - y) > 4 && n++ < 25) setTimeout(essai, 80); };
  requestAnimationFrame(essai);
};

addEventListener('hashchange', () => {
  const avant = route.valeur, titre = titrePage();
  route.valeur = lire();
  const apres = route.valeur;
  if (estBible(apres.segments) && !estBible(avant.segments)) fixerProvenance({ hash: avant.hash, y: positions[avant.hash] || 0, titre });
  else if (!estBible(apres.segments) && provenance.valeur && apres.hash !== provenance.valeur.hash) fixerProvenance(null);
  if (restaurerAuProchain || (provenance.valeur && apres.hash === provenance.valeur.hash)) {
    const y = provenance.valeur && apres.hash === provenance.valeur.hash ? provenance.valeur.y : positions[apres.hash] || 0;
    restaurerAuProchain = false;
    if (provenance.valeur && apres.hash === provenance.valeur.hash) fixerProvenance(null);
    restaurer(y);
  } else scrollTo(0, 0);
});

// Revenir à la page d'où l'on est parti pour ouvrir la Bible, à l'endroit exact où on lisait.
export const revenir = () => {
  const p = provenance.valeur; if (!p) return false;
  location.hash = p.hash;
  return true;
};

// Passer d'un chapitre ou d'un jour à son voisin (même écran, même profondeur) remplace l'entrée
// de l'historique : « Retour » ramène alors à la page d'avant, pas au chapitre précédent.
export const aller = (chemin) => {
  const a = route.valeur.segments, b = chemin.split('?')[0].split('/').filter(Boolean);
  if (a.length >= 3 && a.length === b.length && a[0] === b[0] && a[1] === b[1]) { history.replaceState(null, '', '#/' + chemin); route.valeur = lire(); scrollTo(0, 0); return; }
  location.hash = '#/' + chemin;
};
export const remplacer = (chemin) => { history.replaceState(null, '', '#/' + chemin); route.valeur = lire(); };
export const retour = (defaut = 'accueil') => {
  if (estBible(route.valeur.segments) && revenir()) return;
  restaurerAuProchain = true;
  if (history.length > 1) history.back(); else { restaurerAuProchain = false; aller(defaut); }
};

// Onglet principal auquel appartient chaque écran (premier segment de la route).
export const ONGLET_DE = {
  accueil: 'accueil', jouer: 'jouer', parametres: 'accueil', 'a-propos': 'accueil', telechargements: 'accueil', ecouter: 'accueil',
  priere: 'priere', grandir: 'grandir', orizon: 'grandir', disciple: 'grandir', accompagner: 'grandir', evangeliser: 'evangeliser', bible: 'bible', montrer: 'bible',
};
