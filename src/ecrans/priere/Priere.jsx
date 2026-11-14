import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { BoutonLecture, BoutonTelecharger } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { SujetsACocher, GuidePhase, blocsSujets } from './Veille.jsx';
import { PriereGuidee } from '../../composants/PriereGuidee.jsx';
import { BarreEcoute } from '../../composants/Ecouter.jsx';
import { PRIERES, COMBAT, VEILLES, AUDIOS, veilleDuMoment } from '../../donnees/contenu.js';
import { aiPrie, noterPriere, journal } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { partager } from '../../outils/partage.js';

// Écran 3 : prier maintenant, thèmes par catégorie, combat spirituel.
export function Priere() {
  const j = useSignal(journal);
  const [ouvert, setOuvert] = useState(null);       // catégorie dépliée
  const v = veilleDuMoment();
  const categories = [...new Set(PRIERES.map((p) => p.categorie))];
  const enPriere = j.filter((r) => !r.exaucee).length, exaucees = j.length - enPriere;
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/priere/femme-en-priere.webp" alt="" />
        <div><h2>Prière</h2><p>Approche-toi de Dieu, parle-lui et intercède pour les autres.</p></div>
      </div>

      {v && (
        <a class="carte prier-maintenant" href={'#/priere/veille/' + v.id.replace('veille-', '')}>
          <img src={v.image} alt="" />
          <span class="prier-maintenant__voile" />
          <span class="prier-maintenant__texte">
            <span class="pastille pastille--or">Prier maintenant · {v.heures}</span>
            <span class="prier-maintenant__titre">{v.titre}</span>
            <span class="prier-maintenant__theme">{v.theme}</span>
          </span>
        </a>
      )}
      <div class="veilles">
        {VEILLES.map((x) => (
          <a class={'carte veille-puce' + (x.id === v?.id ? ' veille-puce--active' : '')} href={'#/priere/veille/' + x.id.replace('veille-', '')}>
            <Icone nom={x.id.endsWith('soir') ? 'lune' : 'soleil'} taille={20} /><span>{x.titre.replace('Veille ', '').replace(/^de l'|^du |^de /, '')}</span><small>{x.heures}</small>
          </a>
        ))}
      </div>

      <a class="carte ligne journal-lien" href="#/priere/journal" style="margin-top:12px">
        <span class="ligne__icone"><Icone nom="note" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon journal de prière</span>
          <span class="ligne__desc">{j.length ? `${enPriere} en prière · ${exaucees} exaucée${exaucees > 1 ? 's' : ''}` : 'Écris tes requêtes et note les réponses de Dieu.'}</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <a class="carte ligne journal-lien" href="#/priere/demander" style="margin-top:8px">
        <span class="ligne__icone"><Icone nom="priere" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Demander la prière</span>
          <span class="ligne__desc">Confie ton sujet à l'équipe de Yeshaya, nous prierons pour toi.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>

      <h2 class="titre-section">Prier pour…</h2>
      {categories.map((c) => {
        const liste = PRIERES.filter((p) => p.categorie === c), deplie = ouvert === c || liste.length <= 2;
        return (
          <section class="categorie-priere">
            <button class="categorie-priere__tete" aria-expanded={deplie} onClick={() => setOuvert(ouvert === c ? null : c)}>
              <span>{c}</span><span class="onglets-internes__nb">{liste.length}</span><Icone nom="chevron" taille={18} class={deplie ? 'tourne' : ''} />
            </button>
            {deplie && <div class="liste">{liste.map((p) => <CarteTheme p={p} lien={'#/priere/theme/' + p.id} />)}</div>}
          </section>
        );
      })}

      <h2 class="titre-section">Combat spirituel</h2>
      <p class="ligne__desc" style="margin:-4px 4px 8px">Des fiches de prière à prier avec persévérance.</p>
      <div class="grille-combat">
        {COMBAT.map((c) => (
          <a class="carte combat-tuile" href={'#/priere/combat/' + c.id}><span class="combat-tuile__emoji" aria-hidden="true">{c.emoji}</span><span>{c.titre}</span></a>
        ))}
      </div>
    </div>
  );
}

function CarteTheme({ p, lien }) {
  return (
    <a class="carte theme" href={lien}>
      <img src={p.image} alt="" loading="lazy" />
      <span class="ligne__corps">
        <span class="ligne__titre" style="display:block">{p.nom_court || p.titre} {p.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</span>
        <span class="ligne__desc">{p.nom_court ? p.titre : p.resume}</span>
      </span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
}

function PiedPriere({ id, titre, texte, chemin }) {
  const fois = useSignal(aiPrie)[id] || [];
  return (
    <>
      <button class="bouton bouton--or j-ai-prie" onClick={() => { noterPriere(id); notifier('Merci ! Dieu entend ta prière.'); }}>
        <Icone nom="verifie" taille={20} /> J'ai prié</button>
      <p class="ligne__desc" style="text-align:center;margin-top:6px">
        {fois.length ? `Tu as prié pour ce sujet ${fois.length} fois. La dernière fois : ${new Date(fois[fois.length - 1]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` : 'Prends le temps de prier, à ton rythme.'}
      </p>
      <div class="verset__actions" style="justify-content:center;margin-top:10px">
        <a class="bouton bouton--contour bouton--petit" href="#/priere/journal?nouveau=1"><Icone nom="note" taille={18} /> Ajouter à mon journal</a>
        <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre, texte, chemin })}><Icone nom="partager" taille={18} /> Partager</button>
      </div>
    </>
  );
}

// Écran 4 : page d'un thème de prière, organisée selon les phases du Notre Père.
export function ThemePriere({ id, guide }) {
  const p = PRIERES.find((x) => x.id === id);
  if (!p) return <div class="page"><p class="ligne__desc">Thème introuvable.</p></div>;
  const piste = AUDIOS[p.id];
  const tous = p.phases ? p.phases.flatMap((ph) => ph.sujets) : p.sujets || [];
  return (
    <div class="page">
      <div class="theme-hero">
        <img src={p.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{p.categorie}</span><h2>{p.titre}</h2></div>
      </div>
      {p.exemple && <p style="margin:8px 4px 0"><span class="etiquette-exemple">EXEMPLE</span> Contenu de démonstration.</p>}
      <PriereGuidee auto={guide} id={p.id} titre={p.titre} introduction={p.enseignement} etapes={p.phases ? p.phases.map((ph) => ({ titre: ph.titre, sujets: ph.sujets })) : [{ titre: p.titre, sujets: p.sujets }]} />
      {(p.enseignement || piste) && (
        <section class="carte bloc">
          <h3><span class="ligne__icone"><Icone nom="ampoule" /></span> Enseignement</h3>
          {p.enseignement && <p><TexteRefs texte={p.enseignement} /></p>}
          {piste && (
            <div class="bloc__audio">
              <BoutonLecture piste={piste} taille={44} />
              <a class="ligne__corps" href={'#/ecouter/' + piste.id}><span class="ligne__titre" style="display:block">Écouter l'enseignement</span>
                <span class="ligne__desc">{piste.auteur}{piste.duree ? ' · ' + piste.duree : ''}</span></a>
              <BoutonTelecharger piste={piste} compact />
            </div>
          )}
        </section>
      )}
      {p.versets?.length > 0 && <><h2 class="titre-section">Versets clés</h2><div class="liste">{p.versets.map((r) => <CarteVerset reference={r} />)}</div></>}

      {p.phases ? (() => { let k = 0; const debuts = p.phases.map((ph) => { const d = k + 1; k += ph.sujets.length + 1; return d; }); return (
        <>
          <BarreEcoute id={p.id} titre="Écouter les sujets de prière"
            blocs={p.phases.flatMap((ph) => [{ texte: `${ph.titre}.` }, ...blocsSujets(ph.sujets)])} />
          <p class="guide-phase" style="margin-top:14px"><Icone nom="info" taille={18} /><span>Prie chaque sujet, puis appuie sur le rond pour le cocher. Les sujets suivent le <b>Notre Père</b> (Matthieu 6:9-13).</span></p>
          {p.phases.map((ph, j) => (
            <section class="phase">
              <h2 class="phase__titre"><span class="phase__num">{ph.num}</span>{ph.titre}</h2>
              <GuidePhase num={ph.num} />
              <SujetsACocher sujets={ph.sujets} voixId={p.id} debut={debuts[j]} />
            </section>
          ))}
        </>); })() : (
        <><h2 class="titre-section">Sujets de prière</h2>
          <BarreEcoute id={p.id} titre="Écouter les sujets de prière" blocs={blocsSujets(p.sujets)} />
          <SujetsACocher sujets={p.sujets} voixId={p.id} debut={0} /></>
      )}
      {p.priere && <section class="carte bloc priere-modele"><h3><span class="ligne__icone"><Icone nom="priere" /></span> Prière</h3><p><em>{p.priere}</em></p></section>}
      <PiedPriere id={p.id} titre={p.titre} chemin={'priere/theme/' + p.id}
        texte={`Prions ensemble : ${p.titre}\n\n${tous.slice(0, 8).map((s) => '• ' + (s.titre || s.texte)).join('\n')}`} />
      {p.source && <p class="source-mention">Source : {p.auteur}</p>}
    </div>
  );
}

// Fiche de combat spirituel.
export function FicheCombat({ id, guide }) {
  const c = COMBAT.find((x) => x.id === id);
  if (!c) return <div class="page"><p class="ligne__desc">Fiche introuvable.</p></div>;
  return (
    <div class="page">
      <div class="bandeau-titre"><span class="combat-emoji" aria-hidden="true">{c.emoji}</span><div><h2>{c.titre}</h2><p>Combat spirituel · {c.sujets.length} sujets</p></div></div>
      <PriereGuidee auto={guide} id={c.id} titre={c.titre} introduction={c.introduction} etapes={[{ titre: c.titre, sujets: c.sujets }]} />
      {c.introduction && <section class="carte bloc"><p><TexteRefs texte={c.introduction} /></p></section>}
      {c.versets.length > 0 && <><h2 class="titre-section">Versets de base</h2><div class="liste">{c.versets.map((r) => <CarteVerset reference={r} />)}</div></>}
      <h2 class="titre-section">À prier</h2>
      <p class="guide-phase"><Icone nom="info" taille={18} /><span>Prie chaque point avec foi, à voix haute si possible. Remplace « [...] » par les noms des personnes concernées.</span></p>
      <BarreEcoute id={c.id} titre="Écouter la fiche" blocs={[{ texte: c.titre + '. ' + (c.introduction || '') }, ...blocsSujets(c.sujets, true)]} />
      <SujetsACocher sujets={c.sujets} numerote voixId={c.id} debut={1} />
      <PiedPriere id={c.id} titre={c.titre} chemin={'priere/combat/' + c.id} texte={`${c.titre}\n\n${c.sujets.slice(0, 6).map((s, i) => `${i + 1}. ${s.texte}`).join('\n')}`} />
      <p class="source-mention">Source : {c.auteur}</p>
    </div>
  );
}
