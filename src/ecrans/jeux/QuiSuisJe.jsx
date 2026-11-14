import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { QUI_SUIS_JE } from '../../donnees/contenu.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { ajouter, badge } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';

// Écran 31 : « Qui suis-je ? ». Moins d'indices utilisés = plus de points (3, 2 ou 1).
export function QuiSuisJe() {
  const [liste, setListe] = useState(() => melanger(QUI_SUIS_JE).slice(0, 5));
  const [n, setN] = useState(0), [vus, setVus] = useState(1), [choix, setChoix] = useState(null), [points, setPoints] = useState(0);
  if (n >= liste.length) return (
    <div class="page resultat-quiz"><div class="resultat-quiz__trophee"><Icone nom="recherche" taille={56} /></div>
      <p class="resultat-quiz__libelle">Tes points</p><p class="resultat-quiz__score">{points} / {liste.length * 3}</p>
      <p class="resultat-quiz__texte">Moins tu utilises d'indices, plus tu marques de points.</p>
      <button class="bouton bouton--plein" onClick={() => { setListe(melanger(QUI_SUIS_JE).slice(0, 5)); setN(0); setVus(1); setChoix(null); setPoints(0); }}>Rejouer</button></div>);
  const p = liste[n], repondu = choix !== null, juste = choix === p.reponse;
  return (
    <div class="page">
      <div class="qsj-hero"><img src={repondu ? p.image : '/assets/paysages/coucher-soleil-montagnes.webp'} alt={repondu ? p.nom : ''} />
        {!repondu && <span class="qsj-hero__question">?</span>}</div>
      <p class="jouer-intro">Découvre le personnage biblique grâce aux indices.</p>
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
            onClick={async () => { setChoix(i); if (i === p.reponse) { setPoints(points + (4 - vus)); const b = await ajouter('quiSuisJe'); b.forEach((id) => notifier('Badge obtenu : ' + badge(id)[1])); } }}>{c}</button>
        ))}
      </div>
      {repondu && <>
        <p class={'qsj-verdict ' + (juste ? 'ok' : '')}>{juste ? `Bravo ! +${4 - vus} point${4 - vus > 1 ? 's' : ''}` : `C'était ${p.nom}.`}</p>
        <button class="bouton bouton--or quiz__suivant" onClick={() => { setN(n + 1); setVus(1); setChoix(null); scrollTo(0, 0); }}>Suivant <Icone nom="chevron" taille={18} /></button>
      </>}
    </div>
  );
}
