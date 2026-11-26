import { useState, useEffect } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { VEILLES, GUIDE_PHASES, CYCLE_VEILLES, ADORATION } from '../../donnees/contenu.js';
import { veilleDuJour, nombreDeSujets, semaineEnCours, TAILLES, serieEnCours, meilleureSerie, phraseDeSerie } from '../../donnees/veilles.js';
import { lireEnCours, ecrireEnCours, effacerEnCours } from '../../donnees/veilleEnCours.js';
import { noterPriere, aiPrie } from '../../donnees/priere.js';
import { useSignal, useMemoire } from '../../outils/signal.js';
import { SujetsUnParUn } from './SujetsUnParUn.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { PriereGuidee } from '../../composants/PriereGuidee.jsx';
import { priantsDuJour, chargerPriants, phrasePriants } from '../../donnees/ensemble.js';
import { notesVeilles, noteDuJour, ecrireNote, dernieresNotes, supprimerNote } from '../../donnees/notesVeilles.js';

// Liste de sujets à cocher (« appuie sur chaque point après l'avoir prié »).
export function SujetsACocher({ sujets, cle, numerote, voixId, debut = 0, faits: faitsExt, setFaits: setFaitsExt }) {
  // Mode contrôlé : la veille garde elle-même les coches (pour cocher toute seule en avançant).
  const [faitsLocal, setFaitsLocal] = useMemoire('sujets-' + (cle || voixId || '') + '-' + debut + '-' + (sujets[0]?.texte || '').slice(0, 24), {});
  const faits = faitsExt ?? faitsLocal, setFaits = setFaitsExt ?? setFaitsLocal;
  const va = useVoixActive(voixId);
  const tous = sujets.length && sujets.every((_, i) => faits[i]);
  return (
    <>
      <ol class={'sujets' + (numerote ? ' sujets--numerotes' : '')}>
        {sujets.map((s, i) => (
          <li class={'carte sujet-priere' + (faits[i] ? ' sujet-priere--fait' : '')} {...(voixId ? va(debut + i) : {})}>
            <button class="sujet-priere__case" aria-pressed={!!faits[i]} aria-label={faits[i] ? 'Prié' : 'Marquer comme prié'}
              onClick={() => setFaits({ ...faits, [i]: !faits[i] })}>{faits[i] ? <Icone nom="verifie" taille={16} /> : numerote ? i + 1 : ''}</button>
            <div class="sujet-priere__corps">
              {s.titre && <h4>{s.titre}</h4>}
              <p><TexteRefs texte={s.texte} /></p>
            </div>
          </li>
        ))}
      </ol>
      {sujets.length > 1 && <button class="lien" style="display:block;margin:6px auto 0" onClick={() => setFaits(tous ? {} : Object.fromEntries(sujets.map((_, i) => [i, true])))}>
        {tous ? 'Tout décocher' : 'Tout marquer comme prié'}</button>}
    </>
  );
}

export function GuidePhase({ num }) {
  const g = GUIDE_PHASES?.phases?.['p' + num] || (num === 'proc' ? GUIDE_PHASES?.phases?.proc : null);
  if (!g) return null;
  return <p class="guide-phase"><Icone nom="ampoule" taille={18} /><span><b>{g.titre}</b> <TexteRefs texte={g.texte} /></span></p>;
}

// ============ Ce qui sert à PRIER : l'intérieur d'une veille ============
// Dès qu'on ouvre une veille, on veut prier : rien d'autre ne doit gêner (ni statistiques, ni panneaux).

const lireTaille = () => { try { return localStorage.getItem('yeshaya:veille-taille') || 'normal'; } catch { return 'normal'; } };
// Chaque veille a son humeur : on sent l'heure avant même de lire.
const HUMEURS = {
  'veille-aube': { mot: 'Recevoir le jour', icone: 'soleil' },
  'veille-midi': { mot: 'Tenir bon', icone: 'soleil' },
  'veille-soir': { mot: 'Déposer la journée', icone: 'lune' },
};

// Le thème du jour, en une affiche courte.
function AfficheDuJour({ v }) {
  const j = v.jourCycle; if (!j) return null;
  return (
    <section class="affiche-jour" aria-label={`Prière du jour : ${j.theme}`}>
      <span class="affiche-jour__etiquette">Prière du jour · jour {j.numero} sur 7</span>
      <h3>Prière pour {j.court}</h3>
      <p>{j.accroche}</p>
    </section>
  );
}

// Court, normal ou complet : on choisit selon le temps dont on dispose.
function ChoixTaille({ valeur, surChoix, v }) {
  return (
    <section class="choix-taille" aria-label="Durée de la veille">
      <h3>Combien de temps as-tu ?</h3>
      <div class="segments" role="group" aria-label="Durée">
        {TAILLES.map((x) => <button aria-pressed={valeur === x.id} onClick={() => surChoix(x.id)}>{x.nom}<small>~ {x.minutes} min</small></button>)}
      </div>
      <p class="ligne__desc">{TAILLES.find((x) => x.id === valeur)?.desc} <b>{nombreDeSujets(v)} sujets.</b></p>
    </section>
  );
}

// À la fin de la veille : on note ce que Dieu a dit, tant que c'est frais.
const QUESTION = {
  'veille-aube': { titre: "Ce que Dieu m'a dit ce matin", aide: 'Un mot, une pensée, un verset, un rêve. Écris vite, comme ça vient.' },
  'veille-midi': { titre: 'Ce que Dieu me montre en ce moment', aide: "Ce qui me pèse, ce qu'il me dit, ce que je dois changer cet après-midi." },
  'veille-soir': { titre: "Ce que Dieu a fait aujourd'hui", aide: 'Une protection, une provision, une réponse. Même une petite chose.' },
};
function NoteDeFin({ id }) {
  const notes = useSignal(notesVeilles), q = QUESTION[id] || QUESTION['veille-aube'];
  return (
    <section class="carte bloc mes-notes">
      <h3><span class="ligne__icone"><Icone nom="note" /></span> {q.titre}</h3>
      <p class="ligne__desc">{q.aide} Facultatif.</p>
      <textarea class="champ champ--zone" rows={4} value={noteDuJour(id, notes)} maxLength={2000} placeholder="Écris ici…" aria-label={q.titre} onInput={(e) => ecrireNote(id, e.currentTarget.value)} />
    </section>
  );
}

// Moment de prière guidé (veille de l'Aube, de Midi ou du Soir), phase par phase selon le Notre Père.
// Chaque phase prie d'abord pour le thème du jour. On avance avec « Suivant » : ce qu'on vient de prier se coche tout seul.
export function Veille({ id, guide }) {
  const v0 = VEILLES.find((x) => x.id === 'veille-' + id) || VEILLES[0];
  const [taille, setTaille] = useState(lireTaille);
  const choisir = (x) => { setTaille(x); try { localStorage.setItem('yeshaya:veille-taille', x); } catch { /* stockage indisponible */ } };
  const v = veilleDuJour(v0, CYCLE_VEILLES, new Date(), taille, ADORATION);
  const etapes = [...v.phases, { num: 'proc', titre: 'Proclamations', texte: 'Termine en déclarant à voix haute ces paroles de foi.', sujets: v.proclamations }];
  // La progression se range par veille, par taille et par jour : un nouveau jour repart du début.
  const cleJour = `${v.id}-${taille}-${new Date().toISOString().slice(0, 10)}`;
  const [n, setN] = useMemoire('etape-' + cleJour, -1);
  const [coches, setCoches] = useMemoire('coches-' + cleJour, {});
  const vaE = useVoixActive(`${cleJour}-${n}`);

  const fait = (k) => etapes[k].sujets.length > 0 && etapes[k].sujets.every((_, i) => coches[k]?.[i]);
  const nbFaites = etapes.filter((_, k) => fait(k)).length, tout = nbFaites === etapes.length;
  const prochaine = Math.max(0, etapes.findIndex((_, k) => !fait(k)));
  const toutCocher = (k) => setCoches({ ...coches, [k]: Object.fromEntries(etapes[k].sujets.map((_, i) => [i, true])) });
  const aller = (k) => { setN(k); scrollTo(0, 0); };
  // On garde la trace d'une veille commencée, pour inviter à la reprendre depuis la rubrique Prière.
  useEffect(() => {
    if (n >= 0 && !tout) ecrireEnCours({ id: v0.id, titre: v0.titre, taille, etape: n + 1, total: etapes.length, lien: '#/priere/veille/' + id });
  }, [n, nbFaites]);

  if (n < 0) return (
    <div class={'page veille veille--' + id}>
      <div class="theme-hero"><img src={v.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{v.heures}</span><h2>{v.titre}</h2></div></div>
      <p class="veille__theme"><span class="veille__humeur"><Icone nom={HUMEURS[v.id]?.icone || 'soleil'} taille={15} /> {HUMEURS[v.id]?.mot}</span>{v.theme}</p>
      <AfficheDuJour v={v} />

      {tout
        ? <section class="veille__fin"><Icone nom="verifie" taille={26} /><b>Amen. Tu as prié cette veille.</b><span>Que Dieu exauce ta prière. Tu peux la recommencer ou choisir une autre durée.</span></section>
        : nbFaites > 0 && <section class="veille__reprise"><b>Tu as laissé ta prière à l'étape {prochaine + 1} sur {etapes.length}.</b><span>Veux-tu continuer maintenant ?</span>
            <button class="bouton bouton--or" onClick={() => aller(prochaine)}>Reprendre : {etapes[prochaine].titre}</button></section>}

      <ChoixTaille valeur={taille} surChoix={choisir} v={v} />
      {!nbFaites && <button class="bouton bouton--or veille__demarrer" onClick={() => aller(0)}><Icone nom="priere" taille={22} /> Commencer la veille</button>}
      {nbFaites > 0 && <button class="bouton bouton--contour veille__demarrer" onClick={() => { setCoches({}); aller(0); }}>Recommencer depuis le début</button>}
      <PriereGuidee auto={guide} id={cleJour} titre={v.titre} introduction={v.introduction} idPriere={v.id}
        etapes={etapes.map((e) => ({ titre: e.titre, texte: e.num === 'proc' ? e.texte : null, sujets: e.sujets }))} />

      <section class="carte bloc"><h3><span class="ligne__icone"><Icone nom="info" /></span> Avant de commencer</h3><p><TexteRefs texte={v.introduction} /></p></section>
      <h2 class="titre-section">Le déroulement</h2>
      <ol class="carte deroulement">
        {etapes.map((e, i) => (
          <li><button onClick={() => aller(i)}>
            <span class={'deroulement__num' + (fait(i) ? ' deroulement__num--fait' : '')}>{fait(i) ? <Icone nom="verifie" taille={16} /> : e.num === 'proc' ? '✦' : e.num}</span>
            <span>{e.titre}<small class="deroulement__nb">{e.sujets.length} sujet{e.sujets.length > 1 ? 's' : ''}</small></span><Icone nom="chevron" taille={18} /></button></li>))}
      </ol>
      <p class="source-mention">Source : {v.auteur}</p>
    </div>
  );

  const e = etapes[n], derniere = n === etapes.length - 1;
  const suivant = () => { toutCocher(n); if (derniere) { noterPriere(v.id); effacerEnCours(); const s = serieEnCours(aiPrie.valeur); notifier(s.serie > 1 ? `Amen ! ${s.serie} jours de suite : continue.` : 'Amen ! Que Dieu exauce ta prière.'); aller(-1); } else aller(n + 1); };
  return (
    <div class={'page veille veille--' + id}>
      <div class="progression progression--fine" style="margin-top:12px"><span style={{ width: ((n + 1) / etapes.length) * 100 + '%' }} /></div>
      <p class="quiz__compteur">Étape {n + 1} sur {etapes.length}</p>
      <div {...vaE(0)}>
        <h2 class="phase__titre">{e.num !== 'proc' && <span class="phase__num">{e.num}</span>}{e.titre}</h2>
        {e.sous_titre && <p class="phase__sous-titre"><TexteRefs texte={e.sous_titre} /></p>}
        {e.theme && <p class="phase__theme"><Icone nom="priere" taille={15} /> Aujourd'hui : prière pour {e.theme}</p>}
      </div>
      <p class="phase__consigne">{e.sujets.length > 1 ? 'Voici ' + e.sujets.length + ' consignes de prière, une à la fois. Lis-la, prie avec tes mots, puis touche la flèche pour passer à la suivante.' : 'Lis cette consigne, puis prie avec tes mots.'}</p>
      <SujetsUnParUn key={n} sujets={e.sujets} voixId={`${cleJour}-${n}`} faits={coches[n] || {}} setFaits={(f) => setCoches({ ...coches, [n]: f })}
        intro={`${e.titre}. ${e.theme ? "Aujourd'hui : prière pour " + e.theme + '.' : ''}`} />
      {/* Les explications viennent APRÈS les consignes : d'abord prier, ensuite comprendre. */}
      {e.texte && <section class="carte bloc phase__aide"><h3><span class="ligne__icone"><Icone nom="ampoule" /></span> Pour t'aider dans cette étape</h3><p class="phase__texte"><TexteRefs texte={e.texte} /></p><GuidePhase num={e.num} /></section>}
      {!e.texte && <GuidePhase num={e.num} />}
      {n === 0 && v.verset && <><h3 class="phase__parole">Parole du jour</h3><CarteVerset reference={v.verset} /></>}
      {derniere && <NoteDeFin id={v.id} />}
      <div class="chemin-etape__nav">
        <button class="bouton bouton--contour" onClick={() => aller(n - 1)}><Icone nom="precedent" taille={18} /> {n === 0 ? 'Sommaire' : etapes[n - 1].titre}</button>
        {derniere ? <button class="bouton bouton--or" onClick={suivant}>J'ai prié <Icone nom="verifie" taille={20} /></button>
          : <button class="bouton bouton--plein" onClick={suivant}>{etapes[n + 1].titre} <Icone nom="chevron" taille={18} /></button>}
      </div>
    </div>
  );
}

// ============ Ce qui sert à SUIVRE sa vie de prière : réservé à la rubrique Prière (en bas) ============

// La série de jours de suite : la raison de revenir demain.
export function SerieDeVeilles({ aiPrie: priees, id }) {
  const s = serieEnCours(priees), total = Object.entries(priees).filter(([k]) => k.startsWith('veille-')).reduce((n, [, d]) => n + d.length, 0);
  const cetteVeille = id ? (priees[id] || []).length : 0, meilleure = meilleureSerie(priees);
  return (
    <section class={'serie-veilles' + (s.enDanger ? ' serie-veilles--danger' : '') + (s.serie >= 2 ? ' serie-veilles--vive' : '')} aria-label="Ma régularité">
      <span class="serie-veilles__flamme" aria-hidden="true"><Icone nom="flamme" taille={26} /><b>{s.serie}</b></span>
      <span class="serie-veilles__corps">
        <b>{s.serie > 0 ? `${s.serie} jour${s.serie > 1 ? 's' : ''} de suite` : 'Pas encore de série'}</b>
        <span>{phraseDeSerie(s, total)}</span>
        {total > 0 && <small>{id ? `Cette veille : ${cetteVeille} fois · ` : ''}Toutes les veilles : {total} fois · Meilleure série : {meilleure} jour{meilleure > 1 ? 's' : ''}</small>}
      </span>
    </section>
  );
}

const JOURS_COURTS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
// Les sept jours de la semaine, avec ceux où l'on a prié.
export function SemaineDePriere({ aiPrie: priees }) {
  const semaine = semaineEnCours(priees);
  return (
    <ol class="semaine-priere" aria-label="La semaine">
      {semaine.map((s, i) => (
        <li class={(s.aujourdhui ? 'est-aujourdhui ' : '') + (s.prie ? 'est-prie ' : '') + (s.futur ? 'est-futur' : '')} aria-current={s.aujourdhui ? 'date' : undefined}>
          <span>{JOURS_COURTS[i]}</span><i aria-hidden="true">{s.prie ? <Icone nom="verifie" taille={12} /> : ''}</i>
        </li>))}
    </ol>
  );
}

// « Tu n'es pas seul » : combien de personnes ont prié chaque veille aujourd'hui (rien ne s'affiche hors ligne).
export function PrierEnsemble({ id }) {
  const d = useSignal(priantsDuJour);
  useEffect(() => { chargerPriants(); }, []);
  const phrase = phrasePriants(d, id.replace('veille-', ''));
  if (!phrase) return null;
  return <p class="prier-ensemble"><Icone nom="groupe" taille={18} /><span>{phrase}<small>Total des personnes qui partagent des statistiques anonymes : le vrai nombre est plus élevé.</small></span></p>;
}

const nomVeille = { 'veille-aube': "l'Aube", 'veille-midi': 'Midi', 'veille-soir': 'le Soir' };
// Les dernières notes écrites à la fin des veilles.
export function MesDernieresNotes() {
  const notes = useSignal(notesVeilles), l = dernieresNotes(notes);
  if (!l.length) return null;
  const ajd = new Date(), cleAjd = `${ajd.getFullYear()}-${String(ajd.getMonth() + 1).padStart(2, '0')}-${String(ajd.getDate()).padStart(2, '0')}`;
  return (
    <section class="carte bloc mes-notes">
      <h3><span class="ligne__icone"><Icone nom="note" /></span> Ce que Dieu m'a dit</h3>
      <ul class="mes-notes__liste">
        {l.map((x) => (
          <li>
            <span class="mes-notes__date">{x.date === cleAjd ? "Aujourd'hui" : new Date(x.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {nomVeille[x.veille] || ''}</span>
            <p>{x.texte}</p>
            <button class="lien" onClick={() => { if (confirm('Supprimer cette note ?')) supprimerNote(x.date + '|' + x.veille); }}>Supprimer</button>
          </li>))}
      </ul>
    </section>
  );
}

export const blocsSujets = (sujets, numerote) => sujets.map((s, i) => ({ texte: `${numerote ? (i + 1) + '. ' : ''}${s.titre ? s.titre + '. ' : ''}${s.texte}` }));
