import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { VEILLES, GUIDE_PHASES, CYCLE_VEILLES } from '../../donnees/contenu.js';
import { veilleDuJour, nombreDeSujets, semaineEnCours, TAILLES, serieEnCours, meilleureSerie, phraseDeSerie, joursPries } from '../../donnees/veilles.js';
import { noterPriere, aiPrie } from '../../donnees/priere.js';
import { useSignal, useMemoire } from '../../outils/signal.js';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { PriereGuidee } from '../../composants/PriereGuidee.jsx';
import { notesVeilles, noteDuJour, ecrireNote, dernieresNotes, supprimerNote } from '../../donnees/notesVeilles.js';

// Liste de sujets à cocher (« appuie sur chaque point après l'avoir prié »).
export function SujetsACocher({ sujets, cle, numerote, voixId, debut = 0 }) {
  const [faits, setFaits] = useMemoire('sujets-' + (cle || voixId || '') + '-' + debut + '-' + (sujets[0]?.texte || '').slice(0, 24), {});
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

// Taille choisie : gardée sur le téléphone, d'un jour à l'autre.
const lireTaille = () => { try { return localStorage.getItem('yeshaya:veille-taille') || 'normal'; } catch { return 'normal'; } };
const JOURS_COURTS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
// Chaque veille a son humeur : on sent l'heure avant même de lire.
const HUMEURS = {
  'veille-aube': { mot: 'Recevoir le jour', icone: 'soleil' },
  'veille-midi': { mot: 'Tenir bon', icone: 'soleil' },
  'veille-soir': { mot: 'Déposer la journée', icone: 'lune' },
};

// L'affiche sous la bannière : le thème du jour et la semaine en cours.
function AfficheDuJour({ v, semaine }) {
  const j = v.jourCycle; if (!j) return null;
  return (
    <section class="affiche-jour" aria-label={`Prière du jour : ${j.theme}`}>
      <span class="affiche-jour__etiquette">Prière du jour · jour {j.numero} sur 7</span>
      <h3>Prière pour {j.court}</h3>
      <p>{j.accroche}</p>
      <ol class="affiche-jour__semaine" aria-label="La semaine">
        {semaine.map((s, i) => (
          <li class={(s.aujourdhui ? 'est-aujourdhui ' : '') + (s.prie ? 'est-prie ' : '') + (s.futur ? 'est-futur' : '')} aria-current={s.aujourdhui ? 'date' : undefined}>
            <span>{JOURS_COURTS[i]}</span><i aria-hidden="true">{s.prie ? <Icone nom="verifie" taille={12} /> : ''}</i>
          </li>))}
      </ol>
    </section>
  );
}

// La série de jours de suite : la raison de revenir demain.
export function SerieDeVeilles({ aiPrie, id }) {
  const s = serieEnCours(aiPrie), total = Object.entries(aiPrie).filter(([k]) => k.startsWith('veille-')).reduce((n, [, d]) => n + d.length, 0);
  const cetteVeille = id ? (aiPrie[id] || []).length : 0, meilleure = meilleureSerie(aiPrie);
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

// L'endroit où écrire : ce que Dieu a dit (matin, midi) ou ce qu'il a fait aujourd'hui (soir).
// On y revient pour relire : c'est la mémoire de la veille.
const QUESTION = {
  'veille-aube': { titre: "Ce que Dieu m'a dit ce matin", aide: 'Un mot, une pensée, un verset, un rêve. Écris vite, comme ça vient.' },
  'veille-midi': { titre: "Ce que Dieu me montre en ce moment", aide: 'Ce qui me pèse, ce qu\'il me dit, ce que je dois changer cet après-midi.' },
  'veille-soir': { titre: "Ce que Dieu a fait aujourd'hui", aide: 'Une protection, une provision, une réponse. Même une petite chose.' },
};
const nomVeille = { 'veille-aube': "l'Aube", 'veille-midi': 'Midi', 'veille-soir': 'le Soir' };
export function MesNotes({ id }) {
  const notes = useSignal(notesVeilles), q = QUESTION[id] || QUESTION['veille-aube'];
  const texte = noteDuJour(id, notes), anciennes = dernieresNotes(notes);
  const ajd = new Date(), cleAjd = `${ajd.getFullYear()}-${String(ajd.getMonth() + 1).padStart(2, '0')}-${String(ajd.getDate()).padStart(2, '0')}`;
  const aujourdhui = (d) => d === cleAjd;
  return (
    <section class="carte bloc mes-notes">
      <h3><span class="ligne__icone"><Icone nom="note" /></span> {q.titre}</h3>
      <p class="ligne__desc">{q.aide}</p>
      <textarea class="champ champ--zone" rows={4} value={texte} maxLength={2000} placeholder="Écris ici…" aria-label={q.titre}
        onInput={(e) => ecrireNote(id, e.currentTarget.value)} />
      {texte && <p class="ligne__desc" style="margin:4px 0 0">Enregistré sur ce téléphone seulement.</p>}
      {anciennes.length > 0 && <>
        <h4 class="mes-notes__titre">Mes dernières notes</h4>
        <ul class="mes-notes__liste">
          {anciennes.map((x) => (
            <li>
              <span class="mes-notes__date">{aujourdhui(x.date) ? "Aujourd'hui" : new Date(x.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {nomVeille[x.veille] || ''}</span>
              <p>{x.texte}</p>
              <button class="lien" onClick={() => { if (confirm('Supprimer cette note ?')) supprimerNote(x.date + '|' + x.veille); }}>Supprimer</button>
            </li>))}
        </ul>
      </>}
    </section>
  );
}

// Court, normal ou complet : on choisit selon le temps dont on dispose.
function ChoixTaille({ valeur, surChoix, v0, v }) {
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

// Moment de prière guidé (veille de l'Aube, de Midi ou du Soir), phase par phase selon le Notre Père,
// avec le thème du jour (la famille, le travail, l'Église…) inséré après l'Adoration.
export function Veille({ id, guide }) {
  const v0 = VEILLES.find((x) => x.id === 'veille-' + id) || VEILLES[0];
  const [taille, setTaille] = useState(lireTaille);
  const choisir = (x) => { setTaille(x); try { localStorage.setItem('yeshaya:veille-taille', x); } catch { /* stockage indisponible */ } };
  const v = veilleDuJour(v0, CYCLE_VEILLES, new Date(), taille);
  const aiPriees = useSignal(aiPrie), semaine = semaineEnCours(aiPriees);
  const etapes = [...v.phases, { num: 'proc', titre: 'Proclamations', texte: 'Termine en déclarant à voix haute ces paroles de foi.', sujets: v.proclamations }];
  // La progression se range par veille, par taille et par jour : un nouveau jour repart du début.
  const cleJour = `${v.id}-${taille}-${new Date().toISOString().slice(0, 10)}`;
  const [n, setN] = useMemoire('etape-' + cleJour, -1);
  const vaE = useVoixActive(`${cleJour}-${n}`);

  if (n < 0) return (
    <div class={'page veille veille--' + id}>
      <div class="theme-hero"><img src={v.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{v.heures}</span><h2>{v.titre}</h2></div></div>
      <p class="veille__theme"><span class="veille__humeur"><Icone nom={HUMEURS[v.id]?.icone || 'soleil'} taille={15} /> {HUMEURS[v.id]?.mot}</span>{v.theme}</p>
      <AfficheDuJour v={v} semaine={semaine} />
      <SerieDeVeilles aiPrie={aiPriees} id={v.id} />
      <ChoixTaille valeur={taille} surChoix={choisir} v={v} />
      <PriereGuidee auto={guide} id={cleJour} titre={v.titre} introduction={v.introduction} etapes={etapes.map((e) => ({ titre: e.titre, texte: e.num === 'proc' ? e.texte : (e.num === 'jour' ? e.texte : null), sujets: e.sujets }))} idPriere={v.id} />
      {v.verset && <CarteVerset reference={v.verset} />}
      <MesNotes id={v.id} />
      <section class="carte bloc"><h3><span class="ligne__icone"><Icone nom="info" /></span> Avant de commencer</h3><p><TexteRefs texte={v.introduction} /></p></section>
      <h2 class="titre-section">Le déroulement</h2>
      <ol class="carte deroulement">
        {etapes.map((e, i) => <li><button onClick={() => setN(i)}><span class="deroulement__num">{e.num === 'proc' ? '✦' : e.num === 'jour' ? '★' : e.num}</span><span>{e.titre}<small class="deroulement__nb">{e.sujets.length} sujet{e.sujets.length > 1 ? 's' : ''}</small></span><Icone nom="chevron" taille={18} /></button></li>)}
      </ol>
      <button class="bouton bouton--contour" style="width:100%;margin-top:14px" onClick={() => setN(0)}><Icone nom="priere" taille={20} /> Prier en lisant, étape par étape</button>
      <p class="source-mention">Source : {v.auteur}</p>
    </div>
  );

  const e = etapes[n], derniere = n === etapes.length - 1;
  return (
    <div class={'page veille veille--' + id}>
      <div class="progression progression--fine" style="margin-top:12px"><span style={{ width: ((n + 1) / etapes.length) * 100 + '%' }} /></div>
      <p class="quiz__compteur">{v.titre} · étape {n + 1} sur {etapes.length}</p>
      <BarreEcoute key={'v' + n} id={`${cleJour}-${n}`} titre="Écouter cette étape"
        blocs={[{ texte: `${e.titre}. ${e.sous_titre || ''}. ${e.texte || ''}` }, ...blocsSujets(e.sujets)]} />
      <div {...vaE(0)}>
        <h2 class="phase__titre">{e.num !== 'proc' && <span class="phase__num">{e.num === 'jour' ? '★' : e.num}</span>}{e.titre}</h2>
        {e.sous_titre && <p class="phase__sous-titre"><TexteRefs texte={e.sous_titre} /></p>}
        {e.texte && <p class="phase__texte"><TexteRefs texte={e.texte} /></p>}
      </div>
      <GuidePhase num={e.num} />
      <SujetsACocher key={n} sujets={e.sujets} voixId={`${cleJour}-${n}`} debut={1} />
      <div class="chemin-etape__nav">
        <button class="bouton bouton--contour" onClick={() => { setN(n - 1); scrollTo(0, 0); }}><Icone nom="precedent" taille={18} /> {n === 0 ? 'Sommaire' : 'Précédent'}</button>
        {derniere ? <button class="bouton bouton--or" onClick={() => { noterPriere(v.id); const s = serieEnCours(aiPrie.valeur); notifier(s.serie > 1 ? `Amen ! ${s.serie} jours de suite : continue.` : 'Amen ! Que Dieu exauce ta prière.'); setN(-1); scrollTo(0, 0); }}>J'ai prié <Icone nom="verifie" taille={20} /></button>
          : <button class="bouton bouton--plein" onClick={() => { setN(n + 1); scrollTo(0, 0); }}>Suivant <Icone nom="chevron" taille={18} /></button>}
      </div>
    </div>
  );
}

export const blocsSujets = (sujets, numerote) => sujets.map((s, i) => ({ texte: `${numerote ? (i + 1) + '. ' : ''}${s.titre ? s.titre + '. ' : ''}${s.texte}` }));
