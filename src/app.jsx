import { useEffect, useState } from 'preact/hooks';
import { Entete, BarreOnglets, Tiroir, useTiroir, Bientot } from './composants/Structure.jsx';
import { Notification } from './composants/Notification.jsx';
import { Demarrage } from './ecrans/Demarrage.jsx';
import { Accueil } from './ecrans/Accueil.jsx';
import { Parametres } from './ecrans/Parametres.jsx';
import { APropos } from './ecrans/APropos.jsx';
import { BibleAccueil } from './ecrans/bible/BibleAccueil.jsx';
import { Livres } from './ecrans/bible/Livres.jsx';
import { Lecture, allerLecture } from './ecrans/bible/Lecture.jsx';
import { Recherche } from './ecrans/bible/Recherche.jsx';
import { Montrer } from './ecrans/bible/Montrer.jsx';
import { Ressources } from './ecrans/bible/Ressources.jsx';
import { Sujets } from './ecrans/bible/Sujets.jsx';
import { Chemin } from './ecrans/bible/Chemin.jsx';
import { Meditation } from './ecrans/bible/Meditation.jsx';
import { Plan } from './ecrans/bible/Plan.jsx';
import { Ecouter } from './ecrans/audio/Ecouter.jsx';
import { Telechargements } from './ecrans/audio/Telechargements.jsx';
import { MiniLecteur } from './composants/Audio.jsx';
import { Priere, ThemePriere } from './ecrans/priere/Priere.jsx';
import { Journal } from './ecrans/priere/Journal.jsx';
import { Veille } from './ecrans/priere/Veille.jsx';
import { FicheCombat } from './ecrans/priere/Priere.jsx';
import { EnseignementEcrit } from './ecrans/grandir/EnseignementEcrit.jsx';
import { Grandir } from './ecrans/grandir/Grandir.jsx';
import { Parcours, PARCOURS } from './ecrans/grandir/NouveauConverti.jsx';
import { Evangeliser, Article } from './ecrans/evangeliser/Evangeliser.jsx';
import { Dialogue } from './ecrans/evangeliser/Dialogue.jsx';
import { Outil } from './ecrans/evangeliser/Outil.jsx';
import { Approche } from './ecrans/evangeliser/Approche.jsx';
import { Admin } from './ecrans/Admin.jsx';
import { Confidentialite, VERSION_POLITIQUE } from './ecrans/Confidentialite.jsx';
import { DemanderPriere } from './ecrans/priere/DemanderPriere.jsx';
import { compterPage } from './donnees/mesure.js';
import { Jouer, QuizDuJour, QuizThemes } from './ecrans/jeux/Jouer.jsx';
import { CompleteVerset } from './ecrans/jeux/CompleteVerset.jsx';
import { QuiSuisJe } from './ecrans/jeux/QuiSuisJe.jsx';
import { Ordre } from './ecrans/jeux/Ordre.jsx';
import { Duel } from './ecrans/jeux/Duel.jsx';
import { Badges } from './ecrans/jeux/Badges.jsx';
import { QUIZ } from './donnees/contenu.js';
import { PRIERES, EVANGELISATION, DIALOGUES, VEILLES, COMBAT, ENSEIGNEMENTS, OUTILS, APPROCHES } from './donnees/contenu.js';
import { lecteur } from './audio/lecteur.js';
import { route, ONGLET_DE } from './outils/routeur.js';
import { useSignal } from './outils/signal.js';
import { reglages, modifierReglages, demanderStockagePersistant } from './donnees/reglages.js';
import { positionLecture } from './donnees/annotations.js';
import { SUJETS } from './donnees/contenu.js';
import { PAR_CODE } from './bible/references.js';

// Écrans des phases suivantes : affichés comme « Bientôt disponible » en attendant.
const A_VENIR = {
};

// Titre de la barre secondaire (avec bouton retour) selon l'écran.
function titre([a, b, c]) {
  if (a === 'parametres') return "Paramètres de l'application";
  if (a === 'a-propos') return 'À propos de Yeshaya';
  if (a === 'admin') return 'Espace administrateur';
  if (a === 'confidentialite') return 'Confidentialité';
  if (a === 'priere' && b === 'demander') return 'Demander la prière';
  if (a === 'jouer') return {
    'quiz-du-jour': 'Quiz du jour', themes: c ? (QUIZ.find((q) => q.id === 'quiz-' + c)?.theme ?? 'Quiz') : 'Quiz par thème', complete: 'Complète le verset',
    'qui-suis-je': 'Qui suis-je ?', ordre: "Remets dans l'ordre", duel: 'Duel à deux', badges: 'Mes badges',
  }[b] ?? 'Jouer et apprendre';
  if (a === 'telechargements') return 'Mes téléchargements';
  if (a === 'ecouter') return 'Écouter';
  if (a === 'priere' && b === 'journal') return 'Mon journal de prière';
  if (a === 'priere' && b === 'theme') return PRIERES.find((x) => x.id === c)?.nom_court ?? PRIERES.find((x) => x.id === c)?.titre ?? 'Prière';
  if (a === 'priere' && b === 'veille') return VEILLES.find((x) => x.id === 'veille-' + c)?.titre ?? 'Prier';
  if (a === 'priere' && b === 'combat') return 'Combat spirituel';
  if (a === 'grandir' && b === 'enseignement') return ENSEIGNEMENTS.find((x) => x.id === c)?.titre ?? 'Enseignement';
  if (a === 'grandir' && b === 'nouveau-converti') return c ? `Nouveau converti : jour ${c}` : 'Parcours Nouveau converti';
  if (a === 'grandir' && b === 'decouvrir-jesus') return c ? `Découvrir Jésus : leçon ${c}` : 'Découvrir Jésus';
  if (a === 'evangeliser' && b === 'article') return EVANGELISATION.find((x) => x.id === c)?.titre ?? 'Évangéliser';
  if (a === 'evangeliser' && b === 'dialogue') return 'Dialogue';
  if (a === 'evangeliser' && b === 'outil') return OUTILS.find((x) => x.id === c)?.titre ?? 'Évangéliser';
  if (a === 'evangeliser' && b === 'approche') return APPROCHES.find((x) => x.id === c)?.nom_court ?? 'Évangéliser';
  if (a !== 'bible' || !b) return null;
  return {
    livres: c && PAR_CODE[c] ? PAR_CODE[c].nom : 'Livres de la Bible', lire: 'Lire la Bible', recherche: 'Rechercher dans la Bible',
    plan: 'Plan de lecture', meditation: 'Méditation du matin', sujets: c ? SUJETS.find((s) => s.id === c)?.titre ?? 'Versets par sujet' : 'Versets par sujet',
    chemin: 'Le chemin du salut', ressources: 'Mes favoris, surlignages et notes',
  }[b] ?? 'Bible';
}

function Ecran({ r }) {
  const [a, b, c, d, e] = r.segments;
  const pos = useSignal(positionLecture);
  if (a === 'accueil') return <Accueil />;
  if (a === 'parametres') return <Parametres />;
  if (a === 'admin') return <Admin />;
  if (a === 'confidentialite') return <Confidentialite />;
  if (a === 'a-propos') return <APropos />;
  if (a === 'telechargements') return <Telechargements />;
  if (a === 'jouer') return ({ 'quiz-du-jour': <QuizDuJour />, themes: <QuizThemes theme={c} niveau={d} />, complete: <CompleteVerset />,
    'qui-suis-je': <QuiSuisJe />, ordre: <Ordre id={c} />, duel: <Duel />, badges: <Badges /> })[b] ?? <Jouer />;
  if (a === 'priere') return b === 'demander' ? <DemanderPriere /> : b === 'journal' ? <Journal nouveau={r.params.nouveau} /> : b === 'theme' ? <ThemePriere id={c} /> : b === 'veille' ? <Veille id={c} /> : b === 'combat' ? <FicheCombat id={c} /> : <Priere />;
  if (a === 'grandir') return PARCOURS[b] ? <Parcours id={b} jour={c} /> : b === 'enseignement' ? <EnseignementEcrit id={c} /> : <Grandir />;
  if (a === 'evangeliser') return b === 'article' ? <Article id={c} /> : b === 'dialogue' ? <Dialogue id={c} /> : b === 'outil' ? <Outil id={c} /> : b === 'approche' ? <Approche id={c} /> : <Evangeliser />;
  if (a === 'ecouter') return <Ecouter id={b} />;
  if (a === 'bible') {
    if (!b) return <BibleAccueil />;
    if (b === 'livres') return <Livres code={c} />;
    if (b === 'lire') { if (!c || !d) { allerLecture(pos); return null; } return <Lecture code={c} c={+d} vise={e ? +e : null} />; }
    if (b === 'recherche') return <Recherche q={r.params.q || ''} />;
    if (b === 'ressources') return <Ressources />;
    if (b === 'sujets') return <Sujets id={c} />;
    if (b === 'chemin') return <Chemin etape={c} />;
    if (b === 'meditation') return <Meditation />;
    if (b === 'plan') return <Plan />;
  }
  const v = A_VENIR[a];
  if (v) return <div class="page" style="padding-top:12px"><Bientot titre={v[0]} image={v[1]} texte={v[2]} /></div>;
  return <div class="page" style="padding-top:12px"><Bientot titre="Page introuvable" texte="Cette page n'existe pas." /></div>;
}

export function App() {
  const r = useSignal(route);
  const cleRoute = r.segments.join('/');
  useEffect(() => { compterPage(r.segments); }, [cleRoute]);
  const reg = useSignal(reglages);
  const l = useSignal(lecteur);
  const tiroir = useTiroir();
  const [demarrage, setDemarrage] = useState(true);
  const accepte = reg.premierLancementVu && (reg.politiqueAcceptee || 0) >= VERSION_POLITIQUE;

  // Écran de démarrage : court à chaque ouverture, bandeau des engagements au premier lancement.
  useEffect(() => {
    if (accepte) { const t = setTimeout(() => setDemarrage(false), 900); return () => clearTimeout(t); }
  }, [accepte]);

  if (demarrage) {
    return (
      <Demarrage premierLancement={!accepte}
        surCommencer={() => { modifierReglages({ premierLancementVu: true, politiqueAcceptee: VERSION_POLITIQUE, statsAnonymes: true }); demanderStockagePersistant(); setDemarrage(false); }} />
    );
  }

  // Mode « Montrer » : plein écran, sans en-tête ni onglets.
  if (r.segments[0] === 'montrer') {
    const [, code, c, v] = r.segments;
    return <><Montrer code={code} c={c} v={v} /><Notification /></>;
  }

  return (
    <div class={'app' + (l.piste && r.segments[0] !== 'ecouter' ? ' app--mini' : '')}>
      <Entete titre={titre(r.segments)} surMenu={tiroir.ouvrir} />
      <main id="contenu"><Ecran r={r} /></main>
      <MiniLecteur />
      <BarreOnglets actif={ONGLET_DE[r.segments[0]] ?? 'accueil'} />
      <Tiroir ouvert={tiroir.ouvert} fermer={tiroir.fermer} />
      <Notification />
    </div>
  );
}
