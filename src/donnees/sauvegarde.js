// Sauvegarde et restauration de toute la progression (sans compte : un simple fichier .json).
import { entries, setMany, delMany, keys } from 'idb-keyval';

const PREFIXE = 'yeshaya:';
const FORMAT = 'yeshaya-sauvegarde';

const blobVersTexte = (b) => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(b); });
// Une sauvegarde ne peut contenir qu'une image embarquée (data:), jamais une adresse à aller chercher.
const texteVersBlob = async (u) => { if (typeof u !== 'string' || !u.startsWith('data:image/')) return null; return (await fetch(u)).blob(); };
const LOCALES = (k) => k.startsWith(PREFIXE) && k !== 'yeshaya:admin';

// Ce que contient la sauvegarde, en clair (affiché avant de restaurer)
const LIBELLES = { reglages: 'Réglages', 'profil-photo': 'Photo de profil', 'profil-prenom': 'Prénom', annotations: 'Favoris, surlignages et notes',
  lecture: 'Position de lecture', plan: 'Plan de lecture', journal: 'Journal de prière', 'j-ai-prie': 'Prières faites', 'parcours-nc': 'Parcours Nouveau converti',
  jeux: 'Scores et badges', reflexions: 'Réflexions de méditation', positions: 'Positions d\'écoute', 'derniere-ecoute': 'Dernière écoute' };
export const libelle = (k) => LIBELLES[k] || k;

export async function creerSauvegarde() {
  const donnees = {};
  for (const [k, v] of await entries()) {
    if (typeof k !== 'string' || !k.startsWith(PREFIXE) || k === 'yeshaya:telechargements' || k === 'yeshaya:mesure-file' || k === 'yeshaya:priere-a-envoyer') continue;   // rythme et temps : inclus   // les audios ne sont pas inclus (trop lourds)
    donnees[k.slice(PREFIXE.length)] = v instanceof Blob ? { __blob: await blobVersTexte(v) } : v;
  }
  // Petits réglages gardés hors de la base (sons des jeux, versets mémorisés, rythme du jour).
  const locales = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (LOCALES(k)) locales[k] = localStorage.getItem(k); } } catch {}
  return { format: FORMAT, version: 1, application: 'Yeshaya', date: new Date().toISOString(), donnees, locales };
}

export function nomFichier() {
  const d = new Date(); return `yeshaya-sauvegarde-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
}

export async function telechargerSauvegarde() {
  const s = await creerSauvegarde();
  const fichier = new File([JSON.stringify(s)], nomFichier(), { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(fichier); a.download = fichier.name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return Object.keys(s.donnees);
}

// Partage du fichier (WhatsApp, e-mail…) quand le téléphone le permet.
export async function partagerSauvegarde() {
  const s = await creerSauvegarde();
  const fichier = new File([JSON.stringify(s)], nomFichier(), { type: 'application/json' });
  if (navigator.canShare?.({ files: [fichier] })) {
    try { await navigator.share({ files: [fichier], title: 'Ma sauvegarde Yeshaya', text: 'Sauvegarde de ma progression Yeshaya. Garde ce fichier précieusement.' }); return 'partage'; }
    catch (e) { if (e?.name === 'AbortError') return 'annule'; }
  }
  return 'impossible';
}

export async function lireSauvegarde(fichier) {
  let s;
  try { s = JSON.parse(await fichier.text()); } catch { throw new Error('Ce fichier n\'est pas une sauvegarde Yeshaya.'); }
  if (s?.format !== FORMAT || !s.donnees || typeof s.donnees !== 'object' || Array.isArray(s.donnees)) throw new Error('Ce fichier n\'est pas une sauvegarde Yeshaya.');
  return s;
}

// Remplace les données actuelles par celles de la sauvegarde, puis recharge l'application.
export async function restaurer(s) {
  const actuelles = (await keys()).filter((k) => typeof k === 'string' && k.startsWith(PREFIXE) && k !== 'yeshaya:telechargements');
  await delMany(actuelles);
  const paires = [];
  for (const [k, v] of Object.entries(s.donnees)) {
    if (!/^[a-z0-9:_-]{1,60}$/i.test(k)) continue;                      // clés inattendues ignorées
    const val = v && v.__blob ? await texteVersBlob(v.__blob) : v;
    if (val !== null || !(v && v.__blob)) paires.push([PREFIXE + k, val]);
  }
  await setMany(paires);
  try { for (const [k, v] of Object.entries(s.locales || {})) if (LOCALES(k) && typeof v === 'string' && v.length < 200000) localStorage.setItem(k, v); } catch {}
  try { if (s.donnees.reglages) localStorage.setItem('yeshaya:reglages', JSON.stringify(s.donnees.reglages)); } catch {}
}
