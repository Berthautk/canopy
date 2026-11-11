// Espace de Valérie : connexion, tableau de bord, création de session, suivi en direct,
// candidats/prospects, statistiques, paramètres. (La correction est dans correct.js.)
import { esc, $, $$, fmtTime, fmtDate, fmtDateTime, toast, qrSvg, waLink, resizePhoto, IMG, TEST_NAMES, TEST_ICONS, LEVEL_NAMES } from './ui.js';
import { splitTest } from './scoring.js';
import { renderCorrection, renderAttestation, KEYS } from './correct.js';

export const STATUS = {
  created: ['En attente', 'grey'], waiting: ['Connecté', 'wait'], running: ['En cours', 'run'], finished: ['Écrit terminé', 'done'],
  corrected: ['Corrigé', 'ok'], delivered: ['Attestation remise', 'ok'],
};
const NAV = [
  ['', '🏠', 'Tableau de bord'], ['new', '➕', 'Nouveau test'], ['live', '📋', 'Suivi en direct'],
  ['people', '👥', 'Candidats & prospects'], ['stats', '📊', 'Statistiques'], ['settings', '⚙️', 'Paramètres'],
];

export async function runStaff(root, backend, path) {
  const st = await backend.staffState();
  if (!st.user) return login(root, backend, st);
  const settings = await backend.getSettings();
  const ctx = { root, backend, settings, user: st.user, cleanup: [] };
  window.__vlaCleanup?.forEach((f) => f()); window.__vlaCleanup = ctx.cleanup;
  const [page, a] = path;
  const titles = { '': 'Tableau de bord', new: 'Créer un nouveau test de placement', live: 'Suivi des sessions en cours', people: 'Candidats & prospects', person: 'Fiche prospect', stats: 'Statistiques globales', settings: 'Paramètres', correct: 'Correction du test', attestation: 'Attestation de résultat', session: 'Détail de la session' };
  const nav = (p) => (p === (page === 'person' ? 'people' : page === 'correct' || page === 'attestation' || page === 'session' ? 'live' : page || ''));
  root.innerHTML = `<div class="app">
    <aside class="side"><div class="brand"><img src="${IMG.logo}" alt=""><div>Valérie<br>Language<br>Academy</div></div>
      ${NAV.map(([p, i, l]) => `<a href="#/staff${p ? '/' + p : ''}" class="${nav(p) ? 'on' : ''}"><span>${i}</span>${l}</a>`).join('')}
      <div class="sp"></div>
      <a href="#/c" target="_blank">🧑‍🎓 Écran candidat</a>
      <a href="#" id="out">⏻ Déconnexion</a></aside>
    <div><div class="top"><div><h1>Espace de Valérie</h1><div class="sub">${titles[page || ''] || ''}</div></div>
      <div class="me"><span class="pill ${backend.mode === 'firebase' ? 'ok' : 'done'}">${backend.mode === 'firebase' ? '● En ligne (Firebase)' : '● Mode local'}</span>
      <img class="avatar sm" src="${esc(settings.avatar || IMG.valerie)}" alt=""><div>${esc(settings.name || 'Valérie')}<br><span style="font-weight:400;font-size:.8rem">Administratrice</span></div></div></div>
      <div class="content" id="view"></div></div></div>`;
  $('#out', root).onclick = async (e) => { e.preventDefault(); await backend.staffLogout(); location.hash = '#/staff'; location.reload(); };
  const view = $('#view', root);
  const pages = { '': dashboard, new: newTest, live: live, people, person, stats, settings: settingsPage, correct: renderCorrection, attestation: renderAttestation, session: sessionDetail };
  await (pages[page || ''] || dashboard)(view, ctx, a, path);
}

/* ------------------------------ Connexion ------------------------------ */
function login(root, backend, st) {
  const local = backend.mode === 'local';
  root.innerHTML = `<div class="login ccard" style="background:#fff;padding:28px;border-radius:22px;border:1px solid var(--line)">
    <img src="${IMG.logo}" width="110" style="border-radius:50%"><h1>Espace de Valérie</h1>
    <p class="muted">${local ? (st.hasPin ? 'Saisissez votre code PIN.' : 'Première utilisation : choisissez un code PIN (4 chiffres ou plus).') : 'Connectez-vous avec votre compte.'}</p>
    ${local ? '<input class="txt" id="pin" type="password" inputmode="numeric" placeholder="Code PIN" autocomplete="off">'
      : '<input class="txt" id="em" type="email" placeholder="Email" autocomplete="username"><input class="txt mt" id="pw" type="password" placeholder="Mot de passe" autocomplete="current-password">'}
    <p id="le" style="color:var(--err)"></p>
    <button class="btn primary big" id="ok">Se connecter</button>
    <p class="mt"><a href="#/c">← Écran candidat</a></p></div>`;
  const go = async () => {
    try { await backend.staffLogin(local ? { pin: $('#pin', root).value } : { email: $('#em', root).value, password: $('#pw', root).value }); location.reload(); }
    catch (e) { $('#le', root).textContent = e.message || 'Connexion refusée'; }
  };
  $('#ok', root).onclick = go; root.onkeydown = (e) => e.key === 'Enter' && go();
}

/* ------------------------------ Outils ------------------------------ */
const subscribe = (ctx, unsub) => ctx.cleanup.push(unsub);
const name = (s) => [s.identity?.prenom, s.identity?.nom].filter(Boolean).join(' ') || '— (pas encore identifié)';
const ph = (s) => s.identity?.photo || (s.testCode === 'ENF' ? 'assets/people/enfant2.jpg' : 'assets/people/candidat1.jpg');
export const statusPill = (s) => { const [t, c] = STATUS[s] || ['?', 'grey']; return `<span class="pill ${c}">${t}</span>`; };
const timeLeft = (s) => (s.timeLeft && s.part && s.timeLeft[s.part] != null ? fmtTime(s.timeLeft[s.part]) : '—');
const PART = { A: 'Écoute', B: 'Langue & lecture', C: 'Écriture', done: 'Écrit terminé' };
const exitsBadge = (s) => (s.exits?.length ? `<span class="badge-exit">⚠ ${s.exits.length}</span>` : '<span class="muted">0</span>');
const candUrl = (code) => `${location.origin}${location.pathname}#/c/${code}`;

/* ------------------------------ Tableau de bord ------------------------------ */
async function dashboard(view, ctx) {
  view.innerHTML = '<div id="kp"></div><div class="split"><div class="panel"><h2>Sessions récentes</h2><div class="tablewrap" id="rec"></div></div><div><div class="panel"><h2>Raccourcis</h2><div class="row"><a class="btn primary" href="#/staff/new">➕ Nouveau test</a><a class="btn" href="#/staff/live">📋 Suivi en direct</a></div></div><div class="panel"><h2>📲 Relances WhatsApp</h2><div id="rel" class="muted">Aucune relance.</div></div></div></div>';
  let sess = [], people = [];
  const paint = () => {
    const run = sess.filter((s) => ['waiting', 'running'].includes(s.status)).length;
    const fin = sess.filter((s) => s.status === 'finished').length;
    const done = sess.filter((s) => ['corrected', 'delivered'].includes(s.status)).length;
    $('#kp', view).outerHTML = `<div class="kpis" id="kp"><div class="kpi"><div class="ic">▶️</div><div><b>${run}</b><span>En cours</span></div></div><div class="kpi"><div class="ic" style="background:var(--gold-soft)">✍️</div><div><b>${fin}</b><span>À corriger</span></div></div><div class="kpi"><div class="ic" style="background:#E8F6EE">✅</div><div><b>${done}</b><span>Terminés</span></div></div><div class="kpi"><div class="ic" style="background:#EAF3FF">👥</div><div><b>${people.length}</b><span>Prospects</span></div></div></div>`;
    const recent = [...sess].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
    $('#rec', view).innerHTML = recent.length ? `<table class="t"><tr><th>Candidat</th><th>Test</th><th>Statut</th><th></th></tr>${recent.map((s) => `<tr><td><b>${esc(name(s))}</b><br><span class="muted">Code ${s.id}</span></td><td>${s.testCode}</td><td>${statusPill(s.status)}</td><td><a class="btn sm" href="#/staff/${s.status === 'finished' || s.status === 'corrected' || s.status === 'delivered' ? 'correct' : 'session'}/${s.id}">Ouvrir</a></td></tr>`).join('')}</table>` : '<p class="muted">Aucune session pour l’instant. Cliquez sur « Nouveau test ».</p>';
    const rel = people.filter((p) => p.decision === 'réfléchit');
    $('#rel', view).innerHTML = rel.length ? rel.map((p) => `<div class="row sb mb"><span><b>${esc(p.prenom)} ${esc(p.nom)}</b><br><span class="muted">${esc(p.level || '')} · ${fmtDate(p.testDate)}</span></span><a class="btn sm teal" target="_blank" rel="noopener" href="${waLink(p.tel, `Bonjour ${p.prenom}, c'est Valérie Language Academy. Vous avez passé votre test de placement (niveau ${p.level || ''}). Avez-vous réfléchi à votre inscription ?`)}">WhatsApp</a></div>`).join('') : 'Aucune relance à faire.';
  };
  subscribe(ctx, ctx.backend.onSessions((l) => { sess = l; paint(); }));
  subscribe(ctx, ctx.backend.onPeople((l) => { people = l; paint(); }));
}

/* ------------------------------ Nouveau test ------------------------------ */
async function newTest(view, ctx) {
  let have = [];
  try { have = await ctx.backend.listKeys(); } catch { /* */ }
  view.innerHTML = `<div class="split"><div class="panel"><h2>Informations sur le test</h2>
    <div class="tabs" id="tt">${['ADU', 'ENF', 'IEL'].map((c, i) => `<button class="tab ${i ? '' : 'on'}" data-c="${c}">${TEST_ICONS[c]} ${TEST_NAMES[c]}</button>`).join('')}</div>
    <div id="tinfo" class="info"></div>
    <h3>Lieu de l'entretien oral</h3>
    <div class="row"><label class="checkline"><input type="radio" name="om" value="presentiel" checked> 🏫 En salle (présentiel)</label><label class="checkline"><input type="radio" name="om" value="distance"> 🌐 À distance (visio)</label></div>
    <button class="btn primary big mt" id="mk">Créer le test</button>
    ${have.length < 3 ? '<p class="info mt" style="background:var(--err-soft)">⚠️ Corrigés manquants pour : ' + ['ADU', 'ENF', 'IEL'].filter((c) => !have.includes(c)).join(', ') + '. Importez-les dans Paramètres avant la correction.</p>' : ''}</div>
    <div class="panel" id="res"><h2>Code d'accès</h2><p class="muted">Le code et le QR code apparaîtront ici. Vous pouvez lancer plusieurs candidats en même temps.</p></div></div>`;
  let code = 'ADU';
  const t = { ADU: ['Adolescents (14 ans et +) & Adultes · A1 → C1', '90 min'], ENF: ['Enfants 8 à 13 ans · Starter → A2', '60 min'], IEL: ['IELTS / TOEFL · B1 → C1', '140 min'] };
  const info = () => ($('#tinfo', view).innerHTML = `📝 <div><b>${t[code][0]}</b><br>Durée totale ≈ ${t[code][1]} · écoute, langue &amp; lecture, écriture, oral</div>`);
  info();
  $$('.tab', view).forEach((b) => (b.onclick = () => { code = b.dataset.c; $$('.tab', view).forEach((x) => x.classList.toggle('on', x === b)); info(); }));
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
    const url = candUrl(id);
    $('#res', view).innerHTML = `<h2>✔ Test créé avec succès !</h2><p class="muted">Code d'accès au test — à saisir sur l'appareil du candidat :</p>
      <div class="bigcode">${id}</div>
      <div style="width:210px;margin:14px auto">${qrSvg(url) || '<p class="muted">QR indisponible</p>'}</div>
      <p class="muted" style="text-align:center">Scannez le QR code ou saisissez le code. Valable 7 jours.</p>
      <div class="row" style="justify-content:center"><button class="btn" id="cp">📋 Copier le lien</button><a class="btn teal" href="${waLink('', 'Votre test de placement VLA : ' + url + ' — code : ' + id)}" target="_blank" rel="noopener">WhatsApp</a><a class="btn primary" href="#/staff/session/${id}">Suivre ›</a></div>`;
    $('#cp', view).onclick = () => navigator.clipboard?.writeText(url).then(() => toast('Lien copié'));
  };
}

/* ------------------------------ Suivi en direct ------------------------------ */
async function live(view, ctx, selected) {
  view.innerHTML = `<div id="kp" class="kpis"></div><div class="split"><div class="panel"><div class="row sb mb"><h2 style="margin:0">Sessions</h2>
    <select class="txt" id="fs" style="width:auto"><option value="">Tous les statuts</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div>
    <input class="txt mb" id="q" placeholder="🔍 Rechercher (nom, code…)"><div class="tablewrap" id="tb"></div></div><div id="dt"></div></div>`;
  let sess = [], sel = selected || null;
  const paint = () => {
    const q = $('#q', view).value.toLowerCase(), f = $('#fs', view).value;
    const rows = sess.filter((s) => (!f || s.status === f) && (!q || (name(s) + s.id).toLowerCase().includes(q))).sort((a, b) => b.createdAt - a.createdAt);
    const c = (k) => sess.filter((s) => (Array.isArray(k) ? k : [k]).includes(s.status)).length;
    $('#kp', view).innerHTML = [['👥', sess.length, 'Sessions'], ['▶️', c(['waiting', 'running']), 'En cours'], ['🏁', c('finished'), 'Écrit terminé'], ['⚠️', sess.filter((s) => s.exits?.length).length, 'Avec sorties']].map(([i, n, l]) => `<div class="kpi"><div class="ic">${i}</div><div><b>${n}</b><span>${l}</span></div></div>`).join('');
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th>Candidat</th><th>Test</th><th>Partie</th><th>Q.</th><th>Temps</th><th>Sorties</th><th>Statut</th></tr>${rows.map((s) => `<tr class="click" data-id="${s.id}"><td><b>${esc(name(s))}</b><br><span class="muted">${s.id}</span></td><td>${s.testCode}</td><td>${PART[s.part] || '—'}</td><td>${s.qIndex ? s.qIndex + '/' + s.total : '—'}<div class="mini"><i style="width:${s.pct || 0}%"></i></div></td><td>${s.status === 'running' ? timeLeft(s) : '—'}</td><td>${exitsBadge(s)}</td><td>${statusPill(s.status)}</td></tr>`).join('')}</table>` : '<p class="muted">Aucune session.</p>';
    $$('tr.click', view).forEach((r) => (r.onclick = () => { sel = r.dataset.id; paint(); }));
    const s = sess.find((x) => x.id === sel);
    $('#dt', view).innerHTML = s ? detailPanel(s) : '<div class="panel muted">Sélectionnez une session pour voir le détail.</div>';
  };
  $('#q', view).oninput = paint; $('#fs', view).onchange = paint;
  subscribe(ctx, ctx.backend.onSessions((l) => { sess = l; paint(); }));
}

function detailPanel(s) {
  const done = ['finished', 'corrected', 'delivered'].includes(s.status);
  return `<div class="panel"><div class="row"><img class="avatar" src="${esc(ph(s))}" alt=""><div><h2 style="margin:0">${esc(name(s))}</h2><span class="muted">Code ${s.id} · ${TEST_NAMES[s.testCode]}</span><br>${statusPill(s.status)}</div></div>
    <div class="mt">📞 ${esc(s.identity?.tel || '—')} · 🎯 ${esc(s.identity?.objectif || '—')}<br>🕘 Créé le ${fmtDateTime(s.createdAt)}${s.startedAt ? ' · démarré ' + fmtDateTime(s.startedAt) : ''}</div>
    <div class="mt"><b>Avancement</b> <span class="muted">${PART[s.part] || ''}</span><div class="mini" style="height:14px"><i style="width:${s.pct || 0}%"></i></div></div>
    ${s.exits?.length ? `<div class="info mt" style="background:var(--err-soft);border-color:#f3c1bb"><div>⚠ <b>${s.exits.length} sortie(s) de l'application</b><br>${s.exits.map((e) => fmtDateTime(e.t).slice(-5) + ' (' + e.type + ')').join(' · ')}</div></div>` : ''}
    <div class="row mt"><a class="btn primary" href="#/staff/${done ? 'correct' : 'session'}/${s.id}">${done ? 'Corriger / résultat ›' : 'Voir les réponses ›'}</a></div></div>`;
}

async function sessionDetail(view, ctx, id) {
  view.innerHTML = '<div id="d"></div><div class="panel"><h2>Réponses au fil de l’eau</h2><div id="ans" class="muted">Aucune réponse.</div></div>';
  let s = null, answers = {};
  const paint = async () => {
    if (!s) return ($('#d', view).innerHTML = '<div class="panel">Session introuvable.</div>');
    $('#d', view).innerHTML = detailPanel(s) + (s.status === 'running' || s.status === 'waiting' || s.status === 'created' ? `<div class="panel"><b>Code :</b> <span style="font-size:1.6rem;font-weight:800;letter-spacing:.2em">${s.id}</span> <button class="btn sm" id="qr">QR</button><div id="qrb"></div></div>` : '');
    $('#qr', view) && ($('#qr', view).onclick = () => ($('#qrb', view).innerHTML = `<div style="width:200px">${qrSvg(candUrl(s.id))}</div>`));
    const list = Object.entries(answers).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
    $('#ans', view).innerHTML = list.length ? `<table class="t"><tr><th>Question</th><th>Réponse</th><th>Heure</th></tr>${list.map(([k, v]) => `<tr><td>${k}</td><td>${esc(String(v.v).slice(0, 200))}</td><td>${new Date(v.t).toLocaleTimeString('fr-FR')}</td></tr>`).join('')}</table>` : 'Aucune réponse.';
  };
  subscribe(ctx, ctx.backend.onSession(id, (x) => { s = x; paint(); }));
  subscribe(ctx, ctx.backend.onAnswers(id, (a) => { answers = a; paint(); }));
}

/* ------------------------------ Candidats & prospects ------------------------------ */
async function people(view, ctx) {
  view.innerHTML = '<div class="panel"><div class="row mb"><input class="txt grow" id="q" placeholder="🔍 Rechercher"><select class="txt" id="fl" style="width:auto"><option value="">Tous</option><option value="souhaitée">Inscription souhaitée</option><option value="réfléchit">Réfléchit</option><option value="non">Non</option><option value="inscrit">Inscrits</option></select><select class="txt" id="ft" style="width:auto"><option value="">Tous les tests</option><option>ADU</option><option>ENF</option><option>IEL</option></select></div><div class="tablewrap" id="tb"></div></div>';
  let list = [];
  const paint = () => {
    const q = $('#q', view).value.toLowerCase(), f = $('#fl', view).value, t = $('#ft', view).value;
    const rows = list.filter((p) => (!q || (p.nom + p.prenom + p.tel).toLowerCase().includes(q)) && (!f || (f === 'inscrit' ? p.status === 'Inscrit' : p.decision === f)) && (!t || p.testCode === t)).sort((a, b) => b.testDate - a.testDate);
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th></th><th>Nom</th><th>Test</th><th>Niveau</th><th>Formation</th><th>Date</th><th>Décision</th></tr>${rows.map((p) => `<tr class="click" data-id="${p.id}"><td><img class="avatar sm" src="${esc(p.photo || IMG.logo)}"></td><td><b>${esc(p.prenom)} ${esc(p.nom)}</b><br><span class="muted">${esc(p.tel || '')}</span></td><td>${p.testCode}</td><td><span class="pill done">${esc(p.level || '—')}</span></td><td>${esc(p.formation || '')}</td><td>${fmtDate(p.testDate)}</td><td>${p.status === 'Inscrit' ? '<span class="pill ok">Inscrit</span>' : `<span class="pill ${p.decision === 'souhaitée' ? 'ok' : p.decision === 'non' ? 'bad' : 'wait'}">${p.decision || 'à voir'}</span>`}</td></tr>`).join('')}</table>` : '<p class="muted">Aucun prospect. Ils apparaissent ici quand vous validez un résultat.</p>';
    $$('tr.click', view).forEach((r) => (r.onclick = () => (location.hash = '#/staff/person/' + r.dataset.id)));
  };
  ['#q', '#fl', '#ft'].forEach((s) => ($(s, view).oninput = paint));
  subscribe(ctx, ctx.backend.onPeople((l) => { list = l; paint(); }));
}

async function person(view, ctx, id) {
  const all = await ctx.backend.listPeople();
  const p = all.find((x) => x.id === id);
  if (!p) return (view.innerHTML = '<div class="panel">Fiche introuvable. <a href="#/staff/people">Retour</a></div>');
  view.innerHTML = `<div class="split"><div class="panel"><div class="row"><img class="avatar lg" src="${esc(p.photo || IMG.logo)}"><div><h2 style="margin:0">${esc(p.prenom)} ${esc(p.nom)}</h2><div>${esc(p.status || '')}</div><div class="muted">📞 ${esc(p.tel || '')} · ${esc(p.profession || '')}</div></div></div>
    <div class="grid2 mt"><div class="glob"><span class="muted">Niveau global (CECR)</span><b>${esc(p.level || '—')}</b></div><div class="panel" style="margin:0"><span class="muted">Formation conseillée</span><br><b>${esc(p.formation || '—')}</b><br><span class="muted">N° ${esc(p.attestationNo || '—')} · ${fmtDate(p.testDate)}</span></div></div>
    <h3 class="mt">Décision</h3><div class="row" id="dec">${[['souhaitée', 'Inscription souhaitée'], ['réfléchit', 'Réfléchit'], ['non', 'Non']].map(([v, l]) => `<button class="lvl ${p.decision === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}<button class="lvl ${p.status === 'Inscrit' ? 'on' : ''}" id="ins">✔ Marquer Inscrit</button></div>
    <h3 class="mt">Notes internes</h3><textarea class="txt" id="nt" style="min-height:110px">${esc(p.notes || '')}</textarea>
    <div class="row mt"><button class="btn primary" id="sv">Enregistrer</button>
    <a class="btn teal" target="_blank" rel="noopener" href="${waLink(p.tel, `Bonjour ${p.prenom}, c'est Valérie Language Academy. Voici votre résultat au test de placement : niveau ${p.level} (${p.formation || ''}). Souhaitez-vous vous inscrire ?`)}">💬 Contacter sur WhatsApp</a>
    ${p.sessionId ? `<a class="btn" href="#/staff/correct/${p.sessionId}">Voir le test</a><a class="btn" href="#/staff/attestation/${p.sessionId}">Attestation</a>` : ''}</div></div></div>`;
  let cur = { ...p };
  $$('#dec .lvl[data-v]', view).forEach((b) => (b.onclick = () => { cur.decision = b.dataset.v; $$('#dec .lvl[data-v]', view).forEach((x) => x.classList.toggle('on', x === b)); }));
  $('#ins', view).onclick = (e) => { cur.status = cur.status === 'Inscrit' ? 'Testé · prospect' : 'Inscrit'; e.target.classList.toggle('on'); };
  $('#sv', view).onclick = async () => { cur.notes = $('#nt', view).value; await ctx.backend.putPerson(cur); toast('Fiche enregistrée'); };
}

/* ------------------------------ Statistiques ------------------------------ */
async function stats(view, ctx) {
  view.innerHTML = '<div id="s"></div>';
  let res = [], ppl = [];
  const paint = () => {
    const done = res.filter((r) => r.validatedAt);
    const months = {}; done.forEach((r) => { const k = new Date(r.validatedAt).toISOString().slice(0, 7); months[k] = (months[k] || 0) + 1; });
    const ks = Object.keys(months).sort().slice(-6); const max = Math.max(1, ...ks.map((k) => months[k]));
    const lv = {}; ppl.forEach((p) => p.level && (lv[p.level] = (lv[p.level] || 0) + 1));
    const ins = ppl.filter((p) => p.status === 'Inscrit').length, wish = ppl.filter((p) => p.decision === 'souhaitée').length;
    const conv = ppl.length ? Math.round((ins / ppl.length) * 100) : 0;
    $('#s', view).innerHTML = `<div class="kpis"><div class="kpi"><div class="ic">📝</div><div><b>${done.length}</b><span>Tests réalisés</span></div></div><div class="kpi"><div class="ic" style="background:var(--gold-soft)">🤝</div><div><b>${wish}</b><span>Inscription souhaitée</span></div></div><div class="kpi"><div class="ic" style="background:#E8F6EE">🎓</div><div><b>${ins}</b><span>Inscrits</span></div></div><div class="kpi"><div class="ic" style="background:#EAF3FF">📈</div><div><b>${conv} %</b><span>Conversion test → inscription</span></div></div></div>
    <div class="split"><div class="panel"><h2>Tests par mois</h2>${ks.length ? `<div class="chartbars">${ks.map((k) => `<div style="height:${(months[k] / max) * 100}%"><span>${months[k]}</span></div>`).join('')}</div><div class="chartlbl">${ks.map((k) => `<span>${k.slice(5)}/${k.slice(2, 4)}</span>`).join('')}</div>` : '<p class="muted">Pas encore de données.</p>'}</div>
    <div class="panel"><h2>Répartition des niveaux</h2>${Object.keys(lv).length ? Object.entries(lv).map(([l, n]) => `<div class="skill"><b>${esc(l)}</b><div class="bar"><i style="width:${(n / ppl.length) * 100}%"></i></div><span>${n}</span></div>`).join('') : '<p class="muted">Pas encore de données.</p>'}</div></div>`;
  };
  subscribe(ctx, ctx.backend.onResults((l) => { res = l; paint(); })); subscribe(ctx, ctx.backend.onPeople((l) => { ppl = l; paint(); }));
}

/* ------------------------------ Paramètres ------------------------------ */
async function settingsPage(view, ctx) {
  const s = ctx.settings;
  const have = await ctx.backend.listKeys().catch(() => []);
  view.innerHTML = `<div class="panel"><h2>Centre</h2><div class="grid2">
    <label class="f">Nom affiché<input class="txt" id="nm" value="${esc(s.name || 'Valérie')}"></label>
    <label class="f">Téléphones<input class="txt" id="tl" value="${esc(s.phones || '')}"></label>
    <label class="f" style="grid-column:1/-1">Adresse (attestation)<input class="txt" id="ad" value="${esc(s.address || 'Valérie Language Academy · Garoua')}"></label></div>
    <div class="photo-pick mt"><img class="avatar lg" id="av" src="${esc(s.avatar || IMG.valerie)}"><div><b>Photo de profil</b><br><input type="file" id="avf" accept="image/*" class="hidden"><button class="btn sm" id="avb">📷 Choisir une photo</button></div></div>
    <button class="btn primary mt" id="sv">Enregistrer</button></div>
    <div class="panel"><h2>Corrigés des tests</h2><p class="muted">Les corrigés restent réservés au personnel (collection <code>tests_key</code>). Sélectionnez les 3 fichiers <code>test_ADU.json</code>, <code>test_ENF.json</code>, <code>test_IEL.json</code> complets (énoncés + corrigés).</p>
    <p>${['ADU', 'ENF', 'IEL'].map((c) => `<span class="pill ${have.includes(c) ? 'ok' : 'bad'}">${c} ${have.includes(c) ? '✔ importé' : '✖ manquant'}</span>`).join(' ')}</p>
    <input type="file" id="imp" accept=".json" multiple><div id="im" class="mt"></div></div>
    <div class="panel"><h2>Sauvegarde</h2><p class="muted">Mode ${ctx.backend.mode === 'firebase' ? 'Firebase (données dans le cloud)' : 'local : les données restent dans ce navigateur — pensez à exporter.'}</p>
    <button class="btn" id="ex">⬇ Exporter</button> <input type="file" id="ib" accept=".json" class="hidden"><button class="btn" id="im2">⬆ Importer</button></div>`;
  let avatar = s.avatar;
  $('#avb', view).onclick = () => $('#avf', view).click();
  $('#avf', view).onchange = async (e) => { if (e.target.files[0]) { avatar = await resizePhoto(e.target.files[0]); $('#av', view).src = avatar; } };
  $('#sv', view).onclick = async () => { await ctx.backend.putSettings({ ...s, name: $('#nm', view).value, phones: $('#tl', view).value, address: $('#ad', view).value, avatar }); toast('Enregistré'); setTimeout(() => location.reload(), 500); };
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
