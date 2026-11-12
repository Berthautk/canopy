// Section « Centre » (Valérie) : vue d'ensemble, élèves, classes & leçons, activités, accès apprenants.
// Données sensibles (téléphones, frais, notes) : collection `students` = personnel uniquement.
// Données générales : collection `members` + document `board/summary` = visibles des apprenants connectés.
import { esc, $, $$, fmtDate, toast, uid, IMG, waLink, resizePhoto } from './ui.js';
import { fullName } from './identity.js';
import { practiceLevelFor, PRACTICE_LEVELS } from './practice.js';

export const initial = (s) => `${s.prenom || ''} ${(s.nom || '').slice(0, 1)}${s.nom ? '.' : ''}`.trim();
const LV = ['A1', 'A2', 'B1', 'B2', 'C1'];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const kpi = (ic, n, l, cls = '') => `<div class="kpi ${cls}"><div class="ic">${ic}</div><div><b>${n}</b><span>${l}</span></div></div>`;
const accessCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join(''); };
const subscribe = (ctx, u) => ctx.cleanup.push(u);

/** Recalcule le résumé public (Valérie le publie : aucune Cloud Function nécessaire). */
export async function publishBoard(backend) {
  const [students, classes, lessons, events] = await Promise.all(['students', 'classes', 'lessons', 'events'].map((c) => backend.listCol(c)));
  const act = students.filter((s) => s.status === 'inscrit');
  const settings = await backend.getSettings();
  const showNames = settings.boardNames !== false;
  await backend.putDoc('board', 'summary', {
    id: 'summary', updatedAt: Date.now(), inscrits: act.length, classes: classes.length, lessonsDone: lessons.length,
    byLevel: LV.map((l) => ({ level: l, n: act.filter((s) => s.level === l).length })),
    classList: classes.map((c) => ({ id: c.id, name: c.name, level: c.level, days: c.days || [], time: c.time || '', trainer: c.trainer || '', size: act.filter((s) => s.classId === c.id).length, lessons: lessons.filter((x) => x.classId === c.id).length, last: lessons.filter((x) => x.classId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0]?.topic || '' })),
    events: events.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8).map((e) => ({ id: e.id, title: e.title, date: e.date, place: e.place || '' })),
    names: showNames ? act.map((s) => ({ n: initial(s), level: s.level, classId: s.classId || '' })).sort((a, b) => a.n.localeCompare(b.n)) : [],
  });
  // Fiches « membres » (sans données sensibles) : alimentent l'espace apprenant
  const mem = await backend.listCol('members');
  for (const s of act) await backend.putDoc('members', s.id, { id: s.id, code: s.code, prenom: s.prenom, initial: initial(s), level: s.level, classId: s.classId || '', photo: s.photo || '' });
  for (const m of mem) if (!act.find((s) => s.id === m.id)) await backend.delDoc('members', m.id);
}
let pubT; export const queueBoard = (b) => { clearTimeout(pubT); pubT = setTimeout(() => publishBoard(b).catch(() => {}), 800); };

/* ------------------------------ Vue d'ensemble ------------------------------ */
export async function overview(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">🏫</span>Vue d’ensemble du centre</h2><button class="btn gold" id="pub">📣 Publier le tableau de bord aux apprenants</button></div><div id="kp"></div><div class="split"><div class="panel"><h2>🏫 Classes</h2><div class="tablewrap" id="cl"></div></div><div><div class="panel tint-gold"><h2>📅 Prochaines activités</h2><div id="ev"></div></div><div class="panel"><h2>🎓 Inscrits par niveau</h2><div id="lv"></div></div></div></div>';
  let S = [], C = [], L = [], E = [], P = [];
  const paint = () => {
    const act = S.filter((s) => s.status === 'inscrit');
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('🎓', act.length, 'Élèves inscrits', 'g')}${kpi('🧑‍🤝‍🧑', P.filter((p) => p.status !== 'Inscrit').length, 'Prospects (tests)', 'p')}${kpi('🏫', C.length, 'Classes')}${kpi('📖', L.length, 'Leçons données', 'y')}</div>`;
    $('#cl', view).innerHTML = C.length ? `<table class="t"><tr><th>Classe</th><th>Niveau</th><th>Horaire</th><th>Élèves</th><th>Leçons</th></tr>${C.map((c) => `<tr><td><b>${esc(c.name)}</b><br><span class="muted">${esc(c.trainer || '')}</span></td><td><span class="pill done">${esc(c.level)}</span></td><td>${esc((c.days || []).join(', '))} ${esc(c.time || '')}</td><td>${act.filter((s) => s.classId === c.id).length}</td><td>${L.filter((x) => x.classId === c.id).length}</td></tr>`).join('')}</table>` : '<p class="muted">Aucune classe. <a href="#/centre/classes">Créer une classe</a></p>';
    const up = E.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
    $('#ev', view).innerHTML = up.length ? up.map((e) => `<div class="row sb mb"><span><b>${esc(e.title)}</b><br><span class="muted">${esc(e.place || '')}</span></span><span class="pill done">${fmtDate(e.date)}</span></div>`).join('') : '<p class="muted">Aucune activité à venir.</p>';
    $('#lv', view).innerHTML = LV.map((l) => { const n = act.filter((s) => s.level === l).length; return `<div class="skill" style="grid-template-columns:50px 1fr 40px;background:none"><b>${l}</b><div class="bar"><i style="width:${act.length ? (n / act.length) * 100 : 0}%"></i></div><span>${n}</span></div>`; }).join('');
  };
  for (const [k, set] of [['students', (l) => (S = l)], ['classes', (l) => (C = l)], ['lessons', (l) => (L = l)], ['events', (l) => (E = l)], ['people', (l) => (P = l)]]) subscribe(ctx, ctx.backend.onCol(k, (l) => { set(l); paint(); }));
  $('#pub', view).onclick = async () => { await publishBoard(ctx.backend); toast('Tableau de bord publié ✔'); };
}

/* ------------------------------ Élèves ------------------------------ */
export async function students(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🎓</span>Élèves du centre</h2><div class="row"><button class="btn" id="fromp">📥 Depuis les prospects testés</button><button class="btn gold" id="add">➕ Nouvel élève</button></div></div>
    <div class="panel"><div class="row mb"><input class="txt grow" id="q" placeholder="🔍 Rechercher"><select class="txt" id="fs" style="width:auto"><option value="">Tous</option><option value="inscrit">Inscrits</option><option value="ancien">Anciens</option></select></div><div class="tablewrap" id="tb"></div></div><div id="form"></div>`;
  let S = [], C = [];
  const paint = () => {
    const q = $('#q', view).value.toLowerCase(), f = $('#fs', view).value;
    const rows = S.filter((s) => (!f || s.status === f) && (!q || (fullName(s) + s.code).toLowerCase().includes(q))).sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th></th><th>Élève</th><th>Niveau</th><th>Classe</th><th>Code apprenant</th><th>Frais</th><th>Statut</th><th></th></tr>${rows.map((s) => `<tr><td><img class="avatar sm" src="${esc(s.photo || IMG.logo)}"></td><td><b>${esc(fullName(s))}</b><br><span class="muted">${esc(s.tel || '')}</span></td><td><span class="pill done">${esc(s.level)}</span></td><td>${esc(C.find((c) => c.id === s.classId)?.name || '—')}</td><td><code>${esc(s.code)}</code></td><td>${s.fees ? esc(s.paid || 0) + ' / ' + esc(s.fees) + ' FCFA' : '—'}</td><td><span class="pill ${s.status === 'inscrit' ? 'ok' : 'grey'}">${esc(s.status)}</span></td><td><button class="btn sm" data-e="${s.id}">✏️</button></td></tr>`).join('')}</table>` : '<p class="muted">Aucun élève. Ajoutez-en un ou importez vos prospects testés.</p>';
    $$('[data-e]', view).forEach((b) => (b.onclick = () => edit(S.find((s) => s.id === b.dataset.e))));
  };
  const edit = (s = { id: uid(), code: accessCode(), status: 'inscrit', level: 'A1', nom: '', prenom: '' }) => {
    let photo = s.photo;
    $('#form', view).innerHTML = `<div class="panel tint-gold"><h2>${S.find((x) => x.id === s.id) ? 'Modifier' : 'Nouvel'} élève</h2><div class="photo-pick mb"><img class="avatar lg" id="ph" src="${esc(photo || IMG.logo)}"><input type="file" id="pf" accept="image/*" class="hidden"><button class="btn sm" id="pb">📷 Photo</button></div>
      <div class="grid3"><label class="f">Nom<input class="txt" id="f_nom" value="${esc(s.nom)}"></label><label class="f">Prénom(s)<input class="txt" id="f_prenom" value="${esc(s.prenom)}"></label><label class="f">Téléphone / WhatsApp<input class="txt" id="f_tel" value="${esc(s.tel || '')}"></label>
      <label class="f">Niveau<select class="txt" id="f_level">${LV.map((l) => `<option ${s.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="f">Classe<select class="txt" id="f_class"><option value="">— aucune —</option>${C.map((c) => `<option value="${c.id}" ${s.classId === c.id ? 'selected' : ''}>${esc(c.name)} (${esc(c.level)})</option>`).join('')}</select></label>
      <label class="f">Statut<select class="txt" id="f_status"><option value="inscrit" ${s.status === 'inscrit' ? 'selected' : ''}>Inscrit</option><option value="ancien" ${s.status === 'ancien' ? 'selected' : ''}>Ancien</option></select></label>
      <label class="f">Frais de formation (FCFA)<input class="txt" id="f_fees" type="number" value="${esc(s.fees || '')}"></label><label class="f">Déjà payé (FCFA)<input class="txt" id="f_paid" type="number" value="${esc(s.paid || '')}"></label>
      <label class="f">Code apprenant (connexion)<input class="txt" id="f_code" value="${esc(s.code)}" style="text-transform:uppercase;letter-spacing:.2em;font-weight:700"></label></div>
      <p class="muted">🔒 Téléphone et frais restent visibles du personnel uniquement. Les apprenants ne voient que le prénom + l’initiale, le niveau et la classe.</p>
      <div class="row"><button class="btn primary" id="sv">💾 Enregistrer</button><button class="btn" id="cn">Annuler</button>${S.find((x) => x.id === s.id) ? `<a class="btn wa" target="_blank" rel="noopener" href="${waLink(s.tel, `Bonjour ${s.prenom}, voici votre accès à l’espace d’entraînement VLA : ${location.origin}${location.pathname}#/learn — code : ${s.code}`)}">💬 Envoyer l’accès</a><button class="btn danger" id="dl">🗑</button>` : ''}</div></div>`;
    $('#pb', view).onclick = () => $('#pf', view).click();
    $('#pf', view).onchange = async (e) => { if (e.target.files[0]) { photo = await resizePhoto(e.target.files[0]); $('#ph', view).src = photo; } };
    $('#cn', view).onclick = () => ($('#form', view).innerHTML = '');
    $('#sv', view).onclick = async () => {
      const v = (i) => $('#' + i, view).value.trim();
      if (!v('f_nom') || !v('f_prenom')) return toast('Nom et prénom obligatoires');
      await ctx.backend.putDoc('students', s.id, { ...s, nom: v('f_nom').toUpperCase(), prenom: v('f_prenom'), tel: v('f_tel'), level: v('f_level'), classId: v('f_class'), status: v('f_status'), fees: Number(v('f_fees')) || 0, paid: Number(v('f_paid')) || 0, code: v('f_code').toUpperCase(), photo, enrolledAt: s.enrolledAt || Date.now() });
      await ctx.backend.putDoc('logins', v('f_code').toUpperCase(), { id: v('f_code').toUpperCase(), studentId: s.id });
      queueBoard(ctx.backend); $('#form', view).innerHTML = ''; toast('Élève enregistré');
    };
    $('#dl', view)?.addEventListener('click', async () => { if (!confirm('Supprimer cet élève ?')) return; await ctx.backend.delDoc('students', s.id); await ctx.backend.delDoc('logins', s.code); queueBoard(ctx.backend); $('#form', view).innerHTML = ''; });
    $('#form', view).scrollIntoView({ behavior: 'smooth' });
  };
  $('#add', view).onclick = () => edit();
  $('#fromp', view).onclick = async () => {
    const ppl = (await ctx.backend.listPeople()).filter((p) => !S.find((s) => s.fromPerson === p.id) && (p.decision === 'souhaitée' || p.status === 'Inscrit'));
    if (!ppl.length) return toast('Aucun prospect « inscription souhaitée » à importer');
    for (const p of ppl) { const id = uid(), code = accessCode(); await ctx.backend.putDoc('students', id, { id, code, fromPerson: p.id, nom: p.nom, prenom: p.prenom, tel: p.tel, photo: p.photo, level: practiceLevelFor(p.level), status: 'inscrit', enrolledAt: Date.now() }); await ctx.backend.putDoc('logins', code, { id: code, studentId: id }); }
    queueBoard(ctx.backend); toast(`${ppl.length} élève(s) importé(s) depuis les tests`);
  };
  $('#q', view).oninput = paint; $('#fs', view).onchange = paint;
  subscribe(ctx, ctx.backend.onCol('classes', (l) => { C = l; paint(); })); subscribe(ctx, ctx.backend.onCol('students', (l) => { S = l; paint(); }));
}

/* ------------------------------ Classes & leçons ------------------------------ */
export async function classes(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🏫</span>Classes &amp; leçons</h2><button class="btn gold" id="add">➕ Nouvelle classe</button></div><div id="form"></div><div id="list"></div>`;
  let C = [], S = [], L = [];
  const paint = () => {
    $('#list', view).innerHTML = C.length ? C.map((c) => { const els = S.filter((s) => s.classId === c.id && s.status === 'inscrit'); const ls = L.filter((l) => l.classId === c.id).sort((a, b) => b.date.localeCompare(a.date)); return `<div class="panel"><div class="row sb"><div><h2 style="margin:0">${esc(c.name)} <span class="pill done">${esc(c.level)}</span></h2><span class="muted">${esc((c.days || []).join(', '))} ${esc(c.time || '')} · ${esc(c.trainer || 'formateur non renseigné')}</span></div><div class="row"><button class="btn sm gold" data-l="${c.id}">📖 Ajouter une leçon</button><button class="btn sm" data-c="${c.id}">✏️</button></div></div>
      <div class="split mt"><div><b>Élèves (${els.length})</b><div class="muted">${els.map((s) => esc(fullName(s))).join(' · ') || 'Aucun élève affecté'}</div></div><div><b>Leçons données (${ls.length})</b>${ls.slice(0, 5).map((l) => `<div class="row sb" style="padding:4px 0;border-bottom:1px solid var(--line)"><span>${fmtDate(l.date)} — ${esc(l.topic)}</span><span class="pill ok">${l.present?.length ?? 0}/${els.length} présents</span></div>`).join('') || '<div class="muted">Aucune leçon enregistrée.</div>'}</div></div></div>`; }).join('') : '<div class="panel muted">Aucune classe. Créez-en une pour y affecter des élèves.</div>';
    $$('[data-c]', view).forEach((b) => (b.onclick = () => editClass(C.find((c) => c.id === b.dataset.c))));
    $$('[data-l]', view).forEach((b) => (b.onclick = () => addLesson(C.find((c) => c.id === b.dataset.l))));
  };
  const editClass = (c = { id: uid(), name: '', level: 'A1', days: [], time: '', trainer: '' }) => {
    $('#form', view).innerHTML = `<div class="panel tint-gold"><h2>${C.find((x) => x.id === c.id) ? 'Modifier' : 'Nouvelle'} classe</h2><div class="grid3"><label class="f">Nom<input class="txt" id="c_name" value="${esc(c.name)}" placeholder="Anglais A1 — soir"></label><label class="f">Niveau<select class="txt" id="c_level">${LV.map((l) => `<option ${c.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="f">Formateur<input class="txt" id="c_tr" value="${esc(c.trainer || '')}"></label><label class="f">Horaire<input class="txt" id="c_time" value="${esc(c.time || '')}" placeholder="16h–18h"></label></div>
      <div class="row mt">${DAYS.map((d) => `<label class="checkline" style="padding:2px 10px 2px 0"><input type="checkbox" data-d="${d}" ${c.days?.includes(d) ? 'checked' : ''}> ${d}</label>`).join('')}</div>
      <div class="row mt"><button class="btn primary" id="sv">💾 Enregistrer</button><button class="btn" id="cn">Annuler</button>${C.find((x) => x.id === c.id) ? '<button class="btn danger" id="dl">🗑</button>' : ''}</div></div>`;
    $('#cn', view).onclick = () => ($('#form', view).innerHTML = '');
    $('#sv', view).onclick = async () => { const name = $('#c_name', view).value.trim(); if (!name) return toast('Nom obligatoire'); await ctx.backend.putDoc('classes', c.id, { ...c, name, level: $('#c_level', view).value, trainer: $('#c_tr', view).value.trim(), time: $('#c_time', view).value.trim(), days: $$('[data-d]:checked', view).map((x) => x.dataset.d) }); queueBoard(ctx.backend); $('#form', view).innerHTML = ''; };
    $('#dl', view)?.addEventListener('click', async () => { if (confirm('Supprimer cette classe ?')) { await ctx.backend.delDoc('classes', c.id); queueBoard(ctx.backend); $('#form', view).innerHTML = ''; } });
  };
  const addLesson = (c) => {
    const els = S.filter((s) => s.classId === c.id && s.status === 'inscrit');
    $('#form', view).innerHTML = `<div class="panel tint-gold"><h2>📖 Leçon — ${esc(c.name)}</h2><div class="grid2"><label class="f">Date<input class="txt" id="l_date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label><label class="f">Thème de la leçon<input class="txt" id="l_topic" placeholder="Le présent simple"></label></div>
      <h3 class="mt">Présence</h3><div class="row">${els.map((s) => `<label class="checkline" style="padding:2px 12px 2px 0"><input type="checkbox" data-p="${s.id}" checked> ${esc(fullName(s))}</label>`).join('') || '<span class="muted">Aucun élève dans cette classe.</span>'}</div>
      <label class="f mt">Remarques<textarea class="txt" id="l_note" style="min-height:70px"></textarea></label><div class="row mt"><button class="btn primary" id="sv">💾 Enregistrer la leçon</button><button class="btn" id="cn">Annuler</button></div></div>`;
    $('#cn', view).onclick = () => ($('#form', view).innerHTML = '');
    $('#sv', view).onclick = async () => { const topic = $('#l_topic', view).value.trim(); if (!topic) return toast('Thème obligatoire'); const id = uid(); await ctx.backend.putDoc('lessons', id, { id, classId: c.id, date: $('#l_date', view).value, topic, note: $('#l_note', view).value, present: $$('[data-p]:checked', view).map((x) => x.dataset.p) }); queueBoard(ctx.backend); $('#form', view).innerHTML = ''; toast('Leçon enregistrée'); };
  };
  $('#add', view).onclick = () => editClass();
  for (const [k, set] of [['classes', (l) => (C = l)], ['students', (l) => (S = l)], ['lessons', (l) => (L = l)]]) subscribe(ctx, ctx.backend.onCol(k, (l) => { set(l); if (!$('#form', view).innerHTML) paint(); else paint(); }));
}

/* ------------------------------ Activités ------------------------------ */
export async function events(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">📅</span>Activités du centre</h2><button class="btn gold" id="add">➕ Nouvelle activité</button></div><div id="form"></div><div class="panel"><div class="tablewrap" id="tb"></div></div>';
  let E = [];
  const paint = () => { const rows = [...E].sort((a, b) => b.date.localeCompare(a.date)); $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th>Date</th><th>Activité</th><th>Lieu</th><th></th></tr>${rows.map((e) => `<tr><td>${fmtDate(e.date)}</td><td><b>${esc(e.title)}</b><br><span class="muted">${esc(e.desc || '')}</span></td><td>${esc(e.place || '')}</td><td><button class="btn sm danger" data-d="${e.id}">🗑</button></td></tr>`).join('')}</table>` : '<p class="muted">Aucune activité (portes ouvertes, sortie, conférence, examen blanc…).</p>'; $$('[data-d]', view).forEach((b) => (b.onclick = async () => { await ctx.backend.delDoc('events', b.dataset.d); queueBoard(ctx.backend); })); };
  $('#add', view).onclick = () => {
    $('#form', view).innerHTML = '<div class="panel tint-gold"><div class="grid3"><label class="f">Date<input class="txt" id="e_date" type="date"></label><label class="f">Titre<input class="txt" id="e_title"></label><label class="f">Lieu<input class="txt" id="e_place"></label></div><label class="f mt">Description<input class="txt" id="e_desc"></label><div class="row mt"><button class="btn primary" id="sv">💾 Enregistrer</button><button class="btn" id="cn">Annuler</button></div></div>';
    $('#cn', view).onclick = () => ($('#form', view).innerHTML = '');
    $('#sv', view).onclick = async () => { const t = $('#e_title', view).value.trim(), d = $('#e_date', view).value; if (!t || !d) return toast('Date et titre obligatoires'); const id = uid(); await ctx.backend.putDoc('events', id, { id, title: t, date: d, place: $('#e_place', view).value, desc: $('#e_desc', view).value }); queueBoard(ctx.backend); $('#form', view).innerHTML = ''; };
  };
  subscribe(ctx, ctx.backend.onCol('events', (l) => { E = l; paint(); }));
}
