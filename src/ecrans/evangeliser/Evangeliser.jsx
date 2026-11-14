import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BoutonLecture } from '../../composants/Audio.jsx';
import { EVANGELISATION, DIALOGUES, AUDIOS, OUTILS, APPROCHES, CONVERSATIONS } from '../../donnees/contenu.js';
import { partager } from '../../outils/partage.js';
import { BarreEcoute } from '../../composants/Ecouter.jsx';

const SECTIONS = [
  ['presenter', 'Présenter', 'croix', "Des outils pour annoncer l'Évangile jusqu'à la prière pour recevoir Jésus."],
  ['approches', 'Approches', 'cible', 'Comment parler de Jésus selon la personne : musulman, athée, religieux, traditionnel…'],
  ['motivation', 'Motivation', 'coeur', 'Pourquoi et dans quel esprit partager sa foi.'],
  ['formation', 'Formation', 'ampoule', 'Des outils simples pour témoigner.'],
  ['dialogues', 'Dialogues', 'groupe', 'Exemples de conversations réelles et bienveillantes.'],
  ['objection', 'Objections', 'info', 'Répondre avec douceur et respect aux questions difficiles.'],
];

// Écran 8 : Évangéliser.
export function Evangeliser() {
  const [vue, setVue] = useState('presenter');
  const liste = vue === 'dialogues' ? DIALOGUES : vue === 'presenter' ? [...CONVERSATIONS, ...OUTILS] : vue === 'approches' ? APPROCHES : EVANGELISATION.filter((x) => x.type === vue);
  const lien = (x) => '#/evangeliser/' + (x.noeuds ? 'conversation' : { dialogues: 'dialogue', presenter: 'outil', approches: 'approche' }[vue] || 'article') + '/' + x.id;
  const s = SECTIONS.find((x) => x[0] === vue);
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/evangelisation/partage-bible-dans-la-rue.webp" alt="" />
        <div><h2>Partager l'espérance</h2><p>Évangéliser, c'est aimer et partager la bonne nouvelle autour de soi.</p></div>
      </div>
      <nav class="grille-evang" aria-label="Rubriques">
        {SECTIONS.map(([id, libelle, icone]) => (
          <button class="carte tuile-evang" aria-pressed={vue === id} onClick={() => setVue(id)}><Icone nom={icone} taille={26} /><span>{libelle}</span></button>
        ))}
      </nav>
      <p class="ligne__desc" style="margin:14px 4px 8px">{s[3]}</p>
      <div class="liste">
        {liste.map((x) => (
          <a class="carte theme" href={lien(x)}>
            <img src={x.image} alt="" loading="lazy" />
            <span class="ligne__corps">
              <span class="ligne__titre" style="display:block">{x.titre} {x.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</span>
              <span class="ligne__desc">{x.resume || x.question || x.situation || (x.texte && x.texte[0])}</span>
            </span>
            <Icone nom="chevron" taille={20} />
          </a>
        ))}
      </div>
      {(vue === 'presenter' || vue === 'formation') && <a class="carte theme" href="#/evangeliser/temoignage" style="margin-top:10px">
        <img src="/assets/temoignage/temoignage-au-micro.webp" alt="" loading="lazy" />
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon témoignage en 3 minutes</span>
          <span class="ligne__desc">Écris ton histoire avec Jésus en trois parties (avant, la rencontre, depuis), écoute-la et partage-la.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>}
      <a class="carte ligne" href="#/grandir/decouvrir-jesus" style="margin-top:14px">
        <span class="ligne__icone"><Icone nom="coeur" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Découvrir Jésus (10 leçons)</span>
          <span class="ligne__desc">À partager à un ami qui veut connaître Jésus.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <a class="carte ligne" href="#/bible/chemin" style="margin-top:8px">
        <span class="ligne__icone"><Icone nom="croix" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Le chemin du salut</span>
          <span class="ligne__desc">8 versets à montrer, un par un.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
    </div>
  );
}

// Article de motivation, de formation ou réponse à une objection.
export function Article({ id }) {
  const a = EVANGELISATION.find((x) => x.id === id);
  if (!a) return <div class="page"><p class="ligne__desc">Contenu introuvable.</p></div>;
  const piste = AUDIOS[a.id];
  return (
    <div class="page">
      <div class="theme-hero">
        <img src={a.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{SECTIONS.find((s) => s[0] === a.type)?.[1]}</span><h2>{a.titre}</h2></div>
      </div>
      {a.exemple && <p style="margin:8px 4px 0"><span class="etiquette-exemple">EXEMPLE</span> Contenu de démonstration.</p>}
      {!AUDIOS[a.id] && <BarreEcoute id={a.id} titre="Écouter" blocs={[{ texte: a.titre + (a.question ? '. La question : ' + a.question : '') }, ...a.texte.map((t) => ({ texte: t })), ...a.versets.map((r) => ({ reference: r }))]} />}
      {a.question && <section class="carte bloc question"><Icone nom="info" taille={20} /><p><b>La question :</b> {a.question}</p></section>}
      <section class="carte bloc article">
        {a.texte.map((t) => <p>{t}</p>)}
        {piste && <div class="bloc__audio"><BoutonLecture piste={piste} taille={44} /><a class="ligne__corps" href={'#/ecouter/' + piste.id}><span class="ligne__titre">Écouter</span></a></div>}
      </section>
      <h2 class="titre-section">Versets</h2>
      <div class="liste">{a.versets.map((r) => <CarteVerset reference={r} />)}</div>
      <button class="bouton bouton--contour" style="width:100%;margin-top:12px" onClick={() => partager({ titre: a.titre, texte: `${a.titre}\n\n${a.texte.join('\n')}`, chemin: 'evangeliser/article/' + a.id })}>
        <Icone nom="partager" taille={18} /> Partager</button>
    </div>
  );
}
