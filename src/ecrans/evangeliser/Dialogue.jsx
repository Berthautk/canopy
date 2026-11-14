import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BoutonLecture } from '../../composants/Audio.jsx';
import { DIALOGUES, AUDIOS } from '../../donnees/contenu.js';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';

// Écran 9 : dialogue (audio + texte en bulles).
export function Dialogue({ id }) {
  const d = DIALOGUES.find((x) => x.id === id);
  if (!d) return <div class="page"><p class="ligne__desc">Dialogue introuvable.</p></div>;
  const role = Object.fromEntries(d.personnes.map((p) => [p.nom, p.role]));
  const piste = AUDIOS[d.id];
  const va = useVoixActive(d.id);
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src={d.image} alt="" />
        <div><h2>{d.titre}</h2><p>{d.situation}</p></div>
      </div>
      {d.exemple && <p style="margin:0 4px 8px"><span class="etiquette-exemple">EXEMPLE</span> Dialogue de démonstration.</p>}
      {piste && (
        <section class="carte bloc__audio dialogue__audio">
          <BoutonLecture piste={piste} taille={48} />
          <a class="ligne__corps" href={'#/ecouter/' + piste.id}><span class="ligne__titre" style="display:block">Écouter le dialogue</span>
            <span class="ligne__desc">{piste.auteur}{piste.duree ? ' · ' + piste.duree : ''}</span></a>
        </section>
      )}
      {!piste && <BarreEcoute id={d.id} titre="Écouter le dialogue" blocs={[{ texte: d.situation }, ...d.repliques.map((r) => ({ texte: `${r.personne} : ${r.texte}` }))]} />}
      <div class="bulles">
        {d.repliques.map((r, k) => {
          const chretien = role[r.personne] === 'chretien';
          return (
            <div class={'bulle ' + (chretien ? 'bulle--chretien' : 'bulle--ami')} {...va(k + 1)}>
              <span class="bulle__avatar" aria-hidden="true">{r.personne[0]}</span>
              <div class="bulle__corps">
                <span class="bulle__nom">{r.personne}{chretien ? ' (chrétien)' : ''}</span>
                <p>{r.texte}</p>
              </div>
            </div>
          );
        })}
      </div>
      {d.verset_a_partager && <><h2 class="titre-section">Le verset à partager</h2><CarteVerset reference={d.verset_a_partager} /></>}
      <h2 class="titre-section">Autres situations</h2>
      <div class="liste">
        {DIALOGUES.filter((x) => x.id !== d.id).map((x) => (
          <a class="carte ligne" href={'#/evangeliser/dialogue/' + x.id}><span class="ligne__icone"><Icone nom="groupe" /></span>
            <span class="ligne__corps"><span class="ligne__titre">{x.titre}</span></span><Icone nom="chevron" taille={20} /></a>
        ))}
      </div>
    </div>
  );
}
