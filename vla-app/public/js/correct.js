// Correction (réponses, écriture, oral, résultat) et attestation. Exécuté dans l'espace de Valérie.
import { esc, $, $$, fmtTime, fmtDate, toast, waLink, IMG, TEST_NAMES, LEVEL_NAMES } from './ui.js';
import { computeResult, countWords, iterQuestions } from './scoring.js';

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

function persist(ctx, id, R) {
  clearTimeout(persist.t);
  persist.t = setTimeout(() => ctx.backend.putResult(id, R).catch(() => toast('Enregistrement impossible')), 400);
}

/* ================================ CORRECTION ================================ */
export async function renderCorrection(view, ctx, id) {
  const sess = await ctx.backend.getSession(id);
  if (!sess) return (view.innerHTML = '<div class="panel">Session introuvable.</div>');
  const key = await KEYS.get(ctx.backend, sess.testCode);
  if (!key) return (view.innerHTML = `<div class="panel"><h2>Corrigés non importés</h2><p>Les corrigés du test ${sess.testCode} ne sont pas encore dans l'application. <a href="#/staff/settings">Importer dans Paramètres</a>.</p></div>`);
  let answers = {};
  const raw = await ctx.backend.getAnswers(id); Object.entries(raw).forEach(([k, v]) => (answers[k] = v.v));
  const R = (await ctx.backend.getResult(id)) || { id, validations: {}, writing: {}, oral: {}, formations: null, priorities: null, decision: '', attestationNo: '' };
  R.validations ||= {}; R.writing ||= {}; R.oral ||= {};
  let tab = 'answers', S = sess;
  const name = [S.identity?.prenom, S.identity?.nom].filter(Boolean).join(' ') || 'Candidat';
  const calc = () => computeResult(key, answers, R.validations, { writing: R.writing.level, oral: R.oral.level });

  view.innerHTML = `<div class="panel row sb"><div class="row"><img class="avatar" src="${esc(S.identity?.photo || IMG.logo)}"><div><h2 style="margin:0">${esc(name)}</h2><span class="muted">${TEST_NAMES[S.testCode]} · code ${id} · ${S.identity?.tel || ''}</span></div></div>
    <div class="row" id="sum"></div></div>
    <div class="tabs" id="tabs">${[['answers', '1 · Réponses'], ['writing', '2 · Écriture'], ['oral', '3 · Oral'], ['result', '4 · Résultat']].map(([k, l]) => `<button class="tab" data-t="${k}">${l}</button>`).join('')}</div>
    <div id="body"></div>`;
  const body = $('#body', view);
  const sumUpdate = () => {
    const r = calc();
    $('#sum', view).innerHTML = `<span class="pill ${r.pending ? 'bad' : 'ok'}">${r.pending ? r.pending + ' à valider' : 'Réponses validées'}</span><span class="pill grey">Écoute ${r.levels.listening}</span><span class="pill grey">Langue ${r.levels.language}</span>${r.global ? `<span class="pill done">Global ${r.global}</span>` : ''}`;
  };
  const setTab = (t) => { tab = t; $$('.tab', view).forEach((b) => b.classList.toggle('on', b.dataset.t === t)); ({ answers: tabAnswers, writing: tabWriting, oral: tabOral, result: tabResult })[t](); sumUpdate(); };
  $$('.tab', view).forEach((b) => (b.onclick = () => setTab(b.dataset.t)));
  const save = () => { persist(ctx, id, R); sumUpdate(); };
  const refreshSess = async () => (S = await ctx.backend.getSession(id));

  /* ---- 1. Réponses ---- */
  function tabAnswers() {
    const r = calc();
    const qmap = {}; for (const x of iterQuestions(key)) qmap[x.id] = x.q;
    const reviewRow = (qid, q) => {
      const c = r.corr[qid], v = R.validations[qid], got = answers[qid];
      const on = v ? v.ok : null;
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
    body.innerHTML = `<div class="panel row sb"><div><b>Correction automatique</b> (trous, QCM, vrai/faux) puis <b>validation</b> des réponses courtes et ouvertes.<br><span class="muted">Les ✓ en vert contour sont des suggestions (réponse proche de celles attendues).</span></div><button class="btn gold" id="allsug">✓ Valider toutes les suggestions</button></div>
      ${key.listening.map((ex, i) => `<div class="panel"><div class="row sb"><h2>🎧 ${esc(ex.id)} — niveau ${ex.level}</h2><span class="pill ${L[i].passed ? 'ok' : 'bad'}">${L[i].score}/${L[i].total} ${L[i].passed ? '· réussi' : '· non réussi'}</span></div>${ex.questions.map((q) => reviewRow('L' + q.n, q)).join('')}</div>`).join('')}
      ${key.paliers.map((p, i) => `<div class="panel"><div class="row sb"><h2>📘 Palier ${p.palier} — ${p.level}</h2><span class="pill ${P[i].validated ? 'ok' : 'bad'}">${P[i].score}/${P[i].total} (${Math.round(P[i].pct * 100)} %) · A ${P[i].scoreA}/${P[i].totalA} ${P[i].validated ? '· validé' : '· non validé'}</span></div>
        ${p.items.map((q) => autoRow('P' + q.n, q)).join('')}<h3 class="mt">Lecture</h3>${p.reading.questions.map((q) => (q.type === 'open' ? reviewRow('P' + q.n, q) : autoRow('P' + q.n, q))).join('')}</div>`).join('')}`;
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

  /* ---- 2. Écriture ---- */
  function tabWriting() {
    const text = answers.W || '', words = countWords(text), w = key.writing, r = calc();
    body.innerHTML = `<div class="split"><div class="panel"><h2>✍️ Texte du candidat</h2>
      <div class="row mb"><span class="pill ${words < (w.minWords || 0) ? 'bad' : 'ok'}">${words} mots</span><span class="muted">Min. ${w.minWords || 0} · max. ${w.maxWords}</span></div>
      <div class="got" style="white-space:pre-wrap;padding:14px;background:var(--bg2);border-radius:12px;min-height:200px;font-size:1.02rem">${esc(text) || '<i class="muted">Aucun texte.</i>'}</div>
      ${w.rule ? `<div class="info mt">📏 ${esc(w.rule)}</div>` : ''}</div>
      <div class="panel"><h2>Grille d'évaluation</h2>
      ${Object.entries(w.grid).map(([lv, d]) => `<div class="row mb" style="flex-wrap:nowrap;align-items:flex-start"><button class="lvl ${R.writing.level === lv ? 'on' : ''}" data-l="${lv}" style="min-width:72px">${esc(lv)}</button><span style="font-size:.9rem">${esc(d)}</span></div>`).join('')}
      <div id="wcap"></div><label class="f mt">Remarque<textarea class="txt" id="wn" style="min-height:90px">${esc(R.writing.note || '')}</textarea></label></div></div>`;
    const cap = () => { const x = calc(); $('#wcap', body).innerHTML = R.writing.level && x.levels.writing !== R.writing.level ? `<div class="info" style="background:var(--err-soft)">⚠ Niveau plafonné à <b>${x.levels.writing}</b> (moins de ${w.minWords} mots).</div>` : R.writing.level ? `<p>Niveau retenu : <b>${x.levels.writing}</b></p>` : ''; };
    $$('[data-l]', body).forEach((b) => (b.onclick = () => { R.writing.level = b.dataset.l; $$('[data-l]', body).forEach((x) => x.classList.toggle('on', x === b)); cap(); save(); }));
    $('#wn', body).oninput = (e) => { R.writing.note = e.target.value; save(); }; cap();
  }

  /* ---- 3. Oral (présentiel ou à distance) ---- */
  function tabOral() {
    const o = (S.oral ||= { mode: 'presentiel' }), g = key.oral.grid;
    R.oral.asked ||= {};
    const saveOral = async (patch) => { Object.assign(o, patch); await ctx.backend.patchSession(id, { oral: o }).catch(() => {}); };
    body.innerHTML = `<div class="split"><div><div class="panel"><h2>🗣️ Entretien oral</h2>
      <div class="row mb"><label class="checkline" style="padding:0"><input type="radio" name="om" value="presentiel" ${o.mode !== 'distance' ? 'checked' : ''}> 🏫 En salle</label><label class="checkline" style="padding:0"><input type="radio" name="om" value="distance" ${o.mode === 'distance' ? 'checked' : ''}> 🌐 À distance</label></div>
      <div id="modebox"></div>
      <div class="row mt"><button class="btn ${o.live ? 'danger' : 'primary'}" id="live">${o.live ? '⏹ Terminer l’entretien' : '▶ Démarrer l’entretien'}</button><span class="pill grey" id="oct">⏱ ${fmtTime(R.oral.elapsed || 0)} / ${key.oral.minutes} min</span></div></div>
      <div class="panel"><h2>Questions par palier</h2><p class="muted">Posez les questions à voix haute (ou touchez « Afficher » pour les montrer sur l'écran du candidat). Commencez bas, montez tant que le candidat répond bien.</p>
      ${Object.entries(key.oral.questions).map(([lv, qs]) => `<h3>${esc(lv)}</h3>${qs.map((q, i) => { const k = lv + '#' + i; return `<div class="row mb" style="flex-wrap:nowrap"><input type="checkbox" data-a="${esc(k)}" ${R.oral.asked[k] ? 'checked' : ''} style="width:22px;height:22px"><span class="grow">${esc(q)}</span><button class="btn sm" data-show="${esc(q)}">📺 Afficher</button></div>`; }).join('')}`).join('')}
      <button class="btn sm" id="hide">Masquer la question à l'écran du candidat</button></div></div>
      <div class="panel"><h2>Grille d'évaluation</h2>${Object.entries(g).map(([lv, d]) => `<div class="row mb" style="flex-wrap:nowrap;align-items:flex-start"><button class="lvl ${R.oral.level === lv ? 'on' : ''}" data-l="${esc(lv)}" style="min-width:72px">${esc(lv)}</button><span style="font-size:.9rem">${esc(d)}</span></div>`).join('')}
      <label class="f mt">Notes de l'entretien<textarea class="txt" id="on" style="min-height:140px" placeholder="Fluidité, prononciation, vocabulaire, exemples de phrases…">${esc(R.oral.note || '')}</textarea></label>
      <p class="muted">Les notes et le niveau sont enregistrés dans l'application, que le candidat soit dans la salle ou à distance.</p></div></div>`;
    const modebox = () => {
      $('#modebox', body).innerHTML = o.mode === 'distance'
        ? `<div class="info">🌐 <div><b>À distance :</b> envoyez un lien de visio au candidat. Dès que vous démarrez l'entretien, un bouton « Rejoindre » apparaît sur son écran. Vous évaluez ici pendant que vous l'écoutez.</div></div>
           <label class="f">Lien de visio<input class="txt" id="lk" value="${esc(o.link || '')}" placeholder="https://meet.jit.si/… ou lien Google Meet / Zoom"></label>
           <div class="row mt"><button class="btn sm" id="jt">Générer un lien Jitsi</button><a class="btn sm teal" target="_blank" rel="noopener" href="${waLink(S.identity?.tel, `Bonjour, c'est VLA. Pour votre entretien oral, rejoignez : ${o.link || '(lien à venir)'}`)}">💬 Envoyer sur WhatsApp</a><a class="btn sm" target="_blank" rel="noopener" href="${waLink(S.identity?.tel, 'Bonjour, c’est Valérie Language Academy. Je vous appelle en vidéo sur WhatsApp pour votre entretien oral.')}">📞 Appel vidéo WhatsApp</a></div>
           <p class="muted" style="font-size:.85rem">Astuce réseau : l'appel vidéo WhatsApp fonctionne bien sur les réseaux mobiles de Garoua. Si vous l'utilisez, démarrez l'entretien dans l'app pour afficher les questions au candidat.</p>`
        : '<div class="info">🏫 <div><b>En salle :</b> le candidat reste devant son écran verrouillé. Posez les questions à voix haute, ou affichez-les sur sa tablette. Tout est noté ici sur votre appareil, en direct.</div></div>';
      $('#jt', body)?.addEventListener('click', () => { o.link = 'https://meet.jit.si/VLA-' + id + '-' + Math.random().toString(36).slice(2, 7); saveOral({}); modebox(); });
      $('#lk', body)?.addEventListener('change', (e) => saveOral({ link: e.target.value.trim() }));
    };
    modebox();
    $$('[name=om]', body).forEach((r) => (r.onchange = async () => { await saveOral({ mode: r.value }); modebox(); }));
    let tm; const tick = () => { R.oral.elapsed = (R.oral.elapsed || 0) + 1; const e = $('#oct', body); if (e) e.textContent = `⏱ ${fmtTime(R.oral.elapsed)} / ${key.oral.minutes} min`; else clearInterval(tm); };
    if (o.live) tm = setInterval(tick, 1000); ctx.cleanup.push(() => clearInterval(tm));
    $('#live', body).onclick = async () => { await saveOral({ live: !o.live }); save(); tabOral(); };
    $$('[data-a]', body).forEach((c) => (c.onchange = () => { R.oral.asked[c.dataset.a] = c.checked; save(); }));
    $$('[data-show]', body).forEach((b) => (b.onclick = () => { saveOral({ currentQ: b.dataset.show }); toast('Affichée sur l’écran du candidat'); }));
    $('#hide', body).onclick = () => saveOral({ currentQ: '' });
    $$('[data-l]', body).forEach((b) => (b.onclick = () => { R.oral.level = b.dataset.l; $$('[data-l]', body).forEach((x) => x.classList.toggle('on', x === b)); save(); }));
    $('#on', body).oninput = (e) => { R.oral.note = e.target.value; save(); };
  }

  /* ---- 4. Résultat ---- */
  function tabResult() {
    const r = calc();
    if (r.global && !R.formations) { R.formations = (FORM_DEFAULT[S.testCode]?.[r.global] || []).map((i) => FORM[S.testCode][i]); }
    if (r.global && !R.priorities) R.priorities = r.priorities;
    const L = Object.entries({ 'Écoute': 'listening', 'Langue & lecture': 'language', 'Écriture': 'writing', 'Oral': 'oral' });
    const sc = key.scale;
    const pctOf = (lv) => (lv ? ((sc.indexOf(lv) + 1) / sc.length) * 100 : 0);
    body.innerHTML = `<div class="split"><div class="panel"><h2>Résultats par compétence</h2>
      ${L.map(([lab, k]) => `<div class="skill"><b>${lab}</b><div class="bar"><i style="width:${pctOf(r.levels[k])}%"></i></div><span class="pill done">${r.levels[k] || '—'}</span></div>`).join('')}
      ${r.pending ? `<div class="info" style="background:var(--err-soft)">⚠ ${r.pending} réponse(s) à valider (onglet 1).</div>` : ''}
      ${!r.complete ? '<div class="info">ℹ️ Choisissez les niveaux d\'<b>écriture</b> et d\'<b>oral</b> pour obtenir le niveau global.</div>' : ''}
      <h3 class="mt">Détail des paliers</h3><div class="muted" style="font-size:.9rem">${r.language.details.map((d) => `Palier ${d.palier} (${d.level}) : ${d.score}/${d.total}, A ${d.scoreA}/${d.totalA} ${d.validated ? '✔' : '✖'}`).join('<br>')}</div></div>
      <div><div class="glob"><span class="muted">Niveau global (CECR)</span><b>${r.global || '—'}</b>${r.global ? `<span>${esc(LEVEL_NAMES[r.global] || '')}</span>` : ''}</div>
      ${r.guardrail ? '<div class="info mt" style="background:var(--gold-soft)">🛡️ Garde-fou : oral inférieur de 2 niveaux ou plus → niveau global abaissé d\'un cran.</div>' : ''}
      ${r.estimate ? `<div class="info mt">🎯 Estimation : <b>${esc(r.estimate)}</b></div>` : ''}${r.admission ? `<div class="info mt" style="background:${r.admission.admitted ? 'var(--ok-soft)' : 'var(--err-soft)'}">${esc(r.admission.text)}</div>` : ''}</div></div>
      ${r.global ? `<div class="panel"><h2>Formation conseillée</h2><p class="muted">Proposition : <b>${esc(r.placement)}</b></p><div class="row">${FORM[S.testCode].map((f) => `<label class="checkline" style="padding:2px 10px 2px 0"><input type="checkbox" data-f="${esc(f)}" ${R.formations?.includes(f) ? 'checked' : ''}> ${esc(f)}</label>`).join('')}</div>
      <h3 class="mt">À travailler en priorité</h3><div class="row">${PRIORITIES.map((f) => `<label class="checkline" style="padding:2px 10px 2px 0"><input type="checkbox" data-p="${esc(f)}" ${R.priorities?.includes(f) ? 'checked' : ''}> ${f}</label>`).join('')}</div>
      <h3 class="mt">Décision du candidat</h3><div class="row" id="dec">${[['souhaitée', 'Inscription souhaitée'], ['réfléchit', 'Le candidat réfléchit'], ['non', 'Non']].map(([v, l]) => `<button class="lvl ${R.decision === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="row mt"><button class="btn primary" id="val" ${r.pending || !r.complete ? 'disabled' : ''}>✔ ${R.validatedAt ? 'Mettre à jour le résultat' : 'Valider le résultat'}</button>${R.validatedAt ? `<a class="btn gold" href="#/staff/attestation/${id}">🧾 Générer l'attestation (PDF)</a>` : ''}</div>
      ${R.attestationNo ? `<p class="muted">Attestation n° ${esc(R.attestationNo)}</p>` : ''}</div>` : ''}`;
    $$('[data-f]', body).forEach((c) => (c.onchange = () => { R.formations = $$('[data-f]:checked', body).map((x) => x.dataset.f); save(); }));
    $$('[data-p]', body).forEach((c) => (c.onchange = () => { R.priorities = $$('[data-p]:checked', body).map((x) => x.dataset.p); save(); }));
    $$('#dec [data-v]', body).forEach((b) => (b.onclick = () => { R.decision = b.dataset.v; $$('#dec [data-v]', body).forEach((x) => x.classList.toggle('on', x === b)); save(); }));
    $('#val', body)?.addEventListener('click', async () => {
      const now = calc();
      if (!R.attestationNo) R.attestationNo = await ctx.backend.nextAttestationNo(new Date().getFullYear());
      Object.assign(R, { id, sid: id, testCode: S.testCode, levels: now.levels, global: now.global, placement: now.placement, estimate: now.estimate, words: now.words, validatedAt: R.validatedAt || Date.now() });
      await ctx.backend.putResult(id, R);
      const all = await ctx.backend.listPeople();
      const tel = (S.identity?.tel || '').replace(/\D/g, '');
      const old = all.find((p) => p.sessionId === id || (tel && (p.tel || '').replace(/\D/g, '') === tel));
      await ctx.backend.putPerson({ ...(old || {}), id: old?.id || 'p' + id, sessionId: id, nom: S.identity?.nom || '', prenom: S.identity?.prenom || '', tel: S.identity?.tel || '', photo: S.identity?.photo || '', profession: S.identity?.profession || '', testCode: S.testCode, level: now.global, formation: (R.formations || []).join(' · ') || now.placement, testDate: R.validatedAt, attestationNo: R.attestationNo, decision: R.decision || old?.decision || '', status: old?.status === 'Inscrit' ? 'Inscrit' : 'Testé · prospect' });
      if (S.status !== 'delivered') await ctx.backend.patchSession(id, { status: 'corrected' });
      toast('Résultat validé ✔'); tabResult();
    });
  }

  // Mises à jour en direct pendant l'écrit
  const unsubA = ctx.backend.onAnswers(id, (a) => { const prev = JSON.stringify(answers); answers = Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.v])); if (JSON.stringify(answers) !== prev && tab === 'answers' && !document.activeElement?.closest?.('#body textarea,#body input')) tabAnswers(); sumUpdate(); });
  ctx.cleanup.push(unsubA);
  setTab(['finished', 'running', 'waiting'].includes(S.status) || !R.validatedAt ? 'answers' : 'result');
}

/* ================================ ATTESTATION ================================ */
export async function renderAttestation(view, ctx, id) {
  const S = await ctx.backend.getSession(id);
  const R = await ctx.backend.getResult(id);
  const key = S && (await KEYS.get(ctx.backend, S.testCode));
  if (!S || !R?.validatedAt || !key) return (view.innerHTML = '<div class="panel">Validez d\'abord le résultat. <a href="#/staff/correct/' + id + '">Retour à la correction</a></div>');
  const set = ctx.settings, sc = key.scale, lv = R.levels || {};
  const name = [S.identity?.prenom, S.identity?.nom].filter(Boolean).join(' ').toUpperCase();
  const rows = [['Écoute', 'listening'], ['Langue & lecture', 'language'], ['Écriture', 'writing'], ['Oral', 'oral']];
  const cb = (on) => `<span class="cb">${on ? '✓' : ''}</span>`;
  const att = `<div class="att" id="att">
    <div class="ah"><img class="logo" src="${IMG.logo}" alt=""><div style="flex:1;text-align:center"><div class="org">VALÉRIE LANGUAGE ACADEMY · GAROUA</div><h2>Attestation de résultat</h2><div>Test de placement — ${esc(TEST_NAMES[S.testCode])}</div></div>
      <div style="text-align:right;display:flex;gap:8px;align-items:center"><div>Réf. VLA-PT-${S.testCode}<br><b>N° ${esc(R.attestationNo)}</b></div>${S.identity?.photo ? `<img class="pho" src="${esc(S.identity.photo)}">` : ''}</div></div>
    <div class="cols" style="justify-content:space-between"><span>Nom et prénom : <b>${esc(name)}</b></span><span>Date du test : <b>${fmtDate(R.validatedAt)}</b></span><span>N° candidat : <b>${S.id}</b></span></div>
    <div>La Valérie Language Academy atteste que le/la candidat(e) ci-dessus a passé son test de placement d'anglais et a obtenu les niveaux suivants (Cadre européen commun de référence, CECR) :</div>
    <table><tr><th style="text-align:left">Compétence</th>${sc.map((l) => `<th>${esc(l)}<br><span style="font-weight:400;font-size:8px">${esc(LEVEL_NAMES[l] || '')}</span></th>`).join('')}</tr>
      ${rows.map(([lab, k]) => `<tr><td class="l">${lab}</td>${sc.map((l) => `<td class="${lv[k] === l ? 'mark' : ''}">${lv[k] === l ? '●' : ''}</td>`).join('')}</tr>`).join('')}</table>
    <div class="glo">NIVEAU GLOBAL ${sc.map((l) => `<span class="${R.global === l ? 'on' : ''}">${esc(l)}</span>`).join('')}${R.estimate ? `<span style="border:0;font-weight:600;font-size:9px">${esc(R.estimate)}</span>` : ''}</div>
    <div><b>À travailler en priorité :</b> <span class="cols" style="display:inline-flex">${['Compréhension orale', 'Prononciation', 'Grammaire', 'Vocabulaire', 'Écriture', 'Aisance à l’oral'].map((p) => `<span>${cb(R.priorities?.includes(p))}${p}</span>`).join('')}</span></div>
    <div><b>Formation conseillée :</b> <span class="cols" style="display:inline-flex">${(FORM[S.testCode] || []).map((f) => `<span>${cb(R.formations?.includes(f))}${esc(f)}</span>`).join('')}</span></div>
    <div class="cols" style="justify-content:space-between;align-items:flex-end"><span>${cb(R.decision === 'souhaitée')}Inscription souhaitée &nbsp; ${cb(R.decision === 'réfléchit')}Le candidat réfléchit &nbsp; Rentrée / 1re séance : ____ / ____ / ________</span><div class="sig">Signature et cachet du centre</div></div>
    <div class="foot"><span>Test de placement : il oriente vers le bon cours et ne remplace pas un examen officiel · Résultat valable 6 mois</span><span>${esc(set.address || 'Valérie Language Academy · Garoua')}${set.phones ? ' · ' + esc(set.phones) : ''}</span></div></div>`;
  view.innerHTML = `<div class="panel row sb"><div class="row"><a class="btn" href="#/staff/correct/${id}">‹ Retour</a><b>Attestation ${esc(R.attestationNo)} · ${esc(name)}</b></div>
    <div class="row"><button class="btn primary" id="pr">🖨 Imprimer / Enregistrer en PDF</button>
    <a class="btn teal" id="wa" target="_blank" rel="noopener" href="${waLink(S.identity?.tel, `Bonjour ${S.identity?.prenom || ''}, voici votre attestation de résultat VLA n° ${R.attestationNo} : niveau ${R.global}. Merci d'avoir passé votre test de placement chez Valérie Language Academy !`)}">💬 Envoyer par WhatsApp</a>
    <button class="btn gold" id="dl">✔ Marquer « Attestation remise »</button></div></div>
    <div class="info mb">ℹ️ Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » (format A5 paysage) pour obtenir le PDF à joindre dans WhatsApp. Signez et tamponnez la version imprimée.</div>
    <div style="overflow-x:auto">${att}</div>`;
  $('#pr', view).onclick = () => window.print();
  $('#dl', view).onclick = async () => { await ctx.backend.patchSession(id, { status: 'delivered', deliveredAt: Date.now() }); toast('Attestation marquée comme remise'); };
}
