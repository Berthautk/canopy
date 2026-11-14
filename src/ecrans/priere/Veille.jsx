import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { VEILLES, GUIDE_PHASES } from '../../donnees/contenu.js';
import { noterPriere, aiPrie } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { PriereGuidee } from '../../composants/PriereGuidee.jsx';

// Liste de sujets à cocher (« appuie sur chaque point après l'avoir prié »).
export function SujetsACocher({ sujets, cle, numerote, voixId, debut = 0 }) {
  const [faits, setFaits] = useState({});
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

// Moment de prière guidé (veille de l'Aube, de Midi ou du Soir), phase par phase selon le Notre Père.
export function Veille({ id, guide }) {
  const v = VEILLES.find((x) => x.id === 'veille-' + id) || VEILLES[0];
  const etapes = [...v.phases, { num: 'proc', titre: 'Proclamations', texte: 'Termine en déclarant à voix haute ces paroles de foi.', sujets: v.proclamations }];
  const [n, setN] = useState(-1);
  const fois = useSignal(aiPrie)[v.id] || [];

  if (n < 0) return (
    <div class="page">
      <div class="theme-hero"><img src={v.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{v.heures}</span><h2>{v.titre}</h2></div></div>
      <p class="veille__theme">{v.theme}</p>
      <PriereGuidee auto={guide} id={v.id} titre={v.titre} introduction={v.introduction} etapes={etapes.map((e) => ({ titre: e.titre, texte: e.num === 'proc' ? e.texte : null, sujets: e.sujets }))} />
      {v.verset && <CarteVerset reference={v.verset} />}
      <section class="carte bloc"><h3><span class="ligne__icone"><Icone nom="info" /></span> Avant de commencer</h3><p><TexteRefs texte={v.introduction} /></p></section>
      <h2 class="titre-section">Le déroulement</h2>
      <ol class="carte deroulement">
        {etapes.map((e, i) => <li><button onClick={() => setN(i)}><span class="deroulement__num">{e.num === 'proc' ? '✦' : e.num}</span><span>{e.titre}</span><Icone nom="chevron" taille={18} /></button></li>)}
      </ol>
      <button class="bouton bouton--contour" style="width:100%;margin-top:14px" onClick={() => setN(0)}><Icone nom="priere" taille={20} /> Prier en lisant, étape par étape</button>
      {fois.length > 0 && <p class="ligne__desc" style="text-align:center;margin-top:8px">Tu as prié cette veille {fois.length} fois.</p>}
      <p class="source-mention">Source : {v.auteur}</p>
    </div>
  );

  const e = etapes[n], derniere = n === etapes.length - 1;
  return (
    <div class="page">
      <div class="progression progression--fine" style="margin-top:12px"><span style={{ width: ((n + 1) / etapes.length) * 100 + '%' }} /></div>
      <p class="quiz__compteur">{v.titre} · étape {n + 1} sur {etapes.length}</p>
      <h2 class="phase__titre">{e.num !== 'proc' && <span class="phase__num">{e.num}</span>}{e.titre}</h2>
      {e.sous_titre && <p class="phase__sous-titre"><TexteRefs texte={e.sous_titre} /></p>}
      {e.texte && <p class="phase__texte"><TexteRefs texte={e.texte} /></p>}
      <GuidePhase num={e.num} />
      <BarreEcoute key={'v' + n} id={`${v.id}-${n}`} titre="Écouter cette étape"
        blocs={[{ texte: `${e.titre}. ${e.sous_titre || ''}. ${e.texte || ''}` }, ...blocsSujets(e.sujets)]} />
      <SujetsACocher key={n} sujets={e.sujets} voixId={`${v.id}-${n}`} debut={1} />
      <div class="chemin-etape__nav">
        <button class="bouton bouton--contour" onClick={() => { setN(n - 1); scrollTo(0, 0); }}><Icone nom="precedent" taille={18} /> {n === 0 ? 'Sommaire' : 'Précédent'}</button>
        {derniere ? <button class="bouton bouton--or" onClick={() => { noterPriere(v.id); notifier('Amen ! Que Dieu exauce ta prière.'); setN(-1); scrollTo(0, 0); }}>J'ai prié <Icone nom="verifie" taille={18} /></button>
          : <button class="bouton bouton--plein" onClick={() => { setN(n + 1); scrollTo(0, 0); }}>Suivant <Icone nom="chevron" taille={18} /></button>}
      </div>
    </div>
  );
}

export const blocsSujets = (sujets, numerote) => sujets.map((s, i) => ({ texte: `${numerote ? (i + 1) + '. ' : ''}${s.titre ? s.titre + '. ' : ''}${s.texte}` }));
