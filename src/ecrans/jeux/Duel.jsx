import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { ajouter } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';
import { partager } from '../../outils/partage.js';
import { Question } from './Quiz.jsx';
import { TOUTES } from './Jouer.jsx';

const PAR_JOUEUR = 5;

// Écran 33 : duel à deux joueurs sur le même téléphone, chacun son tour, sans internet.
export function Duel() {
  const [noms, setNoms] = useState(['', '']);
  const [partie, setPartie] = useState(null);   // { questions, i, scores, pret }
  const nom = (k) => noms[k].trim() || `Joueur ${k + 1}`;

  if (!partie) return (
    <div class="page">
      <div class="jouer-hero"><img src="/assets/jeux/banniere-duel-biblique.webp" alt="" /></div>
      <p class="jouer-intro">Quiz biblique à deux joueurs sur le même téléphone. {PAR_JOUEUR} questions chacun, à tour de rôle.</p>
      {[0, 1].map((k) => (
        <label class="carte duel-joueur"><span class="duel-joueur__num">{k + 1}</span>
          <input class="champ" value={noms[k]} maxLength={20} placeholder={`Prénom du joueur ${k + 1}`}
            onInput={(e) => { const n = [...noms]; n[k] = e.currentTarget.value; setNoms(n); }} /></label>
      ))}
      <button class="bouton bouton--or quiz__suivant" onClick={() => setPartie({ questions: melanger(TOUTES()).slice(0, PAR_JOUEUR * 2), i: 0, scores: [0, 0], pret: false })}>
        <Icone nom="lecture" taille={18} /> Commencer le duel</button>
    </div>
  );

  const { questions, i, scores, pret } = partie, joueur = i % 2;
  if (i >= questions.length) {
    const g = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1;
    return (
      <div class="page resultat-quiz">
        <div class="resultat-quiz__trophee"><Icone nom="trophee" taille={64} /></div>
        <h2>{g === null ? 'Égalité !' : `${nom(g)} gagne !`}</h2>
        <div class="duel-scores">{[0, 1].map((k) => <div class={'carte' + (g === k ? ' duel-scores--gagnant' : '')}><span>{nom(k)}</span><b>{scores[k]} / {PAR_JOUEUR}</b></div>)}</div>
        <p class="resultat-quiz__texte">Bravo à tous les deux ! L'important, c'est d'apprendre ensemble.</p>
        <div class="resultat-quiz__actions">
          <button class="bouton bouton--plein" onClick={() => setPartie({ questions: melanger(TOUTES()).slice(0, PAR_JOUEUR * 2), i: 0, scores: [0, 0], pret: false })}>Revanche</button>
          <button class="bouton bouton--whatsapp" onClick={() => partager({ titre: 'Duel biblique', texte: `Duel biblique sur Yeshaya : ${nom(0)} ${scores[0]} – ${scores[1]} ${nom(1)} !`, chemin: 'jouer/duel' })}><Icone nom="partager" taille={18} /> Partager</button>
        </div>
      </div>
    );
  }
  if (!pret) return (
    <div class="page duel-tour">
      <span class="duel-tour__avatar">{nom(joueur)[0].toUpperCase()}</span>
      <h2>À toi, {nom(joueur)} !</h2>
      <p class="ligne__desc">Question {Math.floor(i / 2) + 1} sur {PAR_JOUEUR} · Score : {nom(0)} {scores[0]} – {scores[1]} {nom(1)}</p>
      <p class="ligne__desc">Passe le téléphone à {nom(joueur)}.</p>
      <button class="bouton bouton--or" style="min-width:220px" onClick={() => setPartie({ ...partie, pret: true })}>Je suis prêt</button>
    </div>
  );
  return (
    <div class="page">
      <Question key={i} q={questions[i]} numero={Math.floor(i / 2) + 1} total={PAR_JOUEUR} joueur={nom(joueur)}
        surReponse={(ok) => ok && setPartie((p) => { const s = [...p.scores]; s[joueur]++; return { ...p, scores: s }; })}
        surSuivant={() => { if (i + 1 >= questions.length) ajouter('duels'); setPartie((p) => ({ ...p, i: p.i + 1, pret: false })); scrollTo(0, 0); }} />
    </div>
  );
}
