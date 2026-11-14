import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { ORIZON, chargerOrizon } from '../../donnees/contenu.js';
import { orizon, commencerOrizon, terminerJourOrizon, noterJournal, noterChute, jourCourant, typeJour, phaseDe } from '../../donnees/orizon.js';
import { compter } from '../../donnees/mesure.js';
import { useSignal } from '../../outils/signal.js';

const PHASES = { 1: 'Phase 1 · Le sevrage et les fondations', 2: "Phase 2 · L'enracinement", 3: 'Phase 3 · La consolidation et le service' };
const GROUPES = [['debut', 'Avant de commencer'], ['fondations', 'Partie 1 · Les fondations'], ['apres', 'Après les 90 jours'], ['annexes', 'Annexes']];
const redige = (j) => ORIZON.jours.find((x) => x.jour === j);

// Accueil du parcours : progression, jour du moment, carte des 90 jours, chapitres.
export function OrizonAccueil() {
  const o = useSignal(orizon);
  const courant = jourCourant();
  const r = redige(courant);
  return (
    <div class="page">
      <div class="orizon-hero">
        <p class="orizon-hero__marque">YESHAYA</p>
        <h2>90 jours pour se libérer de la masturbation et de la pornographie</h2>
        <p>{ORIZON.sous_titre}</p>
        <p class="orizon-hero__verset">« C'est pour la liberté que Christ nous a affranchis. » (Galates 5:1)</p>
      </div>
      <section class="carte bloc">
        <p class="ligne__desc" style="margin:0 0 6px">Enseignement et prière, chaque jour pendant 90 jours. Si tu chutes, tu ne reprends pas au jour 1 : tu continues au jour suivant.</p>
        <div class="progression"><span style={{ width: (o.faits.length / 90) * 100 + '%' }} /></div>
        <p class="ligne__desc" style="margin:6px 0 0">{o.faits.length} jour{o.faits.length > 1 ? 's' : ''} vécu{o.faits.length > 1 ? 's' : ''} sur 90 · {PHASES[phaseDe(courant)]}</p>
        <a class="bouton bouton--or" style="width:100%;margin-top:12px" href={'#/orizon/jour/' + courant} onClick={() => commencerOrizon()}>
          {o.faits.length ? `Continuer : jour ${courant}` : 'Commencer le jour 1'}{r ? ' · ' + r.titre : ''}</a>
        {!o.faits.length && <a class="bouton bouton--contour" style="width:100%;margin-top:8px" href="#/orizon/doc/avertissement">Lire d'abord l'avertissement et l'introduction</a>}
        <button class="lien" style="display:block;margin:10px auto 0" onClick={() => { noterChute(); location.hash = '#/orizon/jour/24'; }}>J'ai chuté : que faire maintenant ?</button>
      </section>

      <h2 class="titre-section">Les 90 jours</h2>
      {[1, 2, 3].map((ph) => (
        <section class="carte bloc">
          <h3 style="margin-top:0">{PHASES[ph]}</h3>
          <div class="orizon-grille">
            {Array.from({ length: 30 }, (_, k) => ph * 30 - 29 + k).map((j) => {
              const t = typeJour(j, !!redige(j));
              return <a href={'#/orizon/jour/' + j} class={'orizon-case orizon-case--' + t + (o.faits.includes(j) ? ' orizon-case--fait' : '') + (j === courant ? ' orizon-case--courant' : '')}
                aria-label={`Jour ${j}${redige(j) ? ' : ' + redige(j).titre : t === 'sabbat' ? ' : sabbat' : ' : pratique'}`}>{j}</a>;
            })}
          </div>
        </section>
      ))}
      <p class="ligne__desc" style="margin:0 4px">Case pleine : jour avec enseignement · case claire : pratique libre · 🌅 : sabbat.</p>

      {GROUPES.map(([g, nom]) => (
        <>
          <h2 class="titre-section">{nom}</h2>
          <div class="liste">{ORIZON.documents.filter((d) => d.groupe === g).map((d) => (
            <a class="carte ligne" href={'#/orizon/doc/' + d.id}><span class="ligne__icone"><Icone nom="bible" /></span>
              <span class="ligne__corps"><span class="ligne__titre">{d.titre}</span></span><Icone nom="chevron" taille={20} /></a>
          ))}</div>
        </>
      ))}
      <p class="source-mention">{ORIZON.auteur} · Contact : {ORIZON.contact}</p>
    </div>
  );
}

// Un bloc de texte du manuel, tel quel.
function Bloc({ b, attr }) {
  if (b.t === 'h') return <h3 class="orizon-sous" {...attr}>{b.x}</h3>;
  if (b.t === 'li') return <p class="orizon-li" {...attr}>{b.x}</p>;
  if (b.t === 'cit') return <blockquote class="orizon-cit" {...attr}><TexteRefs texte={b.x} /></blockquote>;
  return <p class="orizon-p" {...attr}><TexteRefs texte={b.x} /></p>;
}

function useCharge(nom) {
  const [e, setE] = useState({ chargement: true });
  useEffect(() => { let ok = true; setE({ chargement: true }); chargerOrizon(nom).then((d) => ok && setE({ d })).catch(() => ok && setE({ erreur: true })); return () => { ok = false; }; }, [nom]);
  return e;
}
const Attente = ({ e }) => <div class="page"><p class={e.erreur ? 'verset__erreur' : 'verset__attente'} style="margin-top:16px">{e.erreur ? "Ce texte n'est pas encore sur ton téléphone. Connecte-toi une fois pour l'ouvrir : il restera ensuite disponible hors ligne." : 'Chargement…'}</p></div>;

export function OrizonDoc({ id }) {
  const e = useCharge(id), va = useVoixActive('orizon-' + id);
  if (!e.d) return <Attente e={e} />;
  const d = e.d;
  return (
    <div class="page orizon-texte">
      <h2 style="margin:14px 4px 8px">{d.titre}</h2>
      <BarreEcoute id={'orizon-' + id} titre="Écouter" blocs={[{ texte: d.titre + '.' }, ...d.blocs.map((b) => ({ texte: b.x }))]} />
      {d.blocs.map((b, i) => <Bloc b={b} attr={va(i + 1)} />)}
      <a class="bouton bouton--contour" href="#/orizon" style="width:100%;margin-top:16px">Retour au parcours</a>
    </div>
  );
}

export function OrizonJour({ j }) {
  const n = Math.min(90, Math.max(1, +j || 1)), r = redige(n);
  return r ? <JourRedige n={n} key={n} /> : <JourPratique n={n} key={n} />;
}

function Navigation({ n }) {
  return (
    <div class="orizon-nav">
      {n > 1 ? <a class="bouton bouton--contour bouton--petit" href={'#/orizon/jour/' + (n - 1)}><Icone nom="precedent" taille={16} /> Jour {n - 1}</a> : <span />}
      <a class="bouton bouton--contour bouton--petit" href="#/orizon">Les 90 jours</a>
      {n < 90 ? <a class="bouton bouton--contour bouton--petit" href={'#/orizon/jour/' + (n + 1)}>Jour {n + 1} <Icone nom="chevron" taille={16} /></a> : <span />}
    </div>
  );
}

function Terminer({ n }) {
  const o = useSignal(orizon), fait = o.faits.includes(n);
  return fait
    ? <p class="carte bloc" style="text-align:center"><Icone nom="verifie" /> Jour {n} vécu. {n < 90 ? 'À demain pour la suite !' : 'Gloire à Dieu pour ces 90 jours !'}</p>
    : <button class="bouton bouton--or" style="width:100%;margin-top:14px" onClick={() => { terminerJourOrizon(n); compter('orizon-jour', String(n)); notifier(n === 90 ? 'Quatre-vingt-dix jours ! Gloire à Dieu !' : 'Bravo ! Jour ' + n + ' vécu.'); }}>
        <Icone nom="verifie" taille={20} /> J'ai vécu le jour {n}</button>;
}

// Jour rédigé : texte intégral du manuel (enseignement, verset, exercice, journal de bord, prière) + écoute + journal à remplir.
function JourRedige({ n }) {
  const e = useCharge(`jour-${String(n).padStart(2, '0')}`), va = useVoixActive('orizon-j' + n);
  const o = useSignal(orizon);
  if (!e.d) return <Attente e={e} />;
  const d = e.d;
  // Les questions du journal de bord : blocs « li » (ou « p » commençant par un tiret) après le titre « Journal de bord ».
  let section = '';
  const blocs = d.blocs.map((b) => { if (b.t === 'h') section = b.x; return { ...b, journal: section.startsWith('Journal de bord') && b.t !== 'h' } });
  const lecture = [{ texte: `Jour ${n}. ${d.titre}.` }, d.accroche && { texte: d.accroche }, ...blocs.map((b) => ({ texte: b.x }))].filter(Boolean);
  return (
    <div class="page orizon-texte">
      <p class="orizon-jour__phase">{PHASES[phaseDe(n)]}</p>
      <h2 class="orizon-jour__titre">Jour {n} · {d.titre}</h2>
      {d.accroche && <p class="veille__theme">{d.accroche}</p>}
      {d.intro_phase && <section class="carte bloc">{d.intro_phase.map((b) => <Bloc b={b} />)}</section>}
      <BarreEcoute id={'orizon-j' + n} titre="Écouter le jour" blocs={lecture} />
      {blocs.map((b, i) => b.journal
        ? <div class="orizon-journal" {...va(i + (d.accroche ? 2 : 1))}><p class="orizon-li">{b.x}</p>
            <textarea class="champ champ--zone" rows={3} placeholder="Ma réponse (reste sur mon téléphone)" value={o.journal[n]?.[i] || ''} onInput={(ev) => noterJournal(n, i, ev.currentTarget.value)} /></div>
        : <Bloc b={b} attr={va(i + (d.accroche ? 2 : 1))} />)}
      <Terminer n={n} />
      <Navigation n={n} />
    </div>
  );
}

// Jours de pratique libre et sabbats des phases 2 et 3 : règles données par le manuel au début de chaque phase.
function JourPratique({ n }) {
  const sabbat = typeJour(n, false) === 'sabbat', ph = phaseDe(n);
  return (
    <div class="page orizon-texte">
      <p class="orizon-jour__phase">{PHASES[ph]}</p>
      <h2 class="orizon-jour__titre">Jour {n} · {sabbat ? 'Sabbat' : 'Pratique libre'}</h2>
      <section class="carte bloc">
        {sabbat
          ? <p class="orizon-p">Dimanche : Sabbat. Culte, repos, bilan rapide de la semaine dans ton journal.</p>
          : <p class="orizon-p">{ph === 2
              ? "Jour de pratique libre. Tu maintiens ta routine matinale (Parole + prière + verset), ton sommeil discipliné, ton sport, ton filtre. Pas de nouvel enseignement — tu vis ce que les jours structurés t'ont donné."
              : 'Tu vis ta vie chrétienne normalement, en maintenant les fondations installées en Phase 1 et enracinées en Phase 2.'}</p>}
        <p class="orizon-p">Si tu chutes : le protocole reste le même. Jour 24 + Chapitre 6. Tu ne reprends pas au Jour 1. Tu reprends au jour suivant.</p>
        <p class="orizon-p">Si tu sens que tu as besoin de revenir à un jour spécifique de la Phase 1 : fais-le. Relis le Jour 4 (déclencheurs), le Jour 13 (plan d'urgence), le Jour 17 (Sainte Cène), ou le Jour 20 (identité).</p>
        <div class="verset__actions">
          <a class="bouton bouton--contour bouton--petit" href="#/orizon/jour/13">Jour 13 · Plan d'urgence</a>
          <a class="bouton bouton--contour bouton--petit" href="#/orizon/jour/24">Jour 24 · Rechute</a>
          <a class="bouton bouton--contour bouton--petit" href="#/orizon/doc/annexe-4">Prières-types</a>
        </div>
      </section>
      <Terminer n={n} />
      <Navigation n={n} />
    </div>
  );
}
