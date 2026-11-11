// Correction (réponses, écriture, oral, récapitulatif) et attestation. Exécuté dans l'espace de Valérie.
import { esc, $, $$, fmtTime, fmtDate, toast, waLink, loadScript, IMG, TEST_NAMES, LEVEL_NAMES } from './ui.js';
import { computeResult, countWords, iterQuestions } from './scoring.js';
import { validateIdentity, fullName, civ, cleanPhone237 } from './identity.js';
import { resizePhoto } from './ui.js';

const cache = {};
export const KEYS = {
  async get(backend, code) { if (!code) return null; if (!cache[code]) cache[code] = await backend.getTestKey(code); return cache[code]; },
  drop(code) { delete cache[code]; },
};
const FORM = {
  ADU: ['Débutant A1', 'Élémentaire A2', 'Intermédiaire B1', 'Avancé B2 / C1', 'Cours accéléré (3 mois)', 'Préparation IELTS / TOEFL', 'Accompagnement personnel'],
  ENF: ['WINGS JUNIOR · Beginner 1', 'WINGS JUNIOR · Beginner 2', 'WINGS JUNIOR · Beginner 3', 'Groupe A2', 'Test Ados & Adultes'],
  IEL: ['Cours général jusqu’à B1', 'Préparation complète', 'Préparation ciblée', 'Coaching intensif'],
};
const FORM_DEFAULT = {
  ADU: { 'Pré-A1': [0], A1: [1], A2: [2], B1: [3], B2: [3, 5], C1: [3, 5, 6] },
  ENF: { Débutant: [0], Starter: [1], A1: [2], A2: [3] },
  IEL: { '< B1': [0], B1: [1], B2: [2], C1: [3] },
};
const PRIORITIES = ['Compréhension orale', 'Prononciation', 'Grammaire', 'Vocabulaire', 'Écriture', 'Aisance à l’oral'];
const WCRIT = ['Respect de la consigne', 'Organisation du texte', 'Vocabulaire', 'Grammaire', 'Orthographe / ponctuation'];
const OCRIT = ['Fluidité', 'Vocabulaire', 'Grammaire', 'Prononciation', 'Interaction'];
const CECR = { 'Pré-A1': 'Découverte', A1: 'Utilisateur élémentaire (débutant)', A2: 'Utilisateur élémentaire', B1: 'Utilisateur indépendant', B2: 'Utilisateur indépendant avancé', C1: 'Utilisateur expérimenté', Débutant: 'Découverte', Starter: 'Utilisateur élémentaire (débutant)', '< B1': 'Niveau inférieur à B1' };
const CECR_LONG = { 'Pré-A1': 'Peut reconnaître quelques mots et expressions très courants.', A1: 'Peut comprendre et utiliser des expressions familières et très simples.', A2: 'Peut communiquer lors de tâches simples et habituelles sur des sujets familiers.', B1: 'Peut comprendre les points essentiels, s’exprimer clairement sur des sujets familiers et gérer la plupart des situations de la vie quotidienne.', B2: 'Peut comprendre des textes complexes, communiquer avec spontanéité et argumenter son point de vue.', C1: 'Peut s’exprimer avec aisance et de façon structurée sur des sujets variés, y compris abstraits.', Débutant: 'Découvre l’anglais.', Starter: 'Comprend et utilise des mots et phrases très simples.', '< B1': 'Doit consolider les bases avant de viser un examen.' };
// Appréciation automatique (modifiable) par compétence et par tranche de niveau.
const TIER = (sc, lv) => { const i = sc.indexOf(lv); const r = sc.length > 1 ? i / (sc.length - 1) : 0; return r < .2 ? 0 : r < .4 ? 1 : r < .6 ? 2 : r < .8 ? 3 : 4; };
const APPR = {
  listening: ['Comprend quelques mots isolés à l’oral.', 'Comprend des messages oraux très simples et lents.', 'Comprend des messages oraux courants.', 'Bonne compréhension des messages oraux.', 'Comprend l’essentiel d’échanges variés, même rapides.'],
  language: ['Maîtrise quelques mots et structures de base.', 'Maîtrise les structures élémentaires de l’anglais.', 'Comprend des textes courts et utilise des structures courantes.', 'Bonne compréhension des textes courants.', 'Comprend des textes longs et complexes avec précision.'],
  writing: ['Écrit des mots isolés ou des phrases très courtes.', 'Écrit des phrases simples sur lui/elle-même.', 'S’exprime par des phrases reliées, avec des erreurs.', 'S’exprime de façon claire et structurée.', 'Rédige des textes détaillés, nuancés et variés.'],
  oral: ['Répond par des mots isolés.', 'Communique avec des phrases très simples.', 'Communique sur des sujets familiers avec hésitations.', 'Communique avec aisance sur des sujets familiers.', 'S’exprime avec spontanéité et nuance.'],
};
const SKILLS = [['listening', 'Compréhension orale', 'Listening', '🎧'], ['language', 'Langue & lecture', 'Language & Reading', '📖'], ['writing', 'Expression écrite', 'Writing', '✍️'], ['oral', 'Expression orale', 'Speaking', '🎤']];

const persist = (ctx, id, R) => { clearTimeout(persist.t); persist.t = setTimeout(() => ctx.backend.putResult(id, R).catch(() => toast('Enregistrement impossible')), 400); };
const sum = (o, n) => Array.from({ length: n }, (_, i) => Number(o?.[i] || 0)).reduce((a, b) => a + b, 0);
const dur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`; };

/* ================================ CORRECTION ================================ */
export async function renderCorrection(view, ctx, id) {
  let S = await ctx.backend.getSession(id);
  if (!S) return (view.innerHTML = '<div class="panel">Session introuvable.</div>');
  const key = await KEYS.get(ctx.backend, S.testCode);
  if (!key) return (view.innerHTML = `<div class="panel"><h2>Corrigés non importés</h2><p>Les corrigés du test ${S.testCode} ne sont pas encore dans l'application. <a href="#/staff/settings">Importer dans Paramètres</a>.</p></div>`);
  const pubTest = await ctx.backend.getTestPublic(S.testCode);
  let answers = {};
  const raw = await ctx.backend.getAnswers(id); Object.entries(raw).forEach(([k, v]) => (answers[k] = v.v));
  const R = (await ctx.backend.getResult(id)) || { id, validations: {}, writing: {}, oral: {}, formations: null, priorities: null, decision: '', attestationNo: '' };
  R.validations ||= {}; R.writing ||= {}; R.oral ||= {};
  R.writing.crit ||= {}; R.oral.crit ||= {}; R.oral.asked ||= {};
  let tab = 'A';
  const calc = () => computeResult(key, answers, R.validations, { writing: R.writing.level, oral: R.oral.level });
  const dur0 = S.startedAt && S.finishedAt ? dur(S.finishedAt - S.startedAt) : '—';

  view.innerHTML = `<div class="pagehead"><h2><span class="pic">✏️</span>Correction du test <small>— ${TEST_NAMES[S.testCode]}</small></h2><div class="row"><a class="btn sm" href="#/staff/results">← Liste</a></div></div>
    <div class="panel"><div class="row" style="align-items:center"><img class="avatar md" style="width:84px;height:92px;border-radius:14px" id="hp" src="${esc(S.identity?.photo || IMG.logo)}">
      <div class="grow" style="min-width:220px"><h2 style="margin:0;font-size:1.7rem" id="hn"></h2><span class="muted" id="hs"></span></div></div><div class="partchips mt" id="chips" style="grid-template-columns:repeat(5,1fr)"></div></div>
    <div id="body"></div>`;
  const body = $('#body', view);
  const header = () => {
    $('#hn', view).textContent = fullName(S.identity) || 'Candidat';
    $('#hs', view).innerHTML = `Code : ${id}<br>Date : ${fmtDate(S.finishedAt || S.createdAt)} · Écrit : ${dur0}`;
    const r = calc();
    const L = r.listening.details.reduce((a, d) => a + d.score, 0), Lt = r.listening.details.reduce((a, d) => a + d.total, 0);
    const P = r.language.details.reduce((a, d) => a + d.score, 0), Pt = r.language.details.reduce((a, d) => a + d.total, 0);
    const w = sum(R.writing.crit, 5), o = sum(R.oral.crit, 5);
    const chips = [['A', 'A. Écoute', r.levels.listening, `${L} / ${Lt} réponses justes`, !r.pending], ['B', 'B. Langue & lecture', r.levels.language, `${P} / ${Pt} réponses justes`, !r.pending], ['C', 'C. Écriture', R.writing.level ? r.levels.writing : '—', w ? `${w} / 25` : 'niveau à choisir', !!R.writing.level], ['D', 'D. Oral', R.oral.level || '—', o ? `${o} / 25` : 'niveau à choisir', !!R.oral.level], ['R', 'Récapitulatif', r.global || '—', R.validatedAt ? 'validé' : 'à valider', !!R.validatedAt]];
    $('#chips', view).innerHTML = chips.map(([k, l, v, sub, ok]) => `<div class="pchip ${ok ? 'ok' : ''} ${tab === k ? 'on' : ''}" data-t="${k}">${ok ? '✔ ' : ''}${l}<b>${esc(v)}</b><small class="muted" style="font-weight:500">${esc(sub)}</small></div>`).join('');
    $$('.pchip', view).forEach((c) => (c.onclick = () => setTab(c.dataset.t)));
  };
  const setTab = (t) => { tab = t; ({ A: tabAnswers, B: tabAnswers, C: tabWriting, D: tabOral, R: tabResult })[t](); header(); };
  const save = () => { persist(ctx, id, R); header(); };

  /* ---- A / B : réponses ---- */
  function tabAnswers() {
    const r = calc();
    const reviewRow = (qid, q) => {
      const c = r.corr[qid], v = R.validations[qid], got = answers[qid], on = v ? v.ok : null;
      return `<div class="corr" data-id="${qid}"><span class="qnum">${qid.slice(1)}</span><div><b>${esc(q.prompt)}</b></div>
        <div class="got ${got ? '' : 'empty'}">${esc(got || 'sans réponse')}</div>
        <div class="exp">✔ ${esc(q.expected)}${q.note ? `<br><span class="muted">${esc(q.note)}</span>` : ''}</div>
        <div class="row" style="flex-wrap:nowrap"><button class="vbtn ok ${on === true ? 'on' : ''}" data-v="1" title="Correct" style="${c.pending && c.suggested ? 'border-color:var(--ok)' : ''}">✓</button><button class="vbtn ko ${on === false ? 'on' : ''}" data-v="0" title="Incorrect">✗</button></div></div>`;
    };
    const autoRow = (qid, q) => {
      const c = r.corr[qid], got = answers[qid];
      const shown = q.type === 'mcq' ? (got === '' || got === undefined ? '' : `${'ABCD'[got]} · ${q.options?.[got] ?? ''}`) : got;
      const exp = q.type === 'mcq' ? `${'ABCD'[q.answer]} · ${q.options[q.answer]}` : q.type === 'gap' ? [...new Set(q.accept || [q.expected])].join(' / ') : q.answer;
      return `<div class="corr" data-id="${qid}" style="grid-template-columns:auto 1.4fr 1fr 1fr auto"><span class="qnum">${qid.slice(1)}</span><span>${esc(q.prompt)}</span><div class="got ${shown ? '' : 'empty'}">${esc(shown || 'sans réponse')}</div><div class="exp">${esc(exp)}</div>
        <button class="pill ${c.ok ? 'ok' : 'bad'}" data-force="1" style="border:0;cursor:pointer" title="Cliquer pour forcer">${c.ok ? '✓' : '✗'}${c.forced ? ' (forcé)' : ''}</button></div>`;
    };
    const L = r.listening.details, P = r.language.details;
    const head = `<div class="panel row sb"><div><b>Correction automatique</b> (trous, QCM, vrai/faux), puis <b>validation</b> des réponses courtes et ouvertes.<br><span class="muted">Le ✓ à contour vert est une suggestion (réponse proche de celles attendues). Cliquer sur ✓ / ✗ d’une réponse automatique la force (motif demandé).</span></div><button class="btn gold" id="allsug">✓ Valider toutes les suggestions</button></div>`;
    body.innerHTML = tab === 'A'
      ? head + key.listening.map((ex, i) => `<div class="panel"><div class="row sb"><h2>🎧 ${esc(ex.id)} — niveau ${ex.level}</h2><span class="pill ${L[i].passed ? 'ok' : 'bad'}">${L[i].score}/${L[i].total} ${L[i].passed ? '· réussi' : '· non réussi'}</span></div>${ex.questions.map((q) => reviewRow('L' + q.n, q)).join('')}</div>`).join('')
      : head + key.paliers.map((p, i) => `<div class="panel"><div class="row sb"><h2>📘 Palier ${p.palier} — ${p.level}</h2><span class="pill ${P[i].validated ? 'ok' : 'bad'}">${P[i].score}/${P[i].total} (${Math.round(P[i].pct * 100)} %) · partie A ${P[i].scoreA}/${P[i].totalA} ${P[i].validated ? '· validé' : '· non validé'}</span></div>
        ${p.items.map((q) => autoRow('P' + q.n, q)).join('')}<h3 class="mt">Lecture</h3>${p.reading.questions.map((q) => (q.type === 'open' ? reviewRow('P' + q.n, q) : autoRow('P' + q.n, q))).join('')}</div>`).join('');
    $('#allsug', body).onclick = () => { for (const [qid, c] of Object.entries(r.corr)) if (c.pending && !R.validations[qid]) R.validations[qid] = { ok: !!c.suggested }; save(); tabAnswers(); };
    $$('.corr', body).forEach((row) => {
      const qid = row.dataset.id;
      $$('[data-v]', row).forEach((b) => (b.onclick = () => { R.validations[qid] = { ok: b.dataset.v === '1' }; save(); tabAnswers(); }));
      $('[data-force]', row)?.addEventListener('click', () => {
        const cur = calc().corr[qid];
        const reason = prompt('Motif du forçage de la correction :', R.validations[qid]?.reason || '');
        if (reason === null) return;
        R.validations[qid] = { ok: !cur.ok, reason }; save(); tabAnswers();
      });
    });
  }

  const critTable = (labels, store, max = 5) => `<div class="crit"><span>Critères</span><span>Descriptif</span><span>Note / ${max}</span></div>${labels.map((l, i) => `<div class="crit"><b>${esc(l)}</b><span class="muted" style="font-size:.85rem">${esc(CRIT_HINT[l] || '')}</span><select data-c="${i}"><option value="">—</option>${[0, 1, 2, 3, 4, 5].map((n) => `<option ${store[i] === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`).join('')}`;
  const CRIT_HINT = { 'Respect de la consigne': 'Traite le sujet, contenu pertinent et complet.', 'Organisation du texte': 'Texte clair, idées liées, paragraphes.', Vocabulaire: 'Vocabulaire adapté, varié et juste.', Grammaire: 'Structures correctes malgré quelques erreurs.', 'Orthographe / ponctuation': 'Orthographe et ponctuation maîtrisées.', Fluidité: 'S’exprime sans hésitations excessives.', Prononciation: 'Prononciation claire et compréhensible.', Interaction: 'Répond de façon pertinente, développe ses idées.' };
  const levelGrid = (grid, cur) => Object.entries(grid).map(([lv, d]) => `<div class="row mb" style="flex-wrap:nowrap;align-items:flex-start"><button class="lvl ${cur === lv ? 'on' : ''}" data-l="${esc(lv)}" style="min-width:76px">${esc(lv)}</button><span style="font-size:.92rem">${esc(d)}</span></div>`).join('');
  const bindCrit = (node, store, rerender) => $$('select[data-c]', node).forEach((s) => (s.onchange = () => { store[s.dataset.c] = s.value === '' ? undefined : Number(s.value); save(); rerender(); }));

  /* ---- C : écriture ---- */
  function tabWriting() {
    const text = answers.W || '', words = countWords(text), w = key.writing, r = calc(), tot = sum(R.writing.crit, 5);
    const pw = pubTest?.writing;
    body.innerHTML = `<div class="split"><div class="panel"><h2>📝 Texte du candidat</h2>
      ${pw ? `<div class="info"><span class="i">i</span><div><b>Sujet :</b> ${esc(pw.prompt.join(' '))}</div></div>` : ''}
      <div class="got" style="white-space:pre-wrap;padding:14px;background:var(--bg2);border-radius:12px;min-height:220px;font-size:1.02rem;border:1px solid var(--line)">${esc(text) || '<i class="muted">Aucun texte.</i>'}</div>
      <div class="row sb mt"><span class="pill ${words < (w.minWords || 0) ? 'bad' : 'ok'}">Nombre de mots : ${words} ${words < (w.minWords || 0) ? '✖' : '✔'}</span><span class="muted">Limite : ${w.minWords || 0} – ${w.maxWords} mots</span></div>
      ${w.rule ? `<div class="info mt"><span class="i">!</span><div>${esc(w.rule)}</div></div>` : ''}</div>
      <div><div class="panel"><h2>Grille d’évaluation — critères <small class="muted" style="font-weight:400">(aide à la notation)</small></h2><div id="wcrit">${critTable(WCRIT, R.writing.crit)}</div>
        <div class="totalbar mt"><span>Note : <span class="chipn">${tot} / 25</span> <span class="muted" style="font-size:1rem">soit ${Math.round((tot / 25) * 100)} %</span></span></div></div>
      <div class="panel"><h2>Niveau CECR — grille officielle</h2>${levelGrid(w.grid, R.writing.level)}<div id="wcap"></div>
      <label class="f mt">Appréciation / observation<textarea class="txt" id="wn" style="min-height:80px">${esc(R.writing.note || '')}</textarea></label></div></div></div>`;
    const cap = () => { const x = calc(); $('#wcap', body).innerHTML = R.writing.level && x.levels.writing !== R.writing.level ? `<div class="info" style="background:var(--err-soft)"><span class="i" style="background:var(--err)">!</span><div>Niveau plafonné à <b>${x.levels.writing}</b> (moins de ${w.minWords} mots).</div></div>` : R.writing.level ? `<div class="totalbar"><span>Niveau retenu</span><span class="lvlok">${x.levels.writing}</span></div>` : ''; };
    $$('[data-l]', body).forEach((b) => (b.onclick = () => { R.writing.level = b.dataset.l; $$('[data-l]', body).forEach((x) => x.classList.toggle('on', x === b)); cap(); save(); }));
    bindCrit($('#wcrit', body), R.writing.crit, tabWriting);
    $('#wn', body).oninput = (e) => { R.writing.note = e.target.value; persist(ctx, id, R); }; cap();
  }

  /* ---- D : oral (en salle ou à distance) ---- */
  function tabOral() {
    const o = (S.oral ||= { mode: 'presentiel' }), g = key.oral.grid, tot = sum(R.oral.crit, 5);
    const saveOral = async (patch) => { Object.assign(o, patch); await ctx.backend.patchSession(id, { oral: o }).catch(() => {}); };
    body.innerHTML = `<div class="split"><div><div class="panel"><h2>🗣️ Entretien oral (Partie D)</h2>
      <div class="row mb"><label class="checkline" style="padding:0"><input type="radio" name="om" value="presentiel" ${o.mode !== 'distance' ? 'checked' : ''}> 🏫 En salle</label><label class="checkline" style="padding:0"><input type="radio" name="om" value="distance" ${o.mode === 'distance' ? 'checked' : ''}> 🌐 À distance</label></div>
      <div id="modebox"></div>
      <div class="row mt"><button class="btn ${o.live ? 'danger' : 'primary'}" id="live">${o.live ? '⏹ Terminer l’entretien' : '▶ Démarrer l’entretien'}</button><span class="pill grey" id="oct" style="font-size:1rem">⏱ ${fmtTime(R.oral.elapsed || 0)} / ${key.oral.minutes} min</span></div></div>
      <div class="panel"><h2>💬 Questions de l’entretien</h2><p class="muted">Commencez bas, montez tant que le candidat répond bien. « Afficher » montre la question sur l’écran du candidat.</p>
      ${Object.entries(key.oral.questions).map(([lv, qs]) => `<h3>${esc(lv)}</h3>${qs.map((q, i) => { const k = lv + '#' + i; return `<div class="row mb" style="flex-wrap:nowrap"><input type="checkbox" data-a="${esc(k)}" ${R.oral.asked[k] ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--ok)"><span class="grow">${esc(q)}</span><button class="btn sm" data-show="${esc(q)}">📺 Afficher</button></div>`; }).join('')}`).join('')}
      <button class="btn sm" id="hide">Masquer la question à l'écran du candidat</button></div></div>
      <div><div class="panel"><h2>Grille d’évaluation — critères</h2><div id="ocrit">${critTable(OCRIT, R.oral.crit)}</div>
        <div class="totalbar mt"><span>Note de l’oral : <span class="chipn">${tot} / 25</span> <span class="muted" style="font-size:1rem">soit ${Math.round((tot / 25) * 100)} %</span></span></div></div>
      <div class="panel"><h2>Niveau CECR — expression orale</h2>${levelGrid(g, R.oral.level)}
      <label class="f mt">Appréciation générale<textarea class="txt" id="on" style="min-height:100px" placeholder="Fluidité, prononciation, vocabulaire, exemples de phrases…">${esc(R.oral.note || '')}</textarea></label>
      <p class="muted">Résultat enregistré dans la même fiche, que le candidat soit dans la salle ou à distance.</p></div></div></div>`;
    const modebox = () => {
      $('#modebox', body).innerHTML = o.mode === 'distance'
        ? `<div class="info"><span class="i">i</span><div><b>À distance :</b> envoyez un lien de visio. Dès que vous démarrez l'entretien, un bouton « Rejoindre » apparaît sur l'écran du candidat. Vous évaluez ici pendant que vous l'écoutez.</div></div>
           <label class="f">Lien de visio<input class="txt" id="lk" value="${esc(o.link || '')}" placeholder="https://meet.jit.si/… ou lien Google Meet / Zoom"></label>
           <div class="row mt"><button class="btn sm" id="jt">Générer un lien Jitsi</button><a class="btn sm wa" target="_blank" rel="noopener" href="${waLink(S.identity?.tel, `Bonjour, c'est VLA. Pour votre entretien oral, rejoignez : ${o.link || '(lien à venir)'}`)}">💬 Envoyer sur WhatsApp</a><a class="btn sm" target="_blank" rel="noopener" href="${waLink(S.identity?.tel, 'Bonjour, c’est Valérie Language Academy. Je vous appelle en vidéo sur WhatsApp pour votre entretien oral.')}">📞 Appel vidéo WhatsApp</a></div>`
        : '<div class="info"><span class="i">i</span><div><b>En salle :</b> le candidat reste devant son écran verrouillé. Posez les questions à voix haute, ou affichez-les sur sa tablette. Tout est noté ici, en direct.</div></div>';
      $('#jt', body)?.addEventListener('click', () => { o.link = 'https://meet.jit.si/VLA-' + id + '-' + Math.random().toString(36).slice(2, 7); saveOral({}); modebox(); });
      $('#lk', body)?.addEventListener('change', (e) => saveOral({ link: e.target.value.trim() }));
    };
    modebox();
    $$('[name=om]', body).forEach((r) => (r.onchange = async () => { await saveOral({ mode: r.value }); modebox(); }));
    let tm; const tick = () => { R.oral.elapsed = (R.oral.elapsed || 0) + 1; const e = $('#oct', body); if (e) e.textContent = `⏱ ${fmtTime(R.oral.elapsed)} / ${key.oral.minutes} min`; else clearInterval(tm); };
    if (o.live) tm = setInterval(tick, 1000); ctx.cleanup.push(() => { clearInterval(tm); persist(ctx, id, R); });
    $('#live', body).onclick = async () => { await saveOral({ live: !o.live }); save(); tabOral(); };
    $$('[data-a]', body).forEach((c) => (c.onchange = () => { R.oral.asked[c.dataset.a] = c.checked; save(); }));
    $$('[data-show]', body).forEach((b) => (b.onclick = () => { saveOral({ currentQ: b.dataset.show }); toast('Affichée sur l’écran du candidat'); }));
    $('#hide', body).onclick = () => saveOral({ currentQ: '' });
    $$('[data-l]', body).forEach((b) => (b.onclick = () => { R.oral.level = b.dataset.l; $$('[data-l]', body).forEach((x) => x.classList.toggle('on', x === b)); save(); }));
    bindCrit($('#ocrit', body), R.oral.crit, tabOral);
    $('#on', body).oninput = (e) => { R.oral.note = e.target.value; persist(ctx, id, R); };
  }

  /* ---- Récapitulatif ---- */
  function tabResult() {
    const r = calc(), sc = key.scale;
    if (r.global && !R.formations) R.formations = (FORM_DEFAULT[S.testCode]?.[r.global] || []).map((i) => FORM[S.testCode][i]);
    if (r.global && !R.priorities) R.priorities = r.priorities;
    const idv = validateIdentity(S.identity || {}, S.testCode === 'ENF');
    const pos = (lv) => (lv ? ((sc.indexOf(lv) + 1) / sc.length) * 100 : 0);
    const appr = (k) => (r.levels[k] ? APPR[k][TIER(sc, r.levels[k])] : '—');
    const det = { listening: (() => { const x = [...r.listening.details].reverse().find((d) => d.passed) || r.listening.details[0]; return `Extrait ${x.level} : ${x.score}/${x.total}`; })(), language: (() => { const x = [...r.language.details].reverse().find((d) => d.validated) || r.language.details[0]; return `Palier ${x.level} : ${x.score}/${x.total}`; })(), writing: R.writing.level ? `${sum(R.writing.crit, 5) ? sum(R.writing.crit, 5) + '/25 · ' : ''}${r.words} mots` : '', oral: sum(R.oral.crit, 5) ? `${sum(R.oral.crit, 5)}/25` : '' };
    body.innerHTML = `<div class="split" style="grid-template-columns:1.25fr 1fr"><div class="panel"><h2>📊 Résultats par compétence</h2>
      ${SKILLS.map(([k, lab, en]) => `<div class="skill"><div><b>${lab}</b><small>(${en})</small></div><div class="bar"><i style="width:${pos(r.levels[k])}%"></i></div><span class="pill done" style="text-align:center">${esc(r.levels[k] || '—')}</span><small style="grid-column:1/-1;margin-top:-6px;color:var(--mut)">${esc(det[k] || '')}</small></div>`).join('')}
      ${r.pending ? `<div class="info" style="background:var(--err-soft)"><span class="i" style="background:var(--err)">!</span><div>${r.pending} réponse(s) à valider (onglets A et B).</div></div>` : ''}
      ${!r.complete ? '<div class="info"><span class="i">i</span><div>Choisissez les niveaux d’<b>écriture</b> (onglet C) et d’<b>oral</b> (onglet D) pour obtenir le niveau global.</div></div>' : ''}
      <p class="muted" style="font-size:.88rem">Le niveau se détermine par paliers validés, sans additionner les points de tout le test (règle du guide du correcteur).</p></div>
      <div class="panel"><h2>🏅 Niveau global (CECR)</h2><div class="glob">Niveau estimé :<b>${r.global || '—'}</b></div>
        ${r.global ? `<div class="info mt" style="display:block">${esc(CECR[r.global] || '')} : ${esc(CECR_LONG[r.global] || '')}</div>` : ''}
        ${r.guardrail ? '<div class="info"><span class="i">!</span><div><b>Garde-fou :</b> oral inférieur de 2 niveaux ou plus → niveau global abaissé d’un cran.</div></div>' : ''}
        ${r.estimate ? `<div class="info"><span class="i">🎯</span><div>Estimation : <b>${esc(r.estimate)}</b></div></div>` : ''}${r.admission ? `<div class="info" style="background:${r.admission.admitted ? 'var(--ok-soft)' : 'var(--err-soft)'}"><div>${esc(r.admission.text)}</div></div>` : ''}</div></div>
    ${r.global ? `<div class="split"><div class="panel"><h2>📋 Formation conseillée</h2><p class="muted">Proposition : <b>${esc(r.placement)}</b></p><div class="row">${FORM[S.testCode].map((f) => `<label class="checkline" style="padding:2px 12px 2px 0"><input type="checkbox" data-f="${esc(f)}" ${R.formations?.includes(f) ? 'checked' : ''}> ${esc(f)}</label>`).join('')}</div>
      <h3 class="mt">À travailler en priorité</h3><div class="row">${PRIORITIES.map((f) => `<label class="checkline" style="padding:2px 12px 2px 0"><input type="checkbox" data-p="${esc(f)}" ${R.priorities?.includes(f) ? 'checked' : ''}> ${f}</label>`).join('')}</div>
      <h3 class="mt">Décision du candidat</h3><div class="row" id="dec">${[['souhaitée', 'Inscription souhaitée'], ['réfléchit', 'Le candidat réfléchit'], ['non', 'Non']].map(([v, l]) => `<button class="lvl ${R.decision === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>
      <label class="f mt">Remarque (interne)<textarea class="txt" id="rm" style="min-height:70px">${esc(R.remark || '')}</textarea></label></div>
    <div class="panel ${idv.ok ? '' : ''}" id="idp"><h2>🪪 Informations imprimées sur l’attestation</h2>${identityForm(S.identity || {}, idv)}</div></div>
    <div class="row"><a class="btn" href="#/staff/live">← Retour</a><button class="btn gold" id="val" ${r.pending || !r.complete || !idv.ok ? 'disabled' : ''}>✔ ${R.validatedAt ? 'Mettre à jour le résultat' : 'Valider le niveau global'}</button>${R.validatedAt ? `<a class="btn primary" href="#/staff/attestation/${id}">🧾 Générer l’attestation (PDF)</a>` : ''}</div>
    ${!idv.ok ? `<p class="ferr mt">⚠ Informations obligatoires manquantes pour l’attestation : ${Object.values(idv.errors).join(' ')}</p>` : ''}
    ${R.attestationNo ? `<p class="muted">Attestation n° ${esc(R.attestationNo)}</p>` : ''}` : ''}`;
    $$('[data-f]', body).forEach((c) => (c.onchange = () => { R.formations = $$('[data-f]:checked', body).map((x) => x.dataset.f); save(); }));
    $$('[data-p]', body).forEach((c) => (c.onchange = () => { R.priorities = $$('[data-p]:checked', body).map((x) => x.dataset.p); save(); }));
    $$('#dec [data-v]', body).forEach((b) => (b.onclick = () => { R.decision = b.dataset.v; $$('#dec [data-v]', body).forEach((x) => x.classList.toggle('on', x === b)); save(); }));
    $('#rm', body)?.addEventListener('input', (e) => { R.remark = e.target.value; persist(ctx, id, R); });
    bindIdentity($('#idp', body), S, async (clean) => { S.identity = clean; await ctx.backend.patchSession(id, { identity: clean }); toast('Informations enregistrées'); header(); tabResult(); });
    $('#val', body)?.addEventListener('click', async () => {
      const now = calc();
      if (!R.attestationNo) R.attestationNo = await ctx.backend.nextAttestationNo(new Date().getFullYear());
      Object.assign(R, { id, sid: id, testCode: S.testCode, name: fullName(S.identity), levels: now.levels, global: now.global, placement: now.placement, estimate: now.estimate, words: now.words, appr: { listening: appr('listening'), language: appr('language'), writing: appr('writing'), oral: appr('oral') }, details: det, validatedAt: R.validatedAt || Date.now() });
      await ctx.backend.putResult(id, R);
      const all = await ctx.backend.listPeople();
      const tel = (S.identity?.tel || '').replace(/\D/g, '');
      const old = all.find((p) => p.sessionId === id || (tel && (p.tel || '').replace(/\D/g, '') === tel));
      const I = S.identity || {};
      await ctx.backend.putPerson({ ...(old || {}), id: old?.id || 'p' + id, sessionId: id, nom: I.nom || '', prenom: I.prenom || '', tel: I.tel || '', email: I.email || '', ville: I.ville || '', photo: I.photo || '', profession: I.profession || '', testCode: S.testCode, level: now.global, formation: (R.formations || []).join(' · ') || now.placement, testDate: R.validatedAt, attestationNo: R.attestationNo, decision: R.decision || old?.decision || '', status: old?.status === 'Inscrit' ? 'Inscrit' : 'Testé · prospect' });
      if (S.status !== 'delivered') await ctx.backend.patchSession(id, { status: 'corrected' });
      toast('Résultat validé ✔'); header(); tabResult();
    });
  }

  const unsubA = ctx.backend.onAnswers(id, (a) => { const prev = JSON.stringify(answers); answers = Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.v])); if (JSON.stringify(answers) !== prev && (tab === 'A' || tab === 'B') && !document.activeElement?.closest?.('#body textarea,#body input')) tabAnswers(); header(); });
  ctx.cleanup.push(unsubA);
  setTab(R.validatedAt ? 'R' : 'A');
}

/* ---- Formulaire d'identité (correction d'orthographe avant l'attestation) ---- */
function identityForm(I, idv) {
  const f = (k, l, t = 'text') => `<label class="f">${l}<input class="txt ${idv.errors[k] ? 'bad' : ''}" data-i="${k}" type="${t}" value="${esc(I[k] || '')}"><span class="ferr">${esc(idv.errors[k] || '')}</span></label>`;
  return `<div class="row mb"><img class="avatar md" id="ipv" src="${esc(I.photo || IMG.logo)}"><input type="file" id="ipf" accept="image/*" class="hidden"><button class="btn sm" id="ipb">📷 Changer la photo</button><span class="ferr">${esc(idv.errors.photo || '')}</span></div>
  <div class="grid2"><label class="f">Civilité<select class="txt" data-i="civilite"><option value="">—</option><option value="M" ${I.civilite === 'M' ? 'selected' : ''}>M. / Garçon</option><option value="F" ${I.civilite === 'F' ? 'selected' : ''}>Mme / Mlle / Fille</option></select><span class="ferr">${esc(idv.errors.civilite || '')}</span></label>${f('nom', 'Nom')}${f('prenom', 'Prénom(s)')}${f('naissance', 'Date de naissance', 'date')}${f('ville', 'Ville')}${f('tel', 'Téléphone')}${f('email', 'Email', 'email')}${I.parent !== undefined || idv.errors.parent ? f('parent', 'Parent') : ''}</div><button class="btn sm mt" id="isv">💾 Enregistrer les informations</button>`;
}
function bindIdentity(node, S, onSave) {
  if (!node) return;
  let photo = S.identity?.photo;
  $('#ipb', node)?.addEventListener('click', () => $('#ipf', node).click());
  $('#ipf', node)?.addEventListener('change', async (e) => { if (e.target.files[0]) { photo = await resizePhoto(e.target.files[0]); $('#ipv', node).src = photo; } });
  $('#isv', node)?.addEventListener('click', () => { const I = { ...(S.identity || {}), photo }; $$('[data-i]', node).forEach((e) => (I[e.dataset.i] = e.value)); const v = validateIdentity(I, S.testCode === 'ENF'); onSave(v.clean); });
}

/* ================================ ATTESTATION ================================ */
export async function renderAttestation(view, ctx, id) {
  const S = await ctx.backend.getSession(id);
  const R = await ctx.backend.getResult(id);
  const key = S && (await KEYS.get(ctx.backend, S.testCode));
  if (!S || !R?.validatedAt || !key) return (view.innerHTML = '<div class="panel">Validez d\'abord le résultat. <a href="#/staff/correct/' + id + '">Retour à la correction</a></div>');
  const set = ctx.settings, sc = key.scale, lv = R.levels || {}, I = S.identity || {};
  const name = `${I.prenom || ''} ${I.nom || ''}`.trim();
  const longDate = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const until = new Date(R.validatedAt); until.setMonth(until.getMonth() + 6);
  const duration = S.startedAt && S.finishedAt ? dur(S.finishedAt - S.startedAt) : '';
  const formation = (R.formations && R.formations.length ? R.formations.join(' · ') : R.placement) || '';
  const att = `<div class="att" id="att"><img class="wm" src="${IMG.logo}" alt=""><div class="topband"></div><div class="gline"></div><div class="frame"></div>
    <img class="logo" src="${IMG.logo}" alt=""><div class="org">Valérie<br>Language Academy<small>English Opens Doors, We Give You The Keys</small></div>
    <div class="refno">Réf. VLA-PT-${S.testCode}<br><b>N° ${esc(R.attestationNo)}</b></div>
    <h1>Attestation de Résultat</h1><div class="ribbon">Test de placement en anglais</div>
    <div class="certify">La Valérie Language Academy (VLA) atteste que :</div>
    ${I.photo ? `<img class="photo" src="${esc(I.photo)}" alt="">` : ''}
    <div class="idl"><div><span>Nom et prénoms</span><b>: ${esc(civ(I))} ${esc(name)}</b></div><div><span>Né(e) le</span>: ${I.naissance ? esc(longDate(I.naissance)) : '—'}</div><div><span>Code candidat</span>: ${esc(S.id)}</div><div><span>Date du test</span>: ${esc(longDate(S.finishedAt || R.validatedAt))}</div>${duration && S.finishedAt - S.startedAt >= 60000 ? `<div><span>Durée de l’écrit</span>: ${esc(duration)}</div>` : ''}</div>
    <div class="glbox"><div class="h">Niveau global (CECR)</div><div class="v">${esc(R.global)}</div><div class="d">${esc(CECR[R.global] || '')}${R.estimate ? `<br><b>${esc(R.estimate)}</b>` : ''}</div></div>
    <div class="lower"><table><tr><th style="text-align:left;width:31%">Compétence</th><th style="width:11%">Niveau</th><th style="width:19%">Résultat</th><th>Appréciation</th></tr>
    ${SKILLS.map(([k, lab, en, ic]) => `<tr><td class="l">${ic} ${lab} <span style="font-weight:400;color:#6b7280">(${en})</span></td><td class="lv"><b>${esc(lv[k] || '—')}</b></td><td>${esc((R.details && R.details[k]) || '')}</td><td class="ap">${esc((R.appr && R.appr[k]) || '')}</td></tr>`).join('')}</table>
    <div class="bottom"><div><div class="formation"><span style="font-size:22px">🎓</span><div><b>Formation conseillée :</b>${esc(formation)}</div></div>
    <div class="prio">${R.priorities?.length ? '<b>À travailler en priorité :</b> ' + esc(R.priorities.join(' · ')) : ''}</div>
    <div class="fait">Fait à ${esc(set.city || 'Garoua')}, le ${esc(longDate(R.validatedAt))}.</div></div>
    <img class="seal" src="assets/seal.png" alt="">
    <div class="sign">${esc(set.directorTitle || 'La Directrice')},<div class="box">${set.signature ? `<img src="${esc(set.signature)}" style="mix-blend-mode:multiply" alt="">` : ''}</div><b>${esc(set.director ?? 'Mme FOTSA NOUMESSING Valérie épouse TEKEUTSA')}</b></div></div></div>
    <div class="valid l2"><span>Test de placement : il oriente vers le bon cours et ne remplace pas un examen officiel.</span><span>Résultat valable 6 mois, jusqu’au ${esc(longDate(until))}.</span></div>
    <div class="valid"><span>${esc(set.address || 'Valérie Language Academy · Garoua')}</span><span>${esc(set.phones || '')}</span></div></div>`;
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🎖️</span>Attestation ${esc(R.attestationNo)} <small>${esc(name)}</small></h2><a class="btn sm" href="#/staff/correct/${id}">← Retour</a></div>
    <div class="panel row"><button class="btn primary" id="pdf">⬇ Télécharger le PDF</button><button class="btn" id="pr">🖨 Imprimer</button><button class="btn wa" id="wa">💬 Envoyer par WhatsApp</button><button class="btn gold" id="dl">✔ Marquer « Attestation remise »</button></div>
    <div class="info mb"><span class="i">i</span><div>Le PDF est au format <b>A5 paysage</b>. Imprimez-le, signez et tamponnez-le, ou envoyez-le directement. ${set.signature ? '' : '<b>Astuce :</b> ajoutez la signature numérique de la directrice dans <a href="#/staff/settings">Paramètres</a>.'}</div></div>
    <div style="overflow-x:auto;padding-bottom:10px">${att}</div>`;
  const el = $('#att', view);
  const fit = () => { const w = view.clientWidth - 8; if (w < 794) { el.style.transformOrigin = 'top left'; el.style.zoom = String(w / 794); } };
  fit();
  const makePdf = async () => {
    await loadScript('js/vendor/html2canvas.min.js'); await loadScript('js/vendor/jspdf.umd.min.js');
    const z = el.style.zoom; el.style.zoom = '1';
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#fffdf8', useCORS: true, logging: false });
    el.style.zoom = z;
    const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 210, 148);
    pdf.setProperties({ title: `Attestation ${R.attestationNo}`, author: 'Valérie Language Academy', subject: 'Attestation de résultat — test de placement' });
    return pdf;
  };
  const fname = `Attestation_${R.attestationNo}_${(I.nom || 'candidat').replace(/[^\w-]+/g, '_')}.pdf`;
  $('#pdf', view).onclick = async (e) => { e.target.disabled = true; try { (await makePdf()).save(fname); } catch (err) { toast('Génération du PDF impossible : ' + err.message); } e.target.disabled = false; };
  $('#pr', view).onclick = () => window.print();
  $('#wa', view).onclick = async () => {
    const text = `Bonjour ${I.prenom || ''}, voici votre attestation de résultat VLA n° ${R.attestationNo} : niveau ${R.global}. Merci d'avoir passé votre test de placement chez Valérie Language Academy !`;
    try {
      const pdf = await makePdf(); const file = new File([pdf.output('blob')], fname, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
      pdf.save(fname); toast('PDF téléchargé : joignez-le dans la conversation WhatsApp');
    } catch (err) { if (err.name === 'AbortError') return; }
    window.open(waLink(I.tel, text), '_blank', 'noopener');
  };
  $('#dl', view).onclick = async () => { await ctx.backend.patchSession(id, { status: 'delivered', deliveredAt: Date.now() }); toast('Attestation marquée comme remise'); };
}
