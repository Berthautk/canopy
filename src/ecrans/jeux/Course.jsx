import { useEffect, useRef, useState } from 'preact/hooks';
import { lireAVoixHaute, arreterVoix } from '../../audio/voix.js';

// « La course de la vie » : le personnage court sur le chemin de la vie, étape après étape, sans fin.
// Il esquive les péchés (ils font mourir : Romains 6:23) et attrape ce qui fortifie (prière, Parole, don…).
// Quand le péché le frappe, il meurt ; s'il appelle Jésus, Jésus entre en lui, il se relève et repart.

const ETAPES = [
  { nom: 'L\'enfance', ciel: ['#8fd3ff', '#d9f1ff'], sol: '#7cc35b', bord: '#5a9e3d', deco: 'fleur', mal: ['Mensonge', 'Désobéissance', 'Colère', 'Caprice'] },
  { nom: 'L\'école', ciel: ['#9cc9ff', '#e9f3ff'], sol: '#c9b79a', bord: '#a7927a', deco: 'maison', mal: ['Tricherie', 'Moquerie', 'Mensonge', 'Paresse'] },
  { nom: 'La jeunesse', ciel: ['#ffb37a', '#ffe1b8'], sol: '#b08a5b', bord: '#8a6a43', deco: 'palmier', mal: ['Impudicité', 'Pornographie', 'Ivrognerie', 'Mauvaises compagnies'] },
  { nom: 'Le travail', ciel: ['#a0b8d8', '#e3ecf7'], sol: '#9e9e9e', bord: '#7b7b7b', deco: 'immeuble', mal: ['Vol', 'Corruption', 'Avarice', 'Orgueil'] },
  { nom: 'La famille', ciel: ['#9fe0c8', '#e8fbf2'], sol: '#8cc084', bord: '#6a9a62', deco: 'maison', mal: ['Adultère', 'Colère', 'Dureté', 'Égoïsme'] },
  { nom: 'Le désert', ciel: ['#ffd27a', '#fff1c9'], sol: '#e2b86b', bord: '#c69a4c', deco: 'cactus', mal: ['Murmure', 'Découragement', 'Amertume', 'Incrédulité'] },
  { nom: 'Le combat de la nuit', ciel: ['#1d2346', '#3b3f74'], sol: '#4a4a6a', bord: '#33334d', deco: 'etoile', mal: ['Peur', 'Sorcellerie', 'Haine', 'Idolâtrie'], nuit: true },
];
const BIEN = [['🙏', 'Prière'], ['📖', 'Parole'], ['🪙', 'Donner'], ['📣', 'Évangéliser'], ['✅', 'Obéir'], ['❤️', 'Pardonner'], ['🎵', 'Louange']];
const DUREE_ETAPE = 25;   // secondes par étape

export function Course() {
  const toile = useRef(null);
  const etat = useRef(null);
  const [vue, setVue] = useState({ phase: 'debut' });
  const lire = (t) => lireAVoixHaute('course', [{ texte: t }]);
  let meilleur = 0; try { meilleur = +localStorage.getItem('yeshaya:course-record') || 0; } catch {}

  useEffect(() => {
    const c = toile.current, ctx = c.getContext('2d');
    let raf, dernier = performance.now();
    const taille = () => { const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); c.width = r.width * d; c.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    taille(); addEventListener('resize', taille);
    const boucle = (t) => { const dt = Math.min(0.05, (t - dernier) / 1000); dernier = t; avancer(dt); dessiner(ctx, c.getBoundingClientRect()); raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    const touche = (e) => { if (e.key === 'ArrowLeft') bouger(-1); if (e.key === 'ArrowRight') bouger(1); };
    addEventListener('keydown', touche);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', taille); removeEventListener('keydown', touche); arreterVoix(); };
  }, []);

  function nouvelle() {
    etat.current = { voie: 1, x: 1, temps: 0, distance: 0, force: 100, objets: [], prochain: 0.8, etape: -1, vitesse: 1, releve: 0, invincible: 0, phase: 'course', anim: 0, bonus: [], lumiere: 0 };
    setVue({ phase: 'course' });
  }
  function bouger(s) { const e = etat.current; if (!e || e.phase !== 'course') return; e.voie = Math.max(0, Math.min(2, e.voie + s)); }

  function avancer(dt) {
    const e = etat.current; if (!e) return;
    e.anim += dt;
    if (e.lumiere > 0) e.lumiere = Math.max(0, e.lumiere - dt);
    if (e.phase !== 'course') return;
    e.temps += dt; e.vitesse = 1 + Math.min(1.6, e.temps / 120);
    e.distance += dt * 6 * e.vitesse;
    e.x += (e.voie - e.x) * Math.min(1, dt * 14);
    const n = Math.floor(e.temps / DUREE_ETAPE);
    if (n !== e.etape) { e.etape = n; const et = ETAPES[n % ETAPES.length]; e.bandeau = 2.5; lire(n === 0 ? 'Cours sur le chemin de la vie ! Évite les péchés, attrape ce qui te rend fort.' : `Nouvelle étape : ${et.nom}.`); }
    if (e.bandeau > 0) e.bandeau -= dt;
    e.force -= dt * (2.2 + e.vitesse);
    if (e.invincible > 0) e.invincible -= dt;
    e.prochain -= dt;
    if (e.prochain <= 0) {
      const et = ETAPES[e.etape % ETAPES.length];
      const bon = Math.random() < 0.34;
      const libres = [0, 1, 2].filter((v) => !e.objets.some((o) => o.v === v && o.y < 0.25));
      const v = libres[Math.floor(Math.random() * libres.length)] ?? 1;
      if (bon) { const b = BIEN[Math.floor(Math.random() * BIEN.length)]; e.objets.push({ v, y: -0.08, bon: true, emoji: b[0], mot: b[1] }); }
      else {
        const demon = et.nuit && Math.random() < 0.4, piege = !demon && Math.random() < 0.15;
        e.objets.push({ v, y: -0.08, bon: false, demon, piege, mot: demon ? 'Démon' : piege ? 'Piège' : et.mal[Math.floor(Math.random() * et.mal.length)], rot: 0 });
      }
      e.prochain = (0.55 + Math.random() * 0.6) / e.vitesse;
    }
    for (const o of e.objets) { o.y += dt * 0.42 * e.vitesse; if (o.rot !== undefined) o.rot += dt * 5 * e.vitesse; }
    for (const o of e.objets) {
      if (o.pris || o.y < 0.78 || o.y > 0.9 || Math.abs(o.v - e.x) > 0.45) continue;
      o.pris = true;
      if (o.bon) { e.force = Math.min(100, e.force + 22); e.bonus.push({ mot: '+ ' + o.mot, y: 0, v: o.v }); }
      else if (e.invincible <= 0) return mourir(o.mot);
    }
    e.objets = e.objets.filter((o) => o.y < 1.1 && !(o.pris && o.bon));
    e.bonus = e.bonus.filter((b) => (b.y += dt) < 1.2);
    if (e.force <= 0) mourir(null);
  }
  function mourir(mot) {
    const e = etat.current; e.phase = 'mort'; e.cause = mot;
    const m = Math.floor(e.distance); try { if (m > meilleur) localStorage.setItem('yeshaya:course-record', m); } catch {}
    setVue({ phase: 'mort', mot, distance: m });
    lire(mot ? `${mot} t'a frappé. Le salaire du péché, c'est la mort. Veux-tu revivre ? Pour continuer, il te faut Jésus.`
      : 'Tu n\'avais plus de force. Sans prière et sans la Parole, on s\'éteint. Veux-tu revivre ? Il te faut Jésus.');
  }
  function revivre() {
    const e = etat.current; e.phase = 'course'; e.force = 100; e.invincible = 3; e.releve++; e.lumiere = 2.2;
    e.objets = e.objets.filter((o) => o.y < 0.4);
    setVue({ phase: 'course' });
    lire('Jésus entre dans ta vie. Il te relève. Il t\'a donné une vie nouvelle. Continue la course !');
  }

  // ———— Dessin ————
  function dessiner(ctx, r) {
    const W = r.width, H = r.height, e = etat.current;
    const et = ETAPES[Math.max(0, e?.etape ?? 0) % ETAPES.length];
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.35); g.addColorStop(0, et.ciel[0]); g.addColorStop(1, et.ciel[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const defile = ((e?.distance ?? 0) * 18) % 80;
    // Bas-côtés et décor qui défile
    ctx.fillStyle = et.bord; ctx.fillRect(0, H * 0.18, W, H);
    for (let y = -80 + defile; y < H + 80; y += 80) { deco(ctx, et.deco, 22, y, et.nuit); deco(ctx, et.deco, W - 22, y + 40, et.nuit); }
    // Chemin
    const gx = W * 0.14, gw = W * 0.72;
    ctx.fillStyle = et.sol; ctx.fillRect(gx, 0, gw, H);
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 3; ctx.setLineDash([22, 22]); ctx.lineDashOffset = -defile * 1.1;
    for (const k of [1, 2]) { ctx.beginPath(); ctx.moveTo(gx + (gw / 3) * k, 0); ctx.lineTo(gx + (gw / 3) * k, H); ctx.stroke(); }
    ctx.setLineDash([]);
    if (et.nuit) { ctx.fillStyle = 'rgba(10,10,40,.25)'; ctx.fillRect(0, 0, W, H); }
    const X = (v) => gx + (gw / 3) * (v + 0.5);
    if (!e) { personnage(ctx, X(1), H * 0.84, 0, 1, 0); return; }
    for (const o of e.objets) { if (o.pris) continue; o.bon ? bonne(ctx, X(o.v), o.y * H, o, e.anim) : peche(ctx, X(o.v), o.y * H, o, gw / 3); }
    // Lumière de Jésus qui descend sur le personnage
    if (e.lumiere > 0) {
      const a = Math.min(1, e.lumiere); const lg = ctx.createLinearGradient(0, 0, 0, H);
      lg.addColorStop(0, `rgba(255,236,150,${0.9 * a})`); lg.addColorStop(1, `rgba(255,255,255,${0.15 * a})`);
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(X(e.x) - 30, 0); ctx.lineTo(X(e.x) + 30, 0); ctx.lineTo(X(e.x) + 70, H); ctx.lineTo(X(e.x) - 70, H); ctx.fill();
    }
    const mort = e.phase === 'mort';
    if (e.invincible > 0 && !mort) { ctx.save(); ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 30; }
    personnage(ctx, X(e.x), H * 0.84, mort ? 0 : e.anim * 11, mort ? 0.4 : 1, mort ? 1 : 0);
    if (e.invincible > 0 && !mort) ctx.restore();
    for (const b of e.bonus) { ctx.globalAlpha = Math.max(0, 1 - b.y); ctx.fillStyle = '#1c7c3c'; ctx.font = '700 16px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.mot, X(b.v), H * 0.78 - b.y * 80); ctx.globalAlpha = 1; }
    // Barre de force et distance
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rond(ctx, 10, 10, W - 20, 36, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Poppins, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Force', 20, 33);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; rond(ctx, 66, 20, W * 0.42, 16, 8); ctx.fill();
    ctx.fillStyle = e.force > 35 ? '#f6c344' : '#ff6b5a'; rond(ctx, 66, 20, Math.max(0, W * 0.42 * e.force / 100), 16, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(`${Math.floor(e.distance)} m`, W - 20, 33);
    if (e.bandeau > 0) {
      ctx.globalAlpha = Math.min(1, e.bandeau); ctx.fillStyle = 'rgba(20,35,64,.85)'; rond(ctx, W * 0.1, H * 0.3, W * 0.8, 58, 16); ctx.fill();
      ctx.fillStyle = '#ffd86b'; ctx.font = '600 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`ÉTAPE ${e.etape + 1}`, W / 2, H * 0.3 + 22);
      ctx.fillStyle = '#fff'; ctx.font = '700 19px Poppins, sans-serif'; ctx.fillText(et.nom, W / 2, H * 0.3 + 46); ctx.globalAlpha = 1;
    }
  }

  const toucherEcran = (ev) => { const r = toile.current.getBoundingClientRect(); bouger(ev.clientX - r.left < r.width / 2 ? -1 : 1); };
  const glisse = useRef(null);
  const e = etat.current;
  return (
    <div class="page course">
      <div class="course__cadre">
        <canvas ref={toile} class="course__toile" onPointerDown={(ev) => { glisse.current = ev.clientX; }} onPointerUp={(ev) => { const d = ev.clientX - (glisse.current ?? ev.clientX); if (Math.abs(d) > 30) bouger(d < 0 ? -1 : 1); else toucherEcran(ev); }}
          aria-label="Touchez à gauche ou à droite pour changer de voie" />
        {vue.phase === 'debut' && <div class="course__voile">
          <h2>La course de la vie</h2>
          <p>Touche à <b>gauche</b> ou à <b>droite</b> pour changer de voie.</p>
          <p class="course__legende"><span class="course__pierre">Péché</span> esquive les pierres du péché : elles font mourir.</p>
          <p class="course__legende"><span class="course__or">🙏</span> attrape la prière, la Parole, le don… : ils te donnent de la force.</p>
          <button class="bouton bouton--or" onClick={nouvelle}>▶ Courir</button>
          {meilleur > 0 && <p class="course__record">Ton record : {meilleur} m</p>}
        </div>}
        {vue.phase === 'mort' && <div class="course__voile course__voile--mort">
          <p class="course__cause">{vue.mot ? <>« {vue.mot} » t'a frappé.</> : 'Tu n\'avais plus de force.'}</p>
          <p class="course__verset">« Le salaire du péché, c'est la mort ; mais le don gratuit de Dieu, c'est la vie éternelle en Jésus-Christ notre Seigneur. »<small>Romains 6:23</small></p>
          <h2>Veux-tu revivre ?</h2>
          <p>Pour continuer, il te faut Jésus.</p>
          <button class="bouton bouton--or course__jesus" onClick={revivre}>✝ Jésus, viens dans ma vie</button>
          <p class="course__record">{vue.distance} m parcourus{e?.releve ? ` · relevé ${e.releve} fois par Jésus` : ''}</p>
        </div>}
      </div>
      <div class="course__fleches" aria-hidden={vue.phase !== 'course'}>
        <button onClick={() => bouger(-1)} aria-label="À gauche">◀</button>
        <button onClick={() => bouger(1)} aria-label="À droite">▶</button>
      </div>
    </div>
  );
}

function rond(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

// Le personnage, vu de dos en train de courir.
function personnage(ctx, x, y, t, a, mort) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1.35, 1.35); ctx.globalAlpha = a;
  if (mort) ctx.rotate(Math.PI / 2.2);
  const p = Math.sin(t), q = Math.cos(t);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 30, 20, 6, 0, 0, 7); ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2b3a67'; ctx.lineWidth = 8;   // jambes
  ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-7 + p * 6, 26 - Math.max(0, p) * 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(7 - p * 6, 26 - Math.max(0, -p) * 5); ctx.stroke();
  ctx.fillStyle = '#3d2a1e'; ctx.beginPath(); ctx.ellipse(-7 + p * 6, 28 - Math.max(0, p) * 5, 5, 3.5, 0, 0, 7); ctx.ellipse(7 - p * 6, 28 - Math.max(0, -p) * 5, 5, 3.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7a4a2e'; ctx.lineWidth = 6;   // bras
  ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(-17 - q * 4, 0 + p * 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -14); ctx.lineTo(17 + q * 4, 0 - p * 5); ctx.stroke();
  const tg = ctx.createLinearGradient(0, -22, 0, 8); tg.addColorStop(0, '#f2f2f2'); tg.addColorStop(1, '#d7dbe6');   // tunique
  ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-13, -18); ctx.quadraticCurveTo(0, -24, 13, -18); ctx.lineTo(11, 9); ctx.lineTo(-11, 9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c99a2e'; ctx.fillRect(-11, -2, 22, 3.5);   // ceinture
  ctx.fillStyle = '#7a4a2e'; ctx.beginPath(); ctx.arc(0, -29, 10, 0, 7); ctx.fill();   // tête
  ctx.fillStyle = '#1e1410'; ctx.beginPath(); ctx.arc(0, -31, 10, Math.PI, 0); ctx.fill();   // cheveux
  ctx.beginPath(); ctx.arc(0, -29, 9.5, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  ctx.restore();
}
function peche(ctx, x, y, o, larg) {
  ctx.save(); ctx.translate(x, y);
  if (o.demon) {
    ctx.fillStyle = '#2a0f19'; ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(-20, 14); ctx.quadraticCurveTo(-24, -18, 0, -20); ctx.quadraticCurveTo(24, -18, 20, 14); ctx.quadraticCurveTo(0, 6, -20, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-20, -30); ctx.lineTo(-6, -18); ctx.moveTo(14, -14); ctx.lineTo(20, -30); ctx.lineTo(6, -18); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(-7, -5, 3, 0, 7); ctx.arc(7, -5, 3, 0, 7); ctx.fill();
  } else if (o.piege) {
    ctx.fillStyle = '#2b1d12'; ctx.beginPath(); ctx.ellipse(0, 4, larg * 0.36, 13, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8b8b8b'; ctx.lineWidth = 3; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 7, 6); ctx.lineTo(k * 7 + 2, -8); ctx.stroke(); }
  } else {
    ctx.rotate(o.rot);
    const rg = ctx.createRadialGradient(-6, -8, 4, 0, 0, 24); rg.addColorStop(0, '#9a9a9a'); rg.addColorStop(1, '#4a4a4a');
    ctx.fillStyle = rg; ctx.beginPath();
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr = 21 + ((k * 7) % 5); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(0, -2); ctx.lineTo(-4, 9); ctx.moveTo(6, -12); ctx.lineTo(10, 4); ctx.stroke();
    ctx.rotate(-o.rot);
  }
  ctx.font = '700 12px Poppins, sans-serif'; ctx.textAlign = 'center';
  const w = Math.min(larg - 6, ctx.measureText(o.mot).width + 12);
  ctx.fillStyle = 'rgba(140,20,20,.92)'; rond(ctx, -w / 2, 22, w, 20, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(o.mot, 0, 36, larg - 10);
  ctx.restore();
}
function bonne(ctx, x, y, o, t) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 5 + x) * 3);
  ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 18;
  const g = ctx.createRadialGradient(-5, -5, 3, 0, 0, 22); g.addColorStop(0, '#fff6c9'); g.addColorStop(1, '#f2b81f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.emoji, 0, 1); ctx.textBaseline = 'alphabetic';
  ctx.font = '700 12px Poppins, sans-serif'; ctx.fillStyle = '#0f5a2c'; ctx.fillText(o.mot, 0, 36);
  ctx.restore();
}
function deco(ctx, type, x, y, nuit) {
  ctx.save(); ctx.translate(x, y);
  if (type === 'fleur') { ctx.fillStyle = '#3f8f2f'; ctx.fillRect(-1, 0, 2, 12); ctx.fillStyle = ['#ff7aa8', '#ffd84d', '#ffffff'][Math.abs(Math.round(y)) % 3]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.26) * 5, Math.sin(k * 1.26) * 5, 4, 0, 7); ctx.fill(); } ctx.fillStyle = '#f2a900'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); }
  else if (type === 'maison') { ctx.fillStyle = '#e8d3b0'; ctx.fillRect(-14, -6, 28, 20); ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.moveTo(-17, -6); ctx.lineTo(0, -20); ctx.lineTo(17, -6); ctx.fill(); ctx.fillStyle = '#6b4a2e'; ctx.fillRect(-4, 4, 8, 10); }
  else if (type === 'palmier') { ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 16); ctx.quadraticCurveTo(3, 0, 0, -14); ctx.stroke(); ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 4; for (const a of [-2.6, -1.9, -1.2, -0.5]) { ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(Math.cos(a) * 10, -14 + Math.sin(a) * 14, Math.cos(a) * 16, -6 + Math.sin(a) * 6); ctx.stroke(); } }
  else if (type === 'immeuble') { ctx.fillStyle = '#5d6b85'; ctx.fillRect(-12, -22, 24, 40); ctx.fillStyle = '#ffe9a0'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(-8 + j * 10, -17 + i * 11, 6, 6); }
  else if (type === 'cactus') { ctx.fillStyle = '#3f8f4a'; rond(ctx, -4, -16, 8, 30, 4); ctx.fill(); rond(ctx, -12, -6, 6, 12, 3); ctx.fill(); rond(ctx, 6, -10, 6, 12, 3); ctx.fill(); }
  else if (type === 'etoile') { ctx.fillStyle = nuit ? '#fff6c0' : '#fff'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#2e2e48'; ctx.beginPath(); ctx.moveTo(-12, 16); ctx.lineTo(0, -4); ctx.lineTo(12, 16); ctx.fill(); }
  ctx.restore();
}
