import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BoutonLecture, BoutonTelecharger } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { PRIERES, AUDIOS } from '../../donnees/contenu.js';
import { urlAudio } from '../../donnees/config.js';
import { aiPrie, noterPriere, journal } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { partager } from '../../outils/partage.js';

// Écran 3 : thèmes de prière, regroupés par catégorie.
export function Priere() {
  const j = useSignal(journal);
  const categories = [...new Set(PRIERES.map((p) => p.categorie))];
  const enPriere = j.filter((r) => !r.exaucee).length, exaucees = j.length - enPriere;
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/priere/femme-en-priere.webp" alt="" />
        <div><h2>Prière</h2><p>Approche-toi de Dieu, parle-lui et intercède pour les autres.</p></div>
      </div>

      <a class="carte ligne journal-lien" href="#/priere/journal">
        <span class="ligne__icone"><Icone nom="note" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon journal de prière</span>
          <span class="ligne__desc">{j.length ? `${enPriere} en prière · ${exaucees} exaucée${exaucees > 1 ? 's' : ''}` : 'Écris tes requêtes et note les réponses de Dieu.'}</span></span>
        <Icone nom="chevron" taille={20} />
      </a>

      {categories.map((c) => (
        <section>
          <h2 class="titre-section">{c}</h2>
          <div class="liste">
            {PRIERES.filter((p) => p.categorie === c).map((p) => (
              <a class="carte theme" href={'#/priere/theme/' + p.id}>
                <img src={p.image} alt="" loading="lazy" />
                <span class="ligne__corps">
                  <span class="ligne__titre" style="display:block">{p.titre} {p.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</span>
                  <span class="ligne__desc">{p.resume}</span>
                </span>
                <Icone nom="chevron" taille={20} />
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Écran 4 : page d'un thème de prière.
export function ThemePriere({ id }) {
  const p = PRIERES.find((x) => x.id === id);
  const fois = useSignal(aiPrie)[id] || [];
  const [coches, setCoches] = useState({});
  if (!p) return <div class="page"><p class="ligne__desc">Thème introuvable.</p></div>;
  const piste = AUDIOS[p.id];
  const pisteSujet = (s, i) => s.audio && { id: `${p.id}-sujet-${i + 1}`, titre: s.texte, auteur: p.auteur, autorisation: p.autorisation === 'oui', url: urlAudio(s.audio), image: p.image, type: 'Sujet de prière', exemple: p.exemple };

  return (
    <div class="page">
      <div class="theme-hero">
        <img src={p.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{p.categorie}</span><h2>{p.titre}</h2></div>
      </div>
      {p.exemple && <p style="margin:8px 4px 0"><span class="etiquette-exemple">EXEMPLE</span> Contenu de démonstration.</p>}

      <section class="carte bloc">
        <h3><span class="ligne__icone"><Icone nom="ampoule" /></span> Enseignement</h3>
        <p>{p.enseignement}</p>
        {piste && (
          <div class="bloc__audio">
            <BoutonLecture piste={piste} taille={44} />
            <a class="ligne__corps" href={'#/ecouter/' + piste.id}><span class="ligne__titre" style="display:block">Écouter l'enseignement</span>
              <span class="ligne__desc">{piste.auteur}{piste.duree ? ' · ' + piste.duree : ''}</span></a>
            <BoutonTelecharger piste={piste} compact />
          </div>
        )}
      </section>

      <h2 class="titre-section">Versets clés</h2>
      <div class="liste">{p.versets.map((r) => <CarteVerset reference={r} />)}</div>

      <h2 class="titre-section">Sujets de prière</h2>
      <ul class="carte sujets-priere">
        {p.sujets.map((s, i) => (
          <li>
            <label class="case">
              <input type="checkbox" checked={!!coches[i]} onChange={(e) => setCoches({ ...coches, [i]: e.currentTarget.checked })} />
              <span class={coches[i] ? 'barre' : ''}>{s.texte}</span>
            </label>
            {pisteSujet(s, i) && <BoutonLecture piste={pisteSujet(s, i)} taille={36} />}
          </li>
        ))}
      </ul>

      <section class="carte bloc priere-modele">
        <h3><span class="ligne__icone"><Icone nom="priere" /></span> Prière</h3>
        <p><em>{p.priere}</em></p>
      </section>

      <button class="bouton bouton--or j-ai-prie" onClick={() => { noterPriere(p.id); notifier('Merci ! Dieu entend ta prière.'); }}>
        <Icone nom="verifie" taille={20} /> J'ai prié</button>
      <p class="ligne__desc" style="text-align:center;margin-top:6px">
        {fois.length ? `Tu as prié pour ce sujet ${fois.length} fois. La dernière fois : ${new Date(fois[fois.length - 1]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` : 'Prends le temps de prier, à ton rythme.'}
      </p>
      <div class="verset__actions" style="justify-content:center;margin-top:10px">
        <a class="bouton bouton--contour bouton--petit" href="#/priere/journal?nouveau=1"><Icone nom="note" taille={18} /> Ajouter à mon journal</a>
        <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: p.titre, texte: `Prions ensemble : ${p.titre}\n\n${p.sujets.map((s) => '• ' + s.texte).join('\n')}`, chemin: 'priere/theme/' + p.id })}>
          <Icone nom="partager" taille={18} /> Partager</button>
      </div>
    </div>
  );
}
