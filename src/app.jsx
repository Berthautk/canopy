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
import { route, ONGLET_DE } from './outils/routeur.js';
import { useSignal } from './outils/signal.js';
import { reglages, modifierReglages, demanderStockagePersistant } from './donnees/reglages.js';
import { positionLecture } from './donnees/annotations.js';
import { SUJETS } from './donnees/contenu.js';
import { PAR_CODE } from './bible/references.js';

// Écrans des phases suivantes : affichés comme « Bientôt disponible » en attendant.
const A_VENIR = {
  priere: ['Prière', '/assets/priere/mains-levees.webp', 'Thèmes de prière, sujets à prier, enseignements audio et journal de prière.'],
  grandir: ['Grandir', '/assets/nouveau-converti/etude-de-la-bible.webp', 'Enseignements par thèmes, séries et parcours « Nouveau converti » sur 30 jours.'],
  evangeliser: ['Évangéliser', '/assets/evangelisation/partage-bible-dans-la-rue.webp', 'Motivation, formation, dialogues et réponses aux objections.'],
  jouer: ['Jouer et apprendre', '/assets/jeux/banniere-quiz-biblique.webp', 'Quiz du jour, « Complète le verset », « Qui suis-je ? », duel à deux et badges.'],
  telechargements: ['Mes téléchargements', '/assets/audio/telephone-lecteur-audio.webp', 'Les audios téléchargés pour l\'écoute hors ligne et l\'espace qu\'ils occupent.'],
};

// Titre de la barre secondaire (avec bouton retour) selon l'écran.
function titre([a, b, c]) {
  if (a === 'parametres') return "Paramètres de l'application";
  if (a === 'a-propos') return 'À propos de Yeshaya';
  if (a === 'jouer') return 'Jouer et apprendre';
  if (a === 'telechargements') return 'Mes téléchargements';
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
  if (a === 'a-propos') return <APropos />;
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
  const reg = useSignal(reglages);
  const tiroir = useTiroir();
  const [demarrage, setDemarrage] = useState(true);

  // Écran de démarrage : court à chaque ouverture, bandeau des engagements au premier lancement.
  useEffect(() => {
    if (reg.premierLancementVu) { const t = setTimeout(() => setDemarrage(false), 900); return () => clearTimeout(t); }
  }, [reg.premierLancementVu]);

  if (demarrage) {
    return (
      <Demarrage premierLancement={!reg.premierLancementVu}
        surCommencer={() => { modifierReglages({ premierLancementVu: true }); demanderStockagePersistant(); setDemarrage(false); }} />
    );
  }

  // Mode « Montrer » : plein écran, sans en-tête ni onglets.
  if (r.segments[0] === 'montrer') {
    const [, code, c, v] = r.segments;
    return <><Montrer code={code} c={c} v={v} /><Notification /></>;
  }

  return (
    <div class="app">
      <Entete titre={titre(r.segments)} surMenu={tiroir.ouvrir} />
      <main id="contenu"><Ecran r={r} /></main>
      <BarreOnglets actif={ONGLET_DE[r.segments[0]] ?? 'accueil'} />
      <Tiroir ouvert={tiroir.ouvert} fermer={tiroir.fermer} />
      <Notification />
    </div>
  );
}
