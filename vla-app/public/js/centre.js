// Section « Centre » (Valérie) : vue d'ensemble, élèves, classes & leçons, activités, rapports.
// Données sensibles (téléphones, frais) : collection `students` = personnel uniquement.
// Données générales : `members` + `board/summary` = visibles des apprenants connectés.
import { esc, $, $$, fmtDate, toast, uid, IMG, waLink, resizePhoto } from './ui.js';
import { fullName } from './identity.js';
import { practiceLevelFor } from './practice.js';
import { hasHost, hostDB, hostClasses, syncFromHost } from './host.js';

export const initial = (s) => `${s.prenom || ''} ${(s.nom || '').slice(0, 1)}${s.nom ? '.' : ''}`.trim();
const LV = ['A1', 'A2', 'B1', 'B2', 'C1'];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const WD = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
export const EVENT_TYPES = { portes: ['Portes ouvertes', '#0EA5A0', 'accueil'], examen: ['Examen blanc', '#E8870E', 'etudiant'], sortie: ['Sortie pédagogique', '#8b5cf6', 'sortie'], club: ['Club / atelier', '#1D7BEA', 'groupe'], diplome: ['Remise de diplômes', '#C9A02A', 'diplome'], autre: ['Autre', '#6B7280', 'equipe'] };
const CLASS_PHOTOS = ['cours', 'tablette', 'groupe', 'ordinateur', 'ecoute', 'etudiant'];
export const photo = (n) => `assets/photos/${n}.jpg`;
const kpi = (ic, n, l, cls = '') => `<div class="kpi ${cls}"><div class="ic">${ic}</div><div><b>${n}</b><span>${l}</span></div></div>`;
const accessCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join(''); };
const subscribe = (ctx, u) => ctx.cleanup.push(u);
const money = (n) => `${Number(n || 0).toLocaleString('fr-FR')} F CFA`;
const owed = (s) => Math.max(0, (Number(s.fees) || 0) - (Number(s.paid) || 0));
const levelPill = (l) => `<span class="pill lv-${esc(l)}">${esc(l)}</span>`;
const today = () => new Date().toISOString().slice(0, 10);

/* ---- Année scolaire (septembre → août) ---- */
export const schoolYearOf = (iso) => { const d = new Date(iso), y = d.getFullYear(); return d.getMonth() >= 8 ? y : y - 1; };
const yearLabel = (y) => `${y} – ${y + 1}`;
const curYear = () => Number(sessionStorage.getItem('vla-year')) || schoolYearOf(today());
const yearSelect = (years) => `<select class="txt" id="yr" style="width:auto;font-weight:700">${[...new Set([curYear(), ...years])].sort().reverse().map((y) => `<option value="${y}" ${y === curYear() ? 'selected' : ''}>Année scolaire : ${yearLabel(y)}</option>`).join('')}</select>`;
const bindYear = (view, again) => { $('#yr', view).onchange = (e) => { sessionStorage.setItem('vla-year', e.target.value); again(); }; };
export function nextLessonDate(days, from = new Date()) {
  if (!days?.length) return null;
  const idx = days.map((d) => (DAYS.indexOf(d) + 1) % 7);
  for (let i = 0; i < 8; i++) { const d = new Date(from); d.setDate(d.getDate() + i); if (idx.includes(d.getDay())) return d.toISOString().slice(0, 10); }
  return null;
}

/** Recalcule le résumé public (Valérie le publie : aucune Cloud Function nécessaire). */
export async function publishBoard(backend) {
  const host = hasHost();
  if (host) await syncFromHost(backend);
  const [students, classes0, lessons, events, ann] = await Promise.all(['students', 'classes', 'lessons', 'events', 'announcements'].map((c) => backend.listCol(c)));
  const act = students.filter((s) => s.status === 'inscrit');
  const settings = await backend.getSettings();
  const showNames = settings.boardNames !== false;
  const classes = host ? hostClasses() : classes0;
  const lessonsDone = host ? Object.keys(hostDB().reports || {}).length : lessons.length;
  await backend.putDoc('board', 'summary', {
    id: 'summary', updatedAt: Date.now(), contact: settings.phones || (host ? hostDB().settings?.phone || '' : ''), inscrits: act.length, classes: classes.length, lessonsDone,
    byLevel: LV.map((l) => ({ level: l, n: act.filter((s) => s.level === l).length })),
    classList: host ? classes : classes.map((c) => ({ id: c.id, name: c.name, level: c.level, days: c.days || [], time: c.time || '', trainer: c.trainer || '', size: act.filter((s) => s.classId === c.id).length, lessons: lessons.filter((x) => x.classId === c.id).length, last: lessons.filter((x) => x.classId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0]?.topic || '' })),
    events: events.filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10).map((e) => ({ id: e.id, title: e.title, date: e.date, time: e.time || '', place: e.place || '', type: e.type || 'autre', audience: e.audience || '' })),
    announcements: ann.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((a) => ({ id: a.id, text: a.text, date: a.date })),
    names: showNames ? act.map((s) => ({ n: initial(s), level: s.level, classId: s.classId || '' })).sort((a, b) => a.n.localeCompare(b.n)) : [],
  });
  const mem = await backend.listCol('members');
  for (const s of act) { const old = mem.find((m) => m.id === s.id) || {}; await backend.putDoc('members', s.id, { ...old, id: s.id, code: s.code, prenom: s.prenom, initial: initial(s), level: s.level, classId: s.classId || '', photo: s.photo || '', kid: !!s.kid }); }
  for (const m of mem) if (!act.find((s) => s.id === m.id)) await backend.delDoc('members', m.id);
}
let pubT; export const queueBoard = (b) => { clearTimeout(pubT); pubT = setTimeout(() => publishBoard(b).catch(() => {}), 800); };

const pager = (total, page, per, id) => { const n = Math.max(1, Math.ceil(total / per)); const nums = [...new Set([1, 2, 3, page, n])].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b); return `<div class="pager"><span class="muted">Affichage : ${total ? (page - 1) * per + 1 : 0} – ${Math.min(total, page * per)} sur ${total}</span><div class="pg" id="${id}"><button data-p="${Math.max(1, page - 1)}">‹</button>${nums.map((x) => `<button data-p="${x}" class="${x === page ? 'on' : ''}">${x}</button>`).join('')}<button data-p="${Math.min(n, page + 1)}">›</button></div></div>`; };

/* ------------------------------ Vue d'ensemble ------------------------------ */
export async function overview(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🏫</span>Centre – Vue d’ensemble</h2><div id="yrw"></div></div><div id="kp"></div>
    <div class="split"><div><div class="panel"><h2>🎓 Liste des classes</h2><div class="tablewrap" id="cl"></div></div><div class="panel"><h2>📊 Inscrits par niveau</h2><div id="lv"></div></div></div>
    <div><div class="panel"><h2>📅 Prochaines activités</h2><div id="ev"></div></div><div class="panel tint-gold"><h2>📢 Annonces aux apprenants</h2><div id="an"></div><div class="row mt"><input class="txt grow" id="at" placeholder="Nouvelle annonce…"><button class="btn sm gold" id="aa">Ajouter</button></div></div>
    <button class="btn gold big" id="pub" style="min-height:84px">📣 &nbsp;Publier le tableau de bord aux apprenants &nbsp;❯</button></div></div>`;
  let S = [], C = [], L = [], E = [], P = [], A = [];
  const paint = () => {
    const y = curYear(), inYear = (d) => schoolYearOf(d) === y;
    const act = S.filter((s) => s.status === 'inscrit'), ls = L.filter((l) => inYear(l.date));
    $('#yrw', view).innerHTML = yearSelect([...L, ...E].map((x) => schoolYearOf(x.date))); bindYear(view, paint);
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('🎓', act.length, 'Élèves inscrits', '')}${kpi('🧑‍🤝‍🧑', P.filter((p) => p.status !== 'Inscrit').length, 'Prospects (tests de placement)', 'y')}${kpi('📚', C.length, 'Classes', 'g')}${kpi('📖', ls.length, 'Leçons données', '')}</div>`;
    $('#cl', view).innerHTML = C.length ? `<table class="t"><tr><th>Classe</th><th>Niveau</th><th>Horaire</th><th>Formateur</th><th>Élèves</th><th>Leçons</th></tr>${C.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td>${levelPill(c.level)}</td><td>${esc((c.days || []).map((d) => d.slice(0, 3)).join(', '))} ${esc(c.time || '')}</td><td>${esc(c.trainer || '—')}</td><td>${act.filter((s) => s.classId === c.id).length}</td><td>${ls.filter((x) => x.classId === c.id).length}</td></tr>`).join('')}</table><a class="btn sm mt" href="#/centre/classes">Voir toutes les classes ❯</a>` : '<p class="muted">Aucune classe. <a href="#/centre/classes">Créer une classe</a></p>';
    $('#lv', view).innerHTML = LV.map((l) => { const n = act.filter((s) => s.level === l).length; return `<div class="skill" style="grid-template-columns:54px 1fr 150px;background:none;padding:2px 0">${levelPill(l)}<div class="bar" style="height:18px"><i style="width:${act.length ? (n / act.length) * 100 : 0}%"></i></div><span>${n} élève(s) (${act.length ? Math.round((n / act.length) * 100) : 0} %)</span></div>`; }).join('');
    const up = E.filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    $('#ev', view).innerHTML = up.length ? up.map((e) => `<div class="row sb mb" style="flex-wrap:nowrap"><img src="${photo(EVENT_TYPES[e.type || 'autre'][2])}" style="width:56px;height:56px;border-radius:12px;object-fit:cover"><span class="grow"><b>${esc(e.title)}</b><br><span class="muted">${esc(e.audience || e.place || '')}</span></span><span class="pill done">${fmtDate(e.date)}</span></div>`).join('') : '<p class="muted">Aucune activité à venir. <a href="#/centre/events">Ajouter</a></p>';
    $('#an', view).innerHTML = A.length ? A.sort((a, b) => b.date.localeCompare(a.date)).map((a) => `<div class="row sb" style="padding:4px 0;border-bottom:1px solid var(--line)"><span>• ${esc(a.text)}</span><button class="btn sm danger" data-da="${a.id}">✕</button></div>`).join('') : '<p class="muted">Aucune annonce.</p>';
    $$('[data-da]', view).forEach((b) => (b.onclick = async () => { await ctx.backend.delDoc('announcements', b.dataset.da); queueBoard(ctx.backend); }));
  };
  for (const [k, set] of [['students', (l) => (S = l)], ['classes', (l) => (C = l)], ['lessons', (l) => (L = l)], ['events', (l) => (E = l)], ['people', (l) => (P = l)], ['announcements', (l) => (A = l)]]) subscribe(ctx, ctx.backend.onCol(k, (l) => { set(l); paint(); }));
  $('#aa', view).onclick = async () => { const t = $('#at', view).value.trim(); if (!t) return; const id = uid(); await ctx.backend.putDoc('announcements', id, { id, text: t, date: today() }); $('#at', view).value = ''; queueBoard(ctx.backend); };
  $('#pub', view).onclick = async () => { await publishBoard(ctx.backend); toast('Tableau de bord publié ✔'); };
}

/* ------------------------------ Élèves ------------------------------ */
export async function students(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🎓</span>Centre – Élèves</h2><div class="row"><input class="txt" id="q" placeholder="🔍 Rechercher un élève (nom, code…)" style="width:280px"><button class="btn" id="fromp">📥 Prospects testés</button><button class="btn gold" id="add">➕ Ajouter un élève</button></div></div>
    <div class="split" style="grid-template-columns:1.6fr 1fr"><div><div class="filters"><select class="txt" id="fl"><option value="">Tous les niveaux</option>${LV.map((l) => `<option>${l}</option>`).join('')}</select><select class="txt" id="fc"><option value="">Toutes les classes</option></select><select class="txt" id="fs"><option value="">Tous les statuts</option><option value="inscrit">Actifs</option><option value="ancien">Anciens</option><option value="dette">Frais dus</option></select></div>
    <div class="panel"><div class="tablewrap" id="tb"></div><div id="pg"></div></div></div><div id="form"></div></div>`;
  let S = [], C = [], page = 1, selId = null;
  const PER = 8;
  const paint = () => {
    const q = $('#q', view).value.toLowerCase(), fl = $('#fl', view).value, fc = $('#fc', view).value, fs = $('#fs', view).value;
    const rows = S.filter((s) => (!fl || s.level === fl) && (!fc || s.classId === fc) && (!fs || (fs === 'dette' ? owed(s) > 0 : s.status === fs)) && (!q || (fullName(s) + s.code).toLowerCase().includes(q))).sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
    const pg = rows.slice((page - 1) * PER, page * PER);
    $('#tb', view).innerHTML = pg.length ? `<table class="t"><tr><th>N°</th><th></th><th>Nom et prénoms</th><th>Niveau</th><th>Classe</th><th>Code</th><th>Frais</th><th>Statut</th></tr>${pg.map((s, i) => `<tr class="click ${s.id === selId ? 'sel' : ''}" data-e="${s.id}"><td>${(page - 1) * PER + i + 1}</td><td><img class="avatar sm" src="${esc(s.photo || IMG.logo)}"></td><td><b>${esc(s.prenom)} ${esc(s.nom)}</b></td><td>${levelPill(s.level)}</td><td>${esc(C.find((c) => c.id === s.classId)?.name || '—')}</td><td><code>${esc(s.code)}</code></td><td>${s.fees ? (owed(s) ? `<span class="owe">Dû : ${money(owed(s))}</span>` : '<span class="paid">Payé</span>') : '—'}</td><td><span class="pill ${s.status === 'inscrit' ? 'ok' : 'grey'}">${s.status === 'inscrit' ? '✔ Actif' : 'Ancien'}</span></td></tr>`).join('')}</table>` : '<p class="muted">Aucun élève. Ajoutez-en un ou importez vos prospects testés.</p>';
    $('#pg', view).innerHTML = pager(rows.length, page, PER, 'pgn');
    $$('#pgn [data-p]', view).forEach((b) => (b.onclick = () => { page = Number(b.dataset.p); paint(); }));
    $$('[data-e]', view).forEach((b) => (b.onclick = () => { selId = b.dataset.e; edit(S.find((s) => s.id === selId)); paint(); }));
  };
  const edit = (s = { id: uid(), code: accessCode(), status: 'inscrit', level: 'A1', nom: '', prenom: '' }) => {
    let photoData = s.photo;
    const exists = S.find((x) => x.id === s.id);
    $('#form', view).innerHTML = `<div class="panel side-edit"><h2>✏️ Fiche de l’apprenant <span class="muted" style="font-weight:400">(${exists ? 'édition' : 'nouveau'})</span></h2>
      <div class="row mb" style="flex-wrap:nowrap"><div style="position:relative"><img class="avatar lg" id="ph" src="${esc(photoData || IMG.logo)}"><input type="file" id="pf" accept="image/*" class="hidden"><button class="btn sm" id="pb" style="position:absolute;right:-6px;bottom:-6px;min-height:34px;padding:4px 10px">📷</button></div>
      <div class="grow"><input class="txt" id="f_nom" placeholder="NOM" value="${esc(s.nom)}" style="font-weight:700;margin-bottom:6px"><input class="txt" id="f_prenom" placeholder="Prénom(s)" value="${esc(s.prenom)}"><div class="mt"><span class="pill ${s.status === 'inscrit' ? 'ok' : 'grey'}">${s.status === 'inscrit' ? '✔ Actif' : 'Ancien'}</span></div></div></div>
      <div class="fieldrow">Code<input class="txt" id="f_code" value="${esc(s.code)}" style="text-transform:uppercase;letter-spacing:.2em;font-weight:700"></div>
      <div class="fieldrow">Niveau *<select class="txt" id="f_level">${LV.map((l) => `<option ${s.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="fieldrow">Classe *<select class="txt" id="f_class"><option value="">— aucune —</option>${C.map((c) => `<option value="${c.id}" ${s.classId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="fieldrow">Téléphone *<span class="row" style="flex-wrap:nowrap"><input class="txt" id="f_tel" value="${esc(s.tel || '')}"><a class="btn wa sm" id="fwa" target="_blank" rel="noopener" href="${waLink(s.tel, '')}">💬</a></span></div>
      <div class="fieldrow">E-mail<input class="txt" id="f_mail" type="email" value="${esc(s.email || '')}"></div>
      <div class="fieldrow">Frais (total)<input class="txt" id="f_fees" type="number" value="${esc(s.fees || '')}"></div>
      <div class="fieldrow">Payé<input class="txt" id="f_paid" type="number" value="${esc(s.paid || '')}"></div>
      <div class="fieldrow">Reste dû<span class="txt good" id="f_rest" style="display:block;font-weight:700"></span></div>
      <div class="fieldrow">Statut<select class="txt" id="f_status"><option value="inscrit" ${s.status === 'inscrit' ? 'selected' : ''}>Actif</option><option value="ancien" ${s.status === 'ancien' ? 'selected' : ''}>Ancien</option></select></div>
      <label class="checkline" style="padding:4px 0"><input type="checkbox" id="f_kid" ${s.kid ? 'checked' : ''}> Mode enfant (8–13 ans) pour l’espace apprenant</label>
      <p class="muted" style="font-size:.85rem">🔒 Téléphone et frais : personnel uniquement. Les apprenants ne voient que prénom + initiale, niveau et classe.</p>
      <div class="row"><button class="btn wa" id="inv" ${exists ? '' : 'disabled'}>💬 Envoyer l’accès</button><button class="btn gold" id="sv">💾 Enregistrer</button>${exists ? '<button class="btn danger" id="dl">🗑</button>' : ''}</div></div>`;
    const rest = () => { $('#f_rest', view).textContent = money(Math.max(0, (Number($('#f_fees', view).value) || 0) - (Number($('#f_paid', view).value) || 0))); };
    ['f_fees', 'f_paid'].forEach((i) => ($('#' + i, view).oninput = rest)); rest();
    $('#f_tel', view).oninput = (e) => ($('#fwa', view).href = waLink(e.target.value, ''));
    $('#pb', view).onclick = () => $('#pf', view).click();
    $('#pf', view).onchange = async (e) => { if (e.target.files[0]) { photoData = await resizePhoto(e.target.files[0]); $('#ph', view).src = photoData; } };
    $('#inv', view).onclick = () => window.open(waLink($('#f_tel', view).value, `Bonjour ${$('#f_prenom', view).value}, voici votre accès à l’espace apprenant VLA : ${location.origin}${location.pathname}#/learn — code : ${$('#f_code', view).value.toUpperCase()}`), '_blank', 'noopener');
    $('#sv', view).onclick = async () => {
      const v = (i) => $('#' + i, view).value.trim();
      if (!v('f_nom') || !v('f_prenom')) return toast('Nom et prénom obligatoires');
      const code = v('f_code').toUpperCase();
      if (!/^[A-Z0-9]{4,8}$/.test(code)) return toast('Code : 4 à 8 lettres ou chiffres');
      if (S.some((x) => x.code === code && x.id !== s.id)) return toast('Ce code est déjà utilisé');
      if (exists && exists.code !== code) await ctx.backend.delDoc('logins', exists.code);
      await ctx.backend.putDoc('students', s.id, { ...s, nom: v('f_nom').toUpperCase(), prenom: v('f_prenom'), tel: v('f_tel'), email: v('f_mail'), level: v('f_level'), classId: v('f_class'), status: v('f_status'), fees: Number(v('f_fees')) || 0, paid: Number(v('f_paid')) || 0, code, photo: photoData, kid: $('#f_kid', view).checked, enrolledAt: s.enrolledAt || Date.now() });
      await ctx.backend.putDoc('logins', code, { id: code, studentId: s.id });
      queueBoard(ctx.backend); selId = s.id; toast('Élève enregistré'); setTimeout(() => { const cur = S.find((x) => x.id === s.id); if (cur) edit(cur); paint(); }, 350);
    };
    $('#dl', view)?.addEventListener('click', async () => { if (!confirm('Supprimer cet élève ?')) return; await ctx.backend.delDoc('students', s.id); await ctx.backend.delDoc('logins', s.code); await ctx.backend.delDoc('members', s.id); queueBoard(ctx.backend); $('#form', view).innerHTML = ''; selId = null; });
  };
  $('#add', view).onclick = () => { selId = null; edit(); paint(); };
  $('#fromp', view).onclick = async () => {
    const ppl = (await ctx.backend.listPeople()).filter((p) => !S.find((s) => s.fromPerson === p.id) && (p.decision === 'souhaitée' || p.status === 'Inscrit'));
    if (!ppl.length) return toast('Aucun prospect « inscription souhaitée » à importer');
    for (const p of ppl) { const id = uid(), code = accessCode(); await ctx.backend.putDoc('students', id, { id, code, fromPerson: p.id, nom: p.nom, prenom: p.prenom, tel: p.tel, email: p.email, photo: p.photo, level: practiceLevelFor(p.level), status: 'inscrit', enrolledAt: Date.now() }); await ctx.backend.putDoc('logins', code, { id: code, studentId: id }); }
    queueBoard(ctx.backend); toast(`${ppl.length} élève(s) importé(s) depuis les tests`);
  };
  ['#q', '#fl', '#fc', '#fs'].forEach((i) => ($(i, view).oninput = () => { page = 1; paint(); }));
  subscribe(ctx, ctx.backend.onCol('classes', (l) => { C = l; $('#fc', view).innerHTML = '<option value="">Toutes les classes</option>' + C.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join(''); paint(); }));
  subscribe(ctx, ctx.backend.onCol('students', (l) => { S = l; paint(); }));
}

/* ------------------------------ Classes & leçons ------------------------------ */
export async function classes(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🎓</span>Centre – Classes &amp; leçons</h2><div class="row"><span id="yrw"></span><button class="btn gold" id="add">➕ Créer une classe</button></div></div><div id="form"></div>
    <div class="split" style="grid-template-columns:1.1fr 1fr"><div id="list"></div><div id="detail"></div></div>`;
  let C = [], S = [], L = [], sel = null;
  const paint = () => {
    const y = curYear(), ls = L.filter((l) => schoolYearOf(l.date) === y);
    $('#yrw', view).innerHTML = yearSelect(L.map((l) => schoolYearOf(l.date))); bindYear(view, paint);
    if (!sel && C.length) sel = C[0].id;
    $('#list', view).innerHTML = C.length ? C.map((c, i) => { const els = S.filter((s) => s.classId === c.id && s.status === 'inscrit'); const cl = ls.filter((l) => l.classId === c.id).sort((a, b) => b.date.localeCompare(a.date)); const last = cl[0]; const pr = last ? Math.round(((last.present?.length || 0) / Math.max(1, els.length)) * 100) : null;
      return `<div class="classcard ${c.id === sel ? 'sel' : ''}" data-s="${c.id}"><img src="${photo(CLASS_PHOTOS[i % CLASS_PHOTOS.length])}" alt=""><div><div>${levelPill(c.level)} <b style="font-size:1.1rem">${esc(c.name)}</b></div><div class="muted">👥 ${els.length} élèves · ${esc((c.days || []).map((d) => d.slice(0, 3)).join('–'))} ${esc(c.time || '')}<br>👤 ${esc(c.trainer || 'formateur à renseigner')}</div></div><div style="min-width:170px;text-align:center">${last ? `<div class="muted" style="font-size:.85rem">Dernière leçon :<br><b>${esc(last.topic)}</b></div><div class="pill ok mt">${last.present?.length || 0} / ${els.length} présents (${pr} %)</div>` : '<span class="muted">Aucune leçon</span>'}</div></div>`; }).join('') : '<div class="panel muted">Aucune classe. Créez-en une pour y affecter des élèves.</div>';
    $$('[data-s]', view).forEach((b) => (b.onclick = () => { sel = b.dataset.s; paint(); }));
    const c = C.find((x) => x.id === sel); if (!c) return ($('#detail', view).innerHTML = '');
    const els = S.filter((s) => s.classId === c.id && s.status === 'inscrit'), cl = ls.filter((l) => l.classId === c.id).sort((a, b) => b.date.localeCompare(a.date));
    const avg = cl.length && els.length ? Math.round((cl.reduce((a, l) => a + (l.present?.length || 0), 0) / (cl.length * els.length)) * 100) : null;
    const nl = nextLessonDate(c.days);
    $('#detail', view).innerHTML = `<div class="panel"><div class="row sb"><h2 style="margin:0">👥 Classe : ${esc(c.name)}</h2><button class="btn sm" data-c="${c.id}">✏️ Modifier</button></div>
      <div class="kpis mt" style="grid-template-columns:repeat(4,1fr)">${kpi('👥', els.length, 'Élèves')}${kpi('📶', avg === null ? '—' : avg + ' %', 'Présence moyenne', 'g')}${kpi('📖', cl.length, 'Leçons données', 'y')}${kpi('📅', nl ? fmtDate(nl).slice(0, 5) : '—', 'Prochaine leçon')}</div>
      <h3>📋 Dernières leçons</h3>${cl.slice(0, 4).map((l) => `<div class="row sb" style="padding:5px 0;border-bottom:1px solid var(--line)"><span>✅ <b>${esc(l.topic)}</b></span><span class="muted">${fmtDate(l.date)}</span><span>${l.present?.length || 0} / ${els.length}</span></div>`).join('') || '<p class="muted">Aucune leçon enregistrée.</p>'}</div>
      <div class="panel tint-gold"><h2>➕ Ajouter une leçon</h2><div class="grid2"><label class="f">Date de la leçon *<input class="txt" id="l_date" type="date" value="${today()}"></label><label class="f">Thème / Titre *<input class="txt" id="l_topic" placeholder="L10 – At the doctor"></label></div>
      <h3 class="mt">Appel des présents (${els.length} élèves)</h3><div class="row"><label class="pill ok" style="cursor:pointer;padding:6px 14px"><input type="checkbox" id="all" checked> Tous</label>${els.map((s) => `<label class="pill ok" style="cursor:pointer;padding:6px 12px"><input type="checkbox" data-p="${s.id}" checked> ${esc(s.prenom)} ${esc((s.nom || '').slice(0, 1))}.</label>`).join('') || '<span class="muted">Aucun élève dans cette classe.</span>'}</div>
      <label class="f mt">Remarques<input class="txt" id="l_note"></label><button class="btn primary big mt" id="sv" style="background:linear-gradient(#27a85f,#157a40);box-shadow:none;border-color:#157a40">💾 Enregistrer la leçon</button></div>`;
    $('[data-c]', view)?.addEventListener('click', () => editClass(c));
    $('#all', view).onchange = (e) => $$('[data-p]', view).forEach((x) => (x.checked = e.target.checked));
    $('#sv', view).onclick = async () => { const topic = $('#l_topic', view).value.trim(); if (!topic) return toast('Thème obligatoire'); const id = uid(); await ctx.backend.putDoc('lessons', id, { id, classId: c.id, date: $('#l_date', view).value, topic, note: $('#l_note', view).value, present: $$('[data-p]:checked', view).map((x) => x.dataset.p) }); queueBoard(ctx.backend); toast('Leçon enregistrée'); };
  };
  const editClass = (c = { id: uid(), name: '', level: 'A1', days: [], time: '', trainer: '' }) => {
    $('#form', view).innerHTML = `<div class="panel tint-gold"><h2>${C.find((x) => x.id === c.id) ? 'Modifier' : 'Nouvelle'} classe</h2><div class="grid3"><label class="f">Nom<input class="txt" id="c_name" value="${esc(c.name)}" placeholder="A1 – Matin"></label><label class="f">Niveau<select class="txt" id="c_level">${LV.map((l) => `<option ${c.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="f">Formateur<input class="txt" id="c_tr" value="${esc(c.trainer || '')}"></label><label class="f">Horaire<input class="txt" id="c_time" value="${esc(c.time || '')}" placeholder="08h00 – 10h00"></label></div>
      <div class="row mt">${DAYS.map((d) => `<label class="checkline" style="padding:2px 10px 2px 0"><input type="checkbox" data-d="${d}" ${c.days?.includes(d) ? 'checked' : ''}> ${d}</label>`).join('')}</div>
      <div class="row mt"><button class="btn primary" id="csv">💾 Enregistrer</button><button class="btn" id="ccn">Annuler</button>${C.find((x) => x.id === c.id) ? '<button class="btn danger" id="cdl">🗑</button>' : ''}</div></div>`;
    $('#ccn', view).onclick = () => ($('#form', view).innerHTML = '');
    $('#csv', view).onclick = async () => { const name = $('#c_name', view).value.trim(); if (!name) return toast('Nom obligatoire'); await ctx.backend.putDoc('classes', c.id, { ...c, name, level: $('#c_level', view).value, trainer: $('#c_tr', view).value.trim(), time: $('#c_time', view).value.trim(), days: $$('[data-d]:checked', view).map((x) => x.dataset.d) }); sel = c.id; queueBoard(ctx.backend); $('#form', view).innerHTML = ''; };
    $('#cdl', view)?.addEventListener('click', async () => { if (confirm('Supprimer cette classe ?')) { await ctx.backend.delDoc('classes', c.id); sel = null; queueBoard(ctx.backend); $('#form', view).innerHTML = ''; } });
    $('#form', view).scrollIntoView({ behavior: 'smooth' });
  };
  $('#add', view).onclick = () => editClass();
  for (const [k, set] of [['classes', (l) => (C = l)], ['students', (l) => (S = l)], ['lessons', (l) => (L = l)]]) subscribe(ctx, ctx.backend.onCol(k, (l) => { set(l); const ae = document.activeElement; if (!ae || !['INPUT', 'TEXTAREA'].includes(ae.tagName)) paint(); }));
}

/* ------------------------------ Activités ------------------------------ */
export async function events(view, ctx) {
  let ym = new Date().toISOString().slice(0, 7), E = [], R = [], S = [];
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">📅</span>Centre – Activités</h2><div class="row"><span id="yrw"></span><button class="btn gold" id="add">➕ Ajouter une activité</button></div></div><div id="form"></div><div class="split" style="grid-template-columns:360px 1fr"><div class="panel"><div id="cal"></div></div><div><div id="kp"></div><div class="panel"><h2>📋 Liste des activités</h2><div id="lst"></div></div></div><div class="panel tint-gold"><h2>📢 Annonces aux apprenants</h2><div id="an"></div><div class="row mt"><input class="txt grow" id="at" placeholder="Nouvelle annonce…"><button class="btn sm gold" id="aa">Ajouter</button></div></div></div></div>';
  let A = [];
  const paintAnn = () => { $('#an', view).innerHTML = A.length ? [...A].sort((a, b) => b.date.localeCompare(a.date)).map((a) => `<div class="row sb" style="padding:4px 0;border-bottom:1px solid var(--line)"><span>• ${esc(a.text)}</span><button class="btn sm danger" data-da="${a.id}">✕</button></div>`).join('') : '<p class="muted">Aucune annonce.</p>'; $$('[data-da]', view).forEach((b) => (b.onclick = async () => { await ctx.backend.delDoc('announcements', b.dataset.da); queueBoard(ctx.backend); })); };
  $('#aa', view).onclick = async () => { const t = $('#at', view).value.trim(); if (!t) return; const id = uid(); await ctx.backend.putDoc('announcements', id, { id, text: t, date: today() }); $('#at', view).value = ''; queueBoard(ctx.backend); };
  subscribe(ctx, ctx.backend.onCol('announcements', (l) => { A = l; paintAnn(); }));
  const paint = () => {
    const y = curYear(), ev = E.filter((e) => schoolYearOf(e.date) === y);
    $('#yrw', view).innerHTML = yearSelect(E.map((e) => schoolYearOf(e.date))); bindYear(view, paint);
    const [Y, M] = ym.split('-').map(Number), first = new Date(Y, M - 1, 1), start = (first.getDay() + 6) % 7, dim = new Date(Y, M, 0).getDate();
    const cells = []; for (let i = 0; i < start; i++) cells.push({ o: 1, n: new Date(Y, M - 1, 1 - (start - i)).getDate() });
    for (let d = 1; d <= dim; d++) { const iso = `${ym}-${String(d).padStart(2, '0')}`; cells.push({ n: d, evs: E.filter((e) => e.date === iso) }); }
    while (cells.length % 7) cells.push({ o: 1, n: cells.length - start - dim + 1 });
    $('#cal', view).innerHTML = `<div class="row sb mb"><button class="btn sm" id="pm">‹</button><b style="font-size:1.2rem">${new Date(Y, M - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</b><button class="btn sm" id="nm">›</button></div><div class="cal">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => `<div class="h">${d}</div>`).join('')}${cells.map((c) => `<div class="d ${c.o ? 'o' : ''} ${c.evs?.length ? 'ev' : ''}">${c.n}${c.evs?.length ? `<span class="dot" style="background:${EVENT_TYPES[c.evs[0].type || 'autre'][1]}"></span>` : ''}</div>`).join('')}</div>
      <div class="row mt" style="gap:10px">${Object.entries(EVENT_TYPES).slice(0, 4).map(([, v]) => `<span class="muted"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${v[1]}"></i> ${v[0]}</span>`).join('')}</div>`;
    $('#pm', view).onclick = () => { ym = new Date(Y, M - 2, 1).toISOString().slice(0, 7); paint(); }; $('#nm', view).onclick = () => { ym = new Date(Y, M, 1).toISOString().slice(0, 7); paint(); };
    const month = ev.filter((e) => e.date.startsWith(ym)), done = ev.filter((e) => e.date < today());
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('📅', month.length, 'Activités ce mois')}${kpi('👥', S.filter((s) => s.status === 'inscrit').length, 'Élèves concernés', 'y')}${kpi('✅', done.length, 'Activités réalisées', 'g')}</div>`;
    const rows = [...ev].sort((a, b) => b.date.localeCompare(a.date));
    $('#lst', view).innerHTML = rows.length ? rows.map((e) => { const t = EVENT_TYPES[e.type || 'autre'], n = R.filter((r) => r.eventId === e.id).length, past = e.date < today(); return `<div class="evrow t-${e.type || 'autre'}" style="--c:${t[1]}"><img src="${photo(t[2])}" alt=""><div><b style="font-size:1.1rem">${esc(e.title)}</b><div class="muted">${esc(e.desc || t[0])}</div><div class="muted">📅 ${new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}${e.time ? ' · ' + esc(e.time) : ''} · 👥 ${esc(e.audience || 'Tout public')}${e.place ? ' · 📍 ' + esc(e.place) : ''}</div></div><div style="text-align:right"><span class="pill ${past ? 'grey' : 'ok'}">${past ? 'Réalisée' : '✔ Prévue'}</span><div class="muted mt">${n} inscrit(s)</div><button class="btn sm danger mt" data-d="${e.id}">🗑</button></div></div>`; }).join('') : '<p class="muted">Aucune activité cette année scolaire.</p>';
    $$('[data-d]', view).forEach((b) => (b.onclick = async () => { await ctx.backend.delDoc('events', b.dataset.d); queueBoard(ctx.backend); }));
  };
  $('#add', view).onclick = () => {
    $('#form', view).innerHTML = `<div class="panel tint-gold"><div class="grid3"><label class="f">Date *<input class="txt" id="e_date" type="date"></label><label class="f">Titre *<input class="txt" id="e_title"></label><label class="f">Type<select class="txt" id="e_type">${Object.entries(EVENT_TYPES).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></label><label class="f">Horaire<input class="txt" id="e_time" placeholder="09h00 – 16h00"></label><label class="f">Lieu<input class="txt" id="e_place"></label><label class="f">Public concerné<input class="txt" id="e_aud" placeholder="Tout public / Classes A2, B1"></label></div><label class="f mt">Description<input class="txt" id="e_desc"></label><div class="row mt"><button class="btn primary" id="sv">💾 Enregistrer</button><button class="btn" id="cn">Annuler</button></div></div>`;
    $('#cn', view).onclick = () => ($('#form', view).innerHTML = '');
    $('#sv', view).onclick = async () => { const t = $('#e_title', view).value.trim(), d = $('#e_date', view).value; if (!t || !d) return toast('Date et titre obligatoires'); const id = uid(); await ctx.backend.putDoc('events', id, { id, title: t, date: d, type: $('#e_type', view).value, time: $('#e_time', view).value, place: $('#e_place', view).value, audience: $('#e_aud', view).value, desc: $('#e_desc', view).value }); queueBoard(ctx.backend); $('#form', view).innerHTML = ''; };
  };
  subscribe(ctx, ctx.backend.onCol('events', (l) => { E = l; paint(); })); subscribe(ctx, ctx.backend.onCol('eventreg', (l) => { R = l; paint(); })); subscribe(ctx, ctx.backend.onCol('students', (l) => { S = l; paint(); }));
}

/* ------------------------------ Rapports (exports) ------------------------------ */
const csv = (rows) => '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); };
export async function reports(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">📊</span>Centre – Rapports</h2></div><div id="kp"></div><div class="grid2"><div class="panel"><h2>💰 Frais de formation</h2><div id="fe"></div><button class="btn mt" id="e1">⬇ Exporter la liste des élèves (Excel / CSV)</button></div><div class="panel"><h2>📶 Présence par classe</h2><div id="pr"></div><button class="btn mt" id="e2">⬇ Exporter les présences (CSV)</button></div></div>';
  let S = [], C = [], L = [];
  const paint = () => {
    const act = S.filter((s) => s.status === 'inscrit'), due = act.filter((s) => owed(s) > 0), tot = act.reduce((a, s) => a + (Number(s.fees) || 0), 0), paid = act.reduce((a, s) => a + (Number(s.paid) || 0), 0);
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('💰', money(paid), 'Encaissé')}${kpi('⏳', money(tot - paid), 'Reste à encaisser', 'y')}${kpi('⚠️', due.length, 'Élèves avec frais dus', 'p')}${kpi('📖', L.length, 'Leçons données', 'g')}</div>`;
    $('#fe', view).innerHTML = due.length ? `<table class="t"><tr><th>Élève</th><th>Classe</th><th>Reste dû</th><th></th></tr>${due.map((s) => `<tr><td>${esc(fullName(s))}</td><td>${esc(C.find((c) => c.id === s.classId)?.name || '—')}</td><td class="owe">${money(owed(s))}</td><td><a class="btn sm wa" target="_blank" rel="noopener" href="${waLink(s.tel, `Bonjour ${s.prenom}, c'est Valérie Language Academy. Il reste ${money(owed(s))} à régler pour votre formation. Merci !`)}">💬 Rappel</a></td></tr>`).join('')}</table>` : '<p class="muted">Aucun frais dû. 🎉</p>';
    $('#pr', view).innerHTML = C.length ? `<table class="t"><tr><th>Classe</th><th>Leçons</th><th>Présence moyenne</th></tr>${C.map((c) => { const els = act.filter((s) => s.classId === c.id).length, ls = L.filter((l) => l.classId === c.id), avg = ls.length && els ? Math.round((ls.reduce((a, l) => a + (l.present?.length || 0), 0) / (ls.length * els)) * 100) : null; return `<tr><td>${esc(c.name)}</td><td>${ls.length}</td><td>${avg === null ? '—' : avg + ' %'}</td></tr>`; }).join('')}</table>` : '<p class="muted">Aucune classe.</p>';
  };
  $('#e1', view).onclick = () => download('eleves-vla.csv', csv([['Nom', 'Prénom', 'Niveau', 'Classe', 'Code', 'Téléphone', 'E-mail', 'Frais', 'Payé', 'Reste dû', 'Statut'], ...S.map((s) => [s.nom, s.prenom, s.level, C.find((c) => c.id === s.classId)?.name || '', s.code, s.tel, s.email, s.fees || 0, s.paid || 0, owed(s), s.status])]));
  $('#e2', view).onclick = () => download('presences-vla.csv', csv([['Date', 'Classe', 'Thème', 'Présents', 'Élèves de la classe'], ...L.map((l) => [l.date, C.find((c) => c.id === l.classId)?.name || '', l.topic, l.present?.length || 0, S.filter((s) => s.classId === l.classId && s.status === 'inscrit').length])]));
  for (const [k, set] of [['students', (l) => (S = l)], ['classes', (l) => (C = l)], ['lessons', (l) => (L = l)]]) subscribe(ctx, ctx.backend.onCol(k, (l) => { set(l); paint(); }));
}
