// Nouvelle version de Yeshaya : le service worker s'installe en arrière-plan et prend la main ;
// la page ouverte garde l'ancien code jusqu'au rechargement. On le signale avec une fenêtre au milieu de l'écran.
import { signal } from './signal.js';

export const miseAJourDispo = signal(false);

export function surveillerMisesAJour() {
  if (!('serviceWorker' in navigator)) return;
  const avaitUnControleur = !!navigator.serviceWorker.controller;   // première visite : pas de fenêtre
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (avaitUnControleur) miseAJourDispo.valeur = true; });
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    const verifier = () => reg.update().catch(() => {});
    setInterval(verifier, 30 * 60e3);                                       // toutes les 30 minutes
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verifier(); });   // au retour dans l'app
  }).catch(() => {});
}

export const recharger = () => location.reload();
