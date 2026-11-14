import { lire, memeTexte, json } from '../_stats.js';

// GET /api/stats?jours=90 : réservé à l'administrateur (mot de passe dans la variable ADMIN_MOT_DE_PASSE).
export async function onRequestGet({ request, env }) {
  const mdp = env.ADMIN_MOT_DE_PASSE;
  const donne = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!mdp || mdp.length < 8 || !memeTexte(donne, mdp)) {
    await new Promise((r) => setTimeout(r, 800));       // ralentit les essais au hasard
    return json({ ok: false, erreur: 'mot de passe incorrect' }, 401);
  }
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const jours = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('jours') || '90', 10) || 90, 1), 3650);
  const depuis = new Date(Date.now() - jours * 864e5).toISOString().slice(0, 10);
  return json({ ok: true, depuis, lignes: await lire(env.DB, depuis) });
}
