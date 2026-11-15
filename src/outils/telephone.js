// « Mettre l'application sur mon téléphone » : installation (écran d'accueil) + téléchargement de tout le contenu.
import { signal } from './signal.js';
import { telechargerBible, verifierHorsLigne, etatTelechargement } from '../bible/bible.js';
import { telechargerImages, verifierImages, etatImages } from './horsLigne.js';

// ---- Installation sur l'écran d'accueil ----
export const installation = signal({ pret: false, installee: false });
let invite = null;
const installee = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const estIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
installation.valeur = { pret: false, installee: installee() };
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invite = e; installation.valeur = { pret: true, installee: false }; });
addEventListener('appinstalled', () => { invite = null; installation.valeur = { pret: false, installee: true }; });
export async function installer() {
  if (!invite) return 'indisponible';
  invite.prompt();
  const { outcome } = await invite.userChoice; invite = null;
  installation.valeur = { pret: false, installee: outcome === 'accepted' };
  return outcome;
}

// ---- Tout télécharger : illustrations + Bible (les textes sont déjà gardés par l'application) ----
export const toutTelecharge = signal({ statut: 'inconnu', fait: 0, total: 0 });
export async function verifierTout() {
  await Promise.all([verifierImages(), verifierHorsLigne()]);
  const i = etatImages.valeur, b = etatTelechargement.valeur;
  const total = (i.total || 0) + (b.total || 0), fait = (i.fait || 0) + (b.fait || 0);
  toutTelecharge.valeur = { statut: total && fait >= total ? 'complet' : fait ? 'partiel' : 'vide', fait, total };
}
export async function toutTelecharger() {
  const maj = () => { const i = etatImages.valeur, b = etatTelechargement.valeur; toutTelecharge.valeur = { statut: 'encours', fait: (i.fait || 0) + (b.fait || 0), total: (i.total || 0) + (b.total || 0) }; };
  const a = etatImages.abonner?.(maj), c = etatTelechargement.abonner?.(maj);
  toutTelecharge.valeur = { ...toutTelecharge.valeur, statut: 'encours' };
  try { await telechargerBible(); await telechargerImages(); } finally { a?.(); c?.(); }
  await verifierTout();
  return toutTelecharge.valeur.statut === 'complet';
}
