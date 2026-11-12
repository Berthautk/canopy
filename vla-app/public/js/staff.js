// Espace de Valérie : connexion, tableau de bord, création de session, suivi en direct,
// résultats, attestations, candidats/prospects, statistiques, paramètres. (Correction : correct.js)
import { esc, $, $$, fmtTime, fmtDate, fmtDateTime, toast, qrSvg, waLink, resizePhoto, IMG, TEST_NAMES, TEST_ICONS } from './ui.js';
import { splitTest } from './scoring.js';
import { fullName } from './identity.js';
import { renderCorrection, renderAttestation, KEYS } from './correct.js';
import { overview, students, classes, events, reports } from './centre.js';
import { bank, followup, trainStats } from './train.js';
import { hasHost, canManage } from './host.js';

export const STATUS = {
  created: ['En attente', 'grey'], waiting: ['Connecté', 'wait'], running: ['En cours', 'run'], finished: ['Écrit terminé', 'done'],
  corrected: ['Corrigé', 'ok'], delivered: ['Attestation remise', 'ok'],
};
const SECTIONS = [['placement', '🎯', 'Test de placement', '#/staff'], ['centre', '🏫', 'Centre', '#/centre'], ['train', '📚', 'Entraînement', '#/train']];
const sectionsFor = (u) => SECTIONS.filter((x) => canManage(u) || x[0] === 'placement' || !u?.role).map((x) => (x[0] === 'centre' && hasHost() ? [x[0], x[1], 'Centre (gestion)', '../'] : x));
const NAVS = {
  placement: [['', '🏠', 'Tableau de bord'], ['new', '➕', 'Créer un test'], ['live', '☰', 'Mes sessions'], ['people', '👥', 'Candidats'], ['results', '📊', 'Résultats & notes'], ['attest', '🎖️', 'Attestations'], ['stats', '📈', 'Statistiques'], ['settings', '⚙️', 'Paramètres']],
  centre: [['', '🏠', 'Vue d’ensemble'], ['students', '🎓', 'Élèves'], ['classes', '📖', 'Classes & leçons'], ['events', '📅', 'Activités'], ['people', '🧑‍🤝‍🧑', 'Prospects (tests)'], ['reports', '📊', 'Rapports'], ['settings', '⚙️', 'Paramètres']],
  train: [['', '📈', 'Suivi des apprenants'], ['bank', '📚', 'Banque d’exercices'], ['stats', '📊', 'Résultats & stat.'], ['events', '📅', 'Activités & annonces'], ['settings', '⚙️', 'Paramètres']],
};
const TITLES = {
  placement: {
    '': ['🏠', 'Tableau de bord des tests de placement'], new: ['＋', 'Gestion des tests et des candidats'], live: ['🖥️', 'Suivi en temps réel des tests de placement'], people: ['👥', 'Gestion des prospects'],
    person: ['👥', 'Gestion des prospects'], results: ['📊', 'Correction et notation des tests de placement'], correct: ['✏️', 'Correction et notation des tests de placement'], attest: ['🎖️', 'Attestations de résultat'],
    attestation: ['🎖️', 'Attestation de résultat'], stats: ['📊', 'Statistiques et performance'], settings: ['⚙️', 'Paramètres du centre'], session: ['🖥️', 'Suivi du candidat'],
  },
  centre: { reports: ['📊', 'Rapports'], '': ['🏫', 'Pilotage du centre'], students: ['🎓', 'Élèves et inscriptions'], classes: ['📖', 'Classes et leçons'], events: ['📅', 'Activités du centre'], people: ['🧑‍🤝‍🧑', 'Prospects issus des tests'], person: ['🧑‍🤝‍🧑', 'Fiche prospect'], settings: ['⚙️', 'Paramètres du centre'] },
  train: { events: ['📅', 'Activités et annonces'], stats: ['📊', 'Résultats'], '': ['📈', 'Suivi des apprenants'], bank: ['📚', 'Banque d’exercices'], settings: ['⚙️', 'Paramètres du centre'] },
};

export async function runStaff(root, backend, path, section = 'placement') {
  const st = await backend.staffState();
  if (!st.user) return login(root, backend, st);
  const settings = await backend.getSettings();
  const ctx = { root, backend, settings, user: st.user, cleanup: [] };
  window.__vlaCleanup?.forEach((f) => f()); window.__vlaCleanup = ctx.cleanup;
  if (st.user.role === 'secretaire' && (section !== 'placement' || ['settings', 'stats'].includes(path[0]))) { location.hash = '#/staff'; return; }
  const [page, a] = path;
  const base = SECTIONS.find((x) => x[0] === section)[3];
  const on = section === 'placement' ? ({ person: 'people', correct: 'results', session: 'live', attestation: 'attest' }[page] ?? (page || '')) : (({ person: 'people' })[page] ?? (page || ''));
  const [ic, sub] = TITLES[section][page || ''] || TITLES[section][''];
  root.innerHTML = `<div class="shell">
    <header class="topbrand"><img class="lg" src="${IMG.logo}" alt=""><div class="nm">Valérie Language Academy<small>English Opens Doors, We Give You The Keys</small></div>
      <div class="me"><span class="pill ${backend.mode === 'firebase' ? 'ok' : 'done'}">${backend.mode === 'firebase' ? '● En ligne' : '● Mode local'}</span><span class="bell">🔔</span>
      <img class="avatar sm" style="width:48px;height:48px;border-color:var(--gold-l)" src="${esc(settings.avatar || IMG.valerie)}" alt=""><div>${esc(settings.name || 'Valérie')}<br><span style="font-weight:400;font-size:.85rem">Administratrice</span></div></div></header>
    <div class="secbar"><span class="lbl">🖥️ ESPACE DE VALÉRIE</span><div class="tabs3">${sectionsFor(st.user).map(([k, i, l, h]) => `<a href="${h}" class="${k === section ? 'on' : ''}">${i} ${l}</a>`).join('')}</div></div>
    <div class="shellbody"><nav class="sidenav">${NAVS[section].map(([p, i, l]) => `<a href="${base}${p ? '/' + p : ''}" class="${on === p ? 'on' : ''}"><span class="ic">${i}</span>${l}</a>`).join('')}
      <hr>${hasHost() ? '<a href="../"><span class="ic">🏠</span>Retour à VLA Gestion</a>' : ''}<a href="#/c" target="_blank"><span class="ic">🧑‍🎓</span>Écran candidat</a><a href="#/learn" target="_blank"><span class="ic">📚</span>Espace apprenant</a><a href="#" id="out"><span class="ic">⏻</span>Déconnexion</a></nav>
      <div class="shellmain" id="view"></div></div></div>`;
  $('#out', root).onclick = async (e) => { e.preventDefault(); await backend.staffLogout(); location.hash = '#/staff'; location.reload(); };
  const view = $('#view', root);
  const PAGES = {
    placement: { '': dashboard, new: newTest, live, people, person, results, attest, stats, settings: settingsPage, correct: renderCorrection, attestation: renderAttestation, session: sessionDetail },
    centre: { '': overview, students, classes, events, people, person, reports, settings: settingsPage },
    train: { '': followup, bank, stats: trainStats, events, settings: settingsPage },
  }[section];
  await (PAGES[page || ''] || PAGES[''])(view, ctx, a, path);
}

/* ------------------------------ Connexion ------------------------------ */
function login(root, backend, st) {
  const local = backend.mode === 'local' && !st.host;
  root.innerHTML = `<div class="login"><img src="${IMG.logo}" width="110" style="border-radius:50%"><h1>Espace de Valérie</h1>
    <p class="muted">${st.host ? (st.denied ? 'Cet espace est réservé à la manager et au secrétariat.' : 'Connectez-vous avec vos accès VLA Gestion (pseudo + code).') : local ? (st.hasPin ? 'Saisissez votre code PIN.' : 'Première utilisation : choisissez un code PIN (4 chiffres ou plus).') : 'Connectez-vous avec votre compte.'}</p>
    ${st.host ? '<input class="txt" id="ps" placeholder="Pseudo" autocomplete="username"><input class="txt mt" id="cd" type="password" inputmode="numeric" placeholder="Code" autocomplete="current-password">' : local ? '<input class="txt" id="pin" type="password" inputmode="numeric" placeholder="Code PIN" autocomplete="off">'
      : '<input class="txt" id="em" type="email" placeholder="Email" autocomplete="username"><input class="txt mt" id="pw" type="password" placeholder="Mot de passe" autocomplete="current-password">'}
    <p id="le" style="color:var(--err)"></p><button class="btn primary big" id="ok">Se connecter</button>
    <p class="mt"><a href="#/c">← Écran candidat</a></p></div>`;
  const go = async () => {
    try { await backend.staffLogin(st.host ? { pseudo: $('#ps', root).value, code: $('#cd', root).value } : local ? { pin: $('#pin', root).value } : { email: $('#em', root).value, password: $('#pw', root).value }); location.reload(); }
    catch (e) { $('#le', root).textContent = e.message || 'Connexion refusée'; }
  };
  $('#ok', root).onclick = go; root.onkeydown = (e) => e.key === 'Enter' && go();
}

/* ------------------------------ Outils ------------------------------ */
const subscribe = (ctx, unsub) => ctx.cleanup.push(unsub);
const name = (s) => fullName(s.identity) || '— (pas encore identifié)';
const ph = (s) => s.identity?.photo || (s.testCode === 'ENF' ? 'assets/people/enfant2.jpg' : 'assets/people/candidat1.jpg');
export const statusPill = (s) => { const [t, c] = STATUS[s] || ['?', 'grey']; return `<span class="pill ${c}">${t}</span>`; };
const timeLeft = (s) => (s.timeLeft && s.part && s.timeLeft[s.part] != null ? fmtTime(s.timeLeft[s.part]) : '—');
const PART = { A: 'Écoute', B: 'Langue & lecture', C: 'Écriture', done: 'Écrit terminé' };
const exitsBadge = (s) => (s.exits?.length ? `<span class="badge-exit">⚠ ${s.exits.length}</span>` : '<span class="muted">0</span>');
export const candUrl = (code) => `${location.origin}${location.pathname}#/c/${code}`;
const kpi = (ic, n, l, cls = '') => `<div class="kpi ${cls}"><div class="ic">${ic}</div><div><b>${n}</b><span>${l}</span></div></div>`;
const isDone = (s) => ['finished', 'corrected', 'delivered'].includes(s.status);

/* ------------------------------ Tableau de bord ------------------------------ */
async function dashboard(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🏠</span>Tableau de bord</h2><div class="row"><a class="btn gold" href="#/staff/new">＋ Créer un test</a></div></div><div id="kp"></div>
  <div class="split"><div class="panel"><h2>Sessions récentes</h2><div class="tablewrap" id="rec"></div></div>
  <div><div class="panel tint-gold"><h2>📲 Relances WhatsApp</h2><div id="rel" class="muted">Aucune relance.</div></div></div></div>`;
  let sess = [], people = [];
  const paint = () => {
    const run = sess.filter((s) => ['waiting', 'running'].includes(s.status)).length;
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('▶️', run, 'En cours', 'g')}${kpi('✍️', sess.filter((s) => s.status === 'finished').length, 'À corriger', 'y')}${kpi('✅', sess.filter((s) => ['corrected', 'delivered'].includes(s.status)).length, 'Terminés')}${kpi('👥', people.length, 'Prospects', 'p')}</div>`;
    const recent = [...sess].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
    $('#rec', view).innerHTML = recent.length ? `<table class="t"><tr><th>Candidat</th><th>Test</th><th>Statut</th><th></th></tr>${recent.map((s) => `<tr><td><b>${esc(name(s))}</b><br><span class="muted">Code ${s.id}</span></td><td>${s.testCode}</td><td>${statusPill(s.status)}</td><td><a class="btn sm" href="#/staff/${isDone(s) ? 'correct' : 'session'}/${s.id}">Ouvrir</a></td></tr>`).join('')}</table>` : '<p class="muted">Aucune session pour l’instant. Cliquez sur « Créer un test ».</p>';
    const rel = people.filter((p) => p.decision === 'réfléchit');
    $('#rel', view).innerHTML = rel.length ? rel.map((p) => `<div class="row sb mb"><span><b>${esc(p.prenom)} ${esc(p.nom)}</b><br><span class="muted">${esc(p.level || '')} · ${fmtDate(p.testDate)}</span></span><a class="btn sm wa" target="_blank" rel="noopener" href="${waLink(p.tel, `Bonjour ${p.prenom}, c'est Valérie Language Academy. Vous avez passé votre test de placement (niveau ${p.level || ''}). Avez-vous réfléchi à votre inscription ?`)}">WhatsApp</a></div>`).join('') : 'Aucune relance à faire.';
  };
  subscribe(ctx, ctx.backend.onSessions((l) => { sess = l; paint(); }));
  subscribe(ctx, ctx.backend.onPeople((l) => { people = l; paint(); }));
}

/* ------------------------------ Créer un test ------------------------------ */
async function newTest(view, ctx) {
  let have = [], pubs = {};
  try { have = await ctx.backend.listKeys(); } catch { /* */ }
  for (const c of ['ADU', 'ENF', 'IEL']) { try { pubs[c] = await ctx.backend.getTestPublic(c); } catch { /* */ } }
  const counts = (c) => { const t = pubs[c]; if (!t) return null; return { A: t.listening.reduce((n, e) => n + e.questions.length, 0), B: t.paliers.reduce((n, p) => n + p.items.length + p.reading.questions.length, 0), pal: t.paliers.length, tm: t.timing }; };
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">＋</span>Créer un nouveau test de placement</h2></div>
  <div class="split"><div class="panel" style="background:#FFFAEC"><div class="stephead"><span class="stepno">1</span>Informations du test</div>
    <div class="tabs" id="tt">${['ADU', 'ENF', 'IEL'].map((c, i) => `<button class="tab ${i ? '' : 'on'}" data-c="${c}">${TEST_ICONS[c]} ${TEST_NAMES[c]}</button>`).join('')}</div>
    <div class="grid2"><div><b>Langue</b><div class="row mt"><span class="pill done" style="font-size:1rem">🇬🇧 Anglais ✔</span></div></div>
    <div><b>Lieu de l’entretien oral</b><div class="row mt"><label class="checkline" style="padding:0"><input type="radio" name="om" value="presentiel" checked> 🏫 En salle</label><label class="checkline" style="padding:0"><input type="radio" name="om" value="distance"> 🌐 À distance</label></div></div></div>
    <div class="stephead mt"><span class="stepno">2</span>Contenu du test</div><div id="content"></div>
    <div class="row sb mt"><button class="btn" id="reset">↺ Réinitialiser</button><button class="btn gold" id="mk">✔ Créer le test</button></div>
    ${have.length < 3 ? '<p class="info mt" style="background:var(--err-soft)">⚠️ Corrigés manquants pour : ' + ['ADU', 'ENF', 'IEL'].filter((c) => !have.includes(c)).join(', ') + '. Importez-les dans Paramètres avant la correction.</p>' : ''}</div>
  <div class="panel tint-gold" id="res"><h2>Code d’accès</h2><p class="muted">Le code et le QR code apparaîtront ici après la création. Vous pouvez lancer plusieurs candidats en même temps.</p></div></div>`;
  let code = 'ADU';
  const paintContent = () => {
    const c = counts(code);
    $('#content', view).innerHTML = c ? `<div style="font-size:1.05rem;line-height:2">✅ <b>Partie A : Écoute</b> (${c.A} questions · ${c.tm.listening} min)<br>✅ <b>Partie B : Langue &amp; lecture</b> (${c.B} questions en ${c.pal} paliers · ${c.tm.paliers} min)<br>✅ <b>Partie C : Écriture</b> (1 sujet · ${c.tm.writing} min)<br>✅ <b>Partie D : Entretien oral</b> (en salle ou à distance · ${c.tm.oral} min)</div>` : '<p class="muted">Test indisponible.</p>';
  };
  paintContent();
  $$('#tt .tab', view).forEach((b) => (b.onclick = () => { code = b.dataset.c; $$('#tt .tab', view).forEach((x) => x.classList.toggle('on', x === b)); paintContent(); }));
  $('#reset', view).onclick = () => newTest(view, ctx);
  $('#mk', view).onclick = async () => {
    let id;
    for (let k = 0; k < 20; k++) {
      id = String(Math.floor(100000 + Math.random() * 900000));
      try {
        await ctx.backend.createSession({ id, testCode: code, status: 'created', createdAt: Date.now(), expiresAt: Date.now() + 7 * 864e5, createdBy: ctx.user.name || '', identity: {}, exits: [], oral: { mode: $('input[name=om]:checked', view).value, live: false, link: '' } });
        break;
      } catch (e) { id = null; }
    }
    if (!id) return toast('Impossible de créer la session');
    const url = candUrl(id), until = new Date(Date.now() + 7 * 864e5);
    $('#res', view).innerHTML = `<div class="row" style="background:linear-gradient(90deg,#FFF3D6,#fff);border-radius:16px;padding:10px 16px"><span class="doneicon" style="width:50px;height:50px;font-size:1.6rem">✔</span><h2 style="margin:0;font-size:1.6rem">Test créé avec succès !</h2></div>
      <p class="qbig" style="text-align:center;margin-top:16px">Code d’accès du test</p>
      <div class="row" style="flex-wrap:nowrap"><div class="bigcode">${id}</div><button class="btn gold" id="cp" title="Copier" style="min-width:64px">⧉</button></div>
      <div class="row mt" style="align-items:flex-start;flex-wrap:nowrap"><div style="width:230px;background:#fff;border-radius:14px;padding:8px;border:1px solid var(--line);flex:none" id="qrw">${qrSvg(url, 6, 'H') || '<p class="muted">QR indisponible</p>'}</div>
      <div><h3>↗ Partager le test</h3><p class="muted">Donnez ce code ou ce QR code au candidat pour qu’il accède au test.</p>
        <div class="row"><button class="btn sm" id="dq">⬇ Télécharger le QR code</button><button class="btn sm" id="pq">🖨 Imprimer</button><a class="btn sm wa" href="${waLink('', 'Votre test de placement VLA : ' + url + ' — code : ' + id)}" target="_blank" rel="noopener">WhatsApp</a></div></div></div>
      <div class="info mt" style="display:block;line-height:1.9">📅 Validité du test : <b>7 jours</b> (jusqu’au ${until.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à 23:59)<br>👥 Nombre de candidats : <b>un candidat par code</b> — créez un code par personne.</div>
      <a class="btn primary big" href="#/staff/session/${id}">Suivre ce test  ❯</a>`;
    $('#cp', view).onclick = () => navigator.clipboard?.writeText(id).then(() => toast('Code copié'));
    $('#dq', view).onclick = () => downloadQr($('#qrw svg', view), id);
    $('#pq', view).onclick = () => { const w = window.open('', '_blank'); w.document.write(`<title>Code ${id}</title><body style="font-family:sans-serif;text-align:center"><img src="${IMG.logo}" width="120"><h1>Test de placement VLA</h1><div style="width:300px;margin:auto">${$('#qrw', view).innerHTML}</div><h1 style="letter-spacing:.3em">${id}</h1><p>${esc(url)}</p><script>setTimeout(print,400)<\/script>`); w.document.close(); };
  };
}
function downloadQr(svg, id) {
  if (!svg) return;
  const x = new XMLSerializer().serializeToString(svg), img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 600; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 600, 600); g.drawImage(img, 0, 0, 600, 600); const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `VLA-QR-${id}.png`; a.click(); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(x);
}

/* ------------------------------ Suivi en direct ------------------------------ */
async function live(view, ctx, selected) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">👥</span>Suivi des sessions en cours</h2><span class="pill ok" style="font-size:.95rem">● Mise à jour en direct</span></div><div id="kp"></div><div class="split"><div class="panel"><div class="row sb mb">
    <input class="txt grow" id="q" placeholder="🔍 Rechercher un candidat (nom, code…)"><select class="txt" id="fs" style="width:auto"><option value="">Tous les statuts</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div>
    <div class="tablewrap" id="tb"></div></div><div id="dt"></div></div>`;
  let sess = [], sel = selected || null;
  const paint = () => {
    const q = $('#q', view).value.toLowerCase(), f = $('#fs', view).value;
    const rows = sess.filter((s) => (!f || s.status === f) && (!q || (name(s) + s.id).toLowerCase().includes(q))).sort((a, b) => b.createdAt - a.createdAt);
    const c = (k) => sess.filter((s) => (Array.isArray(k) ? k : [k]).includes(s.status)).length;
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('👥', sess.length, 'Sessions')}${kpi('✅', c(['waiting', 'running']), 'En cours', 'g')}${kpi('🏁', c('finished'), 'Écrit terminé')}${kpi('⚠️', sess.filter((s) => s.exits?.length).length, 'Avec sorties', 'y')}</div>`;
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th>Candidat</th><th>Test</th><th>Partie</th><th>Avancement</th><th>Temps</th><th>Sorties</th><th>Statut</th></tr>${rows.map((s) => `<tr class="click ${s.id === sel ? 'sel' : ''}" data-id="${s.id}"><td><b>${esc(name(s))}</b><br><span class="muted">${s.id}</span></td><td>${s.testCode}</td><td>${PART[s.part] || '—'}</td><td>${s.qIndex ? s.qIndex + '/' + s.total : '—'} · ${s.pct || 0} %<div class="mini"><i style="width:${s.pct || 0}%"></i></div></td><td>${s.status === 'running' ? timeLeft(s) : '—'}</td><td>${exitsBadge(s)}</td><td>${statusPill(s.status)}</td></tr>`).join('')}</table>` : '<p class="muted">Aucune session.</p>';
    $$('tr.click', view).forEach((r) => (r.onclick = () => { sel = r.dataset.id; paint(); }));
    const s = sess.find((x) => x.id === sel);
    $('#dt', view).innerHTML = s ? detailPanel(s) : '<div class="panel muted">Sélectionnez une session pour voir le détail.</div>';
  };
  $('#q', view).oninput = paint; $('#fs', view).onchange = paint;
  subscribe(ctx, ctx.backend.onSessions((l) => { sess = l; paint(); }));
}

function detailPanel(s) {
  return `<div class="panel"><h2>Détails de la session</h2><div class="row"><img class="avatar lg" src="${esc(ph(s))}" alt=""><div><h2 style="margin:0">${esc(name(s))}</h2><span class="muted">Code ${s.id} · ${TEST_NAMES[s.testCode]}</span><br>${statusPill(s.status)}</div></div>
    <div class="mt">📞 ${esc(s.identity?.tel || '—')} · 🎯 ${esc(s.identity?.objectif || '—')}<br>🕘 Créé le ${fmtDateTime(s.createdAt)}${s.startedAt ? ' · démarré ' + fmtDateTime(s.startedAt) : ''}</div>
    <div class="mt"><b>Avancement</b> <span class="muted">${PART[s.part] || ''}</span><div class="mini" style="height:14px"><i style="width:${s.pct || 0}%"></i></div></div>
    ${s.exits?.length ? `<div class="info mt" style="background:var(--err-soft);border-color:#f3c1bb"><div>⚠ <b>${s.exits.length} sortie(s) de l'application</b><br>${s.exits.map((e) => fmtDateTime(e.t).slice(-5) + ' (' + e.type + ')').join(' · ')}</div></div>` : ''}
    <div class="row mt"><a class="btn primary" href="#/staff/${isDone(s) ? 'correct' : 'session'}/${s.id}">${isDone(s) ? 'Corriger / résultat  ❯' : 'Voir les réponses  ❯'}</a></div></div>`;
}

async function sessionDetail(view, ctx, id) {
  view.innerHTML = '<div id="d"></div><div class="panel"><h2>Réponses au fil de l’eau</h2><div id="ans" class="muted">Aucune réponse.</div></div>';
  let s = null, answers = {};
  const paint = () => {
    if (!s) return ($('#d', view).innerHTML = '<div class="panel">Session introuvable.</div>');
    $('#d', view).innerHTML = detailPanel(s) + (['running', 'waiting', 'created'].includes(s.status) ? `<div class="panel"><b>Code :</b> <span style="font-size:1.6rem;font-weight:800;letter-spacing:.2em">${s.id}</span> <button class="btn sm" id="qr">QR</button><div id="qrb"></div></div>` : '');
    $('#qr', view) && ($('#qr', view).onclick = () => ($('#qrb', view).innerHTML = `<div style="width:200px">${qrSvg(candUrl(s.id))}</div>`));
    const list = Object.entries(answers).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
    $('#ans', view).innerHTML = list.length ? `<table class="t"><tr><th>Question</th><th>Réponse</th><th>Heure</th></tr>${list.map(([k, v]) => `<tr><td>${k}</td><td>${esc(String(v.v).slice(0, 200))}</td><td>${new Date(v.t).toLocaleTimeString('fr-FR')}</td></tr>`).join('')}</table>` : 'Aucune réponse.';
  };
  subscribe(ctx, ctx.backend.onSession(id, (x) => { s = x; paint(); }));
  subscribe(ctx, ctx.backend.onAnswers(id, (a) => { answers = a; paint(); }));
}

/* ------------------------------ Résultats & notes / Attestations ------------------------------ */
async function results(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">📊</span>Résultats &amp; notes</h2></div><div class="panel"><div class="tablewrap" id="tb"></div></div>';
  let sess = [], res = [];
  const paint = () => {
    const rows = sess.filter(isDone).sort((a, b) => (b.finishedAt || b.createdAt) - (a.finishedAt || a.createdAt));
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th>Candidat</th><th>Test</th><th>Terminé</th><th>Niveau global</th><th>Statut</th><th></th></tr>${rows.map((s) => { const r = res.find((x) => x.id === s.id); return `<tr><td><img class="avatar sm" src="${esc(ph(s))}"> <b>${esc(name(s))}</b></td><td>${s.testCode}</td><td>${fmtDateTime(s.finishedAt)}</td><td>${r?.global ? `<span class="pill done">${esc(r.global)}</span>` : '—'}</td><td>${statusPill(s.status)}</td><td><a class="btn sm ${s.status === 'finished' ? 'gold' : ''}" href="#/staff/correct/${s.id}">${s.status === 'finished' ? 'Corriger' : 'Ouvrir'}</a></td></tr>`; }).join('')}</table>` : '<p class="muted">Aucun test terminé pour l’instant.</p>';
  };
  subscribe(ctx, ctx.backend.onSessions((l) => { sess = l; paint(); })); subscribe(ctx, ctx.backend.onResults((l) => { res = l; paint(); }));
}

async function attest(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">🎖️</span>Attestations</h2></div><div class="panel"><div class="tablewrap" id="tb"></div></div>';
  subscribe(ctx, ctx.backend.onResults((l) => {
    const rows = l.filter((r) => r.validatedAt).sort((a, b) => b.validatedAt - a.validatedAt);
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th>N°</th><th>Candidat</th><th>Test</th><th>Niveau</th><th>Date</th><th></th></tr>${rows.map((r) => `<tr><td><b>${esc(r.attestationNo)}</b></td><td>${esc(r.name || r.id)}</td><td>${r.testCode}</td><td><span class="pill done">${esc(r.global)}</span></td><td>${fmtDate(r.validatedAt)}</td><td><a class="btn sm" href="#/staff/attestation/${r.id}">Ouvrir</a></td></tr>`).join('')}</table>` : '<p class="muted">Aucune attestation. Validez un résultat pour la générer.</p>';
  }));
}

/* ------------------------------ Candidats & prospects ------------------------------ */
async function people(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">👥</span>Candidats &amp; prospects</h2></div><div class="panel"><div class="row mb"><input class="txt grow" id="q" placeholder="🔍 Rechercher"><select class="txt" id="fl" style="width:auto"><option value="">Toutes décisions</option><option value="souhaitée">Inscription souhaitée</option><option value="réfléchit">Réfléchit</option><option value="non">Non</option><option value="inscrit">Inscrits</option></select><select class="txt" id="ft" style="width:auto"><option value="">Tous les tests</option><option>ADU</option><option>ENF</option><option>IEL</option></select></div><div class="tablewrap" id="tb"></div></div>';
  let list = [];
  const paint = () => {
    const q = $('#q', view).value.toLowerCase(), f = $('#fl', view).value, t = $('#ft', view).value;
    const rows = list.filter((p) => (!q || (p.nom + p.prenom + p.tel).toLowerCase().includes(q)) && (!f || (f === 'inscrit' ? p.status === 'Inscrit' : p.decision === f)) && (!t || p.testCode === t)).sort((a, b) => b.testDate - a.testDate);
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th></th><th>Nom</th><th>Test</th><th>Niveau</th><th>Formation</th><th>Date</th><th>Décision</th></tr>${rows.map((p) => `<tr class="click" data-id="${p.id}"><td><img class="avatar sm" src="${esc(p.photo || IMG.logo)}"></td><td><b>${esc(p.prenom)} ${esc(p.nom)}</b><br><span class="muted">${esc(p.tel || '')}</span></td><td>${p.testCode}</td><td><span class="pill done">${esc(p.level || '—')}</span></td><td>${esc(p.formation || '')}</td><td>${fmtDate(p.testDate)}</td><td>${p.status === 'Inscrit' ? '<span class="pill ok">Inscrit</span>' : `<span class="pill ${p.decision === 'souhaitée' ? 'ok' : p.decision === 'non' ? 'bad' : 'wait'}">${p.decision || 'à voir'}</span>`}</td></tr>`).join('')}</table>` : '<p class="muted">Aucun prospect. Ils apparaissent ici quand vous validez un résultat.</p>';
    $$('tr.click', view).forEach((r) => (r.onclick = () => (location.hash = (location.hash.startsWith('#/centre') ? '#/centre' : '#/staff') + '/person/' + r.dataset.id)));
  };
  ['#q', '#fl', '#ft'].forEach((s) => ($(s, view).oninput = paint));
  subscribe(ctx, ctx.backend.onPeople((l) => { list = l; paint(); }));
}

async function person(view, ctx, id) {
  const all = (await ctx.backend.listPeople()).sort((a, b) => b.testDate - a.testDate);
  const idx = all.findIndex((x) => x.id === id), p = all[idx];
  if (!p) return (view.innerHTML = '<div class="panel">Fiche introuvable. <a href="#/staff/people">Retour</a></div>');
  const R = p.sessionId ? await ctx.backend.getResult(p.sessionId) : null;
  const L = R?.levels || {};
  const nav = (d) => (all[idx + d] ? `href="#/staff/person/${all[idx + d].id}"` : 'disabled');
  const rowRes = (ic, lab, lv, extra) => `<div class="row sb" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${ic} <b>${lab}</b></span><span class="muted">${esc(extra || '')}</span><span class="pill done">${esc(lv || '—')}</span></div>`;
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">👤</span>Fiche prospect</h2><div class="row"><a class="btn sm" ${nav(-1)}>← Prospect précédent</a><a class="btn sm" ${nav(1)}>Prospect suivant →</a></div></div>
  <div class="panel"><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><img class="avatar lg" style="width:150px;height:170px" src="${esc(p.photo || IMG.logo)}">
    <div class="grow"><h2 style="font-size:2rem;margin:0">${esc(p.prenom)} ${esc(p.nom)}</h2><div class="mt" style="line-height:2">🎓 ${p.status === 'Inscrit' ? 'Inscrit' : 'Candidat testé · Prospect'}<br>📞 ${esc(p.tel || '—')} ${p.email ? '<br>✉ ' + esc(p.email) : ''}${p.ville ? '<br>📍 ' + esc(p.ville) : ''}</div></div>
    <div style="line-height:2">📅 Test : ${fmtDate(p.testDate)}<br>🗂 ${TEST_NAMES[p.testCode] || ''}<br>🎟 Attestation ${esc(p.attestationNo || '—')}</div>
    <div style="min-width:250px"><b>Statut du prospect</b><div class="pill ${p.status === 'Inscrit' ? 'ok' : 'wait'}" style="display:block;text-align:center;font-size:1.2rem;padding:10px;margin:6px 0">${p.status === 'Inscrit' ? '✔ Inscrit' : '✔ Testé · Prospect'}</div>
    <a class="btn wa big" style="min-height:62px;font-size:1.1rem" target="_blank" rel="noopener" href="${waLink(p.tel, `Bonjour ${p.prenom}, c'est Valérie Language Academy. Voici votre résultat au test de placement : niveau ${p.level} (${p.formation || ''}). Souhaitez-vous vous inscrire ?`)}">💬 Contacter sur WhatsApp</a></div></div></div>
  <div class="grid3" style="align-items:start"><div class="panel"><h2>📊 Résultats du test</h2>${rowRes('🎧', 'Compréhension orale', L.listening)}${rowRes('📖', 'Langue & lecture', L.language)}${rowRes('✍️', 'Expression écrite', L.writing)}${rowRes('🎤', 'Expression orale', L.oral)}
      <div class="totalbar mt"><span>🏅 Niveau global (CECR)</span><span class="chipn" style="background:linear-gradient(#F7D769,#E2B230);color:var(--navy)">${esc(p.level || '—')}</span></div>
      <div class="info mt" style="display:block;background:#E8F1FC">🎓 <b>Formation recommandée</b><br>${esc(p.formation || '—')}</div></div>
    <div class="panel"><h2>📅 Parcours et suivi</h2><ul class="timeline"><li class="ok"><i></i><b>Test de placement réalisé</b><br><span class="muted">${fmtDate(p.testDate)} · Niveau ${esc(p.level || '')}</span></li>
      <li class="${p.formation ? 'ok' : ''}"><i></i><b>Proposition de formation</b><br><span class="muted">${p.formation ? 'Faite' : 'À faire'}</span></li>
      <li class="${p.status === 'Inscrit' ? 'ok' : ''}"><i></i><b>Inscription</b><br><span class="muted">${p.status === 'Inscrit' ? 'Inscrit' : 'À venir'}</span></li><li class="${p.debut ? 'ok' : ''}"><i></i><b>Début des cours</b><br><span class="muted">À planifier</span></li></ul>
      <h3>Décision du candidat</h3><div class="row" id="dec">${[['souhaitée', 'Inscription souhaitée'], ['réfléchit', 'Réfléchit'], ['non', 'Non']].map(([v, l]) => `<button class="lvl ${p.decision === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div><div class="panel tint-gold"><h2>📝 Notes internes</h2><textarea class="txt" id="nt" style="min-height:120px;background:transparent">${esc(p.notes || '')}</textarea></div>
      <div class="panel"><h2>🔔 Rappels / Actions</h2><div class="row sb"><span><b>Relancer le prospect</b><br><input type="datetime-local" class="txt" id="rl" value="${esc(p.relance || '')}" style="margin-top:6px"></span><button class="switch ${p.relanceOn ? 'on' : ''}" id="sw" aria-label="Activer le rappel"></button></div></div></div></div>
  <div class="row mt"><a class="btn" href="#/staff/people">← Retour à la liste</a><button class="btn primary" id="sv">💾 Enregistrer la fiche</button>${p.sessionId ? `<a class="btn" href="#/staff/correct/${p.sessionId}">Voir le test</a><a class="btn" href="#/staff/attestation/${p.sessionId}">Attestation</a>` : ''}<button class="btn gold" id="ins">${p.status === 'Inscrit' ? '↩ Retirer « Inscrit »' : '🧑‍🎓 Inscrire à une formation'}</button></div>`;
  let cur = { ...p };
  $$('#dec .lvl[data-v]', view).forEach((b) => (b.onclick = () => { cur.decision = b.dataset.v; $$('#dec .lvl[data-v]', view).forEach((x) => x.classList.toggle('on', x === b)); }));
  $('#sw', view).onclick = (e) => { cur.relanceOn = !cur.relanceOn; e.currentTarget.classList.toggle('on'); };
  const save = async () => { cur.notes = $('#nt', view).value; cur.relance = $('#rl', view).value; await ctx.backend.putPerson(cur); };
  $('#sv', view).onclick = async () => { await save(); toast('Fiche enregistrée'); };
  $('#ins', view).onclick = async () => { cur.status = cur.status === 'Inscrit' ? 'Testé · prospect' : 'Inscrit'; if (cur.status === 'Inscrit') cur.decision = 'souhaitée'; await save(); person(view, ctx, id); };
}

/* ------------------------------ Statistiques ------------------------------ */
const COLORS = { 'Pré-A1': '#7c3aed', A1: '#f59e0b', A2: '#ef4444', B1: '#1D7BEA', B2: '#0F1F44', C1: '#8b5cf6', 'Débutant': '#7c3aed', Starter: '#f59e0b', '< B1': '#7c3aed' };
async function stats(view, ctx) {
  view.innerHTML = '<div id="s"></div>';
  let res = [], ppl = [];
  const paint = () => {
    const done = res.filter((r) => r.validatedAt);
    const months = {}; done.forEach((r) => { const k = new Date(r.validatedAt).toISOString().slice(0, 7); months[k] = (months[k] || 0) + 1; });
    const ks = Object.keys(months).sort().slice(-8), max = Math.max(1, ...ks.map((k) => months[k]));
    const lv = {}; ppl.forEach((p) => p.level && (lv[p.level] = (lv[p.level] || 0) + 1));
    const tot = Object.values(lv).reduce((a, b) => a + b, 0) || 1;
    const ins = ppl.filter((p) => p.status === 'Inscrit').length, wish = ppl.filter((p) => p.decision === 'souhaitée' || p.status === 'Inscrit').length, pend = ppl.filter((p) => p.status !== 'Inscrit').length;
    const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
    let acc = 0; const grad = Object.entries(lv).map(([l, n]) => { const s = (acc / tot) * 100; acc += n; return `${COLORS[l] || '#999'} ${s}% ${(acc / tot) * 100}%`; }).join(',');
    const byLvl = Object.entries(lv).map(([l, n]) => { const i = ppl.filter((p) => p.level === l && p.status === 'Inscrit').length; return `<tr><td><span class="pill" style="background:${COLORS[l] || '#999'}22;color:${COLORS[l] || '#999'}">${esc(l)}</span></td><td>${n}</td><td>${pct(n, tot)} %</td><td>${i}</td><td>${pct(i, n)} %</td></tr>`; }).join('');
    const top = Object.entries(lv).sort((a, b) => b[1] - a[1])[0];
    $('#s', view).innerHTML = `<div class="pagehead"><h2><span class="pic">📊</span>Statistiques globales</h2></div>
    <div class="kpis">${kpi('👥', done.length, 'Tests réalisés', '')}${kpi('🎓', ins, 'Inscriptions', 'y')}${kpi('🎯', pct(ins, ppl.length) + ' %', 'Taux de conversion (test → inscription)', 'g')}${kpi('🧑‍🤝‍🧑', pend, 'Prospects en cours (non inscrits)', 'p')}</div>
    <div class="split" style="grid-template-columns:1.2fr 1fr 1fr"><div class="panel"><h2>📊 Tests réalisés par mois</h2>${ks.length ? `<div class="chartbars">${ks.map((k) => `<div style="height:${(months[k] / max) * 100}%"><span>${months[k]}</span></div>`).join('')}</div><div class="chartlbl">${ks.map((k) => `<span>${k.slice(5)}/${k.slice(2, 4)}</span>`).join('')}</div>` : '<p class="muted">Pas encore de données.</p>'}</div>
    <div class="panel"><h2>◔ Répartition des niveaux</h2>${Object.keys(lv).length ? `<div class="row" style="flex-wrap:nowrap"><div class="donut" style="background:conic-gradient(${grad})"><div><span><span style="font-size:1.8rem">${ppl.length}</span><br>candidats</span></div></div><div class="legend">${Object.entries(lv).map(([l, n]) => `<div><i style="background:${COLORS[l] || '#999'}"></i>${esc(l)} : ${pct(n, tot)} % (${n})</div>`).join('')}</div></div>` : '<p class="muted">Pas encore de données.</p>'}</div>
    <div class="panel"><h2>🎯 Conversion : test → inscription</h2><div class="funnel"><div style="background:#E8F1FC"><span>Tests réalisés<br><b style="font-size:1.4rem">${done.length}</b></span><span class="pctbadge">100 %</span></div><div style="background:#FFF3D6"><span>Inscription souhaitée<br><b style="font-size:1.4rem">${wish}</b></span><span class="pctbadge">${pct(wish, ppl.length)} %</span></div><div style="background:#E6F6EC"><span>Inscrits<br><b style="font-size:1.4rem">${ins}</b></span><span class="pctbadge">${pct(ins, ppl.length)} %</span></div></div></div></div>
    <div class="split"><div class="panel"><h2>🧮 Résultats par niveau</h2>${byLvl ? `<table class="t"><tr><th>Niveau</th><th>Candidats</th><th>Part</th><th>Inscrits</th><th>Taux d’inscription</th></tr>${byLvl}<tr><td><b>Total</b></td><td><b>${ppl.length}</b></td><td>100 %</td><td><b>${ins}</b></td><td><b>${pct(ins, ppl.length)} %</b></td></tr></table>` : '<p class="muted">Pas encore de données.</p>'}</div>
    <div class="panel"><h2>💡 Enseignements clés</h2><ul class="insights" style="padding:0;margin:0"><li>${done.length} test(s) réalisé(s) au total.</li><li>Taux de conversion test → inscription : <b>${pct(ins, ppl.length)} %</b>.</li>${top ? `<li>Le niveau <b>${esc(top[0])}</b> est le plus représenté (${pct(top[1], tot)} % des candidats).</li>` : ''}<li>${ppl.filter((p) => p.decision === 'réfléchit').length} prospect(s) à relancer pour augmenter les inscriptions.</li></ul></div></div>`;
  };
  subscribe(ctx, ctx.backend.onResults((l) => { res = l; paint(); })); subscribe(ctx, ctx.backend.onPeople((l) => { ppl = l; paint(); }));
}

/* ------------------------------ Paramètres ------------------------------ */
async function settingsPage(view, ctx) {
  const s = ctx.settings;
  const have = await ctx.backend.listKeys().catch(() => []);
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">⚙️</span>Paramètres</h2></div><div class="panel"><h2>Centre et attestation</h2><div class="grid2">
    <label class="f">Nom affiché<input class="txt" id="nm" value="${esc(s.name || 'Valérie')}"></label>
    <label class="f">Ville (« Fait à … »)<input class="txt" id="ci" value="${esc(s.city || 'Garoua')}"></label>
    <label class="f">Nom de la directrice (signature)<input class="txt" id="dn" value="${esc(s.director ?? 'Mme FOTSA NOUMESSING Valérie épouse TEKEUTSA')}" placeholder="Mme … (apparaît sur l’attestation)"></label>
    <label class="f">Fonction<input class="txt" id="dt" value="${esc(s.directorTitle || 'La Directrice')}"></label>
    <label class="f">Téléphones<input class="txt" id="tl" value="${esc(s.phones || '')}" placeholder="+237 6 xx xx xx xx"></label>
    <label class="f">Adresse<input class="txt" id="ad" value="${esc(s.address || '')}" placeholder="Quartier, Garoua"></label></div>
    <div class="row mt"><div class="photo-pick"><img class="avatar lg" id="av" src="${esc(s.avatar || IMG.valerie)}"><div><b>Photo de profil</b><br><input type="file" id="avf" accept="image/*" class="hidden"><button class="btn sm" id="avb">📷 Choisir une photo</button></div></div>
    <div class="photo-pick"><div style="width:200px;height:90px;border:1px dashed #9aa6bd;border-radius:10px;display:grid;place-items:center;background:#fff"><img id="sg" src="${esc(s.signature || '')}" style="max-width:190px;max-height:80px;${s.signature ? '' : 'display:none'}"><span class="muted" id="sgp" style="${s.signature ? 'display:none' : ''}">Pas de signature</span></div><div><b>Signature numérique</b><br><span class="muted" style="font-size:.85rem">Photo ou scan de la signature, fond blanc.</span><br><input type="file" id="sgf" accept="image/*" class="hidden"><button class="btn sm" id="sgb">✍️ Ajouter la signature</button></div></div></div>
    <div class="mt"><label class="checkline" style="padding:2px 0"><input type="checkbox" id="ap" ${s.autoPublish === false ? '' : 'checked'}> Publier automatiquement le résultat et l’attestation sur l’écran du candidat quand je valide</label>
    <label class="checkline" style="padding:2px 0"><input type="checkbox" id="bn" ${s.boardNames === false ? '' : 'checked'}> Montrer les prénoms (+ initiale) des élèves dans « Vie du centre » (jamais téléphones, frais ni notes)</label></div>
    <button class="btn primary mt" id="sv">Enregistrer</button></div>
    <div class="panel"><h2>Corrigés des tests</h2><p class="muted">Les corrigés restent réservés au personnel (collection <code>tests_key</code>). Sélectionnez les 3 fichiers <code>test_ADU.json</code>, <code>test_ENF.json</code>, <code>test_IEL.json</code> complets (énoncés + corrigés).</p>
    <p>${['ADU', 'ENF', 'IEL'].map((c) => `<span class="pill ${have.includes(c) ? 'ok' : 'bad'}">${c} ${have.includes(c) ? '✔ importé' : '✖ manquant'}</span>`).join(' ')}</p>
    <input type="file" id="imp" accept=".json" multiple><div id="im" class="mt"></div></div>
    <div class="panel"><h2>Sauvegarde</h2><p class="muted">Mode ${ctx.backend.mode === 'firebase' ? 'Firebase (données dans le cloud)' : 'local : les données restent dans ce navigateur — pensez à exporter.'}</p>
    <button class="btn" id="ex">⬇ Exporter</button> <input type="file" id="ib" accept=".json" class="hidden"><button class="btn" id="im2">⬆ Importer</button></div>`;
  let avatar = s.avatar, signature = s.signature;
  $('#avb', view).onclick = () => $('#avf', view).click();
  $('#avf', view).onchange = async (e) => { if (e.target.files[0]) { avatar = await resizePhoto(e.target.files[0]); $('#av', view).src = avatar; } };
  $('#sgb', view).onclick = () => $('#sgf', view).click();
  $('#sgf', view).onchange = async (e) => { if (e.target.files[0]) { signature = await resizeSig(e.target.files[0]); const g = $('#sg', view); g.src = signature; g.style.display = ''; $('#sgp', view).style.display = 'none'; } };
  $('#sv', view).onclick = async () => { await ctx.backend.putSettings({ ...s, name: $('#nm', view).value, city: $('#ci', view).value, director: $('#dn', view).value, directorTitle: $('#dt', view).value, phones: $('#tl', view).value, address: $('#ad', view).value, avatar, signature, autoPublish: $('#ap', view).checked, boardNames: $('#bn', view).checked }); toast('Enregistré'); setTimeout(() => location.reload(), 500); };
  $('#imp', view).onchange = async (e) => {
    const out = [];
    for (const f of e.target.files) {
      try {
        const full = JSON.parse(await f.text());
        if (!full.code || !full.paliers) throw new Error('format');
        const { pub, key } = splitTest(full);
        await ctx.backend.putTest(full.code, pub, key); KEYS.drop(full.code);
        out.push(`✔ ${full.code} importé`);
      } catch { out.push(`✖ ${f.name} : fichier invalide`); }
    }
    $('#im', view).innerHTML = out.join('<br>'); setTimeout(() => settingsPage(view, ctx), 900);
  };
  $('#ex', view).onclick = async () => { const b = new Blob([JSON.stringify(await ctx.backend.exportAll())], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `vla-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; a.click(); };
  $('#im2', view).onclick = () => $('#ib', view).click();
  $('#ib', view).onchange = async (e) => { await ctx.backend.importAll(JSON.parse(await e.target.files[0].text())); toast('Importé'); };
}
function resizeSig(file) {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const k = Math.min(1, 480 / img.width); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.85)); }; img.onerror = rej; img.src = URL.createObjectURL(file); });
}
