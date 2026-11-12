// Espace apprenant (#/learn) : connexion par code personnel, séance quotidienne adaptée au niveau,
// correction expliquée, progression, résultat du test de placement, vie du centre (données générales).
import { esc, $, $$, toast, IMG, fmtDate, waLink, LEVEL_NAMES } from './ui.js';
import { pickDaily, grade, answerText, applyResults, newProgress, mastery, weakTopics, dayIndex, PRACTICE_LEVELS } from './practice.js';
import { attestationHtml, buildPdf, attFileName, SKILLS, CECR, CECR_LONG, fitAtt } from './attestation.js';

const NOAUTO = 'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"';
const photo = (n) => `assets/photos/${n}.jpg`;
const PATH = [['A1', 'Débutant'], ['A2', 'Élémentaire'], ['B1', 'Intermédiaire'], ['B2', 'Intermédiaire avancé'], ['C1', 'Avancé']];
const fmtT = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const BADGES = [
  ['🌱', 'Première séance', (p) => p.log.length >= 1], ['🔥', '3 jours de suite', (p) => p.streak >= 3], ['🏅', '7 jours de suite', (p) => p.streak >= 7],
  ['⭐', '100 points', (p) => p.xp >= 100], ['🏆', '10 séances', (p) => p.log.length >= 10], ['💯', 'Séance parfaite', (p) => p.log.some((l) => l.total >= 5 && l.ok === l.total)],
];

export async function loadBank(backend) {
  let base = [];
  try { base = await (await fetch('data/bank.json')).json(); } catch { /* hors ligne : le cache du service worker répond */ }
  let extra = []; try { extra = await backend.listCol('bank'); } catch { /* */ }
  return [...base, ...extra.filter((q) => q && q.id)].filter((q) => q.status !== 'draft');
}

export async function runLearner(root, backend) {
  const L = { root, backend, me: null, prog: null, bank: [], page: 'home', sess: null, board: null };
  const saved = localStorage.getItem('vla-learner');
  if (saved) { try { await enter(L, saved); return; } catch { /* retour à la connexion */ } }
  loginScreen(L);
}

/* ------------------------------ Cadre ------------------------------ */
function frame(L, inner, { title = '', nav = true, back = null } = {}) {
  const kid = L.me?.kid, me = L.me, p = L.prog;
  const items = kid
    ? [['home', '🏠', 'Accueil'], ['exo', '📖', 'Mes séances'], ['badges', '🏆', 'Mes badges'], ['progress', '📊', 'Ma progression'], ['centre', '👥', 'Mon centre'], ['profile', '❓', 'Aide']]
    : [['home', '🏠', 'Accueil'], ['exo', '✏️', 'Exercices'], ['progress', '📊', 'Mon progrès'], ...(me?.result ? [['test', '🎯', 'Test de placement']] : []), ['centre', '👥', 'Vie du centre'], ['profile', '👤', 'Mon profil']];
  L.root.innerHTML = `<div class="lshell ${kid ? 'kidmode' : ''}"><header class="topbrand"><img class="lg" src="${IMG.logo}" alt=""><div class="nm">Valérie Language Academy<small>English Opens Doors, We Give You The Keys</small></div>
    ${me ? `<div class="me"><span class="chip" style="color:var(--navy)">🔥 ${p?.streak || 0}</span><span class="chip" style="color:var(--navy)">⭐ ${p?.xp || 0}</span><span class="bell">🔔</span><img class="avatar sm" style="width:46px;height:46px" src="${esc(me.photo || IMG.logo)}" alt=""><div>${esc(me.prenom)} ${esc((me.initial || '').split(' ').pop() || '')}<br><span style="font-weight:400;font-size:.85rem">${kid ? 'Enfant' : 'Apprenant(e)'} – ${esc(p?.level || me.level || '')}</span></div></div>` : ''}</header>
    ${back ? `<div class="secbar"><button class="btn sm" id="bk">← Retour</button><span class="lbl">${title}</span></div>` : ''}
    <div class="${nav && me && !back ? 'lbody' : ''}">${nav && me && !back ? `<nav class="sidenav">${items.map(([k, i, l]) => `<a href="#" data-pg="${k}" class="${L.page === k ? 'on' : ''}"><span class="ic">${i}</span>${l}</a>`).join('')}</nav>` : ''}<main class="lmain" style="${nav && me && !back ? '' : 'max-width:1180px;margin:0 auto;width:100%'}">${inner}</main></div></div>`;
  $$('[data-pg]', L.root).forEach((a) => (a.onclick = (e) => { e.preventDefault(); L.page = a.dataset.pg; render(L); }));
  if (back) $('#bk', L.root).onclick = back;
}

/* ------------------------------ Connexion ------------------------------ */
async function loginScreen(L) {
  let contact = '';
  try { await L.backend.candidateAuth(); contact = (await L.backend.getDoc('board', 'summary'))?.contact || ''; } catch { /* */ }
  L.root.innerHTML = `<div class="lshell"><header class="topbrand"><img class="lg" src="${IMG.logo}" alt=""><div class="nm">Valérie Language Academy<small>English Opens Doors, We Give You The Keys</small></div></header>
    <div class="lmain" style="max-width:1100px;margin:0 auto;width:100%"><div class="hero" style="grid-template-columns:1.1fr 1fr;gap:20px"><div style="position:relative"><img class="ph" src="${photo('ordinateur')}" alt="" style="max-height:420px;width:100%">
      <div class="row" style="position:absolute;left:12px;right:12px;bottom:12px;gap:8px;flex-wrap:nowrap">${[['✏️', 'Exercices interactifs'], ['📈', 'Suivi de progrès'], ['💡', 'Corrections expliquées']].map(([i, t]) => `<div class="chip" style="flex:1;text-align:center;background:linear-gradient(#142a5e,#0F1F44);color:#fff;border:2px solid var(--gold-l)">${i}<br>${t}</div>`).join('')}</div></div>
      <div class="ccard" style="text-align:center"><div class="doneicon" style="margin:0 auto 8px;background:var(--navy)">👤</div><h1 style="margin:0">Espace Apprenant</h1><p class="muted">Accède à tes exercices, à ta progression et à la vie du centre.</p>
        <input class="txt" id="code" maxlength="8" placeholder="Mon code personnel" style="text-align:center;font-size:1.6rem;font-weight:700;letter-spacing:.25em;text-transform:uppercase;min-height:60px" ${NOAUTO}>
        <p id="err" class="ferr mt"></p><button class="btn gold big" id="go">➜ &nbsp;Se connecter</button>
        <div class="rule2" style="font-size:1rem">Tu n’as pas encore de code ?</div><a class="btn big" style="min-height:52px;font-size:1.05rem" ${contact ? `href="${waLink(contact, 'Bonjour, je souhaite obtenir mon code pour l’espace apprenant VLA.')}" target="_blank" rel="noopener"` : 'href="#/"'}>👤 Contacter l’administration</a>
        <p class="mt"><a href="#/">← Accueil</a></p></div></div></div></div>`;
  const go = async () => { try { await enter(L, $('#code', L.root).value.trim().toUpperCase()); } catch (e) { $('#err', L.root).textContent = e.message; } };
  $('#go', L.root).onclick = go; $('#code', L.root).onkeydown = (e) => e.key === 'Enter' && go();
}

async function enter(L, code) {
  if (!code) throw new Error('Saisis ton code.');
  await L.backend.candidateAuth();
  const login = await L.backend.getDoc('logins', code);
  const me = login && (await L.backend.getDoc('members', login.studentId));
  if (!me) throw new Error('Code inconnu. Vérifie auprès du centre.');
  L.me = me; L.bank = await loadBank(L.backend);
  L.board = await L.backend.getDoc('board', 'summary').catch(() => null);
  L.prog = (await L.backend.getDoc('progress', me.id)) || newProgress(me.id, me.level);
  if (me.level && me.level !== L.prog.level) L.prog.level = me.level; // le niveau fixé par Valérie prime
  localStorage.setItem('vla-learner', code);
  L.page = 'home'; render(L);
}
const save = (L) => L.backend.putDoc('progress', L.me.id, { ...L.prog, name: L.me.initial || L.me.prenom, lastSeen: Date.now() }).catch(() => toast('Progression enregistrée sur cet appareil seulement'));

function render(L) { ({ home, exo, progress, test, centre, profile, badges: progress }[L.page] || home)(L); }

/* ------------------------------ Accueil ------------------------------ */
function home(L) {
  const p = L.prog, m = mastery(p, L.bank), t = dayIndex(), kid = L.me.kid;
  const doneToday = p.log.length && p.log[p.log.length - 1].day === t;
  const tot = p.log.reduce((a, l) => a + l.total, 0), ok = p.log.reduce((a, l) => a + l.ok, 0);
  const idx = PATH.findIndex(([l]) => l === p.level), next = PATH[idx + 1]?.[0];
  const evs = (L.board?.events || []).slice(0, 3);
  const weekSess = p.log.filter((l) => l.day > t - 7).length, earned = BADGES.filter((b) => b[2](p));
  const parcours = `<ul class="path">${PATH.map(([l, n], i) => { const st = i < idx ? 'done' : i === idx ? 'cur' : ''; return `<li class="${st}"><span class="n">${st === 'done' ? '✓' : i === idx ? '▶' : ''}</span><b>${l} – ${n}</b><span>${st === 'done' ? '<span class="pill ok">Terminé</span>' : i === idx ? `<span class="pill done">En cours (${m.pct} %)</span><div class="mini b" style="width:150px"><i style="width:${m.pct}%"></i></div>` : l === 'C1' || i > idx ? '<span class="pill grey">🔒 À venir</span>' : ''}</span></li>`; }).join('')}</ul>`;
  const cta = `<div class="panel tint-gold"><h2>${kid ? '🎯 Ma séance du jour' : '📖 Ma séance du jour'}</h2><div class="row" style="flex-wrap:nowrap"><img src="${photo(kid ? 'enfant_classe' : 'ecoute')}" style="width:210px;height:130px;object-fit:cover;border-radius:14px" alt=""><div><b style="font-size:1.2rem">Niveau ${esc(p.level)} — 10 questions</b><p class="muted">${doneToday ? '✅ Séance du jour faite ! Tu peux en refaire une.' : 'Les questions ratées reviennent automatiquement pour que tu les retiennes.'}</p><button class="btn gold" id="start" style="min-width:230px">▶ &nbsp;${doneToday ? 'Nouvelle séance' : 'Commencer la séance'}</button></div></div></div>`;
  frame(L, `<div class="lhello"><img class="big" src="${esc(L.me.photo || photo(kid ? 'enfants' : 'apprenante'))}" alt=""><div><h1 style="margin:0">${kid ? '👋 Bonjour ' + esc(L.me.prenom) + ' !' : '👋 Bonjour ' + esc(L.me.prenom) + ' !'}</h1><p class="qbig" style="font-weight:500;margin:4px 0 12px">${kid ? 'Continue tes séances pour passer au niveau ' + esc(next || p.level) + ' !' : 'Poursuis ta formation et atteins ton objectif !'}</p>
      <div class="lstat">${[['📖', p.log.length, 'Séances faites', ''], ['🎯', tot ? Math.round((ok / tot) * 100) + ' %' : '—', 'Taux de réussite', 'g'], ['🔥', p.streak + ' j', 'Série d’apprentissage', 'y'], ['🎓', next || '—', 'Prochain objectif', 'p']].map(([i, n, l, c]) => `<div class="kpi ${c}" style="flex-direction:column;text-align:center;padding:10px"><div class="ic" style="width:36px;height:36px;font-size:1.2rem">${i}</div><b style="font-size:1.4rem">${n}</b><span style="font-size:.82rem">${l}</span></div>`).join('')}</div></div>
      <div class="levelbadge">${kid ? 'Mon niveau' : 'Mon niveau actuel'}<br><b>${esc(p.level)}</b>${m.ready ? '<div class="mt">⭐ Prêt pour le suivant !</div>' : ''}</div></div>
    ${m.ready ? `<div class="info" style="background:var(--ok-soft)"><span class="i" style="background:var(--ok)">★</span><div><b>Bravo !</b> Tu maîtrises le niveau ${esc(p.level)}. Demande à ta formatrice de te faire passer en ${esc(m.next)}.</div></div>` : ''}
    <div class="split"><div class="panel"><h2>🗺️ ${kid ? 'Mon parcours' : 'Mon parcours de formation'}</h2>${parcours}</div><div>${cta}
      ${kid ? `<div class="panel"><h2>🏆 Mon défi de la semaine</h2><p>Réussis 3 séances cette semaine et gagne un badge !</p><div class="bar" style="height:18px"><i style="width:${Math.min(100, (weekSess / 3) * 100)}%"></i></div><b>${Math.min(3, weekSess)} / 3</b> · 🏅 ${earned.length} badge(s)</div>` : `<div class="panel"><h2>📅 Mes prochaines activités</h2>${evs.length ? evs.map((e) => `<div class="row sb" style="padding:5px 0;border-bottom:1px solid var(--line)"><b>${esc(e.title)}</b><span class="pill done">${fmtDate(e.date)}</span></div>`).join('') : '<p class="muted">Rien de prévu pour le moment.</p>'}<a href="#" data-pg="centre" class="btn sm mt">Voir la vie du centre ❯</a></div>`}</div></div>`);
  $('#start', L.root).onclick = () => startSession(L, pickDaily(L.bank, p, 10), 'Séance du jour');
  $$('[data-pg]', L.root).forEach((a) => (a.onclick = (e) => { e.preventDefault(); L.page = a.dataset.pg; render(L); }));
}

/* ------------------------------ Exercices (séances) ------------------------------ */
function exo(L) {
  const p = L.prog, topics = [...new Set(L.bank.filter((q) => q.level === p.level).map((q) => q.topic))];
  const wrongIds = Object.entries(p.items).filter(([, v]) => v.box <= 1).map(([k]) => k), wrong = L.bank.filter((q) => wrongIds.includes(q.id) && q.level === p.level);
  frame(L, `<div class="pagehead"><h2><span class="pic">✏️</span>Exercices — niveau ${esc(p.level)}</h2></div>
    <div class="grid2"><div class="panel tint-gold"><h2>🎯 Séance du jour</h2><p>10 questions adaptées à ton niveau, avec révision espacée.</p><button class="btn primary big" id="d">▶ Commencer</button></div>
    <div class="panel"><h2>🔁 Réviser mes erreurs</h2><p>${wrong.length} question(s) à retravailler.</p><button class="btn big" id="w" ${wrong.length ? '' : 'disabled'}>Réviser</button></div></div>
    <div class="panel"><h2>🧩 S’entraîner par thème</h2><div class="row">${topics.map((t) => `<button class="btn" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`);
  $('#d', L.root).onclick = () => startSession(L, pickDaily(L.bank, p, 10), 'Séance du jour');
  $('#w', L.root).onclick = () => startSession(L, wrong.slice(0, 10), 'Réviser mes erreurs');
  $$('[data-t]', L.root).forEach((b) => (b.onclick = () => startSession(L, L.bank.filter((q) => q.level === p.level && q.topic === b.dataset.t), b.dataset.t)));
}

/* ------------------------------ Séance ------------------------------ */
function startSession(L, qs, title) {
  if (!qs.length) return toast('Pas de questions pour le moment.');
  L.sess = { qs, i: 0, answers: {}, t0: Date.now(), title }; question(L);
}
function question(L) {
  const { qs, i, answers } = L.sess, q = qs[i], parts = q.prompt.split('___'), blank = '<span style="display:inline-block;min-width:3.2em;border-bottom:4px solid var(--navy)">&nbsp;</span>';
  const body = q.type === 'gap'
    ? `<div class="sentence">${esc(parts[0])}<input class="txt inline" id="ans" value="${esc(answers[q.id] || '')}" ${NOAUTO}>${esc(parts.slice(1).join('___'))}</div>`
    : `<div class="qbig" style="font-size:1.5rem">${q.type === 'tf' ? esc(q.prompt) : parts.length > 1 ? esc(parts[0]) + blank + esc(parts.slice(1).join('___')) : esc(q.prompt)}</div>${(q.type === 'tf' ? q.options : q.options).map((o, k) => { const v = q.type === 'tf' ? o : String(k); return `<button class="optc ${String(answers[q.id]) === v ? 'sel' : ''}" data-v="${esc(v)}"><span class="rd"></span>${q.type === 'tf' ? '' : `<b>${'ABCD'[k]}.</b>`} ${esc(o)}</button>`; }).join('')}`;
  const pct = Math.round((i / qs.length) * 100);
  frame(L, `<div class="qlayout"><div class="ccard"><span class="chip" style="background:var(--blue-soft)">Question ${i + 1} sur ${qs.length}</span><div class="mt">${body}</div>
      <div class="row sb mt"><button class="btn" id="bk2" ${i ? '' : 'disabled'}>← Question précédente</button><button class="btn gold" id="nx">${i === qs.length - 1 ? 'Terminer ✔' : 'Question suivante →'}</button></div></div>
    <div><div class="panel"><h2>📊 Ma progression</h2><div class="bar" style="height:16px"><i style="width:${pct}%"></i></div><b>${pct} %</b></div><div class="panel"><h2>⏱ Temps écoulé</h2><b style="font-size:1.8rem" id="tm">${fmtT(Math.round((Date.now() - L.sess.t0) / 1000))}</b></div><div class="panel tint-gold"><h2>🎯 Thème travaillé</h2><span class="pill done" style="font-size:1rem">${esc(q.topic)}</span></div></div></div>`,
  { title: `Entraînement – ${esc(L.sess.title)} (${esc(L.prog.level)})`, back: () => { if (confirm('Quitter la séance ? Tes réponses ne seront pas comptées.')) { L.page = 'home'; render(L); } }, nav: false });
  clearInterval(L.tick); L.tick = setInterval(() => { const e = $('#tm', L.root); if (e) e.textContent = fmtT(Math.round((Date.now() - L.sess.t0) / 1000)); else clearInterval(L.tick); }, 1000);
  $$('.optc', L.root).forEach((b) => (b.onclick = () => { answers[q.id] = b.dataset.v; $$('.optc', L.root).forEach((x) => x.classList.toggle('sel', x === b)); }));
  $('#ans', L.root)?.addEventListener('input', (e) => (answers[q.id] = e.target.value)); $('#ans', L.root)?.focus();
  $('#bk2', L.root).onclick = () => { L.sess.i--; question(L); };
  $('#nx', L.root).onclick = () => { if (i === qs.length - 1) return finish(L); L.sess.i++; question(L); };
}
async function finish(L) {
  clearInterval(L.tick);
  const { qs, answers } = L.sess, secs = Math.round((Date.now() - L.sess.t0) / 1000);
  const results = qs.map((q) => ({ id: q.id, ok: grade(q, answers[q.id]) }));
  L.prog = applyResults(L.prog, results); await save(L);
  const ok = results.filter((r) => r.ok).length, pct = Math.round((ok / qs.length) * 100), good = pct >= 70;
  const byTopic = {}; qs.forEach((q, k) => { const x = (byTopic[q.topic] ||= { n: 0, ok: 0 }); x.n++; if (results[k].ok) x.ok++; });
  const worst = Object.entries(byTopic).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n)[0];
  frame(L, `<div class="split" style="grid-template-columns:1fr 1.15fr"><div><div class="panel tint-gold"><div class="row" style="flex-wrap:nowrap"><div class="grow"><h2 style="font-size:1.6rem">${good ? 'Bravo ' + esc(L.me.prenom) + ' ! 🎉' : 'Courage ' + esc(L.me.prenom) + ' ! 💪'}</h2><p>${good ? 'Tu as bien travaillé !' : 'Relis les explications : ces questions reviendront.'}</p><span class="pill ${good ? 'ok' : 'wait'}" style="font-size:1rem">${good ? '✔ Séance réussie' : 'À consolider'}</span></div><div class="donutbig" style="background:conic-gradient(${good ? '#1E9E57' : '#E8870E'} ${pct}%,#e3e8f0 0)"><div>${ok} / ${qs.length}<br><small>${pct} %</small></div></div></div></div>
      <div class="panel"><h2>📊 Détail des résultats</h2><div class="fieldrow" style="grid-template-columns:1fr auto">✅ Réponses correctes<b>${ok}</b></div><div class="fieldrow" style="grid-template-columns:1fr auto">❌ Réponses incorrectes<b>${qs.length - ok}</b></div><div class="fieldrow" style="grid-template-columns:1fr auto">⏱ Temps utilisé<b>${fmtT(secs).replace(':', ' min ')} s</b></div><div class="fieldrow" style="grid-template-columns:1fr auto">🎯 Score<b>${pct} %</b></div></div>
      <div class="panel"><h2>🧩 Analyse par thème</h2>${Object.entries(byTopic).map(([t, v]) => `<div class="skill" style="grid-template-columns:1fr 120px 60px;background:none"><span>${esc(t)}</span><div class="bar"><i style="width:${(v.ok / v.n) * 100}%"></i></div><b>${v.ok}/${v.n}</b></div>`).join('')}</div>
      <div class="panel tint-gold"><h2>💡 Conseil pour progresser</h2><p>${worst && worst[1].ok < worst[1].n ? `Revois le thème « ${esc(worst[0])} » et refais une séance sur ce thème.` : 'Continue chaque jour : la régularité fait progresser plus vite.'}</p></div></div>
    <div class="panel"><h2>📖 Corrections et explications</h2>${qs.map((q, k) => { const r = results[k], a = answers[q.id]; const shown = a === undefined || a === '' ? '<i>sans réponse</i>' : q.type === 'mcq' ? esc(q.options[a]) : esc(a);
      return `<div class="acc ${r.ok ? 'ok' : 'ko'} ${r.ok ? '' : 'open'}" data-acc><div class="row sb"><span><b>Q${k + 1}.</b> ${esc(q.prompt)}</span><span>${r.ok ? '✅' : '❌'}</span></div><div>Ta réponse : <b>${shown}</b> ${r.ok ? '— Correcte' : '— <span style="color:var(--err)">Incorrecte</span>'}</div><div class="more">${r.ok ? '' : `Bonne réponse : <b style="color:var(--ok)">${esc(answerText(q))}</b><br>`}<div class="info mt" style="margin-bottom:0"><span class="i">💡</span><div>${esc(q.explain)}</div></div></div></div>`; }).join('')}</div></div>
    <div class="row mt"><button class="btn" id="again">↻ ${results.some((r) => !r.ok) ? 'Réviser mes erreurs' : 'Refaire une séance'}</button><button class="btn gold" id="other">📄 Faire un autre exercice</button><button class="btn primary" id="prog">📊 Voir ma progression</button></div>`,
  { title: '🏆 Résultat de la séance', back: () => { L.page = 'home'; render(L); }, nav: false });
  $$('[data-acc]', L.root).forEach((a) => (a.onclick = () => a.classList.toggle('open')));
  $('#again', L.root).onclick = () => { const wrong = qs.filter((q, k) => !results[k].ok); startSession(L, wrong.length ? wrong : pickDaily(L.bank, L.prog, 10), wrong.length ? 'Réviser mes erreurs' : 'Séance du jour'); };
  $('#other', L.root).onclick = () => { L.page = 'exo'; render(L); }; $('#prog', L.root).onclick = () => { L.page = 'progress'; render(L); };
}

/* ------------------------------ Mon progrès / badges ------------------------------ */
function progress(L) {
  const p = L.prog, m = mastery(p, L.bank), weak = weakTopics(p, L.bank), last = p.log.slice(-10), earned = BADGES.filter((b) => b[2](p)).length;
  frame(L, `<div class="pagehead"><h2><span class="pic">📊</span>${L.me.kid ? 'Ma progression' : 'Mon progrès'}</h2></div>
    <div class="kpis">${[['🎓', p.level, 'Niveau actuel', ''], ['📶', m.pct + ' %', 'Maîtrise du niveau', 'g'], ['🔥', p.streak + ' j', 'Série en cours', 'y'], ['🏅', earned + ' / ' + BADGES.length, 'Badges', 'p']].map(([i, n, l, c]) => `<div class="kpi ${c}"><div class="ic">${i}</div><div><b>${n}</b><span>${l}</span></div></div>`).join('')}</div>
    <div class="split"><div class="panel"><h2>📈 Mes dernières séances</h2>${last.length ? `<div class="chartbars">${last.map((l) => `<div style="height:${(l.ok / Math.max(1, l.total)) * 100}%"><span>${l.ok}/${l.total}</span></div>`).join('')}</div>` : '<p class="muted">Aucune séance pour l’instant.</p>'}</div>
    <div class="panel"><h2>🧩 Mes thèmes</h2>${weak.length ? weak.map((t) => `<div class="skill" style="grid-template-columns:1fr 120px 56px;background:none"><span>${esc(t.topic)}</span><div class="bar"><i style="width:${t.pct}%"></i></div><b>${t.pct} %</b></div>`).join('') : '<p class="muted">Fais ta première séance !</p>'}</div></div>
    <div class="panel"><h2>🏆 Mes badges</h2><div class="row">${BADGES.map((b) => `<div style="text-align:center;width:100px"><div class="badge-med ${b[2](p) ? '' : 'off'}" style="margin:auto">${b[0]}</div><div style="font-size:.82rem;font-weight:600">${b[1]}</div></div>`).join('')}</div></div>`);
}

/* ------------------------------ Résultat du test de placement ------------------------------ */
function test(L) {
  const r = L.me.result; if (!r) return home(L);
  const lv = r.levels || {};
  frame(L, `<div class="pagehead"><h2><span class="pic">🎯</span>Test de placement — mon résultat</h2></div>
    <div class="banner" style="background-image:linear-gradient(90deg,rgba(255,243,214,.96) 40%,rgba(255,243,214,.4)),url(${photo('apprenante')})"><div><h1 style="margin:0">Félicitations ${esc(L.me.prenom)} ! 🎉</h1><p class="qbig">Tu as terminé le test de placement.</p></div></div>
    <div class="split mt"><div><div class="panel"><h2>📋 Ton résultat</h2><div class="glob">Niveau recommandé :<b>${esc(r.global)}</b></div><p class="mt"><b>${esc(CECR[r.global] || '')}</b> — ${esc(CECR_LONG[r.global] || '')}</p><p class="muted">${esc(r.formation || '')}</p></div>
      <div class="panel"><h2>📊 Détail par compétence</h2>${SKILLS.map(([k, lab, , ic]) => `<div class="row sb" style="padding:5px 0;border-bottom:1px solid var(--line)"><span>${ic} ${lab}</span><span class="pill lv-${esc(lv[k] || '')}">${esc(lv[k] || '—')}</span></div>`).join('')}</div>
      <div class="panel tint-gold"><h2>🎯 Prochaine étape</h2><ul class="insights" style="padding:0"><li>Inscris-toi en niveau ${esc(r.global)}.</li><li>Suis le parcours recommandé.</li><li>Entraîne-toi chaque jour ici.</li></ul></div>
      <button class="btn gold big" id="dl">⬇ Télécharger mon attestation (PDF)</button></div>
    <div style="overflow:hidden"><div id="attw" style="transform-origin:top left">${attestationHtml(r)}</div></div></div>`);
  const el = $('#att', L.root), w = L.root.querySelector('.split > div:last-child').clientWidth; fitAtt(el, w - 4);
  $('#dl', L.root).onclick = async (e) => { e.target.disabled = true; try { const z = el.style.zoom; el.style.zoom = '1'; const pdf = await buildPdf(el, r); el.style.zoom = z; pdf.save(attFileName(r)); } catch (err) { toast('Téléchargement impossible : ' + err.message); } e.target.disabled = false; };
}

/* ------------------------------ Vie du centre ------------------------------ */
async function centre(L) {
  const b = (L.board = await L.backend.getDoc('board', 'summary').catch(() => L.board));
  if (!b) return frame(L, '<div class="ccard">Le tableau de bord du centre n’est pas encore publié.</div>');
  const regs = {}; for (const e of b.events || []) regs[e.id] = !!(await L.backend.getDoc('eventreg', `${e.id}_${L.me.id}`).catch(() => null));
  const next = (b.events || [])[0];
  const mon = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  frame(L, `<div class="pagehead"><h2><span class="pic">👥</span>Vie du centre</h2></div>
    ${next ? `<div class="banner" style="background-image:linear-gradient(90deg,rgba(255,255,255,.3),rgba(255,255,255,0)),url(${photo('groupe')})"><div class="card"><b>📅 Prochain événement</b><h2 style="margin:6px 0">${esc(next.title)}</h2><div class="muted">${mon(next.date)}${next.time ? ' · ' + esc(next.time) : ''}</div><button class="btn gold mt" id="reg" ${regs[next.id] ? 'disabled' : ''}>${regs[next.id] ? '✔ Inscrit(e)' : 'Je m’inscris →'}</button></div></div>` : ''}
    <div class="kpis mt">${[['🎓', b.inscrits, 'Élèves au centre', ''], ['📚', b.classes, 'Classes', 'g'], ['📖', b.lessonsDone, 'Leçons données', 'y']].map(([i, n, l, c]) => `<div class="kpi ${c}"><div class="ic">${i}</div><div><b>${n}</b><span>${l}</span></div></div>`).join('')}</div>
    <div class="split"><div class="panel"><h2>📅 Calendrier du centre</h2>${(b.events || []).map((e) => `<div class="row sb" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="pill done" style="min-width:90px;text-align:center">${mon(e.date)}</span><span class="grow" style="margin-left:10px"><b>${esc(e.title)}</b>${e.time ? '<br><span class="muted">' + esc(e.time) + '</span>' : ''}</span>${regs[e.id] ? '<span class="pill ok">✔ Inscrit(e)</span>' : `<button class="btn sm" data-r="${e.id}">S’inscrire</button>`}</div>`).join('') || '<p class="muted">Rien de prévu.</p>'}</div>
    <div><div class="panel tint-gold"><h2>📢 Annonces du centre</h2>${(b.announcements || []).map((a) => `<div style="padding:4px 0">• ${esc(a.text)}</div>`).join('') || '<p class="muted">Aucune annonce.</p>'}</div>
    <div class="panel"><h2>🏫 Les classes</h2>${(b.classList || []).map((c) => `<div class="row sb" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>${esc(c.name)}</b> <span class="pill lv-${esc(c.level)}">${esc(c.level)}</span><br><span class="muted">${esc((c.days || []).map((d) => d.slice(0, 3)).join(', '))} ${esc(c.time || '')}</span></span><span class="muted">${c.size} élèves · ${c.lessons} leçons</span></div>`).join('') || '<p class="muted">—</p>'}</div>
    ${b.names?.length ? `<div class="panel"><h2>👥 Au centre</h2><div class="muted">${b.names.map((n) => `${esc(n.n)} <span class="pill lv-${esc(n.level)} xs">${esc(n.level)}</span>`).join(' · ')}</div></div>` : ''}</div></div>
    <div class="panel"><h2>🖼 Album — vie du centre</h2><div class="photostrip">${['cours', 'equipe', 'sortie', 'visite', 'diplome', 'groupe'].map((n) => `<img src="${photo(n)}" alt="">`).join('')}</div></div>`);
  const reg = async (id) => { const e = b.events.find((x) => x.id === id); await L.backend.putDoc('eventreg', `${id}_${L.me.id}`, { id: `${id}_${L.me.id}`, eventId: id, memberId: L.me.id, name: L.me.initial || L.me.prenom, at: Date.now() }); toast(`Inscription à « ${e.title} » enregistrée ✔`); centre(L); };
  $('#reg', L.root)?.addEventListener('click', () => reg(next.id));
  $$('[data-r]', L.root).forEach((x) => (x.onclick = () => reg(x.dataset.r)));
}

function profile(L) {
  const m = L.me;
  frame(L, `<div class="pagehead"><h2><span class="pic">👤</span>Mon profil</h2></div><div class="panel"><div class="row"><img class="avatar lg" src="${esc(m.photo || IMG.logo)}"><div><h2 style="margin:0">${esc(m.prenom)} ${esc(m.initial?.split(' ').pop() || '')}</h2><p>Niveau <b>${esc(L.prog.level)}</b> · code <code>${esc(m.code)}</code></p></div></div>
    <div class="row mt"><a class="btn wa" target="_blank" rel="noopener" href="${waLink(L.board?.contact || '', `Bonjour, je suis ${m.prenom} (code ${m.code}) et j’ai une question.`)}">💬 Contacter le centre</a><button class="btn danger" id="lo">⏻ Se déconnecter</button></div></div>`);
  $('#lo', L.root).onclick = () => { localStorage.removeItem('vla-learner'); L.me = null; loginScreen(L); };
}
