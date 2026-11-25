import { Icone } from '../../composants/Icone.jsx';
import { Banniere } from '../../composants/Banniere.jsx';
import { QUIZ } from '../../donnees/contenu.js';
import { stats, BADGES } from '../../jeux/stats.js';
import { generateur, melanger, aujourdhui } from '../../jeux/hasard.js';
import { useSignal } from '../../outils/signal.js';
import { PartieQuiz } from './Quiz.jsx';
import { CarteRang } from './Chemin.jsx';

export const TOUTES = () => QUIZ.flatMap((t) => t.questions.map((q) => ({ ...q, theme: t.theme })));
const NIVEAUX = [['facile', 'Facile'], ['moyen', 'Moyen'], ['expert', 'Expert']];

import { ReglageYeux } from './Yeux.jsx';
import { lireAVoixHaute } from '../../audio/voix.js';

// Les jeux rangés en blocs qu'on reconnaît à l'image, même sans savoir lire.
export const BLOCS = [
  { id: 'petits', photo: 'jouer-enfants-chantent', emoji: '🧸', titre: 'Petits enfants', age: '2 à 6 ans', couleur: '#f3a83b', lien: 'jouer/petits' },
  { id: 'enfants', photo: 'jouer-cartes-enfants', emoji: '🏃', titre: 'Enfants', age: '6 à 12 ans', couleur: '#3fa66b', jeux: [
    ['jouer/course', '🏃', 'La course de la vie', 'Esquive le péché, Jésus te relève'], ['jouer/qui-suis-je', '🕵️', 'Qui suis-je ?', 'Trouve le personnage'],
    ['jouer/ordre', '🔀', 'Remets dans l\'ordre', 'Les grandes histoires'], ['jouer/memoriser', '❤️', 'Mémoriser un verset', 'Cache la Parole dans ton cœur']] },
  { id: 'jeunes', photo: 'jouer-quiz-telephone', emoji: '🧭', titre: 'Jeunes et adultes', age: '12 ans et plus', couleur: '#3b6fc4', jeux: [
    ['jouer/chemin', '🗺️', 'Le Chemin de la foi', 'De la Genèse à l\'Apocalypse'], ['jouer/defi', '🏆', 'Défi biblique du jour', '10 questions chaque jour'],
    ['jouer/pelerin', '🚶', 'Le Pèlerin', 'De Jérusalem à Rome avec Paul'], ['jouer/course', '🏃', 'La course de la vie', 'Esquive le péché, Jésus te relève'],
    ['jouer/themes', '📚', 'Quiz par thème', 'Choisis ton thème et ton niveau'], ['jouer/complete', '✍️', 'Complète le verset', 'Les mots manquants']] },
  { id: 'groupe', photo: 'jouer-pere-fille', emoji: '👨‍👩‍👧‍👦', titre: 'En groupe', age: 'en famille, entre amis', couleur: '#9b4fc4', jeux: [
    ['jouer/tribunal', '⚖️', 'Le Tribunal de la Parole', 'Démasquez l\'imposteur'], ['jouer/duel', '🤜', 'Duel à deux', 'Quiz à tour de rôle']] },
];

// Écran 25 : accueil des jeux.
export function Jouer() {
  const s = useSignal(stats);
  const obtenus = Object.keys(s.badges).length;
  return (
    <div class="page">
      <Banniere image="/assets/photos/banniere-jeux.webp" titre="Jouer et apprendre" sous="Des jeux pour tous les âges : on s'amuse et on retient la Parole." />
      <nav class="tuiles" aria-label="Choisis ton âge">
        {BLOCS.map((b) => (
          <a class="tuile" style={{ '--c': b.couleur }} href={'#/' + (b.lien || 'jouer/bloc/' + b.id)} onPointerDown={() => lireAVoixHaute('bloc', [{ texte: b.titre }])}>
            <img src={'/assets/photos/' + b.photo + '.webp'} alt="" loading="lazy" /><b>{b.titre}</b><span>{b.age}</span></a>
        ))}
      </nav>
      <CarteRang compacte />
      <a class="carte ligne" href="#/jouer/badges" style="margin-top:12px">
        <span class="ligne__icone"><Icone nom="etoile" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Badges obtenus : {obtenus} / {BADGES.length}</span>
          <span class="progression progression--fine"><span style={{ width: (obtenus / BADGES.length) * 100 + '%' }} /></span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <h2 class="titre-section">Réglages pour les yeux et les enfants</h2>
      <ReglageYeux />
    </div>
  );
}

export function BlocJeux({ id }) {
  const b = BLOCS.find((x) => x.id === id);
  if (!b?.jeux) return <Jouer />;
  return (
    <div class="page">
      <div class="bloc-jeu bloc-jeu--tete" style={{ '--c': b.couleur }}><span class="bloc-jeu__emoji" aria-hidden="true">{b.emoji}</span><b>{b.titre}</b><small>{b.age}</small></div>
      <div class="liste">{b.jeux.map(([l, e, t, d]) => (
        <a class="carte ligne jeu-ligne" href={'#/' + l}><span class="jeu-ligne__emoji" aria-hidden="true">{e}</span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">{t}</span><span class="ligne__desc">{d}</span></span><Icone nom="chevron" taille={20} /></a>))}</div>
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
