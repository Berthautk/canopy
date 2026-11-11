// Moteur de correction et de calcul des niveaux — fonctions pures, sans DOM.
// Exécuté dans l'espace de Valérie (jamais sur l'appareil du candidat).
// Identifiants de réponses : "L<n>" (écoute), "P<n>" (paliers), "W" (écriture).

export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[’‘ʼ`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '')
    .trim();
}

export function matchesAccept(answer, accept = []) {
  const a = normalize(answer);
  if (!a) return false;
  return accept.some((x) => normalize(x) === a);
}

/** Itère sur toutes les questions du corrigé avec leur identifiant de réponse. */
export function* iterQuestions(key) {
  for (const ex of key.listening || []) {
    for (const q of ex.questions) yield { id: 'L' + q.n, kind: 'listening', group: ex.id, q: { ...q, type: q.type || 'short' } };
  }
  for (const p of key.paliers || []) {
    for (const q of p.items) yield { id: 'P' + q.n, kind: 'palier', group: p.id, q };
    for (const q of p.reading.questions) yield { id: 'P' + q.n, kind: 'palier', group: p.id, q };
  }
}

/** Correction d'une question : { status: 'ok'|'ko'|'review', suggested?: boolean } */
export function correctOne(q, value) {
  const empty = value === undefined || value === null || String(value).trim() === '';
  switch (q.type) {
    case 'gap':
      return { status: !empty && matchesAccept(value, q.accept) ? 'ok' : 'ko', auto: true };
    case 'mcq':
      return { status: !empty && Number(value) === Number(q.answer) ? 'ok' : 'ko', auto: true };
    case 'tf':
    case 'tfng':
      return { status: !empty && String(value) === String(q.answer) ? 'ok' : 'ko', auto: true };
    case 'short':
    case 'open':
    default:
      return { status: 'review', auto: false, suggested: !empty && matchesAccept(value, q.accept || []) };
  }
}

/**
 * Corrige tout le test.
 * @param key        corrigé (test_key)
 * @param answers    { id: valeur }
 * @param validations{ id: { ok: boolean, reason?: string } } décisions de Valérie
 *                   (✓/✗ pour short/open, ou forçage avec motif pour n'importe quel id)
 * @returns { [id]: { ok:boolean, auto:boolean, forced:boolean, pending:boolean, suggested?:boolean, reason?:string } }
 */
export function correctAll(key, answers = {}, validations = {}) {
  const out = {};
  for (const { id, q } of iterQuestions(key)) {
    const c = correctOne(q, answers[id]);
    const v = validations[id];
    if (v && typeof v.ok === 'boolean') {
      const forced = c.auto && v.ok !== (c.status === 'ok');
      out[id] = { ok: v.ok, auto: c.auto, forced, pending: false, reason: v.reason || '' };
    } else if (c.auto) {
      out[id] = { ok: c.status === 'ok', auto: true, forced: false, pending: false };
    } else {
      // en attente de validation humaine : on compte la suggestion à titre provisoire
      out[id] = { ok: !!c.suggested, auto: false, forced: false, pending: true, suggested: !!c.suggested };
    }
  }
  return out;
}

const idx = (scale, lvl) => scale.indexOf(lvl);

/** Écoute : un extrait est réussi si ≥ 3/4 ; niveau = dernier extrait réussi sans interruption. */
export function listeningLevel(key, corr) {
  const scale = key.scale;
  let level = scale[0];
  const details = [];
  let broken = false;
  for (const ex of key.listening) {
    const total = ex.questions.length;
    const score = ex.questions.filter((q) => corr['L' + q.n]?.ok).length;
    const passed = score >= 3;
    details.push({ id: ex.id, level: ex.level, score, total, passed });
    if (passed && !broken) level = ex.level;
    else broken = true;
  }
  return { level, details };
}

/** Langue & lecture : palier validé si ≥ 70 % ET partie A ≥ 5/8 (ENF palier 1 : ≥ 6/10). */
export function languageLevel(key, corr) {
  const scale = key.scale;
  let level = scale[0];
  const details = [];
  let broken = false;
  for (const p of key.paliers) {
    const all = [...p.items, ...p.reading.questions];
    const partA = p.items.filter((i) => i.section === 'A');
    const total = all.length;
    const score = all.filter((q) => corr['P' + q.n]?.ok).length;
    const scoreA = partA.filter((q) => corr['P' + q.n]?.ok).length;
    const minA = key.code === 'ENF' && p.palier === 1 ? 6 : 5;
    const pct = total ? score / total : 0;
    const validated = pct >= 0.7 && scoreA >= minA;
    details.push({ id: p.id, palier: p.palier, level: p.level, score, total, scoreA, totalA: partA.length, minA, pct, validated });
    if (validated && !broken) level = p.level;
    else broken = true;
  }
  return { level, details };
}

export function countWords(text) {
  const t = String(text ?? '').trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

/** Plafonne le niveau d'écriture si le minimum de mots n'est pas atteint. */
export function capWriting(key, level, words) {
  const w = key.writing || {};
  if (!level || !w.minWords || words >= w.minWords || !w.capLevel) return level;
  const s = key.scale;
  return idx(s, level) > idx(s, w.capLevel) ? w.capLevel : level;
}

/** Niveau global : deuxième plus bas des 4 niveaux (+ garde-fou oral pour ADU). */
export function globalLevel(key, levels) {
  const s = key.scale;
  const vals = [levels.listening, levels.language, levels.writing, levels.oral];
  if (vals.some((v) => idx(s, v) < 0)) return { level: null, guardrail: false };
  const sorted = vals.map((v) => idx(s, v)).sort((a, b) => a - b);
  let g = sorted[1];
  let guardrail = false;
  if (key.code === 'ADU' && idx(s, levels.oral) <= g - 2) {
    g = Math.max(0, g - 1);
    guardrail = true;
  }
  return { level: s[g], guardrail };
}

export function placementFor(key, level) {
  return (key.placement && key.placement[level]) || '';
}

export function ieltsEstimate(key, level) {
  return key.estimate ? key.estimate[level] || '' : '';
}

/** Admission IELTS/TOEFL : global ≥ B1 → admis en préparation. */
export function ielAdmission(key, level) {
  if (key.code !== 'IEL' || !level) return null;
  return idx(key.scale, level) >= 1
    ? { admitted: true, text: 'Admis en préparation IELTS / TOEFL.' }
    : { admitted: false, text: 'Faire passer le test Adolescents & Adultes.' };
}

/** Points à travailler en priorité (suggestion modifiable). */
export function suggestPriorities(key, levels, global) {
  const s = key.scale;
  const g = idx(s, global);
  const out = [];
  const low = (v) => idx(s, v) <= g && idx(s, v) === Math.min(...Object.values(levels).map((x) => idx(s, x)));
  if (low(levels.listening)) out.push('Compréhension orale');
  if (low(levels.oral)) out.push('Aisance à l’oral', 'Prononciation');
  if (low(levels.language)) out.push('Grammaire', 'Vocabulaire');
  if (low(levels.writing)) out.push('Écriture');
  return out.length ? [...new Set(out)] : ['Vocabulaire'];
}

/** Calcul complet à partir des corrections et des niveaux choisis par Valérie. */
export function computeResult(key, answers, validations, human = {}) {
  const corr = correctAll(key, answers, validations);
  const listening = listeningLevel(key, corr);
  const language = languageLevel(key, corr);
  const words = countWords(answers.W);
  const writingRaw = human.writing || null;
  const writing = writingRaw ? capWriting(key, writingRaw, words) : null;
  const oral = human.oral || null;
  const levels = { listening: listening.level, language: language.level, writing, oral };
  const complete = !!(writing && oral);
  const g = complete ? globalLevel(key, levels) : { level: null, guardrail: false };
  const pending = Object.values(corr).filter((c) => c.pending).length;
  return {
    corr, listening, language, words, writingRaw, levels,
    global: g.level, guardrail: g.guardrail,
    placement: g.level ? placementFor(key, g.level) : '',
    estimate: g.level ? ieltsEstimate(key, g.level) : '',
    admission: g.level ? ielAdmission(key, g.level) : null,
    priorities: g.level ? suggestPriorities(key, levels, g.level) : [],
    pending, complete,
  };
}

/** Sépare un test complet en test_public (candidat) et test_key (personnel). */
export function splitTest(full) {
  const pub = {
    code: full.code,
    title: full.title,
    scale: full.scale,
    timing: full.timing,
    listening: full.listening.map((ex) => ({
      id: ex.id, title: ex.title, audio: ex.audio,
      questions: ex.questions.map((q) => ({ n: q.n, type: q.type || 'short', prompt: q.prompt })),
    })),
    paliers: full.paliers.map((p) => ({
      id: p.id, palier: p.palier,
      items: p.items.map((i) => {
        const o = { n: i.n, type: i.type, section: i.section, prompt: i.prompt };
        if (i.options) o.options = i.options;
        return o;
      }),
      reading: {
        instruction: p.reading.instruction,
        text: p.reading.text,
        questions: p.reading.questions.map((q) => {
          const o = { n: q.n, type: q.type, prompt: q.prompt };
          if (q.options) o.options = q.options;
          return o;
        }),
      },
    })),
    writing: { minutes: full.writing.minutes, minWords: full.writing.minWords, maxWords: full.writing.maxWords, prompt: full.writing.prompt },
    oral: { minutes: full.oral.minutes },
  };
  const m = /maximum\s+([^\s.]+)/i.exec(full.writing.rule || '');
  const key = {
    code: full.code,
    scale: full.scale,
    placement: full.placement,
    estimate: full.estimate || null,
    listening: full.listening.map((ex) => ({
      id: ex.id, level: ex.level, script: ex.script,
      questions: ex.questions.map((q) => ({ n: q.n, type: q.type || 'short', prompt: q.prompt, expected: q.expected, accept: q.accept, note: q.note || '' })),
    })),
    paliers: full.paliers.map((p) => ({
      id: p.id, palier: p.palier, level: p.level,
      items: p.items.map((i) => ({ n: i.n, type: i.type, section: i.section, prompt: i.prompt, options: i.options, expected: i.expected, accept: i.accept, answer: i.answer, note: i.note || '' })),
      reading: { questions: p.reading.questions.map((q) => ({ n: q.n, type: q.type, prompt: q.prompt, options: q.options, expected: q.expected, accept: q.accept, answer: q.answer, note: q.note || '' })) },
    })),
    writing: { minWords: full.writing.minWords, maxWords: full.writing.maxWords, grid: full.writing.grid, rule: full.writing.rule || '', capLevel: m ? m[1] : null },
    oral: { minutes: full.oral.minutes, questions: full.oral.questions, grid: full.oral.grid },
  };
  return { pub, key };
}
