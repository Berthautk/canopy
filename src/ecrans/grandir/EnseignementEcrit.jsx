import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { LienVideo } from '../../composants/LienVideo.jsx';
import { ENSEIGNEMENTS } from '../../donnees/contenu.js';
import { partager } from '../../outils/partage.js';
import { SujetsACocher, blocsSujets } from '../priere/Veille.jsx';

// Liste ordonnée de tout ce qui se lit à voix haute ; l'index sert aussi au surlignage.
function plan(e) {
  const blocs = [], pos = {};
  const ajout = (cle, b) => { pos[cle] = blocs.length; blocs.push(b); };
  const par = !e.auteur || e.auteur.startsWith("L'Arsenal") ? '' : e.auteur.startsWith('Pasteur') ? '. Enseignement du ' + e.auteur.replace(/^Pasteur/, 'pasteur') : '. Par ' + e.auteur + (e.traduction ? ', traduit de l\'anglais' : '');
  ajout('titre', { texte: `${e.titre}. ${e.resume || ''}${par}.` });
  if (e.verset_de_base) ajout('base', { reference: e.verset_de_base });
  if (e.objectifs?.length) ajout('objectifs', { texte: 'Objectifs. ' + e.objectifs.join('. ') });
  if (e.introduction) ajout('intro', { texte: e.introduction });
  e.sections.forEach((s, i) => {
    ajout(`s${i}`, { texte: `${s.transition ? s.transition + ' ' : ''}Point ${s.numero}. ${s.titre}.` });
    s.blocs.forEach((b, j) => ajout(`s${i}b${j}`, b.verset ? { reference: b.verset } : { texte: b.texte || b.sous_titre }));
  });
  if (e.sujets?.length) { ajout('sujets', { texte: 'Sujets de prière.' }); blocsSujets(e.sujets).forEach((b) => blocs.push(b)); }
  return { blocs, pos };
}

// Enseignement écrit : objectifs, introduction, sections ; versets lus dans la Bible ; écoute à voix haute.
export function EnseignementEcrit({ id }) {
  const e = ENSEIGNEMENTS.find((x) => x.id === id);
  const va = useVoixActive(id);
  if (!e) return <div class="page"><p class="ligne__desc">Enseignement introuvable.</p></div>;
  const { blocs, pos } = plan(e);
  return (
    <div class="page enseignement-ecrit">
      <div class="theme-hero"><img src={e.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{e.theme} · {e.lecture_minutes} min de lecture</span><h2>{e.titre}</h2></div></div>
      <p class="veille__theme" {...va(pos.titre)}>{e.resume}</p>
      {e.auteur && !e.auteur.startsWith("L'Arsenal") && <p class="auteur-ens">{e.auteur}{e.autorisation === 'oui' && <span class="ecouter__autorisation"><Icone nom="verifie" taille={14} /> Utilisé avec autorisation</span>}
        {e.autorisation === 'domaine_public' && <span class="ligne__desc">Domaine public · traduit de l'anglais</span>}</p>}
      <BarreEcoute id={id} blocs={blocs} titre="Écouter l'enseignement" />
      <LienVideo url={e.video} duree={e.video_duree} auteur={e.auteur} />
      {e.verset_de_base && <div {...va(pos.base)}><CarteVerset reference={e.verset_de_base} /></div>}
      {e.objectifs?.length > 0 && (
        <section class="carte bloc" {...va(pos.objectifs)}><h3><span class="ligne__icone"><Icone nom="cible" /></span> Objectifs</h3>
          <ul class="objectifs">{e.objectifs.map((o) => <li><Icone nom="verifie" taille={16} /><span><TexteRefs texte={o} /></span></li>)}</ul></section>
      )}
      {e.introduction && <section class="carte bloc" {...va(pos.intro)}><h3><span class="ligne__icone"><Icone nom="info" /></span> Introduction</h3><p><TexteRefs texte={e.introduction} /></p></section>}
      {e.sections.map((s, i) => (
        <section class="section-ens">
          <div {...va(pos[`s${i}`])}>
            {s.transition && <p class="section-ens__transition"><TexteRefs texte={s.transition} /></p>}
            <h2 class="phase__titre"><span class="phase__num">{s.numero}</span>{s.titre}</h2>
            {s.references.length > 0 && <p class="section-ens__refs">{s.references.map((r) => <TexteRefs texte={r} />).reduce((a, b) => [a, ' · ', b])}</p>}
          </div>
          {s.blocs.map((b, j) => {
            const attr = va(pos[`s${i}b${j}`]);
            return b.verset ? <div {...attr}><CarteVerset reference={b.verset} /></div>
              : b.sous_titre ? <h3 class="section-ens__sous" {...attr}>{b.sous_titre}</h3>
              : <p class="section-ens__texte" {...attr}><TexteRefs texte={b.texte} /></p>;
          })}
        </section>
      ))}
      {e.sujets?.length > 0 && <><h2 class="titre-section" {...va(pos.sujets)}>Sujets de prière</h2><SujetsACocher sujets={e.sujets} voixId={id} debut={pos.sujets + 1} /></>}
      <LienVideo url={e.video} duree={e.video_duree} auteur={e.auteur} />
      <button class="bouton bouton--contour" style="width:100%;margin-top:16px" onClick={() => partager({ titre: e.titre, texte: `${e.titre}\n${e.resume}${e.video ? '\nVidéo : ' + e.video : ''}`, chemin: 'grandir/enseignement/' + e.id })}>
        <Icone nom="partager" taille={18} /> Partager cet enseignement</button>
      {e.titre_original && <p class="source-mention"><b>Titre original :</b> {e.titre_original}</p>}
      {e.traduction && <p class="source-mention">{e.traduction}</p>}
      {e.source && <p class="source-mention">{e.source.startsWith('Arsenal') ? 'Source : ' + e.auteur : e.source}</p>}
    </div>
  );
}
