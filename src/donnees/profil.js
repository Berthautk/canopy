// Profil local : photo et prénom, stockés uniquement sur le téléphone (IndexedDB). Rien n'est envoyé.
import { get, set, del } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE_PHOTO = 'yeshaya:profil-photo';
const CLE_PRENOM = 'yeshaya:profil-prenom';
export const profil = signal({ photo: null, prenom: '' });   // photo = URL locale (blob:)

let urlActuelle = null;
function publier(blob, prenom) {
  if (urlActuelle) URL.revokeObjectURL(urlActuelle);
  urlActuelle = blob ? URL.createObjectURL(blob) : null;
  profil.valeur = { photo: urlActuelle, prenom: prenom ?? profil.valeur.prenom };
}

export async function chargerProfil() {
  try { publier(await get(CLE_PHOTO), (await get(CLE_PRENOM)) || ''); } catch {}
}

// Recadre au centre en carré et réduit à 320 px : la photo pèse ~20-40 Ko au lieu de plusieurs Mo.
async function preparer(fichier) {
  const img = await createImageBitmap(fichier).catch(() => null);
  if (!img) throw new Error('Image illisible');
  const cote = Math.min(img.width, img.height), T = 320;
  const c = document.createElement('canvas'); c.width = c.height = T;
  c.getContext('2d').drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, T, T);
  return new Promise((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error('Conversion impossible'))), 'image/jpeg', 0.82));
}

export async function changerPhoto(fichier) {
  const blob = await preparer(fichier);
  await set(CLE_PHOTO, blob);
  publier(blob);
}

export async function retirerPhoto() {
  await del(CLE_PHOTO);
  publier(null);
}

export async function changerPrenom(prenom) {
  prenom = prenom.trim().slice(0, 40);
  await set(CLE_PRENOM, prenom);
  profil.valeur = { ...profil.valeur, prenom };
}
