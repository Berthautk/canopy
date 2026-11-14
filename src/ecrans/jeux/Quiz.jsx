import { useMemo, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { usePassage, TextePassage } from '../../composants/Verset.jsx';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { finQuiz, badge } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';
import { partager } from '../../outils/partage.js';

const LETTRES = ['A', 'B', 'C', 'D'];

// Référence biblique d'une question : texte LSG lu dans la Bible (jamais retapé) + lien vers le passage.
export function LienReference({ reference }) {
  const r = lireReference(reference);
  const etat = usePassage(reference);
  if (!r) return <span>{reference}</span>;
  return (
    <a class="carte ref-lien" href={`#/bible/lire/${r.code}/${r.c}/${r.v || 1}`}>
      <span class="ref-lien__tete">
        <span class="ligne__icone"><Icone nom="bible" /></span>
        <span class="ligne__corps"><span class="ligne__desc" style="display:block">Référence biblique</span><span class="ligne__titre">{ecrireReference(r)}</span></span>
        <Icone nom="chevron" taille={20} />
      </span>
      <TextePassage etat={etat} />
    </a>
  );
}

// Une question : 4 gros boutons, puis la réponse et l'explication (écrans 26 et 27).
export function Question({ q, numero, total, surReponse, surSuivant, joueur }) {
  const ordre = useMemo(() => melanger([0, 1, 2, 3].slice(0, q.choix.length)), [q.id]);
  const [choix, setChoix] = useState(null);
  const repondu = choix !== null, juste = choix === q.reponse;
  return (
    <div class="quiz">
      {joueur && <p class="quiz__joueur">{joueur}</p>}
      <p class="quiz__compteur">Question {numero} / {total}</p>
      <div class="progression progression--fine"><span style={{ width: (numero / total) * 100 + '%' }} /></div>
      {!repondu ? (
        <>
          <section class="carte quiz__question"><Icone nom="bible" taille={28} /><h2>{q.question}</h2></section>
          <div class="quiz__choix">
            {ordre.map((i, k) => (
              <button class="carte choix" onClick={() => { setChoix(i); surReponse?.(i === q.reponse); }}>
                <span class="choix__lettre">{LETTRES[k]}</span><span>{q.choix[i]}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <section class={'carte verdict ' + (juste ? 'verdict--juste' : 'verdict--faux')} role="status">
            <span class="verdict__icone"><Icone nom={juste ? 'verifie' : 'fermer'} taille={30} /></span>
            <div><h2>{juste ? 'Bonne réponse !' : 'Pas tout à fait…'}</h2>
              <p>{juste ? q.choix[q.reponse] : <>La bonne réponse : <b>{q.choix[q.reponse]}</b></>}</p></div>
          </section>
          <section class="carte bloc"><h3><span class="ligne__icone"><Icone nom="ampoule" /></span> Explication</h3><p>{q.explication}</p></section>
          <div style="margin-top:10px"><LienReference reference={q.reference} /></div>
          <button class="bouton bouton--or quiz__suivant" onClick={() => { setChoix(null); surSuivant(); }}>
            {numero < total ? 'Question suivante' : 'Voir mon résultat'} <Icone nom="chevron" taille={18} /></button>
        </>
      )}
    </div>
  );
}

function encouragement(score, total) {
  const r = score / total;
  if (r === 1) return 'Excellent ! Tu connais très bien la Parole. Continue à la méditer chaque jour.';
  if (r >= 0.7) return 'Bravo ! Tu as de bonnes connaissances bibliques. Continue à apprendre et à grandir dans la Parole.';
  if (r >= 0.4) return 'Bien joué ! Chaque question est une occasion d\'apprendre. Relis les passages et réessaie.';
  return 'Ce n\'est qu\'un début ! Lis les explications et les passages : tu progresseras vite.';
}

// Partie complète de quiz + écran de résultat (écran 28).
export function PartieQuiz({ questions, titre, duJour, chemin }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [fin, setFin] = useState(null);       // { nouveaux: [badges] }
  const [cle, setCle] = useState(0);          // pour rejouer
  if (!questions.length) return <div class="page"><p class="ligne__desc" style="margin-top:16px">Pas encore de questions ici.</p></div>;

  if (fin) {
    const total = questions.length;
    return (
      <div class="page resultat-quiz">
        <div class="resultat-quiz__trophee"><Icone nom="trophee" taille={64} /></div>
        <p class="resultat-quiz__libelle">Ton score</p>
        <p class="resultat-quiz__score">{score} / {total}</p>
        <h2>{score === total ? 'Parfait !' : score >= total * 0.7 ? 'Bravo !' : 'Continue !'}</h2>
        <p class="resultat-quiz__texte">{encouragement(score, total)}</p>
        {fin.nouveaux.map((id) => (
          <div class="carte badge-obtenu"><span class="badge-obtenu__icone"><Icone nom={badge(id)[3]} taille={26} /></span>
            <div><span class="ligne__desc" style="display:block">Badge obtenu</span><b>{badge(id)[1]}</b></div></div>
        ))}
        <div class="resultat-quiz__actions">
          <button class="bouton bouton--plein" onClick={() => { setI(0); setScore(0); setFin(null); setCle(cle + 1); }}><Icone nom="rejouer" taille={18} /> Rejouer</button>
          <button class="bouton bouton--whatsapp" onClick={() => partager({ titre: 'Mon score Yeshaya', texte: `J'ai obtenu ${score}/${total} au quiz « ${titre} » sur Yeshaya. À ton tour !`, chemin })}>
            <Icone nom="partager" taille={18} /> Partager mon score</button>
        </div>
        <a class="lien" href="#/jouer" style="display:block;text-align:center;margin-top:14px">Retour aux jeux</a>
      </div>
    );
  }
  return (
    <div class="page">
      <Question key={cle + '-' + i} q={questions[i]} numero={i + 1} total={questions.length}
        surReponse={(ok) => ok && setScore((s) => s + 1)}
        surSuivant={async () => {
          if (i + 1 < questions.length) { setI(i + 1); scrollTo(0, 0); return; }
          const nouveaux = await finQuiz(score, questions.length, duJour); setFin({ nouveaux }); scrollTo(0, 0);
        }} />
    </div>
  );
}
