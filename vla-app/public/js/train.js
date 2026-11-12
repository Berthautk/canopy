// Section « Entraînement » côté Valérie : banque d'exercices et suivi des apprenants.
import { esc, $, $$, toast, fmtDate, uid } from './ui.js';
import { PRACTICE_LEVELS, mastery, weakTopics } from './practice.js';
import { queueBoard } from './centre.js';

const subscribe = (ctx, u) => ctx.cleanup.push(u);
const kpi = (ic, n, l, cls = '') => `<div class="kpi ${cls}"><div class="ic">${ic}</div><div><b>${n}</b><span>${l}</span></div></div>`;

async function bankAll(ctx) {
  let base = []; try { base = await (await fetch('data/bank.json')).json(); } catch { /* */ }
  const extra = await ctx.backend.listCol('bank').catch(() => []);
  return [...base.map((q) => ({ ...q, builtin: true })), ...extra];
}

export async function bank(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">📚</span>Banque d’exercices</h2><div class="row"><input type="file" id="imp" accept=".json" class="hidden"><button class="btn" id="ib">⬆ Importer (JSON)</button><button class="btn gold" id="add">➕ Nouvelle question</button></div></div><div id="form"></div><div id="kp"></div><div class="panel"><div class="row mb"><select class="txt" id="fl" style="width:auto"><option value="">Tous niveaux</option>' + PRACTICE_LEVELS.map((l) => `<option>${l}</option>`).join('') + '</select></div><div class="tablewrap" id="tb"></div></div>';
  let all = await bankAll(ctx);
  const paint = () => {
    const f = $('#fl', view).value, rows = all.filter((q) => !f || q.level === f);
    $('#kp', view).innerHTML = `<div class="kpis">${PRACTICE_LEVELS.map((l) => kpi('📝', all.filter((q) => q.level === l).length, 'Questions ' + l)).join('')}</div>`;
    $('#tb', view).innerHTML = `<table class="t"><tr><th>Niv.</th><th>Thème</th><th>Question</th><th>Type</th><th></th></tr>${rows.map((q) => `<tr><td><span class="pill done">${q.level}</span></td><td>${esc(q.topic)}</td><td>${esc(q.prompt)}<br><span class="muted">💡 ${esc(q.explain)}</span></td><td>${q.type}</td><td>${q.builtin ? '<span class="pill grey">intégrée</span>' : `<button class="btn sm danger" data-d="${q.id}">🗑</button>`}</td></tr>`).join('')}</table>`;
    $$('[data-d]', view).forEach((b) => (b.onclick = async () => { await ctx.backend.delDoc('bank', b.dataset.d); all = await bankAll(ctx); paint(); }));
  };
  $('#fl', view).onchange = paint; paint();
  $('#add', view).onclick = () => {
    $('#form', view).innerHTML = `<div class="panel tint-gold"><h2>Nouvelle question</h2><div class="grid3"><label class="f">Niveau<select class="txt" id="n_l">${PRACTICE_LEVELS.map((l) => `<option>${l}</option>`).join('')}</select></label><label class="f">Thème<input class="txt" id="n_t" placeholder="Présent simple"></label><label class="f">Type<select class="txt" id="n_ty"><option value="mcq">QCM (4 choix)</option><option value="gap">Phrase à compléter</option><option value="tf">Vrai / Faux</option></select></label></div>
      <label class="f mt">Énoncé (utilisez ___ pour le trou)<input class="txt" id="n_p"></label><div id="n_o"></div><label class="f mt">Explication (en français, affichée après la correction)<textarea class="txt" id="n_e" style="min-height:70px"></textarea></label><div class="row mt"><button class="btn primary" id="sv">💾 Ajouter</button><button class="btn" id="cn">Annuler</button></div></div>`;
    const typ = () => { const t = $('#n_ty', view).value; $('#n_o', view).innerHTML = t === 'mcq' ? '<div class="grid2 mt">' + [0, 1, 2, 3].map((i) => `<label class="f">Option ${'ABCD'[i]}<input class="txt" data-o="${i}"></label>`).join('') + '</div><label class="f mt">Bonne réponse<select class="txt" id="n_a">' + [0, 1, 2, 3].map((i) => `<option value="${i}">${'ABCD'[i]}</option>`).join('') + '</select></label>' : t === 'tf' ? '<label class="f mt">Bonne réponse<select class="txt" id="n_a"><option>True</option><option>False</option></select></label>' : '<label class="f mt">Réponses acceptées (séparées par « | »)<input class="txt" id="n_a" placeholder="went | had gone"></label>'; };
    $('#n_ty', view).onchange = typ; typ();
    $('#cn', view).onclick = () => ($('#form', view).innerHTML = '');
    $('#sv', view).onclick = async () => {
      const t = $('#n_ty', view).value, p = $('#n_p', view).value.trim(), e = $('#n_e', view).value.trim(), a = $('#n_a', view).value.trim();
      if (!p || !e || !a) return toast('Énoncé, réponse et explication obligatoires');
      const q = { id: 'C-' + uid(), level: $('#n_l', view).value, topic: $('#n_t', view).value.trim() || 'Divers', type: t, prompt: p, explain: e };
      if (t === 'mcq') { q.options = $$('[data-o]', view).map((x) => x.value.trim()); if (q.options.some((x) => !x)) return toast('Renseignez les 4 options'); q.answer = Number(a); }
      else if (t === 'tf') { q.options = ['True', 'False']; q.answer = a; } else { q.accept = a.split('|').map((x) => x.trim()).filter(Boolean); q.answer = q.accept[0]; }
      await ctx.backend.putDoc('bank', q.id, q); all = await bankAll(ctx); $('#form', view).innerHTML = ''; paint(); toast('Question ajoutée');
    };
  };
  $('#ib', view).onclick = () => $('#imp', view).click();
  $('#imp', view).onchange = async (e) => {
    try {
      const arr = JSON.parse(await e.target.files[0].text()); let n = 0;
      for (const q of arr) { if (!q.level || !q.prompt || !q.explain || !q.type) continue; const id = q.id && !q.id.startsWith('A1-') ? q.id : 'C-' + uid(); await ctx.backend.putDoc('bank', id, { ...q, id }); n++; }
      all = await bankAll(ctx); paint(); toast(`${n} question(s) importée(s)`);
    } catch { toast('Fichier invalide'); }
  };
}

export async function followup(view, ctx) {
  view.innerHTML = '<div class="pagehead"><h2><span class="pic">📈</span>Suivi des apprenants</h2></div><div id="kp"></div><div class="panel"><div class="tablewrap" id="tb"></div></div>';
  let S = [], P = [], B = await bankAll(ctx);
  const paint = () => {
    const act = S.filter((s) => s.status === 'inscrit');
    const rows = act.map((s) => ({ s, p: P.find((x) => x.id === s.id) }));
    const week = Date.now() - 7 * 864e5;
    $('#kp', view).innerHTML = `<div class="kpis">${kpi('🎓', act.length, 'Apprenants avec accès', 'g')}${kpi('🔥', rows.filter((r) => r.p && r.p.lastSeen > week).length, 'Actifs cette semaine', 'y')}${kpi('★', rows.filter((r) => r.p && mastery(r.p, B).ready).length, 'Prêts pour le niveau suivant', 'p')}${kpi('😴', rows.filter((r) => !r.p || r.p.lastSeen <= week).length, 'À relancer')}</div>`;
    $('#tb', view).innerHTML = rows.length ? `<table class="t"><tr><th>Apprenant</th><th>Niveau</th><th>Série</th><th>Maîtrise</th><th>Point faible</th><th>Dernière activité</th><th></th></tr>${rows.map(({ s, p }) => { const m = p ? mastery(p, B) : { pct: 0 }; const w = p ? weakTopics(p, B)[0] : null; return `<tr><td><b>${esc(s.prenom)} ${esc(s.nom)}</b></td><td><span class="pill done">${esc(p?.level || s.level)}</span></td><td>${p?.streak || 0} 🔥</td><td>${m.pct} %<div class="mini"><i style="width:${m.pct}%"></i></div></td><td>${w ? esc(w.topic) + ' (' + w.pct + ' %)' : '—'}</td><td>${p?.lastSeen ? fmtDate(p.lastSeen) : '<span class="muted">jamais</span>'}</td><td>${m.ready && m.next ? `<button class="btn sm gold" data-up="${s.id}" data-lv="${m.next}">⬆ Passer en ${m.next}</button>` : ''}</td></tr>`; }).join('')}</table>` : '<p class="muted">Aucun apprenant. Ajoutez des élèves dans la section Centre : chacun reçoit un code de connexion.</p>';
    $$('[data-up]', view).forEach((b) => (b.onclick = async () => { const s = S.find((x) => x.id === b.dataset.up); await ctx.backend.putDoc('students', s.id, { ...s, level: b.dataset.lv }); queueBoard(ctx.backend); toast(`${s.prenom} passe en ${b.dataset.lv}`); }));
  };
  subscribe(ctx, ctx.backend.onCol('students', (l) => { S = l; paint(); })); subscribe(ctx, ctx.backend.onCol('progress', (l) => { P = l; paint(); }));
}
