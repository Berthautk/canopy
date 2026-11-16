import { useEffect, useRef, useState } from 'preact/hooks';
import { lireAVoixHaute, arreterVoix, voix } from '../../audio/voix.js';
import { jouerMusique, arreterMusique } from '../../audio/musique.js';
import { reglages, modifierReglages } from '../../donnees/reglages.js';
import { useSignal } from '../../outils/signal.js';
import { messageSuivant, ANNONCE } from '../../jeux/messages.js';

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
// Mètres à parcourir pour finir l'étape n : 3 km, 6 km, 10 km, puis 5 km de plus à chaque étape.
const BUT = (n) => [3000, 6000, 10000][n] ?? 10000 + (n - 2) * 5000;
const CHUTES_MESSAGE = 2;   // toutes les 2 chutes, un message à écouter attentivement
const km = (m) => (m >= 1000 ? (m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' km' : Math.floor(m) + ' m');
const VERSETS = ['« Instruis l\'enfant selon la voie qu\'il doit suivre. » Proverbes 22:6', '« Que personne ne méprise ta jeunesse. » 1 Timothée 4:12',
  '« Fuis les passions de la jeunesse. » 2 Timothée 2:22', '« Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur. » Colossiens 3:23',
  '« Moi et ma maison, nous servirons l\'Éternel. » Josué 24:15', '« L\'homme ne vivra pas de pain seulement. » Deutéronome 8:3', '« Revêtez-vous de toutes les armes de Dieu. » Éphésiens 6:11'];

let GENRE = 'garcon';
const RELEVES_MAX = 5;   // nombre de fois où Jésus relève pendant une même étape
const INTRO = 'Bienvenue dans la course de la vie ! Ton personnage court sur le chemin de la vie. Des pierres roulent vers lui : ce sont des péchés, comme le mensonge, le vol ou la colère. Le péché fait mourir, alors esquive-les ! Touche à gauche ou à droite de l\'écran, ou utilise les flèches, pour changer de voie. Attrape les boules dorées : la prière, la Parole, le don, l\'obéissance. Elles te donnent de la force. Si ta force tombe à zéro, tu t\'éteins. Quand tu es prêt, appuie sur Commencer.';
export function Course() {
  const toile = useRef(null);
  const etat = useRef(null);
  try { if (localStorage.getItem('yeshaya:test')) window.__course = etat; } catch {}
  const [vue, setVue] = useState({ phase: 'debut' });
  const lire = (t) => lireAVoixHaute('course', [{ texte: t }]);
  let meilleur = 0; try { meilleur = +localStorage.getItem('yeshaya:course-etape') || 0; } catch {}
  const r = useSignal(reglages), musique = r.musiqueJeux !== false;
  GENRE = r.genreCoureur || 'garcon';
  useEffect(() => { const t = setTimeout(() => lire(INTRO), 400); return () => clearTimeout(t); }, []);
  useEffect(() => { if (musique && vue.phase !== 'debut' && vue.phase !== 'pause') jouerMusique(); else arreterMusique(); }, [musique, vue.phase]);
  useEffect(() => () => arreterMusique(), []);

  useEffect(() => {
    const c = toile.current, ctx = c.getContext('2d');
    let raf, dernier = performance.now();
    const taille = () => { const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); c.width = r.width * d; c.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    taille(); addEventListener('resize', taille);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(taille) : null; ro?.observe(c);
    const boucle = (t) => { const dt = Math.min(0.05, (t - dernier) / 1000); dernier = t; avancer(dt); dessiner(ctx, c.getBoundingClientRect()); raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    const touche = (e) => { if (e.key === 'ArrowLeft') bouger(-1); if (e.key === 'ArrowRight') bouger(1); if (e.key === ' ' || e.key === 'p') { e.preventDefault(); etat.current?.phase === 'pause' ? reprendre() : pause(); } };
    const cache = () => { if (document.visibilityState !== 'visible') pause(); };
    document.addEventListener('visibilitychange', cache);
    addEventListener('keydown', touche);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); removeEventListener('resize', taille); removeEventListener('keydown', touche); document.removeEventListener('visibilitychange', cache); arreterVoix(); };
  }, []);

  function nouvelle(n = 0) {
    // Compte à rebours, puis les obstacles arrivent peu à peu : on a le temps de se préparer.
    etat.current = { voie: 1, x: 1, temps: 0, distance: 0, force: 100, objets: [], prochain: 2.5, etape: n, vitesse: 1, releve: 0, invincible: 0, phase: 'compte', compte: 3.5, anim: 0, bonus: [], lumiere: 0, bandeau: 0 };
    const et = ETAPES[n % ETAPES.length];
    lire(`Étape ${n + 1} : ${et.nom}. ${km(BUT(n))} à parcourir. Trois, deux, un, cours !`);
    setVue({ phase: 'course' });
  }
  function pause() { const e = etat.current; if (e?.phase !== 'course') return; e.phase = 'pause'; setVue({ phase: 'pause' }); }
  // Reprise après une pause, un enseignement ou un relèvement : on vide la piste devant le joueur et on recompte.
  function relancer() { const e = etat.current; e.objets = e.objets.filter((o) => o.y < 0.15); e.phase = 'compte'; e.compte = 3.5; e.invincible = 1.5; e.prochain = 2; setVue({ phase: 'course' }); }
  function reprendre() { const e = etat.current; if (e?.phase !== 'pause') return; relancer(); }
  function bouger(s) { const e = etat.current; if (!e || e.phase !== 'course') return; e.voie = Math.max(0, Math.min(2, e.voie + s)); }

  function avancer(dt) {
    const e = etat.current; if (!e) return;
    e.anim += dt;
    if (e.lumiere > 0) e.lumiere = Math.max(0, e.lumiere - dt);
    // Tant que la voix parle, rien ne bouge ; ensuite compte à rebours de 3 secondes, puis on court.
    if (e.phase === 'compte') { if (voix.valeur.lecture) { e.compte = 3.5; e.ecoute = true; return; } e.ecoute = false; e.compte -= dt; if (e.compte <= 0) e.phase = 'course'; return; }
    if (e.phase === 'releve') { e.rt += dt; if (e.rt >= 4) {
      if (e.releve % CHUTES_MESSAGE === 0) { e.phase = 'ecoute'; e.et = 0; e.annonce = false; setVue({ phase: 'ecoute' }); lire(ANNONCE); }
      else relancer(); } return; }
    // Transition avant le message : « Écoute ceci attentivement », un temps de silence, puis la voix parle.
    if (e.phase === 'ecoute') { if (voix.valeur.lecture) return; e.et += dt; if (e.et >= 2.2) {
      const m = messageSuivant(); e.phase = 'lecon'; setVue({ phase: 'lecon', m });
      lire(`${m.titre}. ${m.texte} La Bible dit : ${m.verset.replace(/[«»]/g, '')} ${m.ref}.`); } return; }
    if (e.phase !== 'course') return;
    // La vitesse de départ monte à chaque étape, puis monte encore pendant l'étape.
    e.temps += dt; e.vitesse = 0.85 + e.etape * 0.14 + Math.min(0.6, (e.distance / BUT(e.etape)) * 0.6);
    e.distance += dt * 11 * e.vitesse;
    e.x += (e.voie - e.x) * Math.min(1, dt * 14);
    if (e.distance >= BUT(e.etape)) return finirEtape();
    if (e.bandeau > 0) e.bandeau -= dt;
    e.force -= dt * (1.3 + 0.6 * e.vitesse);
    if (e.invincible > 0) e.invincible -= dt;
    e.prochain -= dt;
    if (e.prochain <= 0) {
      const et = ETAPES[e.etape % ETAPES.length];
      const bon = Math.random() < 0.4;
      const libres = [0, 1, 2].filter((v) => !e.objets.some((o) => o.v === v && o.y < 0.25));
      const v = libres[Math.floor(Math.random() * libres.length)] ?? 1;
      if (bon) { const b = BIEN[Math.floor(Math.random() * BIEN.length)]; e.objets.push({ v, y: -0.08, bon: true, emoji: b[0], mot: b[1] }); }
      else {
        const demon = et.nuit && Math.random() < 0.4, piege = !demon && Math.random() < 0.15;
        e.objets.push({ v, y: -0.08, bon: false, demon, piege, mot: demon ? 'Démon' : piege ? 'Piège' : et.mal[Math.floor(Math.random() * et.mal.length)], rot: 0 });
      }
      // Au début de l'étape, les obstacles sont plus espacés, puis ils se rapprochent.
      e.prochain = ((1.0 + Math.random() * 0.8) / Math.sqrt(e.vitesse)) * (1 + Math.max(0, 1 - e.temps / 40));
    }
    for (const o of e.objets) { o.y += dt * 0.42 * e.vitesse; if (o.rot !== undefined) o.rot += dt * 5 * e.vitesse; }
    for (const o of e.objets) {
      if (o.pris || o.y < 0.78 || o.y > 0.9 || Math.abs(o.v - e.x) > 0.45) continue;
      o.pris = true;
      if (o.bon) { e.force = Math.min(100, e.force + 25); e.bonus.push({ mot: '+ ' + o.mot, y: 0, v: o.v }); }
      else if (e.invincible <= 0) return mourir(o.mot);
    }
    e.objets = e.objets.filter((o) => o.y < 1.1 && !(o.pris && o.bon));
    e.bonus = e.bonus.filter((b) => (b.y += dt) < 1.2);
    if (e.force <= 0) mourir(null);
  }
  function mourir(mot) {
    const e = etat.current; e.phase = 'mort'; e.cause = mot;
    const m = Math.floor(e.distance);
    if (e.releve >= RELEVES_MAX) {
      e.phase = 'epuise'; setVue({ phase: 'epuise', mot, distance: m });
      lire('Tu es tombé encore. Jésus t\'a relevé cinq fois dans cette étape. Écoute bien : Dieu ne se lasse pas de pardonner celui qui se repent vraiment. Mais se repentir, ce n\'est pas seulement dire pardon et recommencer la même chose. C\'est changer de direction, et fuir le péché. Celui qui joue avec le péché en se disant « de toute façon, Dieu pardonne », finit par en devenir esclave. Ce que l\'homme sème, il le récolte. Alors reprends cette étape depuis le début, et cette fois, fuis le péché !');
      return;
    }
    setVue({ phase: 'mort', mot, distance: m });
    lire(mot ? `${mot} t'a frappé. Le salaire du péché, c'est la mort. Veux-tu revivre ? Pour continuer, il te faut Jésus.`
      : 'Tu n\'avais plus de force. Sans la prière, la Parole et l\'obéissance, on s\'affaiblit. Attrape les boules dorées ! Veux-tu revivre ? Il te faut Jésus.');
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
    const def2 = ((e?.distance ?? 0) * 18) % 160; ctx.globalAlpha = 0.55; for (let y = -160 + def2; y < H + 160; y += 160) { deco(ctx, et.deco, 22, y, et.nuit); deco(ctx, et.deco, W - 22, y + 80, et.nuit); } ctx.globalAlpha = 1;
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
    for (const b of e.bonus) { ctx.globalAlpha = Math.max(0, 1 - b.y); ctx.fillStyle = '#1c7c3c'; ctx.font = '700 16px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.mot, X(b.v), H * 0.62 - b.y * 90); ctx.globalAlpha = 1; }
    if (e.phase === 'compte') {
      const n = Math.ceil(e.compte - 0.5);
      if (e.ecoute) { ctx.fillStyle = 'rgba(20,35,64,.8)'; rond(ctx, W * 0.15, H * 0.36, W * 0.7, 54, 16); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '600 17px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔊 Écoute…', W / 2, H * 0.36 + 34); }
      else { ctx.fillStyle = 'rgba(20,35,64,.7)'; ctx.beginPath(); ctx.arc(W / 2, H * 0.42, 60, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffd86b'; ctx.font = '800 54px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n > 0 ? n : 'Go !', W / 2, H * 0.42 + 2); ctx.textBaseline = 'alphabetic'; }
    }
    if (e.bandeau > 0) {
      ctx.globalAlpha = Math.min(1, e.bandeau); ctx.fillStyle = 'rgba(20,35,64,.85)'; rond(ctx, W * 0.1, H * 0.3, W * 0.8, 58, 16); ctx.fill();
      ctx.fillStyle = '#ffd86b'; ctx.font = '600 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`ÉTAPE ${e.etape + 1} · ${km(BUT(e.etape)).toUpperCase()}`, W / 2, H * 0.3 + 22);
      ctx.fillStyle = '#fff'; ctx.font = '700 19px Poppins, sans-serif'; ctx.fillText(et.nom, W / 2, H * 0.3 + 46); ctx.globalAlpha = 1;
    }
  }

  // Compteurs hors de la piste, mis à jour 4 fois par seconde.
  const [hud, setHud] = useState(null);
  useEffect(() => { const id = setInterval(() => { const e = etat.current; setHud(e ? { f: Math.max(0, e.force), d: e.distance, b: BUT(e.etape), n: e.etape, r: e.releve } : null); }, 250); return () => clearInterval(id); }, []);
  const toucherEcran = (ev) => { const r = toile.current.getBoundingClientRect(); bouger(ev.clientX - r.left < r.width / 2 ? -1 : 1); };
  const glisse = useRef(null);
  const e = etat.current;
  return (
    <div class="page course">
      <div class="course__haut">
      {(vue.phase === 'course' || vue.phase === 'pause') && <button class="course__musique course__pause" onClick={() => (vue.phase === 'pause' ? reprendre() : pause())}>{vue.phase === 'pause' ? '▶ Reprendre' : '⏸ Pause'}</button>}
      <button class="course__musique" aria-pressed={musique} onClick={() => modifierReglages({ musiqueJeux: !musique })}>{musique ? '🎵 Musique : oui' : '🔇 Musique : non'}</button>
      </div>
      {hud && vue.phase !== 'debut' && <div class="course__hud">
        <span class="course__hud-force" aria-label={`Force ${Math.round(hud.f)} %`}><b>Force</b><i><em style={{ width: hud.f + '%', background: hud.f > 35 ? '#e8b21f' : '#e2574c' }} /></i></span>
        <span class="course__hud-txt">Étape {hud.n + 1} · {km(Math.min(hud.b, hud.d))} / {km(hud.b)}</span>
        <span class="course__hud-croix" title="Relèvements restants">✝ {'●'.repeat(RELEVES_MAX - hud.r)}{'○'.repeat(hud.r)}</span>
        <span class="course__hud-prog"><em style={{ width: Math.min(100, hud.d / hud.b * 100) + '%' }} /></span>
      </div>}
      <div class={'course__cadre' + (vue.phase === 'course' ? '' : ' course__cadre--menu')}>
        <canvas ref={toile} class="course__toile" onPointerDown={(ev) => { glisse.current = ev.clientX; }} onPointerUp={(ev) => { const d = ev.clientX - (glisse.current ?? ev.clientX); if (Math.abs(d) > 30) bouger(d < 0 ? -1 : 1); else toucherEcran(ev); }}
          aria-label="Touchez à gauche ou à droite pour changer de voie" />
        {vue.phase === 'debut' && <div class="course__voile"><div class="course__dedans">
          <h2>La course de la vie</h2>
          <p>Touche à <b>gauche</b> ou à <b>droite</b> pour changer de voie.</p>
          <p class="course__legende"><span class="course__pierre">Péché</span> esquive les pierres du péché : elles font mourir.</p>
          <p class="course__legende"><span class="course__or">🙏</span> attrape la prière, la Parole, le don… : ils te donnent de la force.</p>
          <div class="segments course__genre" role="group" aria-label="Ton personnage">
            {[['garcon', '👦 Garçon'], ['fille', '👧 Fille']].map(([g, t]) => <button aria-pressed={(r.genreCoureur || 'garcon') === g} onClick={() => modifierReglages({ genreCoureur: g })}>{t}</button>)}
          </div>
          <button class="bouton bouton--or course__commencer" onClick={() => nouvelle(meilleur > 0 ? meilleur : 0)}>▶ Commencer {meilleur > 0 ? `(étape ${meilleur + 1})` : ''}</button>
          <button class="lien course__reecouter" onClick={() => lire(INTRO)}>🔊 Réécouter les règles</button>
          {meilleur > 0 && <>
            <p class="course__record">Rejouer une étape déjà réussie :</p>
            <div class="course__etapes">{[...Array(meilleur)].map((_, i) => <button onClick={() => nouvelle(i)} aria-label={`Étape ${i + 1} : ${ETAPES[i % ETAPES.length].nom}`}><b>{i + 1}</b><small>{km(BUT(i))}</small></button>)}</div>
          </>}
        </div></div>}
        {vue.phase === 'ecoute' && <div class="course__voile course__voile--ecoute">
          <p class="course__oreille" aria-hidden="true">👂</p><h2>Écoute ceci attentivement</h2>
          <p class="course__points" aria-hidden="true"><i /><i /><i /></p>
        </div>}
        {vue.phase === 'lecon' && vue.m && <div class="course__voile">
          <div class="course__dedans">
            <p class="course__etiquette">Message pour toi</p>
            <h2>{vue.m.titre}</h2>
            <p>{vue.m.texte}</p>
            <p class="course__verset">{vue.m.verset}<small>{vue.m.ref}</small></p>
            <button class="bouton bouton--or" onClick={() => { arreterVoix(); relancer(); }}>J'ai compris, je continue ▶</button>
            <button class="lien course__reecouter" onClick={() => lire(`${vue.m.titre}. ${vue.m.texte} La Bible dit : ${vue.m.verset.replace(/[«»]/g, '')} ${vue.m.ref}.`)}>🔊 Réécouter</button>
          </div>
        </div>}
        {vue.phase === 'epuise' && <div class="course__voile course__voile--mort"><div class="course__dedans">
          <p class="course__cause">Jésus t'a relevé {RELEVES_MAX} fois dans cette étape.</p>
          <h2>Il est temps de te repentir</h2>
          <p>Dieu ne se lasse pas de pardonner celui qui se repent vraiment. Mais se repentir, c'est <b>changer de direction</b> et fuir le péché, pas recommencer la même chose.</p>
          <p class="course__verset">« Ne vous y trompez pas : on ne se moque pas de Dieu. Ce qu'un homme aura semé, il le moissonnera aussi. »<small>Galates 6:7</small></p>
          <button class="bouton bouton--or" onClick={() => nouvelle(etat.current.etape)}>🙏 Je me repens : je reprends l'étape</button>
          <button class="bouton bouton--contour course__clair" onClick={() => { etat.current = null; setVue({ phase: 'debut' }); lire(INTRO); }}>Choisir une autre étape</button>
        </div></div>}
        {vue.phase === 'pause' && <div class="course__voile"><div class="course__dedans">
          <p style="font-size:3rem">⏸</p><h2>Pause</h2><p>Le jeu t'attend.</p>
          <button class="bouton bouton--or" onClick={reprendre}>▶ Reprendre</button>
          <button class="bouton bouton--contour course__clair" onClick={() => { etat.current = null; setVue({ phase: 'debut' }); }}>Choisir une autre étape</button>
        </div></div>}
        {vue.phase === 'etape' && <div class="course__voile"><div class="course__dedans">
          <p style="font-size:2.6rem">🏁</p>
          <h2>Étape {vue.n + 1} réussie !</h2><p>{ETAPES[vue.n % ETAPES.length].nom}</p>
          <p class="course__verset">{VERSETS[vue.n % VERSETS.length]}</p>
          <button class="bouton bouton--or" onClick={() => nouvelle(vue.n + 1)}>Étape {vue.n + 2} : {ETAPES[(vue.n + 1) % ETAPES.length].nom} ▶</button>
          <p class="course__record">Attention : à chaque étape, ça va plus vite.</p>
        </div></div>}
        {vue.phase === 'mort' && <div class="course__voile course__voile--mort"><div class="course__dedans">
          <p class="course__cause">{vue.mot ? <>« {vue.mot} » t'a frappé.</> : 'Tu n\'avais plus de force.'}</p>
          {vue.mot ? <p class="course__verset">« Le salaire du péché, c'est la mort ; mais le don gratuit de Dieu, c'est la vie éternelle en Jésus-Christ notre Seigneur. »<small>Romains 6:23</small></p>
            : <p class="course__verset">Sans la prière, la Parole et l'obéissance, on s'affaiblit. Attrape les boules dorées ! « Sans moi vous ne pouvez rien faire. »<small>Jean 15:5</small></p>}
          <h2>Veux-tu revivre ?</h2>
          <p>Pour continuer, il te faut Jésus.</p>
          <button class="bouton bouton--or course__jesus" onClick={revivre}>✝ Jésus, viens dans ma vie</button>
          <p class="course__record">{km(vue.distance)} parcourus · Jésus peut encore te relever {RELEVES_MAX - (e?.releve || 0)} fois dans cette étape</p>
        </div></div>}
      </div>
      {(vue.phase === 'course') && <div class="course__fleches">
        <button onClick={() => bouger(-1)} aria-label="À gauche">◀</button>
        <button onClick={() => bouger(1)} aria-label="À droite">▶</button>
      </div>}
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
  const fille = GENRE === 'fille';
  const tg = ctx.createLinearGradient(0, -22, 0, 8);
  if (fille) { tg.addColorStop(0, '#ff8fb8'); tg.addColorStop(1, '#e05a8f'); } else { tg.addColorStop(0, '#f2f2f2'); tg.addColorStop(1, '#d7dbe6'); }
  ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-13, -18); ctx.quadraticCurveTo(0, -24, 13, -18);
  if (fille) { ctx.lineTo(16, 14); ctx.lineTo(-16, 14); } else { ctx.lineTo(11, 9); ctx.lineTo(-11, 9); }   // robe ou tunique
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = fille ? '#fff3b0' : '#c99a2e'; ctx.fillRect(-11, -2, 22, 3.5);   // ceinture
  ctx.fillStyle = '#7a4a2e'; ctx.beginPath(); ctx.arc(0, -29, 10, 0, 7); ctx.fill();   // tête
  ctx.fillStyle = '#1e1410'; ctx.beginPath(); ctx.arc(0, -31, 10, Math.PI, 0); ctx.fill();   // cheveux
  ctx.beginPath(); ctx.arc(0, -29, 9.5, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  if (fille) {   // deux nattes avec des nœuds
    ctx.beginPath(); ctx.arc(-11, -36, 5.5, 0, 7); ctx.arc(11, -36, 5.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff5a92'; ctx.beginPath(); ctx.arc(-11, -36, 2.5, 0, 7); ctx.arc(11, -36, 2.5, 0, 7); ctx.fill();
  }
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
  ctx.fillStyle = '#3b2416';
  ctx.beginPath(); ctx.arc(0, -30, 9.8, Math.PI * 1.08, Math.PI * 1.92); ctx.lineTo(7, -31); ctx.quadraticCurveTo(0, -35, -7, -31); ctx.closePath(); ctx.fill();   // cheveux sur le dessus
  ctx.fillRect(-10, -31, 3, 12); ctx.fillRect(7, -31, 3, 12);   // cheveux sur les côtés
  ctx.beginPath(); ctx.moveTo(-6, -23); ctx.quadraticCurveTo(0, -16, 6, -23); ctx.quadraticCurveTo(0, -20, -6, -23); ctx.fill();   // barbe courte
  ctx.fillStyle = '#1e140c'; ctx.beginPath(); ctx.arc(-3, -28, 1.1, 0, 7); ctx.arc(3, -28, 1.1, 0, 7); ctx.fill();   // yeux
  ctx.strokeStyle = '#5a3420'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -25, 2.2, 0.2, Math.PI - 0.2); ctx.stroke();   // sourire
  ctx.restore();
}
