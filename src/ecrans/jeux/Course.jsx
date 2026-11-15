import { useEffect, useRef, useState } from 'preact/hooks';
import { lireAVoixHaute, arreterVoix } from '../../audio/voix.js';
import { jouerMusique, arreterMusique } from '../../audio/musique.js';
import { reglages, modifierReglages } from '../../donnees/reglages.js';
import { useSignal } from '../../outils/signal.js';

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
const BUT = (n) => 150 + n * 50;   // mètres à parcourir pour finir l'étape n
const VERSETS = ['« Instruis l\'enfant selon la voie qu\'il doit suivre. » Proverbes 22:6', '« Que personne ne méprise ta jeunesse. » 1 Timothée 4:12',
  '« Fuis les passions de la jeunesse. » 2 Timothée 2:22', '« Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur. » Colossiens 3:23',
  '« Moi et ma maison, nous servirons l\'Éternel. » Josué 24:15', '« L\'homme ne vivra pas de pain seulement. » Deutéronome 8:3', '« Revêtez-vous de toutes les armes de Dieu. » Éphésiens 6:11'];

export function Course() {
  const toile = useRef(null);
  const etat = useRef(null);
  const [vue, setVue] = useState({ phase: 'debut' });
  const lire = (t) => lireAVoixHaute('course', [{ texte: t }]);
  let meilleur = 0; try { meilleur = +localStorage.getItem('yeshaya:course-etape') || 0; } catch {}
  const r = useSignal(reglages), musique = r.musiqueJeux !== false;
  useEffect(() => { if (musique && vue.phase !== 'debut' && vue.phase !== 'pause') jouerMusique(); else arreterMusique(); }, [musique, vue.phase]);
  useEffect(() => () => arreterMusique(), []);

  useEffect(() => {
    const c = toile.current, ctx = c.getContext('2d');
    let raf, dernier = performance.now();
    const taille = () => { const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); c.width = r.width * d; c.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    taille(); addEventListener('resize', taille);
    const boucle = (t) => { const dt = Math.min(0.05, (t - dernier) / 1000); dernier = t; avancer(dt); dessiner(ctx, c.getBoundingClientRect()); raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    const touche = (e) => { if (e.key === 'ArrowLeft') bouger(-1); if (e.key === 'ArrowRight') bouger(1); if (e.key === ' ' || e.key === 'p') { e.preventDefault(); etat.current?.phase === 'pause' ? reprendre() : pause(); } };
    const cache = () => { if (document.visibilityState !== 'visible') pause(); };
    document.addEventListener('visibilitychange', cache);
    addEventListener('keydown', touche);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', taille); removeEventListener('keydown', touche); document.removeEventListener('visibilitychange', cache); arreterVoix(); };
  }, []);

  function nouvelle(n = 0) {
    const releve = etat.current?.releve || 0;
    etat.current = { voie: 1, x: 1, temps: 0, distance: 0, force: 100, objets: [], prochain: 0.8, etape: n, vitesse: 1, releve, invincible: 0, phase: 'course', anim: 0, bonus: [], lumiere: 0, bandeau: 2.8 };
    const et = ETAPES[n % ETAPES.length];
    lire(n === 0 ? `Étape 1 : ${et.nom}. Évite les péchés, attrape ce qui te rend fort. Cours ${BUT(0)} mètres !` : `Étape ${n + 1} : ${et.nom}. Cours ${BUT(n)} mètres. Ça va plus vite !`);
    setVue({ phase: 'course' });
  }
  function pause() { const e = etat.current; if (e?.phase !== 'course') return; e.phase = 'pause'; setVue({ phase: 'pause' }); }
  function reprendre() { const e = etat.current; if (e?.phase !== 'pause') return; e.phase = 'course'; setVue({ phase: 'course' }); }
  function bouger(s) { const e = etat.current; if (!e || e.phase !== 'course') return; e.voie = Math.max(0, Math.min(2, e.voie + s)); }

  function avancer(dt) {
    const e = etat.current; if (!e) return;
    e.anim += dt;
    if (e.lumiere > 0) e.lumiere = Math.max(0, e.lumiere - dt);
    if (e.phase === 'releve') { e.rt += dt; if (e.rt >= 4) { e.phase = 'course'; e.invincible = 3; setVue({ phase: 'course' }); } return; }
    if (e.phase !== 'course') return;
    // La vitesse de départ monte à chaque étape, puis monte encore pendant l'étape.
    e.temps += dt; e.vitesse = 0.85 + e.etape * 0.14 + Math.min(0.6, (e.distance / BUT(e.etape)) * 0.6);
    e.distance += dt * 6 * e.vitesse;
    e.x += (e.voie - e.x) * Math.min(1, dt * 14);
    if (e.distance >= BUT(e.etape)) return finirEtape();
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
    const m = Math.floor(e.distance);
    setVue({ phase: 'mort', mot, distance: m });
    lire(mot ? `${mot} t'a frappé. Le salaire du péché, c'est la mort. Veux-tu revivre ? Pour continuer, il te faut Jésus.`
      : 'Tu n\'avais plus de force. Sans prière et sans la Parole, on s\'éteint. Veux-tu revivre ? Il te faut Jésus.');
  }
  // Jésus descend dans la lumière, vient jusqu'au personnage, entre en lui ; il se relève et repart.
  function revivre() {
    const e = etat.current; e.phase = 'releve'; e.rt = 0; e.force = 100; e.releve++; e.objets = [];
    setVue({ phase: 'releve' });
    lire('Jésus vient. Il entre dans ta vie. Il te relève et te donne une vie nouvelle. Continue la course !');
  }
  function finirEtape() {
    const e = etat.current; e.phase = 'etape';
    try { if (e.etape + 1 > meilleur) localStorage.setItem('yeshaya:course-etape', e.etape + 1); } catch {}
    setVue({ phase: 'etape', n: e.etape });
    lire(`Bravo ! Tu as fini l'étape ${e.etape + 1} : ${ETAPES[e.etape % ETAPES.length].nom}. ${VERSETS[e.etape % VERSETS.length]}`);
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
    const mort = e.phase === 'mort', rel = e.phase === 'releve', px = X(e.x), py = H * 0.84;
    if (rel) {   // la scène : lumière, Jésus descend, entre dans le personnage, qui se relève
      const t = e.rt, a = Math.min(1, t / 0.6) * (t > 3.4 ? Math.max(0, (4 - t) / 0.6) : 1);
      const lg = ctx.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, `rgba(255,236,150,${0.95 * a})`); lg.addColorStop(1, `rgba(255,255,255,${0.25 * a})`);
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(px - 40, 0); ctx.lineTo(px + 40, 0); ctx.lineTo(px + 90, H); ctx.lineTo(px - 90, H); ctx.fill();
      const descente = Math.min(1, t / 1.7), entree = Math.max(0, Math.min(1, (t - 1.7) / 0.8));
      const debout = Math.max(0, Math.min(1, (t - 2.5) / 0.8));
      personnage(ctx, px, py, 0, 0.55 + debout * 0.45, 1 - debout);
      if (entree < 1) jesus(ctx, px, -80 + (py - 70 + 80) * (1 - Math.pow(1 - descente, 2)) + entree * 50, 1 - entree, e.anim);
      if (entree > 0 && debout < 1) { const f = Math.sin(Math.min(1, (t - 1.7) / 1.4) * Math.PI); const rg = ctx.createRadialGradient(px, py - 20, 4, px, py - 20, 120);
        rg.addColorStop(0, `rgba(255,255,230,${f})`); rg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = rg; ctx.fillRect(px - 130, py - 150, 260, 260); }
    } else {
      if (e.invincible > 0 && !mort) { ctx.save(); ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 30; }
      personnage(ctx, px, py, mort ? 0 : e.anim * 11 * e.vitesse, mort ? 0.4 : 1, mort ? 1 : 0);
      if (e.invincible > 0 && !mort) ctx.restore();
    }
    for (const b of e.bonus) { ctx.globalAlpha = Math.max(0, 1 - b.y); ctx.fillStyle = '#1c7c3c'; ctx.font = '700 16px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.mot, X(b.v), H * 0.78 - b.y * 80); ctx.globalAlpha = 1; }
    // Barre de force et distance
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rond(ctx, 10, 10, W - 20, 36, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '600 13px Poppins, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Force', 20, 33);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; rond(ctx, 66, 20, W * 0.3, 16, 8); ctx.fill();
    ctx.fillStyle = e.force > 35 ? '#f6c344' : '#ff6b5a'; rond(ctx, 66, 20, Math.max(0, W * 0.3 * e.force / 100), 16, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(`Étape ${e.etape + 1} · ${Math.min(BUT(e.etape), Math.floor(e.distance))}/${BUT(e.etape)} m`, W - 18, 33);
    if (e.bandeau > 0) {
      ctx.globalAlpha = Math.min(1, e.bandeau); ctx.fillStyle = 'rgba(20,35,64,.85)'; rond(ctx, W * 0.1, H * 0.3, W * 0.8, 58, 16); ctx.fill();
      ctx.fillStyle = '#ffd86b'; ctx.font = '600 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`ÉTAPE ${e.etape + 1} · ${BUT(e.etape)} MÈTRES`, W / 2, H * 0.3 + 22);
      ctx.fillStyle = '#fff'; ctx.font = '700 19px Poppins, sans-serif'; ctx.fillText(et.nom, W / 2, H * 0.3 + 46); ctx.globalAlpha = 1;
    }
  }

  const toucherEcran = (ev) => { const r = toile.current.getBoundingClientRect(); bouger(ev.clientX - r.left < r.width / 2 ? -1 : 1); };
  const glisse = useRef(null);
  const e = etat.current;
  return (
    <div class="page course">
      <div class="course__haut">
      {(vue.phase === 'course' || vue.phase === 'pause') && <button class="course__musique course__pause" onClick={() => (vue.phase === 'pause' ? reprendre() : pause())}>{vue.phase === 'pause' ? '▶ Reprendre' : '⏸ Pause'}</button>}
      <button class="course__musique" aria-pressed={musique} onClick={() => modifierReglages({ musiqueJeux: !musique })}>{musique ? '🎵 Musique : oui' : '🔇 Musique : non'}</button>
      </div>
      <div class="course__cadre">
        <canvas ref={toile} class="course__toile" onPointerDown={(ev) => { glisse.current = ev.clientX; }} onPointerUp={(ev) => { const d = ev.clientX - (glisse.current ?? ev.clientX); if (Math.abs(d) > 30) bouger(d < 0 ? -1 : 1); else toucherEcran(ev); }}
          aria-label="Touchez à gauche ou à droite pour changer de voie" />
        {vue.phase === 'debut' && <div class="course__voile">
          <h2>La course de la vie</h2>
          <p>Touche à <b>gauche</b> ou à <b>droite</b> pour changer de voie.</p>
          <p class="course__legende"><span class="course__pierre">Péché</span> esquive les pierres du péché : elles font mourir.</p>
          <p class="course__legende"><span class="course__or">🙏</span> attrape la prière, la Parole, le don… : ils te donnent de la force.</p>
          <button class="bouton bouton--or" onClick={() => nouvelle(0)}>▶ Courir (étape 1)</button>
          {meilleur > 0 && <button class="bouton bouton--contour course__clair" onClick={() => nouvelle(meilleur)}>Reprendre à l'étape {meilleur + 1}</button>}
        </div>}
        {vue.phase === 'pause' && <div class="course__voile">
          <p style="font-size:3rem">⏸</p><h2>Pause</h2><p>Le jeu t'attend.</p>
          <button class="bouton bouton--or" onClick={reprendre}>▶ Reprendre</button>
        </div>}
        {vue.phase === 'etape' && <div class="course__voile">
          <p style="font-size:2.6rem">🏁</p>
          <h2>Étape {vue.n + 1} réussie !</h2><p>{ETAPES[vue.n % ETAPES.length].nom}</p>
          <p class="course__verset">{VERSETS[vue.n % VERSETS.length]}</p>
          <button class="bouton bouton--or" onClick={() => nouvelle(vue.n + 1)}>Étape {vue.n + 2} : {ETAPES[(vue.n + 1) % ETAPES.length].nom} ▶</button>
          <p class="course__record">Attention : à chaque étape, ça va plus vite.</p>
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
      <div class="course__fleches">
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
  if (mort) ctx.rotate((Math.PI / 2.2) * mort);
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

// Jésus : robe blanche, manteau rouge, bras ouverts, auréole de lumière.
function jesus(ctx, x, y, a, t) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = Math.max(0, a); ctx.scale(1.6, 1.6);
  const h = ctx.createRadialGradient(0, -30, 4, 0, -30, 34); h.addColorStop(0, 'rgba(255,248,200,.95)'); h.addColorStop(1, 'rgba(255,230,140,0)');
  ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, -30, 34, 0, 7); ctx.fill();
  ctx.lineCap = 'round'; ctx.strokeStyle = '#f4f1ea'; ctx.lineWidth = 6; const o = Math.sin(t * 2) * 2;
  ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-26, -24 + o); ctx.stroke(); ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(26, -24 - o); ctx.stroke();
  ctx.fillStyle = '#8a5a3c'; ctx.beginPath(); ctx.arc(-27, -25 + o, 3.2, 0, 7); ctx.arc(27, -25 - o, 3.2, 0, 7); ctx.fill();
  const rb = ctx.createLinearGradient(0, -20, 0, 30); rb.addColorStop(0, '#ffffff'); rb.addColorStop(1, '#e6e1d6');
  ctx.fillStyle = rb; ctx.beginPath(); ctx.moveTo(-11, -18); ctx.quadraticCurveTo(0, -23, 11, -18); ctx.lineTo(16, 30); ctx.lineTo(-16, 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b3262f'; ctx.beginPath(); ctx.moveTo(-11, -18); ctx.lineTo(4, -17); ctx.lineTo(-6, 30); ctx.lineTo(-16, 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a5a3c'; ctx.beginPath(); ctx.arc(0, -28, 8.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#3b2416'; ctx.beginPath(); ctx.arc(0, -30, 9.5, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(9, -20); ctx.lineTo(7, -26); ctx.lineTo(-7, -26); ctx.lineTo(-9, -20); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, -25); ctx.quadraticCurveTo(0, -14, 6, -25); ctx.fill();
  ctx.restore();
}
