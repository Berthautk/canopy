// Lien berger ↔ disciple (serveur : /api/suivi). Les réponses du carnet sont envoyées automatiquement
// au berger quand le disciple est relié. Le bilan de vie n'est jamais envoyé.
import { signal } from '../outils/signal.js';
import { lireCarnet, lireDisciples, ecrireDisciples, quandCarnetChange, effacerBilan } from './carnet.js';

const lire = (cle, defaut) => { try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { v == null ? localStorage.removeItem(cle) : localStorage.setItem(cle, JSON.stringify(v)); } catch {} };

export async function api(action, corps = {}) {
  let r;
  try { r = await fetch('/api/suivi', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...corps }), signal: AbortSignal.timeout?.(15000) }); }
  catch { throw new Error('Pas de connexion internet. Réessaie quand tu as du réseau.'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) throw new Error(d.erreur || 'Le serveur ne répond pas correctement (' + r.status + ').');
  return d;
}
export const formaterCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7).replace(/^(.{3})(.+)$/, '$1-$2');

// ---------- Côté disciple ----------
// { mode: 'relie' | 'seul', code, cle, prenom, pas }
export const lienDisciple = signal(lire('yeshaya:suivi-disciple', null));
const garderLien = (l) => { lienDisciple.valeur = l; ecrire('yeshaya:suivi-disciple', l); };
export async function rejoindre(code, prenom) {
  const d = await api('rejoindre', { code: formaterCode(code), prenom });
  garderLien({ mode: 'relie', code: formaterCode(code), cle: d.cle, prenom: d.prenom, pas: d.pas });
  // ce qui a déjà été écrit est envoyé tout de suite
  Object.keys(localStorage).filter((k) => k.startsWith('yeshaya:carnet:pas-')).forEach((k) => aEnvoyer.add(k.slice('yeshaya:carnet:'.length)));
  envoyerTout();
  return d;
}
export const travaillerSeul = (prenom) => garderLien({ mode: 'seul', prenom: (prenom || '').trim(), pas: 'pas-01-le-salut' });
export async function quitterLien(effacerServeur) {
  const l = lienDisciple.valeur;
  if (effacerServeur && l?.mode === 'relie') { try { await api('supprimer', { code: l.code, cle: l.cle }); } catch {} }
  garderLien(null);
}
export async function actualiserDisciple() {
  const l = lienDisciple.valeur; if (l?.mode !== 'relie') return;
  try { const d = await api('etat', { code: l.code, cle: l.cle }); if (d.pas !== l.pas) garderLien({ ...l, pas: d.pas }); } catch {}
}
export const etatEnvoi = signal({ statut: 'ok', quand: null });   // 'ok' | 'envoi' | 'attente'
const aEnvoyer = new Set(lire('yeshaya:suivi-a-envoyer', []));
let minuteur = null;
export function planifierEnvoi(pas) {
  if (lienDisciple.valeur?.mode !== 'relie') return;
  aEnvoyer.add(pas); ecrire('yeshaya:suivi-a-envoyer', [...aEnvoyer]);
  etatEnvoi.valeur = { ...etatEnvoi.valeur, statut: 'envoi' };
  clearTimeout(minuteur); minuteur = setTimeout(envoyerTout, 2500);
}
export async function envoyerTout() {
  const l = lienDisciple.valeur; if (l?.mode !== 'relie' || !aEnvoyer.size) return;
  for (const pas of [...aEnvoyer]) {
    try { await api('envoyer', { code: l.code, cle: l.cle, pas, data: lireCarnet(pas) }); aEnvoyer.delete(pas); }
    catch { etatEnvoi.valeur = { statut: 'attente', quand: etatEnvoi.valeur.quand }; ecrire('yeshaya:suivi-a-envoyer', [...aEnvoyer]); return; }
  }
  ecrire('yeshaya:suivi-a-envoyer', [...aEnvoyer]);
  etatEnvoi.valeur = { statut: 'ok', quand: new Date().toISOString() };
}
quandCarnetChange((pas) => planifierEnvoi(pas));
if (typeof window !== 'undefined') { addEventListener('online', envoyerTout); setTimeout(envoyerTout, 4000); }

// ---------- Côté berger ----------
export async function creerDisciple(prenom) {
  const d = await api('creer', { prenom: prenom.trim() });
  const nouveau = { id: 'd' + Date.now().toString(36), prenom: prenom.trim(), code: d.code, cle: d.cle, pas: 'pas-01-le-salut', versets: [], notes: '', rdv: '', accueil: false };
  ecrireDisciples([...lireDisciples(), nouveau]);
  return nouveau;
}
export async function renommerDisciple(dsc, prenom) {
  const p = String(prenom || '').trim();
  if (p.length < 2) throw new Error('Le prénom est trop court.');
  if (dsc.code) await api('renommer', { code: dsc.code, cle: dsc.cle, prenom: p });
  ecrireDisciples(lireDisciples().map((x) => (x.id === dsc.id ? { ...x, prenom: p } : x)));
  return p;
}
// Côté converti : tout effacer de ce téléphone (lien, prénom, réponses, bilan de vie).
export async function effacerMesDonnees() {
  const l = lienDisciple.valeur;
  if (l?.mode === 'relie') { try { await api('supprimer', { code: l.code, cle: l.cle }); } catch {} }
  garderLien(null);
  try { Object.keys(localStorage).filter((k) => k.startsWith('yeshaya:carnet:') || k === 'yeshaya:suivi-a-envoyer').forEach((k) => localStorage.removeItem(k)); } catch {}
  aEnvoyer.clear();
  effacerBilan();
}
export async function etatDuDisciple(dsc) { return api('etat', { code: dsc.code, cle: dsc.cle }); }
// Le code d'invitation ne sert qu'une fois. Si le disciple change de téléphone, le berger le rouvre :
// la nouvelle liaison remplace l'ancienne, donc l'ancien téléphone perd l'accès au carnet.
export async function rouvrirCode(dsc) { return api('rouvrir', { code: dsc.code, cle: dsc.cle }); }
export async function avancerDisciple(dsc, pas) {
  if (dsc.code) await api('avancer', { code: dsc.code, cle: dsc.cle, pas });
  ecrireDisciples(lireDisciples().map((x) => (x.id === dsc.id ? { ...x, pas } : x)));
}
export async function retirerDisciple(dsc) {
  if (dsc.code) { try { await api('supprimer', { code: dsc.code, cle: dsc.cle }); } catch {} }
  ecrireDisciples(lireDisciples().filter((x) => x.id !== dsc.id));
}
