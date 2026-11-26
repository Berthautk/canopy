import { lire, json } from '../_stats.js';
import { refusAdmin } from './priere.js';

// GET /api/stats?jours=90 : réservé à l'administrateur (mot de passe dans la variable ADMIN_MOT_DE_PASSE).
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const refus = await refusAdmin(request, env); if (refus) return refus;   // temps constant + blocage après 10 essais ratés
  const jours = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('jours') || '90', 10) || 90, 1), 3650);
  const depuis = new Date(Date.now() - jours * 864e5).toISOString().slice(0, 10);
  return json({ ok: true, depuis, lignes: await lire(env.DB, depuis), suivi: await statsSuivi(env.DB) });
}

// Suivi des nouveaux convertis : seulement des totaux, jamais un prénom, un code ou une réponse.
async function statsSuivi(db) {
  try {
    const maintenant = new Date(), il = (j) => new Date(maintenant - j * 864e5).toISOString();
    const un = async (sql, ...a) => (await db.prepare(sql).bind(...a).first())?.n || 0;
    const debutRdv = new Date(maintenant.getTime() + 36e5).toISOString().slice(0, 16);   // sans fuseau : approximation suffisante
    return {
      crees: await un('SELECT COUNT(*) AS n FROM suivis'),
      rejoints: await un('SELECT COUNT(*) AS n FROM suivis WHERE cle_disciple IS NOT NULL'),
      nouveaux7: await un('SELECT COUNT(*) AS n FROM suivis WHERE cree > ?', il(7)),
      actifs14: await un('SELECT COUNT(*) AS n FROM suivis WHERE maj > ? AND cle_disciple IS NOT NULL', il(14)),
      endormis: await un('SELECT COUNT(*) AS n FROM suivis WHERE cle_disciple IS NOT NULL AND maj < ?', il(30)),
      attenteCode: await un('SELECT COUNT(*) AS n FROM suivis WHERE cle_disciple IS NULL AND cree < ?', il(3)),
      rdvAVenir: await un('SELECT COUNT(*) AS n FROM suivis WHERE rdv IS NOT NULL AND rdv > ?', debutRdv),
      carnets: await un('SELECT COUNT(*) AS n FROM carnets'),
    };
  } catch { return null; }
}
