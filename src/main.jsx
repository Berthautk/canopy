import { render } from 'preact';
import './styles/polices.css';
import './styles/theme.css';
import './styles/base.css';
import './styles/ecrans.css';
import { App } from './app.jsx';
import { appliquer, chargerReglages } from './donnees/reglages.js';

appliquer();                 // thème et taille du texte depuis la copie locale, avant le premier rendu
chargerReglages();           // puis lecture d'IndexedDB
render(<App />, document.getElementById('app'));

// Service worker : hors ligne après la première ouverture (uniquement dans la version construite).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
