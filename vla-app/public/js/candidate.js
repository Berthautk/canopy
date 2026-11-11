// Parcours du candidat : code → bienvenue → identité → récapitulatif → règlement → test → fin.
// Aucun corrigé n'est jamais chargé ici (uniquement test_public).
import { idb } from './idb.js';
import { esc, $, $$, fmtTime, uid, toast, resizePhoto, IMG, TEST_NAMES } from './ui.js';
import { countWords } from './scoring.js';

const PART_NAMES = { A: 'Écoute', B: 'Langue & lecture', C: 'Écriture' };
const PART_ICON = { A: '🎧', B: '📘', C: '✍️' };
const NOAUTO = 'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" translate="no"';

export async function runCandidate(root, backend, presetCode) {
  const C = {
    backend, root, st: null, test: null, session: null, screens: [], timer: null, dirty: new Set(),
    saveTimers: {}, audioEl: null, unsubSession: null, lastSync: 0, fs: 1,
  };
  window.addEventListener('online', () => flush(C));
  document.addEventListener('visibilitychange', () => { if (document.hidden) logExit(C, 'visibilité'); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && C.st?.stage === 'run') logExit(C, 'plein écran'); });
  ['copy', 'cut', 'paste', 'contextmenu'].forEach((ev) => document.addEventListener(ev, (e) => { if (C.st) e.preventDefault(); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && C.st && !['TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName) && !$('.cfoot [data-next][disabled]')) { $('.cfoot [data-next]')?.click(); }
  });
  setInterval(() => { flush(C); if (C.st) syncProgress(C); }, 10000);
  C.fs = Number(localStorage.getItem('vla-fs') || 1); document.documentElement.style.setProperty('--fs', C.fs);
  screenCode(C, presetCode);
}

/* ------------------------------ Cadre ------------------------------ */
function shell(C, inner, { clock = false, kid = false, foot = '', title = 'Test de placement VLA' } = {}) {
  const st = C.st;
  const showClock = clock && st;
  const left = showClock ? st.timeLeft[st.part] : 0;
  C.root.innerHTML = `
  <div class="cand ${kid ? 'kid' : ''}">
    <header class="chead">
      <img src="${IMG.logo}" alt="VLA">
      <div class="grow"><div class="t1">Valérie Language Academy (VLA)</div><div class="t2">${esc(title)}</div></div>
      ${showClock ? `<div class="clock ${left <= 60 ? 'warn' : ''}" id="clock">⏱ <span id="clockv">${fmtTime(left)}</span></div>
        <div class="pbar ${left <= 60 ? 'warn' : ''}" id="pbar" title="Progression"><i style="width:${progressPct(C)}%"></i></div>` : ''}
      <div class="fs"><button data-fs="-" aria-label="Réduire le texte">A−</button><button data-fs="+" aria-label="Agrandir le texte">A+</button></div>
    </header>
    ${navigator.onLine ? '' : '<div class="offline" id="off">Hors ligne — vos réponses sont enregistrées</div>'}
    <main class="cmain">${inner}</main>
    ${foot}
  </div>`;
  $$('[data-fs]', C.root).forEach((b) => (b.onclick = () => {
    C.fs = Math.min(1.5, Math.max(.85, C.fs + (b.dataset.fs === '+' ? .1 : -.1)));
    localStorage.setItem('vla-fs', C.fs); document.documentElement.style.setProperty('--fs', C.fs);
  }));
  const onOff = () => { const o = $('#off', C.root); if (!navigator.onLine && !o) $('.cand', C.root)?.insertAdjacentHTML('afterbegin', '<div class="offline" id="off">Hors ligne — vos réponses sont enregistrées</div>'); if (navigator.onLine) o?.remove(); };
  window.ononline = () => { onOff(); flush(C); }; window.onoffline = onOff;
}
const footer = (back, next, nextLabel = 'Suivant ›') => `<div class="cfoot">
  <button class="btn" data-back ${back ? '' : 'disabled'}>‹ Retour</button>
  <button class="btn primary" data-next ${next ? '' : 'disabled'}>${nextLabel}</button></div>`;

/* ------------------------------ Écrans d'entrée ------------------------------ */
function screenCode(C, preset = '') {
  C.root.innerHTML = '';
  shell(C, `<div class="ccard" style="max-width:560px;margin:24px auto;text-align:center">
    <img src="${IMG.logo}" width="120" alt="" style="border-radius:50%">
    <h1>Test de placement VLA</h1>
    <p>Veuillez saisir votre code d'accès à 6 chiffres pour commencer le test.</p>
    <div class="codeinput">${[0, 1, 2, 3, 4, 5].map((i) => `<input inputmode="numeric" maxlength="1" pattern="[0-9]" data-i="${i}" ${NOAUTO} aria-label="Chiffre ${i + 1}">`).join('')}</div>
    <div id="cerr" class="info hidden" style="background:var(--err-soft);border-color:#f3c1bb;color:var(--err)"></div>
    <button class="btn primary big" id="go">Commencer</button>
    <p class="muted" style="font-size:.85rem">🔒 Accès sécurisé au test. Le code vous est remis par votre formateur.</p>
  </div>`);
  const ins = $$('.codeinput input', C.root);
  const read = () => ins.map((i) => i.value).join('');
  ins.forEach((inp, i) => {
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (read().length === 6) go(); };
    inp.onkeydown = (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); };
  });
  if (preset && /^\d{6}$/.test(preset)) { preset.split('').forEach((d, i) => (ins[i].value = d)); }
  else ins[0].focus();
  $('#go', C.root).onclick = go;
  let busy = false;
  async function go() {
    const code = read();
    const err = $('#cerr', C.root);
    if (busy) return;
    if (code.length !== 6) { err.textContent = 'Le code comporte 6 chiffres.'; err.classList.remove('hidden'); return; }
    busy = true;
    try {
      await C.backend.candidateAuth();
      const s = await C.backend.getSession(code);
      if (!s) throw new Error('Code inconnu. Vérifiez auprès de votre formateur.');
      if (s.expiresAt && Date.now() > s.expiresAt) throw new Error('Ce code a expiré. Demandez-en un nouveau.');
      await openSession(C, s);
    } catch (e) {
      err.textContent = e.message || 'Connexion impossible.'; err.classList.remove('hidden'); busy = false;
    }
  }
}

async function openSession(C, s) {
  C.session = s;
  C.test = await C.backend.getTestPublic(s.testCode);
  if (!C.test) throw new Error('Test indisponible.');
  C.kid = s.testCode === 'ENF';
  const local = await idb.get('cand/' + s.id);
  if (local) C.st = local;
  else {
    const p = s.progress;
    const answers = {};
    if (p) { const a = await C.backend.getAnswers(s.id); Object.entries(a).forEach(([k, v]) => (answers[k] = v.v)); }
    C.st = p ? { ...p, answers } : {
      id: s.id, testCode: s.testCode, stage: 'welcome', identity: {}, accepted: false, part: 'A', pal: 0, i: 0,
      timeLeft: { A: C.test.timing.listening * 60, B: C.test.timing.paliers * 60, C: C.test.timing.writing * 60 }, answers: {}, played: {}, exits: [], palStop: false,
    };
  }
  if (s.status === 'created') await C.backend.patchSession(s.id, { status: 'waiting' }).catch(() => {});
  saveLocal(C);
  route(C);
}

const saveLocal = (C) => idb.set('cand/' + C.st.id, C.st);

function route(C) {
  const st = C.st;
  clearInterval(C.timer);
  if (st.stage === 'welcome') return screenWelcome(C);
  if (st.stage === 'identity') return screenIdentity(C);
  if (st.stage === 'recap') return screenRecap(C);
  if (st.stage === 'rules') return screenRules(C);
  if (st.stage === 'preload') return screenPreload(C);
  if (st.stage === 'run') return screenRun(C);
  return screenDone(C);
}
const goStage = (C, stage) => { C.st.stage = stage; saveLocal(C); syncProgress(C, true); route(C); };

function screenWelcome(C) {
  const photo = C.kid ? 'assets/people/enfant1.jpg' : 'assets/people/formatrice.jpg';
  shell(C, `<div class="ccard hero">
    <div><h1>Bienvenue à<br>Valérie Language Academy</h1>
    <p class="qbig">Test de placement d'anglais</p>
    <ul><li>Ce test sert à trouver le <b>bon cours</b> pour vous.</li><li>Il est <b>normal de ne pas tout réussir</b>.</li><li>Faites de votre mieux !</li></ul></div>
    <img class="ph" src="${photo}" alt="">
  </div>`, { kid: C.kid, foot: footer(false, true, 'Suivant ›') });
  $('[data-next]', C.root).onclick = () => goStage(C, 'identity');
}

function screenIdentity(C) {
  const id = C.st.identity;
  const kid = C.kid;
  const fields = kid ? [
    ['prenom', 'Prénom', 1], ['nom', 'Nom', 1], ['age', 'Âge', 0, 'number'], ['classe', 'Classe', 0],
    ['parent', 'Nom du parent', 0], ['tel', 'Téléphone du parent (WhatsApp)', 1, 'tel'],
  ] : [
    ['nom', 'Nom', 1], ['prenom', 'Prénom', 1], ['age', 'Âge', 0, 'number'], ['tel', 'Téléphone / WhatsApp', 1, 'tel'],
    ['profession', 'Profession ou classe', 0], ['objectif', 'Objectif', 0, 'select'],
  ];
  const field = ([k, label, req, type]) => type === 'select'
    ? `<label class="f">${label}<select class="txt" data-k="${k}"><option value="">— Choisir —</option>${['Travail', 'Études', 'Voyage', 'Examen (IELTS / TOEFL)', 'Immigration', 'Plaisir / culture générale'].map((o) => `<option ${id[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`
    : `<label class="f ${req ? 'req' : ''}">${label}<input class="txt" data-k="${k}" type="${type || 'text'}" ${type === 'tel' ? 'inputmode="tel"' : ''} value="${esc(id[k] || '')}" ${NOAUTO}></label>`;
  shell(C, `<div class="ccard"><h2>Vos informations ${kid ? '(enfant)' : '(candidat)'}</h2>
    <div class="photo-pick mb"><img class="avatar" id="pv" src="${id.photo || (kid ? 'assets/people/enfant2.jpg' : 'assets/people/candidat1.jpg')}" alt="Photo">
      <div><b>Photo de profil</b> <span class="muted">(facultatif)</span><br>
      <input type="file" id="pf" accept="image/*" capture="user" class="hidden">
      <button class="btn sm" id="pb" type="button">📷 Prendre / choisir une photo</button></div></div>
    <div class="grid2">${fields.map(field).join('')}</div>
    <div class="mt"><b>${kid ? 'As-tu déjà étudié l’anglais ?' : 'Avez-vous déjà étudié l’anglais ?'}</b>
      <div class="row mt"><label class="checkline" style="padding:0"><input type="radio" name="etude" value="oui" ${id.etude === 'oui' ? 'checked' : ''}> Oui</label>
      <label class="checkline" style="padding:0"><input type="radio" name="etude" value="non" ${id.etude === 'non' ? 'checked' : ''}> Non</label>
      <input class="txt grow" data-k="duree" placeholder="Depuis combien de temps ? (ex. 3 ans)" value="${esc(id.duree || '')}" ${NOAUTO}></div></div>
    <p id="ierr" class="muted"></p></div>`, { kid, foot: footer(true, true) });
  const collect = () => {
    $$('[data-k]', C.root).forEach((e) => (id[e.dataset.k] = e.value.trim()));
    id.etude = $('input[name=etude]:checked', C.root)?.value || '';
  };
  $('#pb', C.root).onclick = () => $('#pf', C.root).click();
  $('#pf', C.root).onchange = async (e) => { if (e.target.files[0]) { id.photo = await resizePhoto(e.target.files[0]); $('#pv', C.root).src = id.photo; } };
  $('[data-back]', C.root).onclick = () => { collect(); goStage(C, 'welcome'); };
  $('[data-next]', C.root).onclick = () => {
    collect();
    const missing = (kid ? ['prenom', 'nom', 'tel'] : ['nom', 'prenom', 'tel']).filter((k) => !id[k]);
    if (missing.length) { $('#ierr', C.root).innerHTML = '<span style="color:var(--err)">Veuillez remplir : nom, prénom et téléphone.</span>'; return; }
    C.backend.patchSession(C.st.id, { identity: id }).catch(() => {});
    goStage(C, 'recap');
  };
}

function screenRecap(C) {
  const t = C.test, tm = t.timing;
  const total = tm.listening + tm.paliers + tm.writing + tm.oral;
  shell(C, `<div class="ccard"><h2>Récapitulatif du test</h2>
    <p class="qbig">Test ${esc(TEST_NAMES[t.code])}</p>
    <div class="chips mb"><span class="chip">⏱ Durée totale : ${total} minutes</span><span class="chip">${t.paliers.length} paliers</span></div>
    <h3>Le test comporte 4 parties</h3>
    <div class="grid2">${[['🎧', 'Écoute', tm.listening], ['📘', 'Langue & lecture', tm.paliers], ['✍️', 'Écriture', tm.writing], ['🗣️', 'Oral (entretien)', tm.oral]]
      .map(([i, n, m]) => `<div class="chip" style="display:flex;gap:10px;align-items:center"><span style="font-size:1.8rem">${i}</span><div>${n}<br><span class="muted">${m} minutes</span></div></div>`).join('')}</div>
    <div class="info mt">ℹ️ L'objectif est de mesurer votre niveau d'anglais dans les 4 compétences afin de vous proposer la formation la mieux adaptée.</div></div>`,
    { kid: C.kid, foot: footer(true, true) });
  $('[data-back]', C.root).onclick = () => goStage(C, 'identity');
  $('[data-next]', C.root).onclick = () => goStage(C, 'rules');
}

function screenRules(C) {
  const rules = [['🚫', 'Pas d’aide extérieure', 'Vous devez répondre seul(e) à toutes les questions.'], ['📖', 'Pas de dictionnaire', 'Ni traducteur, ni téléphone, ni notes.'], ['🎲', 'Ne pas répondre au hasard', 'Si vous ne savez pas, passez ou laissez vide.'],
    ['🎧', 'Écoute une seule fois', 'Chaque enregistrement contient déjà deux lectures. Il ne peut pas être rejoué.'], ['⚠️', 'Ne quittez pas l’application', 'Toute sortie est signalée à votre formateur.']];
  shell(C, `<div class="ccard"><h2>Règlement du test</h2>
    <ul class="rules" style="list-style:none;padding:0">${rules.map(([i, a, b]) => `<li style="display:flex;gap:12px"><span style="font-size:1.6rem">${i}</span><div><b>${a}</b><br><span class="muted">${b}</span></div></li>`).join('')}</ul>
    <label class="checkline"><input type="checkbox" id="acc" ${C.st.accepted ? 'checked' : ''}> <b>J'ai lu et j'accepte le règlement du test.</b></label></div>`,
    { kid: C.kid, foot: footer(true, C.st.accepted, '▶ Commencer') });
  const nx = $('[data-next]', C.root);
  $('#acc', C.root).onchange = (e) => { C.st.accepted = e.target.checked; nx.disabled = !e.target.checked; saveLocal(C); };
  $('[data-back]', C.root).onclick = () => goStage(C, 'recap');
  nx.onclick = async () => {
    try { await document.documentElement.requestFullscreen?.(); } catch { /* iOS : pas de plein écran, on continue */ }
    goStage(C, 'preload');
  };
}

/* ------------------------------ Pré-chargement audio ------------------------------ */
async function screenPreload(C) {
  const urls = C.test.listening.map((e) => e.audio);
  shell(C, `<div class="ccard" style="text-align:center"><h2>Préparation du test…</h2>
    <p>Chargement des enregistrements audio pour éviter les coupures.</p>
    <div class="mini" style="height:16px"><i id="pl" style="width:0"></i></div><p id="pm" class="muted"></p>
    <button class="btn primary hidden" id="retry">Réessayer</button></div>`, { kid: C.kid });
  let ok = 0;
  const run = async () => {
    $('#retry', C.root).classList.add('hidden'); ok = 0;
    for (const u of urls) {
      try {
        if (!(await idb.get('audio/' + u))) {
          const r = await fetch(u); if (!r.ok) throw new Error(r.status);
          await idb.set('audio/' + u, await r.blob());
        }
        ok++; $('#pl', C.root).style.width = (ok / urls.length) * 100 + '%'; $('#pm', C.root).textContent = `${ok} / ${urls.length}`;
      } catch { $('#pm', C.root).textContent = 'Connexion nécessaire pour charger les audios.'; $('#retry', C.root).classList.remove('hidden'); return; }
    }
    // L'audio est en cache : on peut démarrer (même sans internet ensuite).
    C.st.started = C.st.started || Date.now();
    C.backend.patchSession(C.st.id, { status: 'running', startedAt: C.st.started }).catch(() => {});
    goStage(C, 'run');
  };
  $('#retry', C.root).onclick = run; run();
}

/* ------------------------------ Déroulement ------------------------------ */
function buildScreens(C) {
  const t = C.test, st = C.st;
  const A = t.listening.map((ex) => ({ kind: 'listen', ex }));
  const B = t.paliers.map((p) => [...p.items.map((q) => ({ kind: 'item', p, q })), { kind: 'reading', p }, { kind: 'palEnd', p }]);
  return { A, B };
}
const totalScreens = (C) => { const { A, B } = buildScreens(C); return A.length + B.reduce((n, p) => n + p.length - 1, 0) + 1; };
function progressPct(C) {
  const st = C.st; if (!st || st.stage !== 'run') return 0;
  const { A, B } = buildScreens(C);
  let done = 0;
  if (st.part === 'A') done = st.i;
  else if (st.part === 'B') done = A.length + B.slice(0, st.pal).reduce((n, p) => n + p.length - 1, 0) + st.i;
  else done = totalScreens(C) - 1;
  return Math.round((done / totalScreens(C)) * 100);
}
function qIndex(C) {
  const st = C.st, { A, B } = buildScreens(C);
  return st.part === 'A' ? st.i + 1 : st.part === 'B' ? A.length + B.slice(0, st.pal).reduce((n, p) => n + p.length - 1, 0) + st.i + 1 : totalScreens(C);
}

function screenRun(C) {
  const st = C.st;
  if (st.part === 'done') return goStage(C, 'done');
  startTimer(C);
  const { A, B } = buildScreens(C);
  const cur = st.part === 'A' ? A[st.i] : st.part === 'B' ? B[st.pal][st.i] : { kind: 'write' };
  if (!cur) { st.i = 0; return screenRun(C); }
  const render = { listen: viewListen, item: viewItem, reading: viewReading, palEnd: viewPalEnd, write: viewWrite }[cur.kind];
  render(C, cur);
}

function startTimer(C) {
  clearInterval(C.timer);
  let n = 0;
  C.timer = setInterval(() => {
    const st = C.st; if (!st || st.stage !== 'run') return;
    st.timeLeft[st.part] = Math.max(0, st.timeLeft[st.part] - 1);
    const left = st.timeLeft[st.part];
    const clk = $('#clock', C.root);
    if (clk) { $('#clockv', C.root).textContent = fmtTime(left); clk.classList.toggle('warn', left <= 60); $('#pbar', C.root)?.classList.toggle('warn', left <= 60); }
    if (left === 60) toast('Il reste 1 minute !', 4000);
    if (++n % 5 === 0) saveLocal(C);
    if (left <= 0) { toast('Temps écoulé : partie suivante'); stopAudio(C); advancePart(C); }
  }, 1000);
}

function advancePart(C) {
  const st = C.st;
  if (st.part === 'A') { st.part = 'B'; st.pal = 0; st.i = 0; }
  else if (st.part === 'B') { st.part = 'C'; st.i = 0; }
  else { return finish(C); }
  saveLocal(C); syncProgress(C, true); screenRun(C);
}

async function finish(C) {
  clearInterval(C.timer); stopAudio(C);
  C.st.part = 'done'; C.st.stage = 'done'; C.st.finishedAt = Date.now();
  saveLocal(C);
  await flush(C);
  await C.backend.patchSession(C.st.id, { status: 'finished', finishedAt: C.st.finishedAt, progress: pub(C), pct: 100, part: 'done' }).catch(() => {});
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  route(C);
}

const pub = (C) => { const { answers, ...rest } = C.st; return rest; };
function syncProgress(C, force) {
  const st = C.st; if (!st || !C.session) return;
  if (!force && Date.now() - C.lastSync < 9000) return;
  C.lastSync = Date.now();
  const patch = { progress: pub(C), identity: st.identity, part: st.part, qIndex: st.stage === 'run' ? qIndex(C) : 0, total: totalScreens(C), pct: st.stage === 'run' ? progressPct(C) : 0, timeLeft: st.timeLeft, exits: st.exits, lastSeen: Date.now() };
  C.backend.patchSession(st.id, patch).catch(() => {});
}

function logExit(C, type) {
  const st = C.st; if (!st || st.stage !== 'run') return;
  st.exits.push({ t: Date.now(), type }); saveLocal(C); syncProgress(C, true);
  toast('⚠️ Sortie de l’application signalée au formateur', 3500);
}

/* ------------------------------ Réponses ------------------------------ */
function setAnswer(C, id, v, immediate) {
  C.st.answers[id] = v; saveLocal(C); C.dirty.add(id);
  clearTimeout(C.saveTimers[id]);
  C.saveTimers[id] = setTimeout(() => flush(C), immediate ? 0 : 1000);
}
async function flush(C) {
  if (!C.st) return;
  for (const id of [...C.dirty]) {
    try { await C.backend.putAnswer(C.st.id, id, C.st.answers[id] ?? ''); C.dirty.delete(id); } catch { break; }
  }
}
const val = (C, id) => C.st.answers[id] ?? '';

function stepNav(C, { back, next, nextLabel }) {
  const b = $('[data-back]', C.root), n = $('[data-next]', C.root);
  if (b) b.onclick = back || (() => {});
  if (n) n.onclick = next;
  window.scrollTo(0, 0);
}

/* ---- A : écoute ---- */
async function viewListen(C, { ex }) {
  const st = C.st, { A } = buildScreens(C);
  const played = st.played[ex.id];
  const i = st.i;
  shell(C, `<div class="partbar"><div class="ico">🎧</div><h2>Partie A : Écoute</h2><span class="tag">Extrait ${i + 1} / ${A.length}</span></div>
    <div class="ccard">
    ${C.kid ? '<div class="cheer">🎧 Écoute bien, puis réponds !</div>' : ''}
    <div class="info">ℹ️ <div>Écoutez attentivement l'enregistrement, puis répondez aux questions en anglais par des réponses courtes (mots ou expressions). <b>${esc(ex.title)}</b></div></div>
    <button class="playbtn ${played === 'started' ? 'playing' : ''}" id="play" ${played ? 'disabled' : ''}>
      <span id="pi">${played === 'done' || (played && played !== 'started') ? '✔' : '▶'}</span>
      <span id="pt">${played ? (played === 'started' ? 'Écoute en cours…' : 'Écoute terminée') : 'Écouter (une seule fois)'}</span>
      <span class="wave"><i></i><i></i><i></i><i></i></span></button>
    <h3 class="mt">Questions <span class="muted">(réponses courtes)</span></h3>
    ${ex.questions.map((q) => `<div class="qline"><span class="qnum">${q.n}</span><span class="qprompt">${esc(q.prompt)}</span>
      <span class="ans"><input class="txt" data-q="L${q.n}" value="${esc(val(C, 'L' + q.n))}" placeholder="Votre réponse…" ${NOAUTO}></span></div>`).join('')}
    </div>`, { clock: true, kid: C.kid, foot: footer(i > 0, true, i === A.length - 1 ? 'Partie suivante ›' : 'Suivant ›') });
  $$('[data-q]', C.root).forEach((e) => (e.oninput = () => setAnswer(C, e.dataset.q, e.value)));
  const btn = $('#play', C.root);
  // Une interruption en cours d'écoute compte comme écoute faite (l'audio n'est jamais rejoué).
  if (played === 'started') { st.played[ex.id] = 'done'; saveLocal(C); $('#pt', C.root).textContent = 'Écoute terminée'; $('#play', C.root).classList.remove('playing'); }
  btn.onclick = async () => {
    if (st.played[ex.id]) return;
    const blob = await idb.get('audio/' + ex.audio);
    if (!blob) { toast('Audio indisponible : prévenez le formateur'); return; }
    st.played[ex.id] = 'started'; saveLocal(C); syncProgress(C, true);
    btn.disabled = true; btn.classList.add('playing'); $('#pt', C.root).textContent = 'Écoute en cours…'; $('#pi', C.root).textContent = '🔊';
    const a = new Audio(URL.createObjectURL(blob)); C.audioEl = a; a.controls = false;
    const end = () => { st.played[ex.id] = 'done'; saveLocal(C); const b = $('#play', C.root); if (b) { b.classList.remove('playing'); $('#pt', C.root).textContent = 'Écoute terminée'; $('#pi', C.root).textContent = '✔'; } };
    a.onended = end; a.onerror = () => { toast('Erreur audio : prévenez le formateur'); end(); };
    a.play().catch(() => { toast('Touchez de nouveau pour lancer l’audio'); st.played[ex.id] = undefined; btn.disabled = false; btn.classList.remove('playing'); });
  };
  stepNav(C, {
    back: () => { st.i--; saveLocal(C); screenRun(C); },
    next: () => { if (st.i === A.length - 1) { stopAudio(C); advancePart(C); } else { st.i++; saveLocal(C); syncProgress(C); screenRun(C); } },
  });
}
function stopAudio(C) { try { C.audioEl?.pause(); } catch { /* */ } C.audioEl = null; }

/* ---- B : paliers ---- */
const palierHead = (C, p, label) => `<div class="partbar"><div class="ico">📘</div><h2>Partie B : Langue &amp; lecture</h2><span class="tag">Palier ${p.palier} · ${label}</span></div>`;

function palierNav(C, screens) {
  const st = C.st;
  const next = () => { st.i++; saveLocal(C); syncProgress(C); screenRun(C); };
  stepNav(C, { back: st.i > 0 ? () => { st.i--; saveLocal(C); screenRun(C); } : null, next });
}

function viewItem(C, { p, q }) {
  const st = C.st, n = p.items.indexOf(q) + 1, k = 'P' + q.n;
  let body;
  if (q.type === 'gap') {
    const parts = q.prompt.split('___');
    body = `<div class="sentence">${esc(parts[0])}<input class="txt inline" data-q="${k}" value="${esc(val(C, k))}" ${NOAUTO} aria-label="Réponse">${esc(parts.slice(1).join('___'))}</div>
      <div class="info mt">💡 Complétez la phrase avec le mot ou l'expression qui convient en anglais.</div>`;
  } else {
    const parts = q.prompt.split('___');
    body = `<div class="qbig">${parts.length > 1 ? esc(parts[0]) + '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>' + esc(parts.slice(1).join('___')) : esc(q.prompt)}</div>
      ${q.options.map((o, i) => `<button class="opt ${String(val(C, k)) === String(i) ? 'sel' : ''}" data-opt="${i}"><b>${'ABCD'[i]}</b>${esc(o)}</button>`).join('')}
      <div class="info mt">ℹ️ Sélectionnez la bonne réponse, puis cliquez sur Suivant.</div>`;
  }
  shell(C, `${palierHead(C, p, 'Question ' + n + ' / ' + (p.items.length + p.reading.questions.length))}
    <div class="ccard">${C.kid ? '<div class="cheer">⭐ Bravo, continue !</div>' : ''}<span class="qbadge">Question ${q.n}</span>${body}</div>`,
    { clock: true, kid: C.kid, foot: footer(st.i > 0, true) });
  $$('[data-q]', C.root).forEach((e) => (e.oninput = () => setAnswer(C, e.dataset.q, e.value)));
  $$('[data-opt]', C.root).forEach((b) => (b.onclick = () => { setAnswer(C, k, b.dataset.opt, true); $$('[data-opt]', C.root).forEach((x) => x.classList.toggle('sel', x === b)); }));
  palierNav(C);
  $('input.txt', C.root)?.focus();
}

function viewReading(C, { p }) {
  const st = C.st, r = p.reading;
  shell(C, `${palierHead(C, p, 'Lecture')}
    <div class="ccard"><div class="info">📖 ${esc(r.instruction)}</div>
    <button class="btn sm rtoggle mb" id="rt">📄 Afficher / masquer le texte</button>
    <div class="reading"><div class="rtext" id="rtext">${esc(r.text).replace(/\n/g, '<br>')}</div>
    <div>${r.questions.map((q) => {
      const k = 'P' + q.n;
      let a;
      if (q.type === 'open') a = `<input class="txt" data-q="${k}" value="${esc(val(C, k))}" placeholder="Votre réponse…" ${NOAUTO}>`;
      else if (q.type === 'mcq') a = q.options.map((o, i) => `<button class="opt" data-k="${k}" data-v="${i}" style="min-height:48px"><b>${'ABCD'[i]}</b>${esc(o)}</button>`).join('');
      else a = `<div class="row">${q.options.map((o) => `<button class="opt" data-k="${k}" data-v="${esc(o)}" style="flex:1;min-width:110px;justify-content:center;min-height:52px">${esc(o)}</button>`).join('')}</div>`;
      return `<div class="mb"><div class="qprompt"><span class="qnum" style="display:inline-grid;margin-right:8px">${q.n}</span>${esc(q.prompt)}</div>${a}</div>`;
    }).join('')}</div></div></div>`, { clock: true, kid: C.kid, foot: footer(true, true, 'Terminer le palier ›') });
  $$('[data-q]', C.root).forEach((e) => (e.oninput = () => setAnswer(C, e.dataset.q, e.value)));
  const paint = () => $$('[data-k]', C.root).forEach((b) => b.classList.toggle('sel', String(val(C, b.dataset.k)) === b.dataset.v));
  $$('[data-k]', C.root).forEach((b) => (b.onclick = () => { setAnswer(C, b.dataset.k, b.dataset.v, true); paint(); })); paint();
  $('#rt', C.root).onclick = () => $('#rtext', C.root).classList.toggle('collapsed');
  if (window.innerWidth < 860) $('#rtext', C.root).classList.remove('collapsed');
  palierNav(C);
}

function viewPalEnd(C, { p }) {
  const st = C.st, last = st.pal === C.test.paliers.length - 1;
  shell(C, `<div class="ccard" style="text-align:center;max-width:620px;margin:20px auto">
    <div style="font-size:3.5rem">🏁</div><h1>Palier ${p.palier} terminé</h1>
    <p>${last ? 'Vous avez terminé tous les paliers.' : 'Voulez-vous continuer au palier suivant ? Les questions deviennent un peu plus difficiles.'}</p>
    ${last ? '' : '<button class="btn primary big" id="cont">Continuer au palier suivant ›</button>'}
    <button class="btn ${last ? 'primary' : ''} big mt" id="stop">${last ? 'Passer à l’écriture ›' : 'Je préfère m’arrêter ici'}</button>
    ${last ? '' : '<p class="muted mt" style="font-size:.9rem">Si vous vous arrêtez ici, vous passez directement à la partie écriture.</p>'}
  </div>`, { clock: true, kid: C.kid, foot: footer(true, false, ' ') });
  stepNav(C, { back: () => { st.i--; saveLocal(C); screenRun(C); }, next: () => {} });
  $('#cont', C.root)?.addEventListener('click', () => { st.pal++; st.i = 0; saveLocal(C); syncProgress(C, true); screenRun(C); });
  $('#stop', C.root).onclick = () => { st.palStop = true; advancePart(C); };
}

/* ---- C : écriture ---- */
function viewWrite(C) {
  const st = C.st, w = C.test.writing;
  const lines = w.prompt.map((l, i) => (i === 0 ? `<p class="qbig">${esc(l)}</p>` : `<p>${esc(l)}</p>`)).join('');
  shell(C, `<div class="partbar"><div class="ico">✍️</div><h2>Partie C : Écriture</h2><span class="tag">${C.test.timing.writing} minutes</span></div>
    <div class="ccard">${lines}
    <textarea class="txt" id="w" placeholder="Tapez votre texte ici…" ${NOAUTO} data-gramm="false">${esc(val(C, 'W'))}</textarea>
    <div class="wc" id="wc"></div></div>`, { clock: true, kid: C.kid, foot: footer(false, true, 'Terminer l’écrit ›') });
  const ta = $('#w', C.root);
  const upd = () => {
    const n = countWords(ta.value);
    $('#wc', C.root).innerHTML = `<span class="${n >= w.minWords && (!w.maxWords || n <= w.maxWords) ? 'good' : n > w.maxWords ? 'bad' : ''}">Nombre de mots : ${n}${w.maxWords ? ' / ' + w.maxWords : ''}</span>${w.minWords ? `<span class="${n < w.minWords ? 'bad' : 'good'}">Min. ${w.minWords} mots</span>` : ''}<span>Max. ${w.maxWords} mots</span>`;
  };
  ta.oninput = () => { setAnswer(C, 'W', ta.value); upd(); }; upd();
  stepNav(C, { next: () => { if (confirm('Terminer l’écrit ? Vous ne pourrez plus modifier vos réponses.')) finish(C); } });
}

/* ---- Fin ---- */
function screenDone(C) {
  const st = C.st;
  const s = C.session;
  shell(C, `<div class="ccard hero"><div>
    <div style="font-size:3rem">✅</div><h1>Partie C : Écriture terminée !</h1>
    <p class="qbig">Merci ! Votre formateur va maintenant passer l'entretien oral avec vous.</p>
    <p><b>Ne fermez pas cette page.</b></p>
    <div id="oralbox"></div>
    <div class="info mt">ℹ️ Préparez-vous : vérifiez votre connexion et trouvez un endroit calme. Vos réponses sont enregistrées — l'écran est maintenant verrouillé.</div></div>
    <img class="ph" src="assets/people/${C.kid ? 'enfant2' : 'candidat4'}.jpg" alt=""></div>`, { kid: C.kid, title: 'Test de placement VLA · Écrit terminé' });
  C.unsubSession?.();
  C.unsubSession = C.backend.onSession(st.id, (sess) => {
    const o = sess?.oral || {}; const box = $('#oralbox', C.root); if (!box) return;
    const parts = [];
    if (o.currentQ) parts.push(`<div class="panel" style="background:var(--teal-soft)"><span class="qbadge">Question de l'entretien</span><div class="qbig" style="font-size:1.6rem">${esc(o.currentQ)}</div></div>`);
    if (o.mode === 'distance' && o.live && o.link) parts.push(`<a class="btn teal big" href="${esc(o.link)}" target="_blank" rel="noopener">🎥 Rejoindre l'entretien (visio)</a>`);
    else if (o.mode === 'distance') parts.push('<div class="info">📞 L’entretien se fera à distance. Restez sur cette page : un bouton « Rejoindre » apparaîtra ici.</div>');
    else if (o.live) parts.push('<div class="info" style="background:var(--ok-soft)">🗣️ Entretien en cours avec votre formateur.</div>');
    box.innerHTML = parts.join('');
  });
}
