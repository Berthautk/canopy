import { lire, json } from '../_stats.js';
import { refusAdmin } from './priere.js';

// GET /api/stats?jours=90 : réservé à l'administrateur (mot de passe dans la variable ADMIN_MOT_DE_PASSE).
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const refus = await refusAdmin(request, env); if (refus) return refus;   // temps constant + blocage après 10 essais ratés
  const jours = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('jours') || '90', 10) || 90, 1), 3650);
  const depuis = new Date(Date.now() - jours * 864e5).toISOString().slice(0, 10);
  return json({ ok: true, depuis, lignes: await lire(env.DB, depuis) });
}
