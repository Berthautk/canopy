// Mesure la difficulté de lecture des enseignements : longueur des phrases et mots compliqués.
// Objectif Yeshaya : phrases courtes (15 mots en moyenne au plus), peu de phrases de plus de 25 mots.
//   node tools/lisibilite.mjs            → le classement, du plus dur au plus simple
//   node tools/lisibilite.mjs <id>       → le détail d'un enseignement, avec ses pires phrases
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const fichiers = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? fichiers(p) : p.endsWith('.json') ? [p] : []; });

// Tout le texte lu par la personne (hors versets cités, qui gardent le style de la Bible).
export function texteDe(j) {
  const t = [j.resume, j.introduction];
  for (const s of j.sections || []) { t.push(s.titre, s.transition); for (const b of s.blocs || []) t.push(b.texte, b.sous_titre); }
  return t.filter(Boolean).map((x) => (/[.!?…»]$/.test(x.trim()) ? x : x + '.')).join(' ');
}
const phrases = (t) => t.split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length > 2);
const mots = (p) => p.split(/\s+/).filter(Boolean);
// Compte approximatif des syllabes d'un mot français : les groupes de voyelles.
const syllabes = (m) => (m.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[aeiouy]+/g) || []).length;

export function mesurer(j) {
  const ph = phrases(texteDe(j));
  if (!ph.length) return null;
  const tousMots = ph.flatMap(mots);
  const longues = ph.filter((p) => mots(p).length > 25);
  const durs = tousMots.filter((m) => syllabes(m) >= 4);
  return {
    id: j.id, titre: j.titre, auteur: j.auteur || 'Yeshaya',
    phrases: ph.length,
    moyenne: +(tousMots.length / ph.length).toFixed(1),
    pcLongues: Math.round((longues.length / ph.length) * 100),
    pcDurs: Math.round((durs.length / tousMots.length) * 100),
    pires: longues.sort((a, b) => mots(b).length - mots(a).length).slice(0, 3),
  };
}
// Note de 0 (très dur) à 100 (très simple).
export const note = (m) => Math.max(0, Math.min(100, Math.round(100 - (m.moyenne - 12) * 4 - m.pcLongues * 1.6 - Math.max(0, m.pcDurs - 8) * 2)));

const liste = fichiers('content/enseignements').map((f) => mesurer(JSON.parse(readFileSync(f, 'utf8')))).filter(Boolean).map((m) => ({ ...m, note: note(m) }));
const cible = process.argv[2];
if (cible) {
  const m = liste.find((x) => x.id === cible); if (!m) { console.log('inconnu'); process.exit(1); }
  console.log(`${m.titre} (${m.auteur})\n  note ${m.note}/100 · ${m.phrases} phrases · ${m.moyenne} mots en moyenne · ${m.pcLongues} % de phrases longues · ${m.pcDurs} % de mots longs`);
  m.pires.forEach((p, i) => console.log(`\n  phrase longue ${i + 1} (${p.split(/\s+/).length} mots) :\n   « ${p} »`));
} else {
  liste.sort((a, b) => a.note - b.note);
  const moy = (c) => +(liste.reduce((s, x) => s + x[c], 0) / liste.length).toFixed(1);
  console.log(`${liste.length} enseignements · note moyenne ${moy('note')}/100 · ${moy('moyenne')} mots par phrase · ${moy('pcLongues')} % de phrases longues\n`);
  console.log('LES 20 PLUS DIFFICILES');
  liste.slice(0, 20).forEach((m) => console.log(`  ${String(m.note).padStart(3)}/100  ${String(m.moyenne).padStart(5)} mots  ${String(m.pcLongues).padStart(3)} %long  ${m.titre.slice(0, 48).padEnd(50)} ${m.auteur}`));
  console.log('\nRÉPARTITION');
  for (const [nom, min, max] of [['très difficile', 0, 40], ['difficile', 40, 60], ['moyen', 60, 75], ['simple', 75, 101]]) {
    const n = liste.filter((x) => x.note >= min && x.note < max).length;
    console.log(`  ${nom.padEnd(16)} ${String(n).padStart(3)}  ${'█'.repeat(Math.round(n / 3))}`);
  }
}
