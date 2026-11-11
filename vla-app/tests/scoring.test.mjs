import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalize, splitTest, correctAll, listeningLevel, languageLevel, globalLevel, computeResult, countWords, capWriting } from '../public/js/scoring.js';

const load = (c) => JSON.parse(readFileSync(new URL(`../source-data/test_${c}.json`, import.meta.url), 'utf8'));
const ADU = splitTest(load('ADU')), ENF = splitTest(load('ENF')), IEL = splitTest(load('IEL'));

test('normalisation', () => {
  assert.equal(normalize("  It’s   GOOD. "), "it's good");
  assert.equal(normalize('Mr Bello.'), 'mr bello');
});

test('séparation public / clé : aucun corrigé côté candidat', () => {
  for (const { pub } of [ADU, ENF, IEL]) {
    const s = JSON.stringify(pub);
    for (const bad of ['"expected"', '"accept"', '"answer"', '"script"', '"note"', '"grid"', '"correction"', '"placement"']) assert.ok(!s.includes(bad), bad);
  }
});

test("exemples de niveau global du §7 (ADU)", () => {
  const rows = [
    ['A1', 'A2', 'A1', 'A1', 'A1'],
    ['A2', 'B1', 'A2', 'B1', 'A2'],
    ['B1', 'B2', 'B1', 'A2', 'B1'],
    ['A1', 'A2', 'A1', 'Pré-A1', 'A1'],
    ['B2', 'B2', 'B2', 'A2', 'B1'],
  ];
  for (const [l, g, w, o, exp] of rows) {
    assert.equal(globalLevel(ADU.key, { listening: l, language: g, writing: w, oral: o }).level, exp, `${l}/${g}/${w}/${o}`);
  }
});

// Réponses parfaites jusqu'à un certain palier/extrait
function answersUpTo(key, nL, nP) {
  const a = {};
  key.listening.slice(0, nL).forEach((ex) => ex.questions.forEach((q) => (a['L' + q.n] = q.accept[0])));
  key.paliers.slice(0, nP).forEach((p) => {
    [...p.items, ...p.reading.questions].forEach((q) => {
      if (q.type === 'gap' || q.type === 'open') a['P' + q.n] = q.accept?.[0] ?? q.expected;
      else if (q.type === 'mcq') a['P' + q.n] = q.answer;
      else a['P' + q.n] = q.answer;
    });
  });
  return a;
}

test('écoute : dernier extrait réussi sans interruption', () => {
  const a = answersUpTo(ADU.key, 2, 0);
  const r = listeningLevel(ADU.key, correctAll(ADU.key, a));
  assert.equal(r.level, 'A2');
  // extrait 1 raté, extrait 2 réussi → les points au-dessus ne comptent pas
  const b = answersUpTo(ADU.key, 3, 0);
  ADU.key.listening[0].questions.forEach((q) => delete b['L' + q.n]);
  assert.equal(listeningLevel(ADU.key, correctAll(ADU.key, b)).level, 'Pré-A1');
});

test('langue : palier validé ≥70 % et partie A ≥ 5/8, sans interruption', () => {
  const a = answersUpTo(ADU.key, 0, 3);
  assert.equal(languageLevel(ADU.key, correctAll(ADU.key, a)).level, 'B1');
  // palier 2 raté → palier 3 parfait ne compte pas
  const b = answersUpTo(ADU.key, 0, 3);
  [...ADU.key.paliers[1].items, ...ADU.key.paliers[1].reading.questions].forEach((q) => delete b['P' + q.n]);
  assert.equal(languageLevel(ADU.key, correctAll(ADU.key, b)).level, 'A1');
  // 70 % atteint mais partie A < 5/8 → non validé
  const c = answersUpTo(ADU.key, 0, 1);
  ADU.key.paliers[0].items.filter((i) => i.section === 'A').slice(0, 4).forEach((q) => delete c['P' + q.n]);
  assert.equal(languageLevel(ADU.key, correctAll(ADU.key, c)).level, 'Pré-A1');
});

test('ENF palier 1 : partie A ≥ 6/10', () => {
  const a = answersUpTo(ENF.key, 0, 1);
  const A = ENF.key.paliers[0].items.filter((i) => i.section === 'A');
  assert.equal(A.length, 10);
  assert.equal(languageLevel(ENF.key, correctAll(ENF.key, a)).level, 'Starter');
  A.slice(0, 5).forEach((q) => delete a['P' + q.n]); // 5/10 < 6
  assert.equal(languageLevel(ENF.key, correctAll(ENF.key, a)).level, 'Débutant');
});

test('contractions et formes longues acceptées pour gap', () => {
  const q = ADU.key.paliers.flatMap((p) => p.items).find((i) => i.accept && i.accept.length > 1);
  if (q) q.accept.forEach((x) => assert.equal(correctAll({ listening: [], paliers: [{ items: [q], reading: { questions: [] } }] }, { ['P' + q.n]: x })['P' + q.n].ok, true));
});

test('short/open : en attente, pré-suggestion, forçage avec motif', () => {
  const ex = ADU.key.listening[0];
  const q = ex.questions[0];
  const c = correctAll(ADU.key, { ['L' + q.n]: q.accept[0] });
  assert.equal(c['L' + q.n].pending, true);
  assert.equal(c['L' + q.n].suggested, true);
  const c2 = correctAll(ADU.key, { ['L' + q.n]: 'zzz' }, { ['L' + q.n]: { ok: true, reason: 'orthographe proche' } });
  assert.equal(c2['L' + q.n].ok, true);
  assert.equal(c2['L' + q.n].pending, false);
  // forçage d'une question auto
  const p = ADU.key.paliers[0].items[0];
  const c3 = correctAll(ADU.key, { ['P' + p.n]: 'zzz' }, { ['P' + p.n]: { ok: true, reason: 'dictée' } });
  assert.equal(c3['P' + p.n].forced, true);
});

test('écriture plafonnée sous le minimum de mots', () => {
  assert.equal(capWriting(ADU.key, 'B2', 30), 'A2');
  assert.equal(capWriting(ADU.key, 'A1', 30), 'A1');
  assert.equal(capWriting(ADU.key, 'B2', 40), 'B2');
  assert.equal(capWriting(IEL.key, 'C1', 100), 'B1');
  assert.equal(capWriting(ENF.key, 'A2', 1), 'A2');
  assert.equal(countWords("  a  b\nc "), 3);
});

test('IEL : admission et estimation', () => {
  const a = answersUpTo(IEL.key, 3, 2);
  const r = computeResult(IEL.key, { ...a, W: 'word '.repeat(160) }, {}, { writing: 'B2', oral: 'B2' });
  assert.equal(r.global, 'B2');
  assert.equal(r.admission.admitted, true);
  assert.match(r.estimate, /IELTS/);
  const r2 = computeResult(IEL.key, {}, {}, { writing: '< B1', oral: '< B1' });
  assert.equal(r2.admission.admitted, false);
});

import { validateIdentity, cleanPhone237, cleanPrenom, ageFrom } from '../public/js/identity.js';
test('identité : champs obligatoires et normalisation', () => {
  const now = new Date('2026-11-11');
  const bad = validateIdentity({}, false, now);
  for (const k of ['civilite', 'nom', 'prenom', 'naissance', 'ville', 'tel', 'photo']) assert.ok(bad.errors[k], k);
  const ok = validateIdentity({ civilite: 'M', nom: ' essama  ', prenom: 'jean-paul marie', naissance: '2000-11-12', ville: 'Garoua', tel: '677123456', photo: 'data:x' }, false, now);
  assert.equal(ok.ok, true);
  assert.equal(ok.clean.nom, 'ESSAMA');
  assert.equal(ok.clean.prenom, 'Jean-Paul Marie');
  assert.equal(ok.clean.tel, '+237 6 77 12 34 56');
  assert.equal(ok.clean.age, 25);
  assert.equal(cleanPrenom("n'dongo"), "N'Dongo");
  assert.equal(ageFrom('2026-02-30', now), null);
  assert.ok(validateIdentity({ civilite: 'M', nom: 'A1', prenom: 'Bo', naissance: '2000-01-01', ville: 'x', tel: '12', photo: 'x', email: 'zz' }, false, now).errors.email);
  const kid = validateIdentity({ civilite: 'F', nom: 'Dupont', prenom: 'Lea', naissance: '2016-05-05', parent: 'Mme Dupont', tel: '699000111', photo: 'x' }, true, now);
  assert.equal(kid.ok, true);
});
