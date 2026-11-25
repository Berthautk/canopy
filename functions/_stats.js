// Statistiques anonymes de Yeshaya (Cloudflare Pages Functions + base D1 liée sous le nom « DB »).
// Rien d'identifiant n'est reçu ni stocké : ni nom, ni adresse IP, ni pays, ni identifiant d'appareil.
// Seulement des compteurs par jour : « tel contenu a été ouvert N fois », « N personnes ont dit avoir donné leur vie à Jésus ».

export const SCHEMA = 'CREATE TABLE IF NOT EXISTS stats (jour TEXT NOT NULL, cle TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (jour, cle))';
const CLE = /^[a-z][a-z0-9-]{0,40}(:[a-z0-9-]{1,80})?$/;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

// Vérifie et nettoie un envoi { jours: { 'AAAA-MM-JJ': { cle: nombre } } }. Renvoie des lignes [jour, cle, n].
export function lignesValides(corps, maintenant = new Date()) {
  const lignes = [];
  const jours = corps && typeof corps === 'object' && corps.jours && typeof corps.jours === 'object' ? corps.jours : {};
  const max = maintenant.getTime() + 864e5, min = maintenant.getTime() - 60 * 864e5;   // 60 jours en arrière au plus
  for (const [jour, compteurs] of Object.entries(jours).slice(0, 61)) {
    if (!JOUR.test(jour)) continue;
    const t = Date.parse(jour + 'T00:00:00Z'); if (!(t >= min && t <= max)) continue;
    if (!compteurs || typeof compteurs !== 'object') continue;
    for (const [cle, n] of Object.entries(compteurs).slice(0, 200)) {
      if (!CLE.test(cle) || !Number.isInteger(n) || n < 1) continue;
      lignes.push([jour, cle, Math.min(n, 500)]);
    }
  }
  return lignes.slice(0, 1000);
}

export async function enregistrer(db, lignes) {
  await db.prepare(SCHEMA).run();
  const req = db.prepare('INSERT INTO stats (jour, cle, n) VALUES (?, ?, ?) ON CONFLICT (jour, cle) DO UPDATE SET n = n + excluded.n');
  if (db.batch) await db.batch(lignes.map((l) => req.bind(...l)));
  else for (const l of lignes) await req.bind(...l).run();
}

export async function lire(db, depuis) {
  await db.prepare(SCHEMA).run();
  const { results } = await db.prepare('SELECT jour, cle, n FROM stats WHERE jour >= ? ORDER BY jour').bind(depuis).all();
  return results;
}

// Comparaison en temps constant (évite de deviner le mot de passe caractère par caractère).
export function memeTexte(a = '', b = '') {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}
export const json = (o, statut = 200) => new Response(JSON.stringify(o), { status: statut, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// Refuse les envois qui viennent d'un autre site (un navigateur indique toujours l'origine d'un POST).
export function memeOrigine(request) {
  const o = request.headers.get('origin'); if (!o) return true;            // applications et outils sans navigateur : pas d'en-tête
  try { return new URL(o).host === new URL(request.url).host; } catch { return false; }
}

// ---------- Freins contre les attaques par tâtonnement ----------
// On ne garde jamais l'adresse IP : seulement une empreinte courte et irréversible (SHA-256),
// qui sert uniquement à compter les essais ratés et s'efface d'elle-même au bout d'un jour.
export async function cleAnonyme(request, usage) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip) return '';
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(usage + '|' + ip));
  return usage + ':' + [...new Uint8Array(h)].slice(0, 10).map((x) => x.toString(16).padStart(2, '0')).join('');
}

const SCHEMA_ESSAIS = 'CREATE TABLE IF NOT EXISTS essais (cle TEXT PRIMARY KEY, n INTEGER NOT NULL, depuis TEXT NOT NULL)';
// Compte un essai et dit s'il faut refuser. Fenêtre glissante simple : au-delà de `max` essais, on bloque.
export async function tropDEssais(db, cle, max, fenetreMs = 36e5) {
  if (!db || !cle) return false;
  try {
    await db.prepare(SCHEMA_ESSAIS).run();
    const t = Date.now(), debut = new Date(t - fenetreMs).toISOString();
    const l = await db.prepare('SELECT n, depuis FROM essais WHERE cle = ?').bind(cle).first();
    if (!l || l.depuis < debut) {
      await db.prepare('INSERT INTO essais (cle, n, depuis) VALUES (?, 1, ?) ON CONFLICT (cle) DO UPDATE SET n = 1, depuis = excluded.depuis').bind(cle, new Date(t).toISOString()).run();
      await db.prepare('DELETE FROM essais WHERE depuis < ?').bind(new Date(t - 864e5).toISOString()).run();
      return false;
    }
    await db.prepare('UPDATE essais SET n = n + 1 WHERE cle = ?').bind(cle).run();
    return l.n + 1 > max;
  } catch { return false; }
}
export const oublierEssais = (db, cle) => (cle ? db.prepare('DELETE FROM essais WHERE cle = ?').bind(cle).run().catch(() => {}) : Promise.resolve());

// Lit le corps d'une requête en vérifiant sa vraie taille (l'en-tête « content-length » peut être absent).
export async function corpsJson(request, maxOctets) {
  let brut; try { brut = await request.text(); } catch { return null; }
  if (brut.length > maxOctets) return 'trop-long';
  try { const o = JSON.parse(brut); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch { return null; }
}
