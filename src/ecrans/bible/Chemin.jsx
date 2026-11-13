import { Icone } from '../../composants/Icone.jsx';
import { usePassage, TextePassage, cheminMontrer, cheminLire } from '../../composants/Verset.jsx';
import { CHEMIN_DU_SALUT as C } from '../../donnees/contenu.js';
import { ecrireReference, lireReference } from '../../bible/references.js';
import { partager } from '../../outils/partage.js';

// Écran 22 : le chemin du salut, un verset à la fois avec une courte explication.
export function Chemin({ etape }) {
  const n = etape ? Math.min(Math.max(1, +etape), C.etapes.length) : null;

  if (!n) {
    return (
      <div class="page">
        <div class="bandeau-titre">
          <img src="/assets/jesus/jesus-main-tendue.webp" alt="" />
          <div><h2>{C.titre}</h2><p>{C.introduction}</p></div>
        </div>
        <ol class="etapes">
          {C.etapes.map((e, i) => (
            <li><a class="carte etape" href={`#/bible/chemin/${i + 1}`}>
              <span class="etape__num">{i + 1}</span>
              <span class="ligne__corps"><span class="ligne__titre" style="display:block">{e.titre}</span>
                <span class="ligne__desc">{ecrireReference(lireReference(e.reference))}</span></span>
              <Icone nom="chevron" taille={20} />
            </a></li>
          ))}
        </ol>
        <a class="bouton bouton--plein" style="width:100%;margin-top:14px" href="#/bible/chemin/1">Commencer le parcours</a>
      </div>
    );
  }

  const e = C.etapes[n - 1];
  return <Etape e={e} n={n} total={C.etapes.length} />;
}

function Etape({ e, n, total }) {
  const etat = usePassage(e.reference);
  const r = etat.ref;
  return (
    <div class="page chemin-etape">
      <div class="progression progression--fine" aria-label={`Étape ${n} sur ${total}`}><span style={{ width: (n / total) * 100 + '%' }} /></div>
      <p class="chemin-etape__compteur">Étape {n} sur {total}</p>
      <h2 class="chemin-etape__titre">{e.titre}</h2>
      <section class="carte chemin-etape__verset">
        <TextePassage etat={etat} grand />
        {r && <span class="pastille pastille--or">{ecrireReference(r)}</span>}
      </section>
      <section class="carte chemin-etape__explication">
        <span class="ligne__icone"><Icone nom="ampoule" /></span>
        <p>{e.explication}</p>
      </section>
      {r && (
        <div class="verset__actions" style="justify-content:center">
          <a class="bouton bouton--contour bouton--petit" href={'#/' + cheminMontrer(r)}><Icone nom="agrandir" taille={18} /> Montrer</a>
          <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: e.titre, texte: `${e.titre}\n« ${etat.texte} » — ${ecrireReference(r)} (LSG)`, chemin: `bible/chemin/${n}` })}>
            <Icone nom="partager" taille={18} /> Partager</button>
        </div>
      )}
      <div class="chemin-etape__nav">
        {n > 1 ? <a class="bouton bouton--contour" href={`#/bible/chemin/${n - 1}`}><Icone nom="precedent" taille={18} /> Précédent</a> : <a class="bouton bouton--contour" href="#/bible/chemin">Sommaire</a>}
        {n < total ? <a class="bouton bouton--plein" href={`#/bible/chemin/${n + 1}`}>Suivant <Icone nom="chevron" taille={18} /></a>
          : <a class="bouton bouton--or" href="#/bible/chemin">Terminer</a>}
      </div>
    </div>
  );
}
