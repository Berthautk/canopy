import { useEffect, useState } from 'preact/hooks';
import { Entete, BarreOnglets, Tiroir, useTiroir, Bientot } from './composants/Structure.jsx';
import { Demarrage } from './ecrans/Demarrage.jsx';
import { Accueil } from './ecrans/Accueil.jsx';
import { Parametres } from './ecrans/Parametres.jsx';
import { APropos } from './ecrans/APropos.jsx';
import { route, ONGLET_DE } from './outils/routeur.js';
import { useSignal } from './outils/signal.js';
import { reglages, modifierReglages, demanderStockagePersistant } from './donnees/reglages.js';

// Écrans des phases suivantes : affichés comme « Bientôt disponible » en attendant.
const A_VENIR = {
  priere: ['Prière', '/assets/priere/mains-levees.webp', 'Thèmes de prière, sujets à prier, enseignements audio et journal de prière.'],
  grandir: ['Grandir', '/assets/nouveau-converti/etude-de-la-bible.webp', 'Enseignements par thèmes, séries et parcours « Nouveau converti » sur 30 jours.'],
  evangeliser: ['Évangéliser', '/assets/evangelisation/partage-bible-dans-la-rue.webp', 'Motivation, formation, dialogues et réponses aux objections.'],
  bible: ['Bible', '/assets/objets-bibliques/bible-ouverte.webp', 'La Bible Louis Segond 1910 complète, lisible hors ligne, avec recherche, plans de lecture et favoris.'],
  jouer: ['Jouer et apprendre', '/assets/jeux/banniere-quiz-biblique.webp', 'Quiz du jour, « Complète le verset », « Qui suis-je ? », duel à deux et badges.'],
  telechargements: ['Mes téléchargements', '/assets/audio/telephone-lecteur-audio.webp', 'Les audios téléchargés pour l\'écoute hors ligne et l\'espace qu\'ils occupent.'],
};

const TITRES = { parametres: "Paramètres de l'application", 'a-propos': 'À propos de Yeshaya', jouer: 'Jouer et apprendre', telechargements: 'Mes téléchargements' };

function Ecran({ id }) {
  if (id === 'accueil') return <Accueil />;
  if (id === 'parametres') return <Parametres />;
  if (id === 'a-propos') return <APropos />;
  const v = A_VENIR[id];
  if (v) return <div class="page" style="padding-top:12px"><Bientot titre={v[0]} image={v[1]} texte={v[2]} /></div>;
  return <div class="page" style="padding-top:12px"><Bientot titre="Page introuvable" texte="Cette page n'existe pas." /></div>;
}

export function App() {
  const id = useSignal(route);
  const r = useSignal(reglages);
  const tiroir = useTiroir();
  const [demarrage, setDemarrage] = useState(true);

  // Écran de démarrage : court à chaque ouverture, bandeau des engagements au premier lancement.
  useEffect(() => {
    if (r.premierLancementVu) { const t = setTimeout(() => setDemarrage(false), 900); return () => clearTimeout(t); }
  }, [r.premierLancementVu]);

  if (demarrage) {
    return (
      <Demarrage premierLancement={!r.premierLancementVu}
        surCommencer={() => { modifierReglages({ premierLancementVu: true }); demanderStockagePersistant(); setDemarrage(false); }} />
    );
  }

  const onglet = ONGLET_DE[id] ?? 'accueil';
  return (
    <div class="app">
      <Entete titre={TITRES[id]} surMenu={tiroir.ouvrir} />
      <main id="contenu"><Ecran id={id} /></main>
      <BarreOnglets actif={onglet} />
      <Tiroir ouvert={tiroir.ouvert} fermer={tiroir.fermer} />
    </div>
  );
}
