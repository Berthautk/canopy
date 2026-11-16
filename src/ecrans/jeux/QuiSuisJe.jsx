import { useMessageEchecs } from '../../composants/MessageEchecs.jsx';
import { VoixJeu } from '../../composants/VoixJeu.jsx';
import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { QUI_SUIS_JE } from '../../donnees/contenu.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { ajouter, badge } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';
import { BarreEtapes, TitreEtape, FinEtape, etapesOuvertes, reussirEtape, lienBible } from '../../composants/Etapes.jsx';

// Étape n : plus de personnages et un score minimum plus exigeant.
const regle = (n) => { const manches = Math.min(5 + n, 12); return { manches, seuil: Math.ceil(manches * 3 * Math.min(0.5 + 0.05 * n, 0.8)) }; };

// Écran 31 : « Qui suis-je ? ». Moins d'indices utilisés = plus de points (3, 2 ou 1).
export function QuiSuisJe() {
  const [echecMsg, voileMsg] = useMessageEchecs(3);
  const [etape, setEtape] = useState(() => etapesOuvertes('quiSuisJe'));
  const r = regle(etape);
  const [liste, setListe] = useState(() => melanger(QUI_SUIS_JE).slice(0, regle(etape).manches));
  const [n, setN] = useState(0), [vus, setVus] = useState(1), [choix, setChoix] = useState(null), [points, setPoints] = useState(0);
  const lancer = (e) => { setEtape(e); setListe(melanger(QUI_SUIS_JE).slice(0, regle(e).manches)); setN(0); setVus(1); setChoix(null); setPoints(0); scrollTo(0, 0); };
  if (n >= liste.length) {
    const reussi = points >= r.seuil; if (reussi) reussirEtape('quiSuisJe', etape);
    return <FinEtape icone="recherche" etape={etape} reussi={reussi} score={`${points} / ${liste.length * 3}`}
      texte={reussi ? 'Moins tu utilises d\'indices, plus tu marques de points. L\'étape suivante a plus de personnages.' : `Il fallait au moins ${r.seuil} points. Utilise moins d'indices et lis les références pour apprendre.`}
      suivante={() => lancer(etape + 1)} rejouer={() => lancer(etape)}
      plusLoin={liste.map((x) => lienBible('Lire l\'histoire de ' + x.nom, x.indices[0]?.reference)).filter(Boolean)} />;
  }
  const p = liste[n], repondu = choix !== null, juste = choix === p.reponse;
  return (
    <div class="page">{voileMsg}
      <div class="qsj-hero"><img src={repondu ? p.image : '/assets/paysages/coucher-soleil-montagnes.webp'} alt={repondu ? p.nom : ''} />
        {!repondu && <span class="qsj-hero__question">?</span>}</div>
      <VoixJeu cle={`${p.nom}:${vus}:${repondu ? 'r' : ''}`} blocs={repondu
        ? [{ texte: juste ? `Bravo ! C'était bien ${p.nom}.` : `Non. C'était ${p.nom}.` }]
        : [...(vus === 1 ? [{ texte: 'Qui suis-je ?' }] : []), { texte: `Indice ${vus} : ${p.indices[vus - 1].texte}` }, { texte: `Est-ce ${p.choix.slice(0, -1).join(', ')} ou ${p.choix.at(-1)} ?` }]} />
      {n === 0 && !repondu && vus === 1 && <BarreEtapes jeu="quiSuisJe" etape={etape} choisir={lancer} />}
      <TitreEtape etape={etape} but={`Découvre ${liste.length} personnages · au moins ${r.seuil} points pour réussir`} />
      <p class="quiz__compteur">Personnage {n + 1} / {liste.length} · {points} point{points > 1 ? 's' : ''}</p>
      <ol class="indices">
        {p.indices.map((ind, i) => i < (repondu ? 3 : vus) ? (
          <li class="carte indice"><span class="indice__num">Indice {i + 1}</span><span>{ind.texte}</span>
            <a class="indice__ref" href={(() => { const r = lireReference(ind.reference); return `#/bible/lire/${r.code}/${r.c}/${r.v}`; })()}>{ecrireReference(lireReference(ind.reference))}</a></li>
        ) : <li class="carte indice indice--cache"><span class="indice__num">Indice {i + 1}</span><Icone nom="cadenas" taille={16} /></li>)}
      </ol>
      {!repondu && vus < 3 && <button class="lien" style="display:block;margin:4px auto 10px" onClick={() => setVus(vus + 1)}>Voir l'indice suivant ({3 - vus} point{3 - vus > 1 ? 's' : ''} en jeu ensuite)</button>}
      <p class="qsj-question">Qui suis-je ?</p>
      <div class="qsj-choix">
        {p.choix.map((c, i) => (
          <button class={'carte choix choix--centre' + (repondu && i === p.reponse ? ' choix--juste' : '') + (repondu && i === choix && !juste ? ' choix--faux' : '')} disabled={repondu}
            onClick={async () => { setChoix(i); if (i !== p.reponse) echecMsg(); if (i === p.reponse) { setPoints(points + (4 - vus)); const b = await ajouter('quiSuisJe'); b.forEach((id) => notifier('Badge obtenu : ' + badge(id)[1])); } }}>{c}</button>
        ))}
      </div>
      {repondu && <>
        <p class={'qsj-verdict ' + (juste ? 'ok' : '')}>{juste ? `Bravo ! +${4 - vus} point${4 - vus > 1 ? 's' : ''}` : `C'était ${p.nom}.`}</p>
        <button class="bouton bouton--or quiz__suivant" onClick={() => { setN(n + 1); setVus(1); setChoix(null); scrollTo(0, 0); }}>Suivant <Icone nom="chevron" taille={18} /></button>
      </>}
    </div>
  );
}
