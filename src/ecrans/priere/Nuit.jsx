import { useEffect, useState } from 'preact/hooks';
import { Banniere } from '../../composants/Banniere.jsx';
import { Icone } from '../../composants/Icone.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { Accordeon } from '../../composants/Accordeon.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { SujetsUnParUn } from './SujetsUnParUn.jsx';
import { NUIT_PRIERE as N, CYCLE_VEILLES, ADORATION } from '../../donnees/contenu.js';
import { construireNuit, LONGUEURS, prochaineNuit } from '../../donnees/nuit.js';
import { notesVeilles, dernieresNotes } from '../../donnees/notesVeilles.js';
import { useSignal } from '../../outils/signal.js';

const CLE = 'yeshaya:nuit-en-cours';
const lire = () => { try { return JSON.parse(localStorage.getItem(CLE)); } catch { return null; } };
const ecrire = (v) => { try { v ? localStorage.setItem(CLE, JSON.stringify(v)) : localStorage.removeItem(CLE); } catch {} };
const lireVu = () => { try { return localStorage.getItem('yeshaya:nuit-intro-vue') === '1'; } catch { return false; } };
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const duree = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + String(m % 60).padStart(2, '0') : ''}` : `${m} min`);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function Nuit() {
  const [enCours, setEnCours] = useState(() => { const e = lire(); return e && Date.now() - e.depuis < 20 * 3600e3 ? e : null; });
  const [vue, setVue] = useState(() => (enCours ? 'nuit' : lireVu() ? 'plan' : 'intro'));
  const sauve = (v) => { setEnCours(v); ecrire(v); };
  if (vue === 'intro') return <Introduction fin={() => { try { localStorage.setItem('yeshaya:nuit-intro-vue', '1'); } catch {} setVue('plan'); }} />;
  if (vue === 'nuit' && enCours) return <NuitEnCours etat={enCours} sauve={sauve} fin={() => { sauve(null); setVue('plan'); }} />;
  return <Plan revoir={() => setVue('intro')} commencer={(e) => { sauve(e); setVue('nuit'); }} />;
}

// ---------- 1. Comprendre, par étapes ----------
function Introduction({ fin }) {
  const [n, setN] = useState(0);
  const e = N.intro[n], derniere = n === N.intro.length - 1;
  return (
    <div class="page nuit">
      <div class="progression progression--fine" style="margin-top:12px"><span style={{ width: ((n + 1) / N.intro.length) * 100 + '%' }} /></div>
      <p class="quiz__compteur">{n + 1} sur {N.intro.length}</p>
      <div class="nuit__tete"><Icone nom="lune" taille={34} /><h2>{e.titre}</h2></div>
      <section class="carte bloc">{e.texte.map((t) => <p class="nuit__texte"><TexteRefs texte={t} /></p>)}</section>
      <nav class="nav-phase" aria-label="Étapes">
        <button class="nav-phase__bouton" disabled={n === 0} onClick={() => setN(n - 1)} style={n === 0 ? 'visibility:hidden' : ''}>
          <Icone nom="precedent" taille={26} /><span><small>Retour à</small><b>{N.intro[n - 1]?.titre || ''}</b></span></button>
        <button class="nav-phase__bouton nav-phase__bouton--suivant" onClick={() => (derniere ? fin() : setN(n + 1))}>
          <Icone nom="chevron" taille={26} /><span><small>{derniere ? 'Terminer' : 'Suivant'}</small><b>{derniere ? 'Préparer ma nuit' : N.intro[n + 1].titre}</b></span></button>
      </nav>
    </div>
  );
}

// ---------- 2. Préparer la nuit ----------
function Plan({ revoir, commencer }) {
  const [longueur, setLongueur] = useState('complete');
  const [debut, setDebut] = useState('22:00');
  const notes = useSignal(notesVeilles);
  const recentes = dernieresNotes(notes, 20).filter((x) => Date.now() - new Date(x.date + 'T12:00:00') < 8 * 864e5).map((x) => x.texte);
  const nuit = construireNuit({ cycle: CYCLE_VEILLES, adoration: ADORATION, contenu: N, longueur, debut, notes: recentes });
  const v = prochaineNuit(new Date());
  return (
    <div class="page nuit">
      <Banniere image="/assets/photos/banniere-priere.webp" titre="Nuit de prière" sous="Veiller avec Dieu pendant que le monde dort." />
      <section class="carte bloc nuit__semaine">
        <span class="pastille pastille--or pastille--mini">Cette semaine</span>
        <h2>Thème : {nuit.theme.court}</h2>
        <p>{nuit.theme.accroche.replace("Aujourd'hui", 'Cette nuit')}</p>
        <p class="ligne__desc">Nuit conseillée : <b>{JOURS[v.getDay()]} {v.getDate()} {MOIS[v.getMonth()]}</b>, la nuit du vendredi au samedi.</p>
      </section>

      <h2 class="titre-section">Choisis ta nuit</h2>
      <div class="nuit__choix" role="radiogroup" aria-label="Durée de la nuit">
        {LONGUEURS.map((l) => (
          <button role="radio" aria-checked={longueur === l.id} class={'chip' + (longueur === l.id ? ' chip--actif' : '')} onClick={() => setLongueur(l.id)}>
            <b>{l.titre}</b><small>{l.detail}</small></button>))}
      </div>
      <label class="etiquette-champ" for="nuit-debut">Heure de début</label>
      <input id="nuit-debut" class="champ" type="time" value={debut} onInput={(e) => setDebut(e.currentTarget.value || '22:00')} />
      <p class="ligne__desc">De {nuit.phases[0].debut} à {nuit.fin} · {duree(nuit.total)}. Si tu débutes, prends la nuit courte.</p>

      <h2 class="titre-section">Le déroulement</h2>
      <ol class="nuit__etapes">
        {nuit.phases.map((p, i) => (
          <li><span class="nuit__heure">{p.debut}</span><span class="nuit__nom"><b>{p.titre}</b><small>au moins {duree(p.minutes)}</small></span></li>))}
      </ol>
      <button class="bouton bouton--or" style="width:100%;margin-top:14px" onClick={() => commencer({ depuis: Date.now(), longueur, debut, n: 0, tPhase: Date.now(), reglages: {} })}>
        <Icone nom="lune" taille={20} /> Commencer la nuit</button>
      <p class="ligne__desc" style="margin-top:8px">Chaque durée est un minimum conseillé. Tu restes libre de rester plus longtemps ou de passer avant.</p>
      <div class="liste" style="margin-top:12px">
        <a class="carte ligne" href={'#/grandir/enseignement/' + N.enseignement}><span class="ligne__corps"><span class="ligne__titre" style="display:block">Lire l'enseignement</span><span class="ligne__desc">La nuit de prière : le modèle biblique et les dangers à éviter.</span></span><Icone nom="chevron" taille={20} /></a>
        <button class="carte ligne" onClick={revoir} style="width:100%;text-align:left"><span class="ligne__corps"><span class="ligne__titre" style="display:block">Revoir l'introduction</span><span class="ligne__desc">Pourquoi prier la nuit, comment se préparer.</span></span><Icone nom="chevron" taille={20} /></button>
      </div>
    </div>
  );
}

// ---------- 3. Pendant la nuit : une phase à la fois, chronométrée ----------
function NuitEnCours({ etat, sauve, fin }) {
  const notes = useSignal(notesVeilles);
  const recentes = dernieresNotes(notes, 20).filter((x) => Date.now() - new Date(x.date + 'T12:00:00') < 8 * 864e5).map((x) => x.texte);
  const nuit = construireNuit({ cycle: CYCLE_VEILLES, adoration: ADORATION, contenu: N, longueur: etat.longueur, debut: etat.debut, reglages: etat.reglages, notes: recentes });
  const n = Math.min(etat.n, nuit.phases.length - 1), p = nuit.phases[n], derniere = n === nuit.phases.length - 1;
  const [, force] = useState(0);
  useEffect(() => { try { window.scrollTo(0, 0); } catch {} }, [n]);
  // Chronomètre fondé sur l'heure réelle : il reste juste même si le téléphone s'est mis en veille.
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  // Garde l'écran allumé pendant la nuit (quand le téléphone le permet).
  useEffect(() => {
    let verrou = null;
    const prendre = async () => { try { verrou = await navigator.wakeLock?.request('screen'); } catch {} };
    prendre(); const r = () => document.visibilityState === 'visible' && prendre();
    document.addEventListener('visibilitychange', r);
    return () => { document.removeEventListener('visibilitychange', r); try { verrou?.release(); } catch {} };
  }, []);
  const ecoule = Math.max(0, Math.floor((Date.now() - etat.tPhase) / 1000)), cible = p.minutes * 60;
  const atteint = ecoule >= cible;
  const aller = (i) => sauve({ ...etat, n: i, tPhase: Date.now() });
  const regler = (delta) => sauve({ ...etat, reglages: { ...etat.reglages, [p.id]: Math.max(5, p.minutes + delta) } });
  const suivant = () => {
    if (!atteint && !confirm(`Il reste ${mmss(cible - ecoule)} sur le temps prévu pour cette phase. Passer quand même à la suite ?`)) return;
    if (derniere) { notifier('Amen. Que Dieu exauce ta prière. Va te reposer.'); fin(); } else aller(n + 1);
  };
  return (
    <div class="page nuit">
      <div class="progression progression--fine" style="margin-top:12px"><span style={{ width: ((n + 1) / nuit.phases.length) * 100 + '%' }} /></div>
      <p class="quiz__compteur">Phase {n + 1} sur {nuit.phases.length} · prévue de {p.debut} à {p.fin}</p>
      <h2 class="phase__titre">{p.titre}</h2>
      {p.theme && <p class="phase__theme"><Icone nom="priere" taille={15} /> {p.theme}</p>}

      <section class="carte nuit__chrono" aria-live="off">
        <div class="nuit__temps"><b>{mmss(ecoule)}</b><span> / minimum {duree(p.minutes)}</span></div>
        <div class="progression progression--fine"><span style={{ width: Math.min(100, (ecoule / cible) * 100) + '%' }} /></div>
        <p class="ligne__desc" style="margin:6px 0">{atteint ? 'Temps atteint. Reste si Dieu te retient, ou passe à la suite.' : `Encore ${mmss(cible - ecoule)} pour atteindre le minimum.`}</p>
        <div class="nuit__reglage"><button class="lien" onClick={() => regler(-5)}>− 5 min</button><button class="lien" onClick={() => regler(5)}>+ 5 min</button><button class="lien" onClick={() => regler(15)}>+ 15 min</button></div>
      </section>

      <p class="phase__consigne">{p.consigne}</p>
      <SujetsUnParUn key={p.id} sujets={p.sujets} voixId={'nuit-' + p.id} intro={p.titre + '.'} />
      <Accordeon key={'a' + p.id} volets={[{ id: 'aide', titre: "Pour t'aider dans cette phase", contenu: <p class="phase__texte"><TexteRefs texte={p.aide} /></p> }]} />

      <nav class="nav-phase" aria-label="Changer de phase">
        <button class="nav-phase__bouton" onClick={() => (n === 0 ? fin() : aller(n - 1))}>
          <Icone nom="precedent" taille={26} /><span><small>Retour à</small><b>{n === 0 ? 'Préparer la nuit' : nuit.phases[n - 1].titre}</b></span></button>
        {derniere
          ? <button class="nav-phase__bouton nav-phase__bouton--suivant nav-phase__bouton--fin" onClick={suivant}><Icone nom="verifie" taille={26} /><span><small>Terminer</small><b>J'ai prié</b></span></button>
          : <button class="nav-phase__bouton nav-phase__bouton--suivant" onClick={suivant}><Icone nom="chevron" taille={26} /><span><small>Suivant</small><b>{nuit.phases[n + 1].titre}</b></span></button>}
      </nav>
    </div>
  );
}
