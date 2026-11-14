import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { APPROCHES } from '../../donnees/contenu.js';
import { useState } from 'preact/hooks';
import { Presentation } from '../../composants/Presentation.jsx';
import { arreterVoix } from '../../audio/voix.js';

// Approche d'évangélisation pour un public donné : comprendre, comment s'y prendre, objections, dialogue écoutable.
export function Approche({ id }) {
  const a = APPROCHES.find((x) => x.id === id);
  const va = useVoixActive(a?.id);
  const [pres, setPres] = useState(false);
  if (!a) return <div class="page"><p class="ligne__desc">Contenu introuvable.</p></div>;

  const blocs = [];
  const ajoute = (b) => (blocs.push(b), blocs.length - 1);
  const parties = a.parties.map((p) => ({ ...p, iTitre: ajoute({ texte: p.titre + '.' }), iTextes: p.texte.map((t) => ajoute({ texte: t })) }));
  const objections = (a.objections || []).map((o) => ({ ...o, iQ: ajoute({ texte: 'Objection : ' + o.question }), iR: ajoute({ texte: o.reponse }) }));
  const d = a.dialogue;
  const iSituation = d ? ajoute({ texte: 'Dialogue. ' + d.situation }) : -1;
  const repliques = d ? d.repliques.map((r) => ({ ...r, i: ajoute({ texte: `${r.personne} : ${r.texte}` }) })) : [];
  const role = d ? Object.fromEntries(d.personnes.map((p) => [p.nom, p.role])) : {};

  return (
    <div class="page">
      <div class="theme-hero">
        <img src={a.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">Approche · {a.public}</span><h2>{a.titre}</h2></div>
      </div>
      <p class="guide-phase" style="margin-top:12px"><Icone nom="info" taille={18} /><span>{a.resume}</span></p>
      <button class="carte priere-guidee__lancer" onClick={() => { arreterVoix(); setPres(true); }}>
        <span class="priere-guidee__icone" aria-hidden="true"><Icone nom="lecture" taille={26} /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Regarder et écouter (présentation)</span>
          <span class="ligne__desc">Chaque partie apparaît avec son image, la voix explique, puis « Suivant ».</span></span>
      </button>
      <BarreEcoute id={a.id} titre="Écouter l'enseignement et le dialogue" blocs={blocs} />
      {pres && <Presentation id={a.id} titre={a.titre} fermer={() => setPres(false)} diapos={[
        ...parties.map((p) => ({ image: p.image || a.image, titre: p.titre, blocs: [blocs[p.iTitre], ...p.iTextes.map((i) => blocs[i])] })),
        ...(objections.length ? [{ image: a.image, titre: 'Questions et objections', blocs: objections.flatMap((o) => [blocs[o.iQ], blocs[o.iR]]) }] : []),
        ...(d ? [{ image: d.image || a.image, titre: 'Dialogue', blocs: [blocs[iSituation], ...repliques.map((r) => blocs[r.i])] }] : []),
      ]} />}

      {parties.map((p) => (
        <section class="carte bloc article">
          <h3 {...va(p.iTitre)}>{p.titre}</h3>
          {p.texte.map((t, k) => <p {...va(p.iTextes[k])}><TexteRefs texte={t} /></p>)}
        </section>
      ))}

      {objections.length > 0 && <>
        <h2 class="titre-section">Questions et objections fréquentes</h2>
        {objections.map((o) => (
          <details class="carte bloc objection">
            <summary {...va(o.iQ)}><b>« {o.question} »</b></summary>
            <p {...va(o.iR)}><TexteRefs texte={o.reponse} /></p>
          </details>
        ))}
      </>}

      {d && <>
        <h2 class="titre-section">Dialogue à écouter</h2>
        <p class="ligne__desc" style="margin:0 4px 8px" {...va(iSituation)}>{d.situation}</p>
        <div class="bulles">
          {repliques.map((r) => {
            const chretien = role[r.personne] === 'chretien';
            return (
              <div class={'bulle ' + (chretien ? 'bulle--chretien' : 'bulle--ami')} {...va(r.i)}>
                <span class="bulle__avatar" aria-hidden="true">{r.personne[0]}</span>
                <div class="bulle__corps"><span class="bulle__nom">{r.personne}{chretien ? ' (chrétien)' : ''}</span><p>{r.texte}</p></div>
              </div>
            );
          })}
        </div>
      </>}

      {a.versets?.length > 0 && <><h2 class="titre-section">Versets utiles</h2><div class="liste">{a.versets.map((r) => <CarteVerset reference={r} />)}</div></>}
      <a class="carte ligne" href="#/evangeliser/outil/outil-coeur-de-l-homme" style="margin-top:14px">
        <span class="ligne__icone"><Icone nom="coeur" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Présenter l'Évangile : « Le cœur de l'homme »</span>
          <span class="ligne__desc">5 images et la prière pour recevoir Jésus.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <p class="source-mention">{a.source || "Contenu rédigé pour Yeshaya, à relire par un responsable d'évangélisation."}</p>
    </div>
  );
}
