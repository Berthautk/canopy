// Étapes sans fin du « Chemin de la foi » : au-delà des niveaux écrits, chaque étape est fabriquée à partir
// du texte même de la Bible (LSG), sur un thème différent : compléter un verset, retrouver le livre, vrai ou faux.
// La même étape donne toujours les mêmes questions (graine = numéro de l'étape).
import { THEMES_BIBLE, SUJETS, QUIZ, NIVEAUX_CHEMIN } from '../donnees/contenu.js';
import { lireReference, ecrireReference, LIVRES, PAR_CODE } from '../bible/references.js';
import { texteVerset } from '../bible/bible.js';
import { generateur, melanger } from './hasard.js';

const MOTS_VIDES = new Set('afin ainsi alors aussi autre avait avaient avec avez avons celui celle cette ceux comme dans donc elle elles entre est était être leur leurs lorsque mais même nous parce pour quand quelque sans selon sera seront sont sous toute toutes tous tout vers vous votre vôtre point celui-ci dont lequel laquelle'.split(' '));
const IMAGES = ['/assets/paysages/sentier-de-montagne.webp', '/assets/paysages/chemin-oliviers.webp', '/assets/symboles/chemin-sur-la-colline.webp', '/assets/paysages/lever-soleil-collines.webp', '/assets/paysages/riviere.webp', '/assets/paysages/champ-de-ble.webp', '/assets/symboles/bible-dans-la-lumiere.webp', '/assets/paysages/montagne.webp'];
export const PREMIERE_ETAPE = NIVEAUX_CHEMIN.length + 1;
export const estEtape = (id) => /^etape-\d+$/.test(id);
export const numeroEtape = (id) => +id.split('-')[1];

export function infoEtape(num) {
  const t = THEMES_BIBLE[(num - PREMIERE_ETAPE) % THEMES_BIBLE.length];
  return { id: 'etape-' + num, num, titre: `Étape ${num} · ${t.nom}`, sous_titre: 'Versets à compléter, livres à retrouver', image: IMAGES[num % IMAGES.length], theme: t };
}

const mots = (t) => t.replace(/\n/g, ' ').split(/\s+/).map((m) => m.replace(/^[«"(]+|[»",.;:!?)]+$/g, '')).filter((m) => m.length >= 5 && !MOTS_VIDES.has(m.toLowerCase()) && !/^\d/.test(m));
const nomLivre = (code) => PAR_CODE[code].nom;

// Défi du jour : 10 questions nouvelles chaque jour, sur un thème tiré au sort (le même pour tous ce jour-là).
export async function genererDefi(jour) {
  const alea = generateur('defi-' + jour), k = Math.floor(alea() * THEMES_BIBLE.length);
  const num = PREMIERE_ETAPE + k;
  const e = await genererEtape(num, 'defi-' + jour);
  return { ...e, id: 'defi-' + jour, titre: 'Défi du jour · ' + THEMES_BIBLE[k].nom, questions: e.questions.slice(0, 10) };
}

export async function genererEtape(num, graine) {
  const info = infoEtape(num), alea = generateur(graine || 'etape-' + num);
  const refs = [...info.theme.versets, ...melanger(SUJETS.flatMap((s) => s.versets), alea).slice(0, 12), ...melanger(THEMES_BIBLE.flatMap((t) => t.versets), alea).slice(0, 12)];
  const versets = [];
  for (const r0 of refs) {
    const r = lireReference(r0); if (!r) continue;
    const v = r.v || 1;
    try { const t = await texteVerset(r.code, r.c, v); if (t && t.length > 40) versets.push({ code: r.code, c: r.c, v, texte: t.replace(/\n/g, ' '), ref: ecrireReference({ code: r.code, c: r.c, v }) }); } catch {}
    if (versets.length >= 24) break;
  }
  if (versets.length < 6) throw new Error('bible');
  const reserveMots = versets.flatMap((x) => mots(x.texte));
  const difficile = num >= PREMIERE_ETAPE + 15;
  const qs = [];
  melanger(versets, alea).forEach((x, i) => {
    const type = i % 3;
    if (type === 0) {               // compléter le verset
      const cand = mots(x.texte); if (!cand.length) return;
      const m = cand[Math.floor(alea() * cand.length)];
      const faux = melanger([...new Set(reserveMots.filter((w) => w.toLowerCase() !== m.toLowerCase()))], alea).slice(0, 3);
      qs.push({ type: 'qcm', question: `Complète le verset : « ${x.texte.replace(m, '……')} »`, choix: [m, ...faux], reponse: 0, explication: `« ${x.texte} »`, reference: x.ref });
    } else if (type === 1) {        // retrouver le livre
      const at = LIVRES.findIndex((l) => l.code === x.code) < 39;
      const autres = melanger(LIVRES.filter((l) => l.code !== x.code && (!difficile || (LIVRES.indexOf(l) < 39) === at)), alea).slice(0, 3).map((l) => l.nom);
      qs.push({ type: 'qcm', question: `Dans quel livre de la Bible lit-on : « ${x.texte} » ?`, choix: [nomLivre(x.code), ...autres], reponse: 0, explication: `Ce verset se trouve dans ${x.ref}.`, reference: x.ref });
    } else {                        // vrai ou faux
      const vrai = alea() < 0.5;
      const autre = melanger(LIVRES.filter((l) => l.code !== x.code), alea)[0];
      qs.push({ type: 'vf', question: `Ce verset se trouve dans le livre ${vrai ? nomLivre(x.code) : autre.nom} : « ${x.texte} »`, vrai, explication: `Ce verset se trouve dans ${x.ref}.`, reference: x.ref });
    }
  });
  // Quelques questions des quiz écrits, pour varier.
  const ecrites = melanger([...QUIZ.flatMap((t) => t.questions.map((q) => ({ ...q, type: 'qcm' }))), ...NIVEAUX_CHEMIN.flatMap((n) => n.questions.filter((q) => !q.id))], alea).slice(0, 3);
  return { ...info, questions: melanger([...qs.slice(0, 9), ...ecrites], alea).slice(0, 10 + Math.min(5, Math.floor((num - PREMIERE_ETAPE) / 10))) };
}
