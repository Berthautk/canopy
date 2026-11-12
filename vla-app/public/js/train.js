// Section « Entraînement » côté Valérie : suivi des apprenants, banque d'exercices, résultats.
import { esc, $, $$, toast, fmtDate, uid, IMG } from './ui.js';
import { PRACTICE_LEVELS, mastery, weakTopics, dayIndex } from './practice.js';
import { queueBoard } from './centre.js';

const subscribe = (ctx, u) => ctx.cleanup.push(u);
const kpi = (ic, n, l, cls = '') => `<div class="kpi ${cls}"><div class="ic">${ic}</div><div><b>${n}</b><span>${l}</span></div></div>`;
const lvPill = (l) => `<span class="pill lv-${esc(l)}">${esc(l)}</span>`;
export const THEMES = { 'Vie quotidienne': '📅', Achats: '🛒', Famille: '👨‍👩‍👧', Grammaire: '📖', Communication: '✉️', Santé: '🩺', Emploi: '💼', Voyage: '✈️', Environnement: '🌿', Divers: '📝' };
const TYPES = { mcq: ['QCM', '#e7defa'], gap: ['Compléter', '#FFF3D6'], tf: ['Vrai / Faux', '#DCEBFB'] };
const pager = (total, page, per, id) => { const n = Math.max(1, Math.ceil(total / per)); const nums = [...new Set([1, 2, 3, page, n])].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b); return `<div class="pager"><span class="muted">Affichage : ${total ? (page - 1) * per + 1 : 0} – ${Math.min(total, page * per)} sur ${total}</span><div class="pg" id="${id}"><button data-p="${Math.max(1, page - 1)}">‹</button>${nums.map((x) => `<button data-p="${x}" class="${x === page ? 'on' : ''}">${x}</button>`).join('')}<button data-p="${Math.min(n, page + 1)}">›</button></div></div>`; };

export async function bankAll(ctx) {
  let base = []; try { base = await (await fetch('data/bank.json')).json(); } catch { /* */ }
  const extra = await ctx.backend.listCol('bank').catch(() => []);
  const norm = (q) => ({ ...q, title: q.title || q.topic, theme: q.theme || 'Grammaire', status: q.status || 'published' });
  return [...base.map((q) => ({ ...norm(q), builtin: true })), ...extra.map(norm)];
}

/* ------------------------------ Suivi des apprenants ------------------------------ */
export async function followup(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">🎓</span>Entraînement – Suivi des apprenants</h2><div class="row"><select class="txt" id="fl" style="width:auto"><option value="">Tous les niveaux</option>${PRACTICE_LEVELS.map((l) => `<option>${l}</option>`).join('')}</select><input class="txt" id="q" placeholder="🔍 Rechercher un apprenant…" style="width:240px"></div></div>
    <div id="kp"></div><div class="split" style="grid-template-columns:1.7fr 1fr"><div class="panel"><div class="tablewrap" id="tb"></div><div id="pg"></div></div><div id="dt"></div></div>`;
  let S = [], P = [], B = await bankAll(ctx), page = 1, sel = null;
  const PER = 8, week = () => Date.now() - 7 * 864e5;
  const stateOf = (p, m) => (m.ready ? ['Prêt pour ' + m.next, 'ok'] : p && m.pct < 40 && p.log.length >= 3 ? ['À renforcer', 'bad'] : ['En progression', 'wait']);
  const paint = () => {
    const q = $('#q', view).value.toLowerCase(), fl = $('#fl', view).value;
    const act = S.filter((s) => s.status === 'inscrit');
    const all = act.map((s) => { const p = P.find((x) => x.id === s.id); return { s, p, m: p ? mastery(p, B) : { pct: 0, acc: 0, ready: false, next: null } }; });
    const rows = all.filter((r) => (!fl || (r.p?.level || r.s.level) === fl) && (!q || (r.s.prenom + r.s.nom).toLowerCase().includes(q)));
    const withP = all.filter((r) => r.p);
    const sess30 = P.reduce((a, p) => a + p.log.filter((l) => l.day > dayIndex() - 30).length, 0);
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('🎓', act.length, 'Apprenants suivis')}${kpi('📶', withP.length ? Math.round(withP.reduce((a, r) => a + r.m.pct, 0) / withP.length) + ' %' : '—', 'Taux de maîtrise moyen', 'g')}${kpi('🎯', all.filter((r) => r.m.ready).length, 'Prêts pour le niveau suivant', 'y')}${kpi('🏆', sess30, 'Séances (30 jours)', 'p')}</div>`;
    const pg = rows.slice((page - 1) * PER, page * PER);
    $('#tb', view).innerHTML = pg.length ? `<table class="t"><tr><th>N°</th><th>Apprenant</th><th>Niveau</th><th>Série 🔥</th><th>Maîtrise</th><th>Point faible</th><th>Dernière activité</th><th>État</th></tr>${pg.map(({ s, p, m }, i) => { const w = p ? weakTopics(p, B)[0] : null, st = stateOf(p, m); return `<tr class="click ${s.id === sel ? 'sel' : ''}" data-id="${s.id}"><td>${(page - 1) * PER + i + 1}</td><td><img class="avatar sm" src="${esc(s.photo || IMG.logo)}"> <b>${esc(s.prenom)} ${esc(s.nom)}</b></td><td>${lvPill(p?.level || s.level)}</td><td>${p?.streak || 0}</td><td><b>${m.pct} %</b><div class="mini"><i style="width:${m.pct}%"></i></div></td><td>${w ? esc(w.topic) : '—'}</td><td>${p?.lastSeen ? fmtDate(p.lastSeen) : '<span class="muted">jamais</span>'}</td><td><span class="pill ${st[1]}">${esc(st[0])}</span></td></tr>`; }).join('')}</table>` : '<p class="muted">Aucun apprenant. Ajoutez des élèves dans la section Centre : chacun reçoit un code de connexion.</p>';
    $('#pg', view).innerHTML = pager(rows.length, page, PER, 'pgn');
    $$('#pgn [data-p]', view).forEach((b) => (b.onclick = () => { page = Number(b.dataset.p); paint(); }));
    $$('tr.click', view).forEach((r) => (r.onclick = () => { sel = r.dataset.id; paint(); }));
    const cur = all.find((r) => r.s.id === sel) || null;
    if (!cur) return ($('#dt', view).innerHTML = '<div class="panel muted">Sélectionnez un apprenant pour voir le détail.</div>');
    const { s, p, m } = cur, tp = p ? weakTopics(p, B) : [], good = [...tp].reverse().filter((t) => t.pct >= 70).slice(0, 2), weak = tp[0];
    $('#dt', view).innerHTML = `<div class="panel side-edit"><h2>👤 Détails de l’apprenant</h2><div class="row mb" style="flex-wrap:nowrap"><img class="avatar lg" src="${esc(s.photo || IMG.logo)}"><div><h3 style="margin:0">${esc(s.prenom)} ${esc(s.nom)}</h3><div class="muted">Code : ${esc(s.code)}</div><span class="pill ${stateOf(p, m)[1]} mt">${esc(stateOf(p, m)[0])}</span></div></div>
      <div class="fieldrow">Niveau actuel :<b>${esc(p?.level || s.level)}</b></div><div class="fieldrow">Série actuelle :<b>${p?.streak || 0} jours 🔥</b></div><div class="fieldrow">Maîtrise :<span><b>${m.pct} %</b> (réussite récente ${m.acc || 0} %)<div class="bar"><i style="width:${m.pct}%"></i></div></span></div>
      <div class="fieldrow">Points forts :<span>${good.map((t) => esc(t.topic)).join(', ') || '—'}</span></div><div class="fieldrow">Point faible :<span>${weak ? esc(weak.topic) + ' (' + weak.pct + ' %)' : '—'}</span></div>
      <div class="fieldrow">Dernière activité :<span>${p?.lastSeen ? fmtDate(p.lastSeen) : 'jamais'}</span></div>
      ${m.ready && m.next ? `<button class="btn big" id="up" style="background:linear-gradient(#27a85f,#157a40);color:#fff;border-color:#157a40;min-height:56px">⏩ Passer en ${m.next}</button>` : ''}
      <button class="btn big mt" id="pr" style="min-height:52px">📊 Voir les progrès</button><div id="prog"></div></div>`;
    $('#up', view)?.addEventListener('click', async () => { await ctx.backend.putDoc('students', s.id, { ...s, level: m.next }); queueBoard(ctx.backend); toast(`${s.prenom} passe en ${m.next}`); });
    $('#pr', view).onclick = () => { const last = (p?.log || []).slice(-10); $('#prog', view).innerHTML = last.length ? `<div class="chartbars mt" style="height:110px">${last.map((l) => `<div style="height:${(l.ok / Math.max(1, l.total)) * 100}%"><span>${l.ok}/${l.total}</span></div>`).join('')}</div><div class="chartlbl">${last.map((l) => `<span>S${last.indexOf(l) + 1}</span>`).join('')}</div>` : '<p class="muted mt">Aucune séance.</p>'; };
  };
  ['#q', '#fl'].forEach((i) => ($(i, view).oninput = () => { page = 1; paint(); }));
  subscribe(ctx, ctx.backend.onCol('students', (l) => { S = l; paint(); })); subscribe(ctx, ctx.backend.onCol('progress', (l) => { P = l; paint(); }));
}

/* ------------------------------ Banque d'exercices ------------------------------ */
export async function bank(view, ctx) {
  view.innerHTML = `<div class="pagehead"><h2><span class="pic">📚</span>Entraînement – Banque d’exercices</h2><div class="row"><input class="txt" id="q" placeholder="🔍 Rechercher un exercice (titre, thème…)" style="width:280px"><input type="file" id="imp" accept=".json" class="hidden"><button class="btn" id="ib">⬆ Importer</button><button class="btn gold" id="add">➕ Ajouter un exercice</button></div></div>
    <div class="split" style="grid-template-columns:1.5fr 1fr"><div><div class="filters"><select class="txt" id="fl"><option value="">Tous les niveaux</option>${PRACTICE_LEVELS.map((l) => `<option>${l}</option>`).join('')}</select><select class="txt" id="ft"><option value="">Tous les thèmes</option>${Object.keys(THEMES).map((t) => `<option>${t}</option>`).join('')}</select><select class="txt" id="fy"><option value="">Tous les types</option><option value="mcq">QCM</option><option value="gap">Compléter</option><option value="tf">Vrai / Faux</option></select></div>
    <div class="panel"><div class="tablewrap" id="tb"></div><div id="pg"></div></div></div><div id="form"></div></div>`;
  let all = await bankAll(ctx), page = 1;
  const PER = 8;
  const groups = () => { const m = new Map(); for (const q of all) { const k = q.level + '|' + q.title; if (!m.has(k)) m.set(k, { title: q.title, level: q.level, theme: q.theme, qs: [] }); m.get(k).qs.push(q); } return [...m.values()]; };
  const paint = () => {
    const f = { q: $('#q', view).value.toLowerCase(), l: $('#fl', view).value, t: $('#ft', view).value, y: $('#fy', view).value };
    const rows = groups().filter((g) => (!f.l || g.level === f.l) && (!f.t || g.theme === f.t) && (!f.y || g.qs.some((q) => q.type === f.y)) && (!f.q || (g.title + g.theme).toLowerCase().includes(f.q)));
    const pg = rows.slice((page - 1) * PER, page * PER);
    $('#tb', view).innerHTML = `<table class="t"><tr><th>N°</th><th>Titre de l’exercice</th><th>Niveau</th><th>Thème</th><th>Type</th><th>Questions</th><th>Statut</th></tr>${pg.map((g, i) => { const types = [...new Set(g.qs.map((q) => q.type))], draft = g.qs.every((q) => q.status === 'draft'); return `<tr><td>${(page - 1) * PER + i + 1}</td><td><b>${esc(g.title)}</b></td><td>${lvPill(g.level)}</td><td>${THEMES[g.theme] || '📝'} ${esc(g.theme)}</td><td>${types.map((t) => `<span class="pill xs" style="background:${TYPES[t][1]}">${TYPES[t][0]}</span>`).join(' ')}</td><td>${g.qs.length}</td><td>${g.qs.some((q) => q.builtin) ? '<span class="pill ok">✔ Publié</span>' : `<button class="pill ${draft ? 'grey' : 'ok'}" data-pub="${esc(g.level + '|' + g.title)}" style="border:0;cursor:pointer" title="Cliquer pour changer">${draft ? '🕘 Brouillon' : '✔ Publié'}</button>`}</td></tr>`; }).join('')}</table>`;
    $('#pg', view).innerHTML = pager(rows.length, page, PER, 'pgn');
    $$('#pgn [data-p]', view).forEach((b) => (b.onclick = () => { page = Number(b.dataset.p); paint(); }));
    $$('[data-pub]', view).forEach((b) => (b.onclick = async () => { const g = groups().find((x) => x.level + '|' + x.title === b.dataset.pub); const draft = g.qs.every((q) => q.status === 'draft'); for (const q of g.qs) await ctx.backend.putDoc('bank', q.id, { ...q, status: draft ? 'published' : 'draft' }); all = await bankAll(ctx); paint(); }));
  };
  ['#q', '#fl', '#ft', '#fy'].forEach((i) => ($(i, view).oninput = () => { page = 1; paint(); })); paint();
  const form = () => {
    $('#form', view).innerHTML = `<div class="panel side-edit"><h2>✏️ Ajouter un exercice</h2>
      <label class="f req">Titre de l’exercice<input class="txt" id="n_ti" placeholder="The environment" list="titles"></label><datalist id="titles">${[...new Set(all.map((q) => q.title))].map((t) => `<option value="${esc(t)}">`).join('')}</datalist>
      <div class="grid2 mt"><label class="f req">Niveau<select class="txt" id="n_l">${PRACTICE_LEVELS.map((l) => `<option>${l}</option>`).join('')}</select></label><label class="f req">Thème<select class="txt" id="n_t">${Object.entries(THEMES).map(([t, i]) => `<option value="${t}">${i} ${t}</option>`).join('')}</select></label></div>
      <div class="mt"><b class="req">Type d’exercice</b><div class="row mt" id="n_ty">${Object.entries(TYPES).map(([k, v], i) => `<label class="pill" style="background:${v[1]};padding:8px 14px;cursor:pointer"><input type="radio" name="ty" value="${k}" ${i ? '' : 'checked'}> ${v[0]}</label>`).join('')}</div></div>
      <label class="f req mt">Question (utilisez ___ pour le trou)<textarea class="txt" id="n_p" style="min-height:70px"></textarea></label><div id="n_o"></div>
      <label class="f mt req">Explication affichée après la correction<textarea class="txt" id="n_e" style="min-height:60px"></textarea></label>
      <div class="row mt"><button class="btn" id="pv">👁 Aperçu</button><button class="btn" id="sv" style="background:linear-gradient(#27a85f,#157a40);color:#fff;border-color:#157a40">💾 Enregistrer l’exercice</button></div><div id="pvw"></div></div>`;
    const type = () => $('input[name=ty]:checked', view).value;
    const opts = () => { const t = type(); $('#n_o', view).innerHTML = t === 'mcq' ? [0, 1, 2, 3].map((i) => `<div class="row mt" style="flex-wrap:nowrap"><input type="radio" name="ok" value="${i}" ${i ? '' : 'checked'} title="Bonne réponse"><b>${'ABCD'[i]}.</b><input class="txt" data-o="${i}" placeholder="Option ${'ABCD'[i]}"></div>`).join('') + '<p class="muted">◉ = bonne réponse</p>' : t === 'tf' ? '<label class="f mt">Bonne réponse<select class="txt" id="n_a"><option>True</option><option>False</option></select></label>' : '<label class="f mt">Réponses acceptées (séparées par « | »)<input class="txt" id="n_a" placeholder="went | had gone"></label>'; };
    $$('input[name=ty]', view).forEach((r) => (r.onchange = opts)); opts();
    const build = () => {
      const t = type(), p = $('#n_p', view).value.trim(), e = $('#n_e', view).value.trim(), ti = $('#n_ti', view).value.trim();
      if (!ti || !p || !e) { toast('Titre, question et explication sont obligatoires'); return null; }
      const q = { id: 'C-' + uid(), level: $('#n_l', view).value, theme: $('#n_t', view).value, topic: ti, title: ti, type: t, prompt: p, explain: e, status: 'published' };
      if (t === 'mcq') { q.options = $$('[data-o]', view).map((x) => x.value.trim()); if (q.options.some((x) => !x)) { toast('Renseignez les 4 options'); return null; } q.answer = Number($('input[name=ok]:checked', view).value); }
      else if (t === 'tf') { q.options = ['True', 'False']; q.answer = $('#n_a', view).value; } else { const a = $('#n_a', view).value.trim(); if (!a) { toast('Indiquez la réponse'); return null; } q.accept = a.split('|').map((x) => x.trim()).filter(Boolean); q.answer = q.accept[0]; }
      return q;
    };
    $('#pv', view).onclick = () => { const q = build(); if (!q) return; $('#pvw', view).innerHTML = `<div class="info mt" style="display:block"><b>${esc(q.prompt)}</b>${q.options ? '<br>' + q.options.map((o, i) => `${'ABCD'[i]}. ${esc(o)}${q.type === 'mcq' && i === q.answer ? ' ✔' : ''}`).join('<br>') : '<br>Réponse : ' + esc(q.accept?.join(' / ') || '')}<br>💡 ${esc(q.explain)}</div>`; };
    $('#sv', view).onclick = async () => { const q = build(); if (!q) return; await ctx.backend.putDoc('bank', q.id, q); all = await bankAll(ctx); paint(); toast('Question ajoutée à l’exercice « ' + q.title + ' »'); $('#n_p', view).value = ''; $('#n_e', view).value = ''; $$('[data-o]', view).forEach((x) => (x.value = '')); };
  };
  form();
  $('#add', view).onclick = () => { form(); $('#form', view).scrollIntoView({ behavior: 'smooth' }); };
  $('#ib', view).onclick = () => $('#imp', view).click();
  $('#imp', view).onchange = async (e) => {
    try { const arr = JSON.parse(await e.target.files[0].text()); let n = 0; for (const q of arr) { if (!q.level || !q.prompt || !q.explain || !q.type) continue; const id = 'C-' + uid(); await ctx.backend.putDoc('bank', id, { ...q, id }); n++; } all = await bankAll(ctx); paint(); toast(`${n} question(s) importée(s)`); } catch { toast('Fichier invalide'); }
  };
}

/* ------------------------------ Résultats & statistiques ------------------------------ */
export async function trainStats(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">📊</span>Entraînement – Résultats &amp; statistiques</h2></div><div id="s"></div>';
  let P = [], S = [], B = await bankAll(ctx);
  const paint = () => {
    const wk = []; const t0 = dayIndex(); for (let i = 7; i >= 0; i--) { const from = t0 - i * 7 - 6, to = t0 - i * 7; wk.push({ n: P.reduce((a, p) => a + p.log.filter((l) => l.day >= from && l.day <= to).length, 0), ok: P.reduce((a, p) => a + p.log.filter((l) => l.day >= from && l.day <= to).reduce((b, l) => b + l.ok, 0), 0), tot: P.reduce((a, p) => a + p.log.filter((l) => l.day >= from && l.day <= to).reduce((b, l) => b + l.total, 0), 0) }); }
    const max = Math.max(1, ...wk.map((w) => w.n));
    const topics = {}; for (const p of P) for (const t of weakTopics(p, B)) { const x = (topics[t.topic] ||= { seen: 0, ok: 0 }); x.seen += t.seen; x.ok += (t.pct / 100) * t.seen; }
    const tp = Object.entries(topics).map(([k, v]) => ({ k, pct: Math.round((v.ok / v.seen) * 100), seen: Math.round(v.seen) })).sort((a, b) => a.pct - b.pct);
    const tot = P.reduce((a, p) => a + p.log.reduce((b, l) => b + l.total, 0), 0), ok = P.reduce((a, p) => a + p.log.reduce((b, l) => b + l.ok, 0), 0);
    $('#s', view).innerHTML = `<div class="kpis">${kpi('🏁', P.reduce((a, p) => a + p.log.length, 0), 'Séances réalisées')}${kpi('✅', tot ? Math.round((ok / tot) * 100) + ' %' : '—', 'Taux de réussite global', 'g')}${kpi('👥', P.filter((p) => p.lastSeen > Date.now() - 7 * 864e5).length, 'Actifs cette semaine', 'y')}${kpi('📚', B.length, 'Questions en banque', 'p')}</div>
    <div class="split"><div class="panel"><h2>📊 Séances par semaine</h2><div class="chartbars">${wk.map((w) => `<div style="height:${(w.n / max) * 100}%"><span>${w.n}</span></div>`).join('')}</div><div class="chartlbl">${wk.map((w, i) => `<span>S-${7 - i}</span>`).join('')}</div></div>
    <div class="panel"><h2>🧩 Thèmes les plus difficiles</h2>${tp.length ? tp.slice(0, 6).map((t) => `<div class="skill" style="grid-template-columns:1fr 130px 60px;background:none"><span>${esc(t.k)}</span><div class="bar"><i style="width:${t.pct}%"></i></div><span class="pill ${t.pct < 60 ? 'bad' : 'ok'}">${t.pct} %</span></div>`).join('') : '<p class="muted">Pas encore de données.</p>'}</div></div>
    <div class="panel"><h2>Maîtrise par niveau</h2>${PRACTICE_LEVELS.map((l) => { const ps = P.filter((p) => p.level === l), avg = ps.length ? Math.round(ps.reduce((a, p) => a + mastery(p, B).pct, 0) / ps.length) : 0; return `<div class="skill" style="grid-template-columns:54px 1fr 150px;background:none">${lvPill(l)}<div class="bar" style="height:16px"><i style="width:${avg}%"></i></div><span>${ps.length} apprenant(s) · ${avg} %</span></div>`; }).join('')}</div>`;
  };
  subscribe(ctx, ctx.backend.onCol('progress', (l) => { P = l; paint(); })); subscribe(ctx, ctx.backend.onCol('students', (l) => { S = l; paint(); }));
}
