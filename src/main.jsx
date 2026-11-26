import { surveillerMisesAJour } from './outils/miseAJour.js';
import { render } from 'preact';
import './styles/polices.css';
import './styles/theme.css';
import './styles/base.css';
import './styles/ecrans.css';
import './styles/bible.css';
import { App } from './app.jsx';
import './audio/surlignage.js';
import { appliquer, chargerReglages } from './donnees/reglages.js';
import { chargerProfil } from './donnees/profil.js';
import { chargerAnnotations, chargerPosition } from './donnees/annotations.js';
import { chargerPlan } from './bible/plans.js';
import { chargerLecteur } from './audio/lecteur.js';
import { chargerTelechargements } from './audio/telechargements.js';
import { chargerPriere } from './donnees/priere.js';
import { chargerNotesVeilles } from './donnees/notesVeilles.js';
import { demarrerMesure } from './donnees/mesure.js';
import { chargerRythme, verifierRappels } from './donnees/rythme.js';
import { notifier } from './composants/Notification.jsx';
import { chargerProgressionOrizon } from './donnees/orizon.js';
import { chargerPourQuelquun } from './donnees/pourQuelquun.js';
import { chargerDisciple } from './donnees/disciple.js';
import { chargerStats } from './jeux/stats.js';
import { chargerChemin } from './jeux/chemin.js';

appliquer();                 // thème et taille du texte depuis la copie locale, avant le premier rendu
chargerReglages();           // puis lecture d'IndexedDB
chargerProfil();
chargerAnnotations();
chargerPosition();
chargerPlan();
chargerLecteur();
chargerTelechargements();
chargerPriere();
chargerNotesVeilles();
demarrerMesure();
chargerRythme();
setInterval(() => verifierRappels(notifier), 30000);   // rappels pendant que l'application est ouverte
chargerProgressionOrizon();
chargerPourQuelquun();
chargerDisciple();
chargerStats();
chargerChemin();
render(<App />, document.getElementById('app'));

// Service worker : hors ligne après la première ouverture (uniquement dans la version construite).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => surveillerMisesAJour());
}

// À l'impression (fiches, PDF d'un pas), les sections repliées doivent sortir elles aussi :
// on les ouvre le temps de l'impression, puis on les referme comme elles étaient.
let repliees = [];
addEventListener('beforeprint', () => {
  repliees = [...document.querySelectorAll('details:not([open])')];
  repliees.forEach((d) => d.setAttribute('open', ''));
});
addEventListener('afterprint', () => { repliees.forEach((d) => d.removeAttribute('open')); repliees = []; });
