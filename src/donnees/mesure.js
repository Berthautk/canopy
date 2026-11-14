// Statistiques anonymes : envoyées uniquement si l'utilisateur l'a accepté (choix à l'entrée, modifiable dans les Paramètres).
// Ce qui part : des compteurs par jour, par exemple « ouverture:priere = 3 » ou « decision = 1 ».
// Ce qui ne part jamais : nom, profil, journal de prière, notes, adresse, pays, identifiant d'appareil.
// Hors ligne, les compteurs attendent sur le téléphone et partent au retour d'internet.
import { get, set, del } from 'idb-keyval';
import { reglages, modifierReglages } from './reglages.js';

const CLE_FILE = 'yeshaya:mesure-file';
const URL_ENVOI = '/api/evenements';
let file = null, minuteur = null;

const actif = () => reglages.valeur.statsAnonymes === true;   // uniquement avec le consentement de l'utilisateur
const jour = () => new Date().toISOString().slice(0, 10);
const propre = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

async function charger() { if (!file) { try { file = (await get(CLE_FILE)) || { jours: {} }; } catch { file = { jours: {} }; } } return file; }
function sauverPlusTard() { clearTimeout(minuteur); minuteur = setTimeout(() => set(CLE_FILE, file).catch(() => {}), 800); }

// compter('ouverture', 'priere') ou compter('decision')
export async function compter(type, detail) {
  if (!actif()) return;
  const cle = propre(type) + (detail ? ':' + propre(detail) : '');
  const f = await charger(), j = jour();
  f.jours[j] = f.jours[j] || {};
  f.jours[j][cle] = (f.jours[j][cle] || 0) + 1;
  sauverPlusTard();
}

export async function envoyer({ balise = false } = {}) {
  if (!actif() || !navigator.onLine) return;
  const f = await charger();
  if (!Object.keys(f.jours).length) return;
  const corps = JSON.stringify(f);
  try {
    if (balise && navigator.sendBeacon) { if (!navigator.sendBeacon(URL_ENVOI, new Blob([corps], { type: 'application/json' }))) return; }
    else { const r = await fetch(URL_ENVOI, { method: 'POST', headers: { 'content-type': 'application/json' }, body: corps, keepalive: true }); if (!r.ok) return; }
    file = { jours: {} }; await del(CLE_FILE);
  } catch { /* pas de réseau : on réessaiera */ }
}

export async function choisirStats(oui) {
  await modifierReglages({ statsAnonymes: !!oui });
  if (!oui) { file = { jours: {} }; try { await del(CLE_FILE); } catch {} }
}

export function demarrerMesure() {
  setTimeout(() => envoyer(), 8000);
  addEventListener('online', () => envoyer());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') envoyer({ balise: true }); });
}

// Ce que l'on compte quand une page s'ouvre (section et contenu, jamais de texte saisi).
export function compterPage(segments) {
  const [a, b, c] = segments;
  if (!a) return;
  compter('ouverture', a);
  const contenus = { 'grandir/enseignement': 'enseignement', 'priere/veille': 'veille', 'priere/theme': 'theme-priere', 'priere/combat': 'combat',
    'evangeliser/outil': 'outil', 'evangeliser/approche': 'approche', 'evangeliser/article': 'article', 'evangeliser/dialogue': 'dialogue' };
  const t = contenus[a + '/' + b];
  if (t && c) compter(t, c);
  else if (a === 'grandir' && (b === 'nouveau-converti' || b === 'decouvrir-jesus')) compter('parcours', b + (c ? '-' + c : ''));
  else if (a === 'bible' && b === 'lire' && c) compter('bible-livre', c);
  else if (a === 'jouer' && b) compter('jeu', b);
}

// ----- Demandes de prière (envoyées seulement quand la personne appuie sur « Envoyer ») -----
const CLE_REQ = 'yeshaya:priere-a-envoyer';
export async function envoyerDemande(d) {
  let liste = []; try { liste = (await get(CLE_REQ)) || []; } catch {}
  if (d) liste.push({ ...d, date: new Date().toISOString() });
  const restent = [];
  for (const r of liste) {
    try { const x = await fetch('/api/priere', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) }); if (!x.ok) restent.push(r); }
    catch { restent.push(r); }
  }
  try { restent.length ? await set(CLE_REQ, restent) : await del(CLE_REQ); } catch {}
  return { envoye: !d || restent.length < liste.length || !restent.includes(liste[liste.length - 1]), enAttente: restent.length };
}
addEventListener?.('online', () => envoyerDemande());
