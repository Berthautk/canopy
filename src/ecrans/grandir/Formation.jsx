import { Icone } from '../../composants/Icone.jsx';
import { FORMATION, ENSEIGNEMENTS } from '../../donnees/contenu.js';
import { stats } from '../../jeux/stats.js';

// « Former le disciple » : 38 leçons en 3 volumes ; chaque leçon rédigée ouvre un enseignement complet.
export function Formation() {
  const ecrites = FORMATION.volumes.flatMap((v) => v.lecons).filter((l) => l.enseignement && ENSEIGNEMENTS.some((e) => e.id === l.enseignement)).length;
  let n = 0;
  return (
    <div class="page">
      <div class="chemin-hero"><h2>{FORMATION.titre}</h2><p>{FORMATION.resume}</p></div>
      <p class="ligne__desc" style="margin:0 4px 8px">{ecrites} leçon{ecrites > 1 ? 's' : ''} disponible{ecrites > 1 ? 's' : ''} sur {FORMATION.volumes.flatMap((v) => v.lecons).length}{ecrites < FORMATION.volumes.flatMap((v) => v.lecons).length ? " · les suivantes arrivent au fil des mises à jour." : "."}</p>
      {FORMATION.volumes.map((v) => (
        <section class="carte bloc">
          <h3 style="margin-top:0">{v.titre}</h3>
          <p class="ligne__desc" style="margin-top:-4px">{v.sous_titre}</p>
          <ol class="formation">
            {v.lecons.map((l) => {
              n++;
              const e = l.enseignement && ENSEIGNEMENTS.find((x) => x.id === l.enseignement);
              return <li class={'formation__lecon' + (e ? '' : ' formation__lecon--a-venir')}>
                {e ? <a href={'#/grandir/enseignement/' + e.id}><span class="formation__num">{n}</span><span class="ligne__corps"><span class="ligne__titre">{l.titre}</span><span class="ligne__desc" style="display:block">{e.lecture_minutes} min · questions · travail de la semaine</span></span><Icone nom="chevron" taille={18} /></a>
                  : <span><span class="formation__num">{n}</span><span class="ligne__corps"><span class="ligne__titre">{l.titre}</span><span class="ligne__desc" style="display:block">En préparation</span></span></span>}
              </li>;
            })}
          </ol>
        </section>
      ))}
      <p class="source-mention">{FORMATION.source}</p>
    </div>
  );
}
