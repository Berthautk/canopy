// Imitation minimale de D1 (Cloudflare) au-dessus de node:sqlite, pour tester les fonctions hors ligne.
import { DatabaseSync } from 'node:sqlite';
export function faireDB() {
  const db = new DatabaseSync(':memory:');
  const prep = (sql) => {
    const faire = (args) => {
      const s = db.prepare(sql);
      return {
        run: async () => ({ success: true, ...(sql.trim().toUpperCase().startsWith('SELECT') ? {} : s.run(...args)) }),
        first: async () => s.all(...args)[0] ?? null,
        all: async () => ({ results: s.all(...args) }),
      };
    };
    return { bind: (...a) => faire(a), ...faire([]) };
  };
  return { prepare: prep, batch: async (l) => { for (const x of l) await x.run(); } };
}
export const req = (corps, { ip = '1.2.3.4', origin = 'https://yeshaya.pages.dev', auth = null } = {}) => ({
  url: 'https://yeshaya.pages.dev/api/x',
  headers: { get: (h) => ({ origin, 'cf-connecting-ip': ip, authorization: auth, 'content-length': null }[h.toLowerCase()] ?? null) },
  json: async () => corps,
  text: async () => (typeof corps === 'string' ? corps : JSON.stringify(corps)),
});
export const lireRep = async (r) => ({ statut: r.status, ...JSON.parse(await r.text()) });
