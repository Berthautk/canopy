import { useMessageEchecs } from '../../composants/MessageEchecs.jsx';
import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { TOUTES } from './Jouer.jsx';
import { Question } from './Quiz.jsx';
import { lireReference } from '../../bible/references.js';
import { melanger } from '../../jeux/hasard.js';

// « Le Pèlerin » : de Jérusalem à Rome sur les pas de Paul. Une question par ville ;
// une bonne réponse fait avancer, une erreur fait reculer d'une ville (comme au jeu de l'oie).
export const VILLES = [
  ['Jérusalem', 'Ac 9:26-28', 'Tout commence ici, où l\'Église est née.'], ['Damas', 'Ac 9:3-6', 'Sur ce chemin, Saul a rencontré Jésus.'],
  ['Antioche', 'Ac 11:26', 'Ici, pour la première fois, on appela les disciples « chrétiens ».'], ['Chypre', 'Ac 13:4-12', 'Le magicien Élymas devint aveugle.'],
  ['Lystre', 'Ac 14:8-19', 'Un boiteux fut guéri ; Paul fut lapidé.'], ['Philippes', 'Ac 16:25-34', 'En prison, Paul et Silas chantaient à minuit.'],
  ['Thessalonique', 'Ac 17:1-4', 'Paul expliqua les Écritures trois sabbats.'], ['Athènes', 'Ac 17:22-31', 'Paul annonça le Dieu inconnu à l\'Aréopage.'],
  ['Corinthe', 'Ac 18:9-11', '« Ne crains point ; parle. »'], ['Éphèse', 'Ac 19:18-20', 'On brûla les livres de magie.'],
  ['Césarée', 'Ac 26:28-29', 'Le roi Agrippa entendit l\'Évangile.'], ['Malte', 'Ac 28:3-6', 'Une vipère mordit Paul, sans lui faire de mal.'], ['Rome', 'Ac 28:30-31', 'Paul y prêcha le royaume de Dieu sans obstacle.'],
];

export function Pelerin() {
  const [echecMsg, voileMsg] = useMessageEchecs(3);
  const [pos, setPos] = useState(0), [q, setQ] = useState(null), [msg, setMsg] = useState(null), [tours, setTours] = useState(0);
  const arrive = pos === VILLES.length - 1;
  if (q) return <div class="page"><p class="quiz__compteur" style="margin-top:12px">📍 Épreuve à {VILLES[Math.min(pos + 1, VILLES.length - 1)][0]}</p>
    <Question q={q} numero={1} total={1} surReponse={(ok) => { if (!ok) echecMsg(); setMsg(ok ? 'avance' : 'recule'); setTours(tours + 1); }}
      surSuivant={() => { setPos(msg === 'avance' ? pos + 1 : Math.max(0, pos - 1)); setQ(null); scrollTo(0, 0); }} /></div>;
  return (
    <div class="page">{voileMsg}
      <p class="jouer-intro" style="margin-top:12px">De Jérusalem à Rome sur les pas de l'apôtre Paul. Réponds juste pour avancer ; une erreur te fait reculer d'une ville.</p>
      {msg && <p class={'pelerin-msg ' + (msg === 'avance' ? 'ok' : '')}>{msg === 'avance' ? '✅ Tu avances !' : '↩️ Tu recules d\'une ville.'}</p>}
      <ol class="pelerin">
        {VILLES.map(([v, ref, txt], i) => <li class={'pelerin__ville' + (i === pos ? ' pelerin__ville--ici' : i < pos ? ' pelerin__ville--fait' : '')}>
          <span class="pelerin__pion">{i === pos ? '🚶' : i < pos ? '✓' : i + 1}</span>
          <span class="ligne__corps"><b>{v}</b>{i === pos && <span class="ligne__desc" style="display:block">{txt} <a class="lien" href={lien(ref)}>{ref}</a></span>}</span></li>)}
      </ol>
      {arrive ? <div class="carte bloc" style="text-align:center"><h2>🏛️ Tu es arrivé à Rome !</h2><p>En {tours} épreuves. « J'ai combattu le bon combat, j'ai achevé la course, j'ai gardé la foi. » (2 Ti 4:7)</p>
        <button class="bouton bouton--or" onClick={() => { setPos(0); setTours(0); setMsg(null); }}>Repartir de Jérusalem</button></div>
        : <button class="bouton bouton--or quiz__suivant" onClick={() => setQ(melanger(TOUTES())[0])}>Marcher vers {VILLES[pos + 1][0]} <Icone nom="chevron" taille={18} /></button>}
    </div>
  );
}

function lien(ref) { const r = lireReference(ref); return r ? `#/bible/lire/${r.code}/${r.c}/${r.v || 1}` : '#/bible'; }
