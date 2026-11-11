// Parcours du candidat : code → bienvenue → identité → récapitulatif → règlement → test → fin.
// Aucun corrigé n'est jamais chargé ici (uniquement test_public).
import { idb } from './idb.js';
import { esc, $, $$, fmtTime, uid, toast, resizePhoto, IMG, TEST_NAMES } from './ui.js';
import { countWords } from './scoring.js';
import { validateIdentity, fullName, civ } from './identity.js';

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
function progLabel(C) {
  const st = C.st;
  if (!st || st.stage !== 'run') return '';
  const { A } = buildScreens(C);
  if (st.part === 'A') return `Écoute · Extrait ${st.i + 1} / ${A.length}`;
  if (st.part === 'B') { const p = C.test.paliers[st.pal]; const tot = p.items.length + p.reading.questions.length; const n = Math.min(st.i + 1, p.items.length + 1); return `Palier ${p.palier} · Question ${Math.min(n, tot)} / ${tot}`; }
  return 'Écriture';
}
function shell(C, inner, { clock = false, kid = false, foot = '', title, stepper = 0 } = {}) {
  const st = C.st;
  const showClock = clock && st;
  const left = showClock ? st.timeLeft[st.part] : 0;
  const t2 = title || (kid ? 'Test de niveau – Mode Enfant (8–13 ans)' : 'Test de placement VLA');
  const steps = ['Partie A|Écoute', 'Partie B|Langue & lecture', 'Partie C|Écriture', 'Entretien|oral'];
  C.root.innerHTML = `
  <div class="cand ${kid ? 'kid' : ''}">
    <header class="chead">
      <img class="logo" src="${IMG.logo}" alt="VLA">
      <div class="vsep"></div>
      <div><div class="t1">Valérie Language Academy (VLA)</div><div class="t2">${esc(t2)}</div></div>
      <div class="grow"></div>
      ${stepper ? `<div class="stepper">${steps.map((s2, i) => { const [a, b] = s2.split('|'); return `<div class="s ${i === 3 ? 'cur' : ''}"><i>${i === 3 ? '4' : '✓'}</i>${a}<br>${b}</div>`; }).join('')}</div>` : ''}
      ${showClock ? `<div class="clock ${left <= 60 ? 'warn' : ''}" id="clock">⏱ <span id="clockv">${fmtTime(left)}</span></div><div class="vsep"></div>
        <div class="prog"><small>${kid ? 'Ma progression' : esc(progLabel(C))}</small><div class="row" style="gap:8px;flex-wrap:nowrap"><div class="pbar ${left <= 60 ? 'warn' : ''}" id="pbar"><i style="width:${progressPct(C)}%"></i></div><span class="pct" id="pct">${progressPct(C)} %</span></div></div>` : ''}
      ${kid && showClock ? `<span class="chip" style="color:var(--navy)">${esc(progLabel(C))}</span><span style="font-size:2.2rem">⭐</span>` : ''}
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
const footer = (back, next, nextLabel = 'Suivant  ❯') => `<div class="cfoot">
  <button class="btn" data-back ${back ? '' : 'disabled'}>❮ Retour</button>
  <button class="btn primary" data-next ${next ? '' : 'disabled'}>${nextLabel}</button></div>`;

/* ------------------------------ Écrans d'entrée ------------------------------ */
function screenCode(C, preset = '') {
  C.root.innerHTML = '';
  shell(C, `<div class="ccard" style="max-width:600px;margin:18px auto;text-align:center">
    <div class="partbar" style="justify-content:center"><h2>Test de placement VLA</h2></div>
    <p class="qbig" style="font-weight:600">Veuillez saisir votre code d'accès à 6 chiffres pour commencer le test.</p>
    <div class="codeinput">${[0, 1, 2, 3, 4, 5].map((i) => `<input inputmode="numeric" maxlength="1" pattern="[0-9]" data-i="${i}" ${NOAUTO} aria-label="Chiffre ${i + 1}">`).join('')}</div>
    <div id="cerr" class="info hidden" style="background:var(--err-soft);border-color:#f3c1bb;color:var(--err)"></div>
    <button class="btn gold big" id="go">▶ &nbsp;Commencer</button>
    <p class="muted mt" style="font-size:.9rem">🔒 Accès sécurisé au test. Le code vous est remis par votre formateur.</p>
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
  shell(C, `<div class="ccard hero" style="background:linear-gradient(120deg,#fff 40%,#E8F1FC)">
    <div><div class="herotitle">Bienvenue à<b>Valérie Language Academy</b></div>
    <div class="rule2">Test de placement d’anglais</div>
    <p class="qbig" style="text-align:center;font-weight:500;line-height:1.5">Ce test sert à trouver le bon cours pour vous.<br>Il est normal de ne pas tout réussir.<br><i style="font-weight:700">Faites de votre mieux !</i></p></div>
    <img class="ph" src="${photo}" alt="">
  </div>`, { kid: C.kid, foot: footer(false, true, '▶  Accéder au test  ❯') });
  $('[data-next]', C.root).onclick = () => goStage(C, 'identity');
}

const IDF = (id, k, label, { type = 'text', req = false, ph = '', extra = '' } = {}) => `<label class="f ${req ? 'req' : ''}">${label}<input class="txt" data-k="${k}" type="${type}" value="${esc(id[k] || '')}" placeholder="${esc(ph)}" ${type === 'tel' ? 'inputmode="tel"' : ''} ${extra} ${NOAUTO}><span class="ferr" data-e="${k}"></span></label>`;

function screenIdentity(C) {
  const id = C.st.identity;
  const kid = C.kid;
  const today = new Date().toISOString().slice(0, 10);
  shell(C, `<div class="ccard"><div class="partbar"><div class="ico">👤</div><h2>Vos informations ${kid ? '(enfant)' : '(candidat)'}</h2><span class="tag">* Champs obligatoires</span></div>
    <div class="info"><span class="i">i</span><div>Ces informations figureront sur votre <b>attestation de résultat</b>. Écrivez votre nom <b>exactement comme sur vos documents officiels</b>.</div></div>
    <div class="photo-pick mb"><img class="avatar lg" id="pv" src="${id.photo || (kid ? 'assets/people/enfant2.jpg' : 'assets/people/candidat1.jpg')}" alt="Photo" style="${id.photo ? '' : 'opacity:.45'}">
      <div><b class="req">Photo de profil</b><br><span class="muted" style="font-size:.9rem">Visage bien visible, fond clair. Elle sera imprimée sur l’attestation.</span><br>
      <input type="file" id="pf" accept="image/*" capture="user" class="hidden">
      <button class="btn sm mt" id="pb" type="button">📷 Prendre / choisir une photo</button><div class="ferr" data-e="photo"></div></div></div>
    <div class="mb"><b class="req">${kid ? 'Ton sexe' : 'Civilité'}</b>
      <div class="row mt"><label class="checkline" style="padding:0"><input type="radio" name="civ" value="M" ${id.civilite === 'M' ? 'checked' : ''}> ${kid ? 'Garçon' : 'Monsieur'}</label>
      <label class="checkline" style="padding:0"><input type="radio" name="civ" value="F" ${id.civilite === 'F' ? 'checked' : ''}> ${kid ? 'Fille' : 'Madame / Mademoiselle'}</label></div><span class="ferr" data-e="civilite"></span></div>
    <div class="grid2">
      ${IDF(id, 'nom', 'Nom de famille', { req: 1, ph: 'ESSAMA' })}${IDF(id, 'prenom', 'Prénom(s)', { req: 1, ph: 'Paul' })}
      ${IDF(id, 'naissance', 'Date de naissance', { type: 'date', req: 1, extra: `max="${today}" min="1920-01-01"` })}
      ${kid ? IDF(id, 'classe', 'Classe', { ph: 'CM2' }) : IDF(id, 'ville', 'Ville de résidence', { req: 1, ph: 'Garoua' })}
      ${kid ? IDF(id, 'parent', 'Nom du parent / tuteur', { req: 1 }) : IDF(id, 'tel', 'Téléphone / WhatsApp', { type: 'tel', req: 1, ph: '6 77 12 34 56' })}
      ${kid ? IDF(id, 'tel', 'Téléphone du parent (WhatsApp)', { type: 'tel', req: 1, ph: '6 77 12 34 56' }) : IDF(id, 'email', 'Email (facultatif)', { type: 'email' })}
      ${kid ? IDF(id, 'ville', 'Ville de résidence', { ph: 'Garoua' }) : IDF(id, 'profession', 'Profession ou classe', { ph: 'Enseignant' })}
      ${kid ? '' : `<label class="f">Objectif<select class="txt" data-k="objectif"><option value="">— Choisir —</option>${['Travail', 'Études', 'Voyage', 'Examen (IELTS / TOEFL)', 'Immigration', 'Culture générale'].map((o) => `<option ${id.objectif === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`}
    </div>
    <div class="mt"><b>${kid ? 'As-tu déjà étudié l’anglais ?' : 'Avez-vous déjà étudié l’anglais ?'}</b>
      <div class="row mt"><label class="checkline" style="padding:0"><input type="radio" name="etude" value="oui" ${id.etude === 'oui' ? 'checked' : ''}> Oui</label>
      <label class="checkline" style="padding:0"><input type="radio" name="etude" value="non" ${id.etude === 'non' ? 'checked' : ''}> Non</label>
      <input class="txt grow" data-k="duree" placeholder="Depuis combien de temps ? (ex. 3 ans)" value="${esc(id.duree || '')}" ${NOAUTO}></div></div>
    <div class="ferr mt" id="ierr"></div></div>`, { kid, foot: footer(true, true) });
  const collect = () => {
    $$('[data-k]', C.root).forEach((e) => (id[e.dataset.k] = e.value));
    id.civilite = $('input[name=civ]:checked', C.root)?.value || '';
    id.etude = $('input[name=etude]:checked', C.root)?.value || '';
  };
  $$('input.txt[data-k]', C.root).forEach((e) => e.addEventListener('input', () => { e.classList.remove('bad'); const m = $('[data-e="' + e.dataset.k + '"]', C.root); if (m) m.textContent = ''; }));
  $('#pb', C.root).onclick = () => $('#pf', C.root).click();
  $('#pf', C.root).onchange = async (e) => { if (e.target.files[0]) { id.photo = await resizePhoto(e.target.files[0]); const pv = $('#pv', C.root); pv.src = id.photo; pv.style.opacity = 1; const m = $('[data-e=photo]', C.root); if (m) m.textContent = ''; } };
  $('[data-back]', C.root).onclick = () => { collect(); goStage(C, 'welcome'); };
  $('[data-next]', C.root).onclick = () => {
    collect();
    const r = validateIdentity(id, kid);
    $$('[data-e]', C.root).forEach((e) => (e.textContent = r.errors[e.dataset.e] || ''));
    $$('input.txt[data-k]', C.root).forEach((e) => e.classList.toggle('bad', !!r.errors[e.dataset.k]));
    if (!r.ok) {
      $('#ierr', C.root).textContent = 'Veuillez corriger les champs signalés avant de continuer.';
      $(`[data-e="${Object.keys(r.errors)[0]}"]`, C.root)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    Object.assign(C.st.identity, r.clean);
    C.backend.patchSession(C.st.id, { identity: C.st.identity }).catch(() => {});
    goStage(C, 'recap');
  };
}

function screenRecap(C) {
  const t = C.test, tm = t.timing, id = C.st.identity;
  const total = tm.listening + tm.paliers + tm.writing + tm.oral;
  shell(C, `<div class="ccard"><div class="partbar"><div class="ico">📋</div><h2>Récapitulatif du test</h2></div>
    <p class="qbig">Test ${esc(TEST_NAMES[t.code])}</p>
    <div class="chips mb"><span class="chip">⏱ Durée totale : ${total} minutes</span><span class="chip">${t.paliers.length} paliers de difficulté croissante</span></div>
    <div class="grid2">${[['🎧', 'Écoute', tm.listening], ['📘', 'Langue & lecture', tm.paliers], ['✍️', 'Écriture', tm.writing], ['🗣️', 'Oral (entretien)', tm.oral]]
      .map(([i, n, m]) => `<div class="chip" style="display:flex;gap:12px;align-items:center;background:var(--blue-soft)"><span style="font-size:2rem">${i}</span><div>${n}<br><span class="muted">${m} minutes</span></div></div>`).join('')}</div>
    <div class="info mt"><span class="i">i</span><div>L’objectif est de mesurer votre niveau d’anglais dans les 4 compétences afin de vous proposer la formation la mieux adaptée.</div></div>
    <h3 class="mt">Vérifiez vos informations</h3>
    <div class="row" style="background:var(--cream);border-radius:16px;padding:12px 16px"><img class="avatar md" src="${esc(id.photo || '')}" alt="">
      <div class="grow"><b style="font-size:1.2rem">${esc(civ(id))} ${esc(fullName(id))}</b><br><span class="muted">Né(e) le ${esc(id.naissance ? new Date(id.naissance).toLocaleDateString('fr-FR') : '')} · ${esc(id.ville || '')} · ${esc(id.tel || '')}</span></div>
      <button class="btn sm" id="edit">✏️ Modifier</button></div>
    <label class="acceptbox mt"><input type="checkbox" id="okid" ${C.st.idOk ? 'checked' : ''}> Mes informations sont exactes : elles seront imprimées sur mon attestation.</label></div>`,
    { kid: C.kid, foot: footer(true, !!C.st.idOk) });
  const nx = $('[data-next]', C.root);
  $('#okid', C.root).onchange = (e) => { C.st.idOk = e.target.checked; nx.disabled = !e.target.checked; saveLocal(C); };
  $('#edit', C.root).onclick = () => goStage(C, 'identity');
  $('[data-back]', C.root).onclick = () => goStage(C, 'identity');
  nx.onclick = () => goStage(C, 'rules');
}

function screenRules(C) {
  const rules = [['💻🚫', 'Pas d’aide extérieure :', 'Vous devez répondre seul(e) à toutes les questions.'], ['📖🚫', 'Pas de dictionnaire :', 'Ni dictionnaire (papier ou en ligne), ni traducteur, ni notes.'], ['🎯', 'Ne pas répondre au hasard :', 'Lisez bien les questions. Si vous ne savez pas, laissez vide.'],
    ['🎧', 'Écoute une seule fois :', 'Chaque enregistrement est diffusé une seule fois (il contient déjà deux lectures).'], ['🚪', 'Toute sortie de l’application est signalée :', 'Si vous quittez le test, cela sera enregistré et vu par le formateur.']];
  shell(C, `<div class="ccard"><div class="partbar"><div class="ico" style="background:#F6D251">📋</div><h2>Règlement du test</h2></div>
    <ul class="rules">${rules.map(([i, a, b]) => `<li><span class="ri">${i}</span><div><b>${a}</b><br>${b}</div></li>`).join('')}</ul>
    <label class="acceptbox mt"><input type="checkbox" id="acc" ${C.st.accepted ? 'checked' : ''}> J’ai lu et j’accepte le règlement du test.</label></div>`,
    { kid: C.kid, foot: footer(true, C.st.accepted, '▶  Commencer') });
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
    const pc = $('#pct', C.root); if (pc) pc.textContent = progressPct(C) + ' %';
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
  shell(C, `<div class="partbar"><div class="ico">🎧</div><h2>Partie A : Écoute</h2><span class="tag">Écoute · ${C.test.timing.listening} minutes</span></div>
    <div class="ccard">
    ${C.kid ? '<div class="cheer">🎧 Écoute bien, puis réponds !</div>' : ''}
    <div class="info"><span class="i">i</span><div>Écoutez attentivement l’enregistrement, puis répondez aux questions en anglais par des réponses courtes (mots ou expressions).<br><b>${esc(ex.title)}</b></div></div>
    <button class="playbtn ${played === 'started' ? 'playing' : ''}" id="play" ${played ? 'disabled' : ''}>
      <span id="pi">${played ? '✔' : '▶'}</span>
      <span id="pt">${played ? (played === 'started' ? 'Écoute en cours…' : 'Écoute terminée') : 'Écouter <small>(une seule fois)</small>'}</span>
      <span class="wave"><i></i><i></i><i></i><i></i></span></button>
    <div class="qhead">📝 Questions <span style="font-weight:400">(réponses courtes)</span></div>
    ${ex.questions.map((q) => `<div class="qline"><span class="qnum">${q.n}</span><span class="qprompt">${esc(q.prompt)}</span>
      <span class="ans"><input class="txt" data-q="L${q.n}" value="${esc(val(C, 'L' + q.n))}" placeholder="Votre réponse…" ${NOAUTO}></span></div>`).join('')}
    </div>`, { clock: true, kid: C.kid, foot: footer(i > 0, true, i === A.length - 1 ? 'Partie suivante  ❯' : 'Suivant  ❯') });
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
const partB = (C, tag) => `<div class="partbar"><div class="ico">📖</div><h2>Partie B : Langue &amp; lecture</h2><span class="tag">${tag}</span></div>`;

function palierNav(C) {
  const st = C.st;
  const next = () => { st.i++; saveLocal(C); syncProgress(C); screenRun(C); };
  stepNav(C, { back: st.i > 0 ? () => { st.i--; saveLocal(C); screenRun(C); } : null, next });
}

function viewItem(C, { p, q }) {
  const st = C.st, k = 'P' + q.n, kid = C.kid;
  const parts = q.prompt.split('___');
  const blank = '<span style="display:inline-block;min-width:3.2em;border-bottom:4px solid var(--navy);margin:0 6px">&nbsp;</span>';
  let tag, instr, body;
  if (q.type === 'gap') {
    tag = 'Phrase à compléter';
    instr = kid ? 'Complète la phrase.' : 'Complete the sentence with the correct word.';
    body = parts.length > 1
      ? `<div class="sentence">${esc(parts[0])}<input class="txt inline" data-q="${k}" value="${esc(val(C, k))}" ${NOAUTO} aria-label="Réponse">${esc(parts.slice(1).join('___'))}</div>`
      : `<div class="sentence">${esc(q.prompt)}<br><input class="txt inline" data-q="${k}" value="${esc(val(C, k))}" ${NOAUTO} aria-label="Réponse"></div>`;
    body += `<div class="info"><span class="i">i</span><div>${kid ? 'Écris le mot qui manque.' : 'Complétez la phrase avec le mot ou l’expression qui convient en anglais.'}</div></div>`;
  } else {
    tag = 'Questions à choix multiples (QCM)';
    instr = kid ? 'Choisis la bonne réponse.' : parts.length > 1 ? 'Choose the correct answer to complete the sentence.' : 'Choose the correct answer.';
    body = `<div class="sentence" style="font-size:1.9rem">${parts.length > 1 ? esc(parts[0]) + blank + esc(parts.slice(1).join('___')) : esc(q.prompt)}</div>
      <div class="opts">${q.options.map((o, i) => `<button class="opt ${String(val(C, k)) === String(i) ? 'sel' : ''}" data-opt="${i}"><span class="rd"></span><b>${'ABCD'[i]}.</b>${esc(o)}</button>`).join('')}</div>
      <div class="info"><span class="i">i</span><div>${kid ? 'Touche la bonne réponse, puis « Suivant ».' : 'Sélectionnez la bonne réponse, puis cliquez sur « Suivant ».'}</div></div>`;
  }
  shell(C, `${partB(C, tag)}<div class="ccard">${kid ? '<div class="cheer">⭐ Bravo, continue !</div>' : ''}
    <div class="qinstr"><span class="qnum">${q.n}.</span>${esc(instr)}</div>${body}</div>`,
    { clock: true, kid, foot: footer(st.i > 0, true) });
  $$('[data-q]', C.root).forEach((e) => (e.oninput = () => setAnswer(C, e.dataset.q, e.value)));
  $$('[data-opt]', C.root).forEach((b) => (b.onclick = () => { setAnswer(C, k, b.dataset.opt, true); $$('[data-opt]', C.root).forEach((x) => x.classList.toggle('sel', x === b)); }));
  palierNav(C);
  $('input.txt', C.root)?.focus();
}

function viewReading(C, { p }) {
  const r = p.reading, kid = C.kid;
  shell(C, `${partB(C, 'Compréhension écrite')}
    <div class="ccard"><div class="info"><span class="i">i</span><div>${kid ? 'Lis le texte, puis réponds aux questions.' : 'Lisez attentivement le texte ci-dessous, puis répondez aux questions.'}<br><span class="muted">${esc(r.instruction)}</span></div></div>
    <button class="btn sm rtoggle mb" id="rt">📄 Afficher / masquer le texte</button>
    <div class="reading"><div class="rtext" id="rtext"><span class="ttl">Reading text</span><br>${esc(r.text).replace(/\n/g, '<br>')}</div>
    <div><div class="qhead" style="margin-top:0">📝 Questions</div>${r.questions.map((q) => {
      const k = 'P' + q.n;
      let a;
      if (q.type === 'open') a = `<input class="txt" data-q="${k}" value="${esc(val(C, k))}" placeholder="Votre réponse…" ${NOAUTO}>`;
      else if (q.type === 'mcq') a = `<div class="opts">${q.options.map((o, i) => `<button class="opt" data-k="${k}" data-v="${i}"><span class="rd"></span><b>${'ABCD'[i]}.</b>${esc(o)}</button>`).join('')}</div>`;
      else a = `<div class="opts" style="grid-template-columns:repeat(${q.options.length},1fr)">${q.options.map((o) => `<button class="opt tf" data-k="${k}" data-v="${esc(o)}"><span class="rd"></span>${esc(o)}</button>`).join('')}</div>`;
      return `<div class="rq"><div class="qprompt"><span class="qnum">${q.n - p.items.length - (p.palier - 1) * 20}</span>${esc(q.prompt)}</div>${a}</div>`;
    }).join('')}</div></div></div>`, { clock: true, kid, foot: footer(true, true, 'Terminer le palier  ❯') });
  $$('[data-q]', C.root).forEach((e) => (e.oninput = () => setAnswer(C, e.dataset.q, e.value)));
  const paint = () => $$('[data-k]', C.root).forEach((b) => b.classList.toggle('sel', String(val(C, b.dataset.k)) === b.dataset.v));
  $$('[data-k]', C.root).forEach((b) => (b.onclick = () => { setAnswer(C, b.dataset.k, b.dataset.v, true); paint(); })); paint();
  $('#rt', C.root).onclick = () => $('#rtext', C.root).classList.toggle('collapsed');
  palierNav(C);
}

function viewPalEnd(C, { p }) {
  const st = C.st, last = st.pal === C.test.paliers.length - 1;
  shell(C, `<div class="ccard" style="text-align:center;max-width:660px;margin:20px auto">
    <div class="doneicon" style="margin:0 auto 10px">🏁</div><h1>Palier ${p.palier} terminé</h1>
    <p class="qbig" style="font-weight:500">${last ? 'Vous avez terminé tous les paliers.' : 'Voulez-vous continuer au palier suivant ? Les questions deviennent un peu plus difficiles.'}</p>
    ${last ? '' : '<button class="btn primary big" id="cont">Continuer au palier suivant  ❯</button>'}
    <button class="btn ${last ? 'primary' : ''} big mt" id="stop">${last ? 'Passer à l’écriture  ❯' : 'Je préfère m’arrêter ici'}</button>
    ${last ? '' : '<p class="muted mt" style="font-size:.9rem">Si vous vous arrêtez ici, vous passez directement à la partie écriture.</p>'}
  </div>`, { clock: true, kid: C.kid, foot: footer(true, false, '&nbsp;') });
  stepNav(C, { back: () => { st.i--; saveLocal(C); screenRun(C); }, next: () => {} });
  $('#cont', C.root)?.addEventListener('click', () => { st.pal++; st.i = 0; saveLocal(C); syncProgress(C, true); screenRun(C); });
  $('#stop', C.root).onclick = () => { st.palStop = true; advancePart(C); };
}

/* ---- C : écriture ---- */
function viewWrite(C) {
  const st = C.st, w = C.test.writing;
  const [topic, ...rest] = w.prompt;
  shell(C, `<div class="partbar"><div class="ico">✍️</div><h2>Partie C : Écriture</h2><span class="tag">Question 1 / 1</span></div>
    <div class="ccard"><div class="info"><span class="i">i</span><div><b>${esc(topic)}</b>${rest.map((l) => `<br>${esc(l)}`).join('')}</div></div>
    <textarea class="txt" id="w" placeholder="Tapez votre texte ici…" ${NOAUTO} data-gramm="false">${esc(val(C, 'W'))}</textarea>
    <div class="wc" id="wc"></div></div>`, { clock: true, kid: C.kid, foot: footer(false, true, 'Terminer l’écrit  ❯') });
  const ta = $('#w', C.root);
  const upd = () => {
    const n = countWords(ta.value);
    const okMin = !w.minWords || n >= w.minWords, okMax = !w.maxWords || n <= w.maxWords;
    $('#wc', C.root).innerHTML = `<span class="${okMin && okMax && n ? 'good' : okMax ? '' : 'bad'}">Nombre de mots : ${n}${w.maxWords ? ' / ' + w.maxWords : ''}${okMin && okMax && n ? ' ✔' : ''}</span><span>${w.minWords ? `Min. ${w.minWords} mots · ` : ''}Max. ${w.maxWords} mots</span>`;
  };
  ta.oninput = () => { setAnswer(C, 'W', ta.value); upd(); }; upd();
  stepNav(C, { next: () => { if (confirm('Terminer l’écrit ? Vous ne pourrez plus modifier vos réponses.')) finish(C); } });
}

/* ---- Fin ---- */
function screenDone(C) {
  const st = C.st;
  shell(C, `<div class="ccard hero" style="grid-template-columns:330px 1fr">
    <img class="ph" src="assets/people/${C.kid ? 'enfant2' : 'candidat4'}.jpg" alt="">
    <div><div class="row" style="flex-wrap:nowrap;background:linear-gradient(90deg,#FFF3D6,#fff);border-radius:18px;padding:10px 16px"><div class="doneicon" style="width:76px;height:76px;font-size:2.4rem">✔</div><h1 style="margin:0;font-size:1.9rem">Partie C : Écriture<br>terminée !</h1></div>
    <p class="qbig" style="font-weight:500;margin-top:14px">Votre texte a été enregistré avec succès.</p>
    <div class="info" style="padding:14px 16px"><span style="font-size:2.2rem">🗣️</span><div><b>Prochaine étape : Entretien oral</b><div id="oralhow">Votre formateur va maintenant passer l’entretien oral avec vous (5 à 10 minutes). <b>Ne fermez pas cette page.</b></div></div></div>
    <div id="oralbox"></div>
    <div class="info" style="background:#fff;margin-top:14px"><span class="i">i</span><div><b>Préparez-vous :</b><br>✔ Vérifiez votre connexion Internet.<br>✔ Placez-vous dans un endroit calme.<br>✔ Votre écran est verrouillé : vos réponses sont enregistrées.</div></div></div></div>`,
    { kid: C.kid, title: 'Test de placement VLA', stepper: 1 });
  C.unsubSession?.();
  C.unsubSession = C.backend.onSession(st.id, (sess) => {
    const o = sess?.oral || {}; const box = $('#oralbox', C.root); if (!box) return;
    const parts = [];
    if (o.currentQ) parts.push(`<div class="panel" style="background:var(--teal-soft)"><span class="qbadge">Question de l’entretien</span><div class="qbig" style="font-size:1.6rem">${esc(o.currentQ)}</div></div>`);
    $('#oralhow', C.root).innerHTML = o.mode === 'distance'
      ? 'L’entretien se fera <b>à distance</b> (visio). Restez sur cette page : un bouton « Rejoindre » apparaîtra ici.'
      : 'L’entretien se fait <b>en salle</b>, avec votre formateur. <b>Ne fermez pas cette page.</b>';
    if (o.mode === 'distance' && o.live && o.link) parts.push(`<a class="btn teal big" href="${esc(o.link)}" target="_blank" rel="noopener">🎥 Rejoindre l’entretien (visio)</a>`);
    else if (o.live) parts.push('<div class="info" style="background:var(--ok-soft)">🗣️ Entretien en cours avec votre formateur.</div>');
    else parts.push('<div class="btn primary big" style="pointer-events:none">🎧 En attente de l’examinateur…</div>');
    box.innerHTML = parts.join('');
  });
}
