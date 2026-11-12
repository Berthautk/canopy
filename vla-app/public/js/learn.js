// Espace apprenant (#/learn) : connexion par code personnel, séance quotidienne adaptée au niveau,
// correction expliquée, progression, et « vie du centre » (données générales uniquement).
import { esc, $, $$, toast, IMG } from './ui.js';
import { pickDaily, grade, answerText, applyResults, newProgress, mastery, weakTopics, dayIndex } from './practice.js';

const NOAUTO = 'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"';

export async function loadBank(backend) {
  let base = [];
  try { base = await (await fetch('data/bank.json')).json(); } catch { /* hors ligne : le cache du service worker répond */ }
  let extra = []; try { extra = await backend.listCol('bank'); } catch { /* */ }
  return [...base, ...extra.filter((q) => q && q.id)];
}

export async function runLearner(root, backend) {
  const L = { root, backend, me: null, prog: null, bank: [], tab: 'home', sess: null };
  const saved = localStorage.getItem('vla-learner');
  if (saved) { try { await enter(L, saved, true); return; } catch { /* retour à la connexion */ } }
  loginScreen(L);
}

function frame(L, inner, { title = 'Entraînement VLA', nav = true } = {}) {
  L.root.innerHTML = `<div class="cand"><header class="chead"><img class="logo" src="${IMG.logo}" alt=""><div class="vsep"></div><div><div class="t1">Valérie Language Academy (VLA)</div><div class="t2">${esc(title)}</div></div><div class="grow"></div>
    ${L.me ? `<span class="chip" style="color:var(--navy)">🔥 ${L.prog?.streak || 0} j</span><span class="chip" style="color:var(--navy)">⭐ ${L.prog?.xp || 0}</span>` : ''}</header>
    <main class="cmain" style="padding-bottom:${nav && L.me ? 110 : 30}px">${inner}</main>
    ${nav && L.me ? `<div class="cfoot" style="justify-content:space-around;min-height:84px">${[['home', '🏠', 'Entraînement'], ['centre', '🏫', 'Vie du centre']].map(([k, i, l]) => `<button class="btn ${L.tab === k ? 'primary' : ''}" data-tab="${k}" style="min-width:0;flex:1;max-width:260px">${i} ${l}</button>`).join('')}<button class="btn" id="lo" style="min-width:0">⏻</button></div>` : ''}</div>`;
  $$('[data-tab]', L.root).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; render(L); }));
  $('#lo', L.root)?.addEventListener('click', () => { localStorage.removeItem('vla-learner'); L.me = null; loginScreen(L); });
}

function loginScreen(L) {
  frame(L, `<div class="ccard" style="max-width:560px;margin:18px auto;text-align:center"><div class="partbar" style="justify-content:center"><h2>📚 Mon entraînement</h2></div>
    <p class="qbig" style="font-weight:500">Entre ton code personnel pour t’entraîner en anglais, à ton niveau.</p>
    <input class="txt" id="code" maxlength="8" placeholder="CODE" style="text-align:center;font-size:2rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase" ${NOAUTO}>
    <p id="err" class="ferr mt"></p><button class="btn gold big" id="go">▶ &nbsp;Entrer</button>
    <p class="muted mt">Ton code t’a été donné par le centre. <a href="#/">← Accueil</a></p></div>`, { nav: false });
  const go = async () => { try { await enter(L, $('#code', L.root).value.trim().toUpperCase()); } catch (e) { $('#err', L.root).textContent = e.message; } };
  $('#go', L.root).onclick = go; $('#code', L.root).onkeydown = (e) => e.key === 'Enter' && go();
}

async function enter(L, code, silent) {
  if (!code) throw new Error('Saisis ton code.');
  await L.backend.candidateAuth();
  const login = await L.backend.getDoc('logins', code);
  const me = login && (await L.backend.getDoc('members', login.studentId));
  if (!me) throw new Error('Code inconnu. Vérifie auprès du centre.');
  L.me = me; L.bank = await loadBank(L.backend);
  L.prog = (await L.backend.getDoc('progress', me.id)) || newProgress(me.id, me.level);
  if (me.level && me.level !== L.prog.level && L.prog.levelSetBy !== 'self') L.prog.level = me.level; // le niveau fixé par Valérie prime
  localStorage.setItem('vla-learner', code);
  L.tab = 'home'; render(L);
}

function render(L) { if (L.tab === 'centre') return centreTab(L); homeTab(L); }

/* ------------------------------ Accueil ------------------------------ */
function homeTab(L) {
  const p = L.prog, m = mastery(p, L.bank), today = dayIndex();
  const doneToday = p.lastDay === today && p.log.length && p.log[p.log.length - 1].day === today;
  const weak = weakTopics(p, L.bank).filter((t) => t.pct < 70).slice(0, 3);
  const due = L.bank.filter((q) => q.level === p.level && p.items[q.id] && p.items[q.id].due <= today).length;
  frame(L, `<div class="ccard"><div class="row" style="flex-wrap:nowrap"><img class="avatar lg" src="${esc(L.me.photo || IMG.logo)}"><div class="grow"><h1 style="margin:0">Bonjour ${esc(L.me.prenom)} 👋</h1><p class="qbig" style="margin:4px 0">Ton niveau : <span class="pill done" style="font-size:1.1rem">${esc(p.level)}</span></p>
      <div class="muted">${p.streak ? `🔥 ${p.streak} jour(s) de suite — continue !` : 'Commence ta série aujourd’hui !'}</div></div></div>
    ${m.ready ? `<div class="info mt" style="background:var(--ok-soft)"><span class="i" style="background:var(--ok)">★</span><div><b>Bravo !</b> Tu maîtrises le niveau ${esc(p.level)}. Demande à ta formatrice de te faire passer au niveau ${esc(m.next)}.</div></div>` : ''}
    <div class="panel tint-gold mt"><h2>🎯 Séance du jour</h2><p>${doneToday ? '✅ Tu as déjà fait ta séance aujourd’hui. Tu peux en refaire une pour t’entraîner encore.' : '10 questions adaptées à ton niveau. Les questions ratées reviennent automatiquement pour que tu les retiennes.'}${due ? `<br><b>${due}</b> question(s) à revoir aujourd’hui.` : ''}</p>
      <button class="btn primary big" id="start">▶ &nbsp;${doneToday ? 'Nouvelle séance' : 'Commencer la séance'}</button></div>
    <div class="grid2"><div class="panel"><h2>📈 Maîtrise du niveau ${esc(p.level)}</h2><div class="bar" style="height:20px"><i style="width:${m.pct}%"></i></div><p class="muted">${m.pct} % des exercices maîtrisés · réussite récente ${m.acc || 0} %</p></div>
    <div class="panel"><h2>🧩 À retravailler</h2>${weak.length ? weak.map((t) => `<div class="row sb"><span>${esc(t.topic)}</span><span class="pill bad">${t.pct} %</span></div>`).join('') : '<p class="muted">Pas encore de point faible détecté. Fais une séance !</p>'}</div></div></div>`, { title: 'Mon entraînement' });
  $('#start', L.root).onclick = () => startSession(L, pickDaily(L.bank, p, 10));
}

/* ------------------------------ Séance ------------------------------ */
function startSession(L, qs) {
  if (!qs.length) { toast('Pas de questions pour ce niveau pour le moment.'); return; }
  L.sess = { qs, i: 0, answers: {} }; question(L);
}
function question(L) {
  const { qs, i, answers } = L.sess, q = qs[i], blank = '<span style="display:inline-block;min-width:3.2em;border-bottom:4px solid var(--navy)">&nbsp;</span>';
  const parts = q.prompt.split('___');
  const body = q.type === 'gap'
    ? `<div class="sentence">${esc(parts[0])}<input class="txt inline" id="ans" value="${esc(answers[q.id] || '')}" ${NOAUTO}>${esc(parts.slice(1).join('___'))}</div>`
    : q.type === 'tf'
      ? `<div class="sentence" style="font-size:1.7rem">${esc(q.prompt)}</div><div class="opts">${q.options.map((o) => `<button class="opt tf ${answers[q.id] === o ? 'sel' : ''}" data-v="${esc(o)}"><span class="rd"></span>${esc(o)}</button>`).join('')}</div>`
      : `<div class="sentence" style="font-size:1.8rem">${parts.length > 1 ? esc(parts[0]) + blank + esc(parts.slice(1).join('___')) : esc(q.prompt)}</div><div class="opts">${q.options.map((o, k) => `<button class="opt ${String(answers[q.id]) === String(k) ? 'sel' : ''}" data-v="${k}"><span class="rd"></span><b>${'ABCD'[k]}.</b>${esc(o)}</button>`).join('')}</div>`;
  frame(L, `<div class="partbar"><div class="ico">📝</div><h2>Question ${i + 1} / ${qs.length}</h2><span class="tag">${esc(q.topic)}</span></div><div class="ccard">${body}</div>
    <div class="cfoot"><button class="btn" id="bk" ${i ? '' : 'disabled'}>❮ Retour</button><button class="btn primary" id="nx">${i === qs.length - 1 ? 'Terminer ✔' : 'Suivant ❯'}</button></div>`, { title: 'Séance du jour', nav: false });
  $$('.opt', L.root).forEach((b) => (b.onclick = () => { answers[q.id] = b.dataset.v; $$('.opt', L.root).forEach((x) => x.classList.toggle('sel', x === b)); }));
  $('#ans', L.root)?.addEventListener('input', (e) => (answers[q.id] = e.target.value));
  $('#ans', L.root)?.focus();
  $('#bk', L.root).onclick = () => { L.sess.i--; question(L); };
  $('#nx', L.root).onclick = () => { if (i === qs.length - 1) return finish(L); L.sess.i++; question(L); };
}
async function finish(L) {
  const { qs, answers } = L.sess;
  const results = qs.map((q) => ({ id: q.id, ok: grade(q, answers[q.id]) }));
  L.prog = applyResults(L.prog, results);
  try { await L.backend.putDoc('progress', L.me.id, { ...L.prog, name: L.me.initial || L.me.prenom, lastSeen: Date.now() }); } catch { toast('Progression enregistrée sur cet appareil seulement'); }
  const ok = results.filter((r) => r.ok).length;
  frame(L, `<div class="ccard"><div class="row" style="flex-wrap:nowrap"><div class="doneicon" style="width:90px;height:90px;font-size:2.6rem">${ok >= qs.length * 0.7 ? '🏆' : '💪'}</div><div><h1 style="margin:0">${ok} / ${qs.length}</h1><p class="qbig" style="margin:0;font-weight:500">${ok === qs.length ? 'Parfait !' : ok >= qs.length * 0.7 ? 'Très bien, continue !' : 'Courage : relis les explications, ces questions reviendront.'} (+${ok * 10 + (qs.length - ok) * 2} points)</p></div></div></div>
    <h2 class="mt">Correction</h2>${qs.map((q, k) => { const r = results[k], a = answers[q.id]; const shown = a === undefined || a === '' ? '<i>sans réponse</i>' : q.type === 'mcq' ? esc(q.options[a]) : esc(a);
      return `<div class="rq" style="border-color:${r.ok ? '#9ed9b6' : '#f3c1bb'};background:${r.ok ? '#F3FBF6' : '#FFF6F5'}"><div class="qprompt"><span class="qnum" style="background:${r.ok ? 'var(--ok)' : 'var(--err)'}">${r.ok ? '✓' : '✗'}</span>${esc(q.prompt)}</div>
      <div style="margin:6px 0 0 46px">Ta réponse : <b>${shown}</b>${r.ok ? '' : `<br>Bonne réponse : <b style="color:var(--ok)">${esc(answerText(q))}</b>`}<div class="info mt" style="margin-bottom:0"><span class="i">💡</span><div>${esc(q.explain)}</div></div></div></div>`; }).join('')}
    <div class="row mt"><button class="btn primary" id="again">🔁 ${results.some((r) => !r.ok) ? 'Réviser mes erreurs' : 'Nouvelle séance'}</button><button class="btn" id="home">🏠 Accueil</button></div>`, { title: 'Résultat de la séance', nav: false });
  $('#home', L.root).onclick = () => { L.tab = 'home'; render(L); };
  $('#again', L.root).onclick = () => { const wrong = qs.filter((q, k) => !results[k].ok); startSession(L, wrong.length ? wrong : pickDaily(L.bank, L.prog, 10)); };
}

/* ------------------------------ Vie du centre (données générales) ------------------------------ */
async function centreTab(L) {
  const b = await L.backend.getDoc('board', 'summary').catch(() => null);
  frame(L, b ? `<div class="kpis">${[['🎓', b.inscrits, 'Élèves au centre'], ['🏫', b.classes, 'Classes'], ['📖', b.lessonsDone, 'Leçons données']].map(([i, n, l]) => `<div class="kpi"><div class="ic">${i}</div><div><b>${n}</b><span>${l}</span></div></div>`).join('')}</div>
    <div class="split"><div class="panel"><h2>🏫 Les classes</h2>${(b.classList || []).map((c) => `<div class="row sb" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>${esc(c.name)}</b> <span class="pill done">${esc(c.level)}</span><br><span class="muted">${esc((c.days || []).join(', '))} ${esc(c.time || '')}</span></span><span class="muted">${c.size} élèves · ${c.lessons} leçons${c.last ? '<br>Dernière : ' + esc(c.last) : ''}</span></div>`).join('') || '<p class="muted">—</p>'}</div>
    <div><div class="panel tint-gold"><h2>📅 À venir</h2>${(b.events || []).map((e) => `<div class="row sb mb"><b>${esc(e.title)}</b><span class="pill done">${new Date(e.date).toLocaleDateString('fr-FR')}</span></div>`).join('') || '<p class="muted">Rien de prévu pour le moment.</p>'}</div>
    ${b.names?.length ? `<div class="panel"><h2>👥 Au centre</h2><div class="muted">${b.names.map((n) => `${esc(n.n)} <span class="pill grey">${esc(n.level)}</span>`).join(' · ')}</div></div>` : ''}</div></div>
    <p class="muted" style="text-align:center">Mis à jour le ${new Date(b.updatedAt).toLocaleDateString('fr-FR')}</p>` : '<div class="ccard">Le tableau de bord du centre n’est pas encore publié.</div>', { title: 'Vie du centre' });
}
