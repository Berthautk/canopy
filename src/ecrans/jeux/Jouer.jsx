import { Icone } from '../../composants/Icone.jsx';
import { QUIZ } from '../../donnees/contenu.js';
import { stats, BADGES } from '../../jeux/stats.js';
import { generateur, melanger, aujourdhui } from '../../jeux/hasard.js';
import { useSignal } from '../../outils/signal.js';
import { PartieQuiz } from './Quiz.jsx';
import { CarteRang } from './Chemin.jsx';

export const TOUTES = () => QUIZ.flatMap((t) => t.questions.map((q) => ({ ...q, theme: t.theme })));
const NIVEAUX = [['facile', 'Facile'], ['moyen', 'Moyen'], ['expert', 'Expert']];

const TUILES = [
  ['jouer/memoriser', 'Mémoriser un verset', 'coeur'], ['jouer/quiz-du-jour', 'Quiz du jour', 'trophee'], ['jouer/themes', 'Quiz par thème', 'liste'], ['jouer/complete', 'Complète le verset', 'note'], ['jouer/qui-suis-je', 'Qui suis-je ?', 'recherche'],
  ['jouer/ordre', 'Remets dans l\'ordre', 'trier'], ['jouer/duel', 'Duel à deux', 'groupe'], ['jouer/badges', 'Mes badges', 'etoile'],
];

// Écran 25 : accueil « Jouer et apprendre ».
export function Jouer() {
  const s = useSignal(stats);
  const fait = s.joursQuizDuJour.includes(aujourdhui());
  const obtenus = Object.keys(s.badges).length;
  return (
    <div class="page">
      <div class="jouer-hero">
        <img src="/assets/jeux/banniere-quiz-biblique.webp" alt="" />
      </div>
      <p class="jouer-intro">Apprends, révise et renforce ta foi autrement !</p>
      <a class="carte chemin-entree" href="#/jouer/chemin">
        <span class="chemin-entree__icone" aria-hidden="true">🗺️</span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block;font-size:1.15rem">Le Chemin de la foi</span>
          <span class="ligne__desc">De la Genèse à l'Apocalypse, puis des étapes sans fin · vies, étoiles et rangs</span></span>
        <Icone nom="chevron" taille={22} />
      </a>
      <CarteRang compacte />
      <a class="carte quiz-du-jour" href="#/jouer/defi">
        <span class="quiz-du-jour__icone"><Icone nom="trophee" taille={34} /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block;font-size:1.15rem">Défi biblique du jour</span>
          <span class="ligne__desc">10 questions nouvelles chaque jour, tirées de la Bible</span></span>
        <Icone nom="chevron" taille={22} />
      </a>
      <div class="grille-jeux">
        {TUILES.map(([lien, libelle, icone]) => (
          <a class="carte tuile-jeu" href={'#/' + lien}><Icone nom={icone} taille={30} /><span>{libelle}</span></a>
        ))}
      </div>
      <a class="carte ligne" href="#/jouer/badges" style="margin-top:12px">
        <span class="ligne__icone"><Icone nom="etoile" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Badges obtenus : {obtenus} / {BADGES.length}</span>
          <span class="progression progression--fine"><span style={{ width: (obtenus / BADGES.length) * 100 + '%' }} /></span></span>
        <Icone nom="chevron" taille={20} />
      </a>
    </div>
  );
}

export function QuizDuJour() {
  const alea = generateur('quiz-du-jour-' + aujourdhui());
  const questions = melanger(TOUTES(), alea).slice(0, 10);
  return <PartieQuiz questions={questions} titre="Quiz du jour" duJour chemin="jouer/quiz-du-jour" />;
}

// Écran 29 : thèmes × niveaux, puis partie.
export function QuizThemes({ theme, niveau }) {
  const t = QUIZ.find((x) => x.id === 'quiz-' + theme);
  if (t) {
    const qs = melanger(t.questions.filter((q) => !niveau || niveau === 'tous' || q.niveau === niveau));
    const nom = NIVEAUX.find((n) => n[0] === niveau)?.[1];
    return <PartieQuiz questions={qs} titre={t.theme + (nom ? ' · ' + nom : '')} chemin={`jouer/themes/${theme}/${niveau || 'tous'}`} />;
  }
  return (
    <div class="page">
      <p class="jouer-intro" style="margin-top:12px">Choisis un thème et ton niveau.</p>
      <div class="liste">
        {QUIZ.map((q) => {
          const id = q.id.replace('quiz-', '');
          return (
            <section class="carte theme-quiz">
              <div class="theme-quiz__tete"><span class="ligne__titre">{q.theme}</span><a class="lien" href={`#/jouer/themes/${id}/tous`}>Tout ({q.questions.length})</a></div>
              <div class="theme-quiz__niveaux">
                {NIVEAUX.map(([n, lib]) => {
                  const nb = q.questions.filter((x) => x.niveau === n).length;
                  return nb ? <a class={'niveau niveau--' + n} href={`#/jouer/themes/${id}/${n}`}>{lib}<small>{nb}</small></a>
                    : <span class="niveau niveau--vide">{lib}<small>0</small></span>;
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
