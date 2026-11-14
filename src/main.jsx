import { render } from 'preact';
import './styles/polices.css';
import './styles/theme.css';
import './styles/base.css';
import './styles/ecrans.css';
import './styles/bible.css';
import { App } from './app.jsx';
import { appliquer, chargerReglages } from './donnees/reglages.js';
import { chargerProfil } from './donnees/profil.js';
import { chargerAnnotations, chargerPosition } from './donnees/annotations.js';
import { chargerPlan } from './bible/plans.js';
import { chargerLecteur } from './audio/lecteur.js';
import { chargerTelechargements } from './audio/telechargements.js';
import { chargerPriere } from './donnees/priere.js';
import { demarrerMesure } from './donnees/mesure.js';
import { chargerRythme } from './donnees/rythme.js';
import { chargerProgressionOrizon } from './donnees/orizon.js';
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
demarrerMesure();
chargerRythme();
chargerProgressionOrizon();
chargerDisciple();
chargerStats();
chargerChemin();
render(<App />, document.getElementById('app'));

// Service worker : hors ligne après la première ouverture (uniquement dans la version construite).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
