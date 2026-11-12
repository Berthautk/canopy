import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { grade, pickDaily, applyResults, newProgress, mastery, practiceLevelFor, weakTopics, PRACTICE_LEVELS } from '../public/js/practice.js';
const bank = JSON.parse(readFileSync(new URL('../public/data/bank.json', import.meta.url), 'utf8'));

test('banque : structure valide et réponses cohérentes', () => {
  const ids = new Set();
  for (const q of bank) {
    assert.ok(!ids.has(q.id), 'id unique ' + q.id); ids.add(q.id);
    assert.ok(PRACTICE_LEVELS.includes(q.level) && q.explain && q.prompt, q.id);
    if (q.type === 'mcq') { assert.equal(q.options.length, 4); assert.ok(q.answer >= 0 && q.answer < 4, q.id); }
    if (q.type === 'tf') assert.ok(q.options.includes(q.answer), q.id);
    if (q.type === 'gap') assert.ok(q.accept.length, q.id);
  }
  for (const l of PRACTICE_LEVELS) assert.ok(bank.filter((q) => q.level === l).length >= 10);
});

test('correction', () => {
  const g = bank.find((q) => q.id === 'A2-10');
  assert.equal(grade(g, "Didn't go."), true);
  assert.equal(grade(g, 'did not go'), true);
  assert.equal(grade(g, 'went'), false);
  assert.equal(grade(bank.find((q) => q.id === 'A1-01'), '0'), true);
  assert.equal(grade(bank.find((q) => q.id === 'A1-01'), ''), false);
  assert.equal(grade(bank.find((q) => q.id === 'A1-07'), 'True'), true);
});

test('niveau d’entraînement depuis le test de placement', () => {
  assert.equal(practiceLevelFor('Pré-A1'), 'A1'); assert.equal(practiceLevelFor('B1'), 'B1'); assert.equal(practiceLevelFor('C1'), 'B2'); assert.equal(practiceLevelFor(undefined), 'A1');
});

test('séance du jour, répétition espacée et série', () => {
  let p = newProgress('s1', 'A1');
  const d1 = pickDaily(bank, p, 10, 100);
  assert.equal(d1.length, 10); assert.ok(d1.every((q) => q.level === 'A1'));
  p = applyResults(p, d1.map((q, i) => ({ id: q.id, ok: i < 7 })), 100);
  assert.equal(p.streak, 1); assert.equal(p.xp, 7 * 10 + 3 * 2);
  // ratées : à revoir dès le lendemain ; réussies : plus tard
  const d2 = pickDaily(bank, p, 10, 101);
  const wrong = d1.slice(7).map((q) => q.id);
  assert.ok(wrong.every((id) => d2.slice(0, 3).some((q) => q.id === id)), 'les erreurs reviennent en premier');
  assert.ok(!d2.some((q) => d1.slice(0, 7).some((r) => r.id === q.id)) || d2.length === 10);
  p = applyResults(p, d2.map((q) => ({ id: q.id, ok: true })), 101);
  assert.equal(p.streak, 2);
  p = applyResults(p, [{ id: d1[0].id, ok: true }], 105);
  assert.equal(p.streak, 1, 'série interrompue');
  assert.ok(p.items[d1[0].id].box >= 3);
});

test('maîtrise et passage au niveau suivant', () => {
  let p = newProgress('s2', 'A1');
  const A1 = bank.filter((q) => q.level === 'A1');
  for (let day = 0; day < 6; day++) p = applyResults(p, A1.map((q) => ({ id: q.id, ok: true })), 200 + day);
  const m = mastery(p, bank);
  assert.ok(m.pct >= 60 && m.acc === 100 && m.ready && m.next === 'A2');
  assert.equal(mastery(newProgress('x', 'B2'), bank).ready, false);
  assert.ok(weakTopics(p, bank).length > 0);
});
