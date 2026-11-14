// Outils du disciple : défis de 21 jours, verset de la semaine, liste des 5. Tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:disciple';
const VIDE = { defis: {}, versets: {}, cinq: [] };   // defis: { id: { debut, faits: [jours] } } ; versets: { ref: date appris } ; cinq: [{ id, prenom, note, prie: [], parle: [] }]
export const disciple = signal({ ...VIDE });
export async function chargerDisciple() { try { disciple.valeur = { ...VIDE, ...((await get(CLE)) || {}) }; } catch {} }
const sauver = (v) => { disciple.valeur = v; return set(CLE, v).catch(() => {}); };
const auj = () => new Date().toISOString().slice(0, 10);

export function cocherDefi(id, jour) {
  const d = disciple.valeur, x = d.defis[id] || { debut: auj(), faits: [] };
  const faits = x.faits.includes(jour) ? x.faits.filter((j) => j !== jour) : [...x.faits, jour].sort((a, b) => a - b);
  return sauver({ ...d, defis: { ...d.defis, [id]: { ...x, faits } } });
}
export const recommencerDefi = (id) => { const d = disciple.valeur, { [id]: _, ...reste } = d.defis; return sauver({ ...d, defis: reste }); };

export const marquerVersetAppris = (ref) => sauver({ ...disciple.valeur, versets: { ...disciple.valeur.versets, [ref]: auj() } });

export function ajouterPersonne(prenom, note = '') {
  const p = { id: Date.now().toString(36), prenom: prenom.trim().slice(0, 40), note: note.trim().slice(0, 300), prie: [], parle: [] };
  return sauver({ ...disciple.valeur, cinq: [...disciple.valeur.cinq, p].slice(0, 5) });
}
export const retirerPersonne = (id) => sauver({ ...disciple.valeur, cinq: disciple.valeur.cinq.filter((p) => p.id !== id) });
export function noterPour(id, quoi) {   // quoi : 'prie' | 'parle'
  return sauver({ ...disciple.valeur, cinq: disciple.valeur.cinq.map((p) => (p.id === id && !p[quoi].includes(auj()) ? { ...p, [quoi]: [...p[quoi], auj()] } : p)) });
}

// 52 versets à mémoriser, un par semaine de l'année.
export const VERSETS_SEMAINE = ['Jn 3:16', 'Rm 3:23', 'Rm 6:23', 'Rm 5:8', 'Ép 2:8-9', 'Jn 1:12', 'Ap 3:20', '1 Jn 5:13', 'Jn 10:28', '1 Co 10:13',
  '1 Jn 1:9', 'Pr 3:5-6', 'Ph 4:6-7', 'Ph 4:13', 'Jos 1:8', 'Ps 119:11', 'Ps 119:105', '2 Tm 3:16', 'Mt 6:33', 'Rm 8:28',
  'Rm 12:1-2', 'Ga 2:20', 'Ga 5:22-23', '2 Co 5:17', 'Mt 28:19-20', 'Ac 1:8', 'Rm 1:16', '1 Pi 3:15', 'Mt 5:16', 'Jn 14:6',
  'Jn 15:5', 'Jn 13:34-35', 'Ép 4:32', 'Col 3:13', '1 Co 13:4-7', 'Mi 6:8', 'Hé 11:6', 'Jc 1:22', 'Jc 4:7', 'Ép 6:10-11',
  '1 Th 5:16-18', 'Mt 11:28', 'Es 41:10', 'Ps 23:1', 'Ps 46:2', 'Lm 3:22-23', 'Hé 13:5', 'Ph 1:6', 'Rm 8:1', 'Jn 14:3', 'Ap 21:4', 'Pr 4:23'];
export function versetDeLaSemaine(d = new Date()) {
  const debut = new Date(d.getFullYear(), 0, 1), semaine = Math.floor((d - debut) / (7 * 864e5));
  return VERSETS_SEMAINE[semaine % VERSETS_SEMAINE.length];
}
