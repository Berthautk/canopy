import { useEffect, useState } from 'preact/hooks';
import { reglages, modifierReglages } from '../../donnees/reglages.js';
import { useSignal } from '../../outils/signal.js';
import { lireAVoixHaute } from '../../audio/voix.js';

// Protection des yeux dans l'espace Jeux : couleurs adoucies, pause toutes les 20 minutes (règle 20-20-20),
// temps de jeu limité pour les enfants (réglé par le parent, protégé par un petit calcul).
// L'application ne peut pas changer la luminosité du téléphone : elle adoucit seulement son propre affichage.
const CLE = 'yeshaya:jeux-temps';
const jour = () => new Date().toISOString().slice(0, 10);
function lireTemps() { try { const t = JSON.parse(localStorage.getItem(CLE) || '{}'); return t.jour === jour() ? t : { jour: jour(), s: 0, pause: 0 }; } catch { return { jour: jour(), s: 0, pause: 0 }; } }

export function ProtectionYeux({ actif }) {
  const r = useSignal(reglages);
  const [t, setT] = useState(lireTemps);
  const [repos, setRepos] = useState(0);
  const [debloque, setDebloque] = useState(false);
  const on = r.yeux !== false, limite = r.limiteJeux || 0;
  useEffect(() => {
    document.documentElement.classList.toggle('yeux-proteges', actif && on);
    return () => document.documentElement.classList.remove('yeux-proteges');
  }, [actif, on]);
  useEffect(() => {
    if (!actif) return;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setT((x) => { const n = { ...lireTemps(), s: x.s + 1 }; n.pause = (x.pause || 0) + 1;
        if (on && n.pause >= 20 * 60) { n.pause = 0; setRepos(20); lireAVoixHaute('yeux', [{ texte: 'Pause ! Repose tes yeux. Regarde loin, par la fenêtre, pendant vingt secondes.' }]); }
        try { localStorage.setItem(CLE, JSON.stringify(n)); } catch {} return n; });
    }, 1000);
    return () => clearInterval(id);
  }, [actif, on]);
  useEffect(() => { if (repos <= 0) return; const id = setTimeout(() => setRepos(repos - 1), 1000); return () => clearTimeout(id); }, [repos]);
  const fini = actif && limite > 0 && t.s >= limite * 60 && !debloque;
  useEffect(() => { if (fini) lireAVoixHaute('yeux', [{ texte: 'C\'est fini pour aujourd\'hui. Tes yeux ont besoin de repos. À demain !' }]); }, [fini]);
  if (!actif) return null;
  if (fini) return <Fin surDebloquer={() => setDebloque(true)} />;
  if (repos > 0) return (
    <div class="yeux-repos" role="dialog" aria-label="Pause pour les yeux">
      <span aria-hidden="true">👀🌳</span><h2>Repose tes yeux</h2><p>Regarde loin, par la fenêtre.</p><b>{repos}</b>
    </div>);
  return null;
}

function Fin({ surDebloquer }) {
  const [a] = useState(() => 6 + Math.floor(Math.random() * 7)), [b] = useState(() => 3 + Math.floor(Math.random() * 7));
  const [v, setV] = useState('');
  return (
    <div class="yeux-repos" role="dialog" aria-label="Temps de jeu terminé">
      <span aria-hidden="true">🌙</span><h2>C'est fini pour aujourd'hui</h2><p>Tes yeux ont besoin de repos. À demain !</p>
      <details style="margin-top:18px"><summary class="lien" style="color:#fff">Parent : continuer</summary>
        <p style="margin:8px 0">Combien font {a} × {b} ?</p>
        <input class="champ" inputMode="numeric" value={v} onInput={(e) => setV(e.target.value)} style="max-width:120px;text-align:center" />
        <button class="bouton bouton--or bouton--petit" style="margin-left:8px" onClick={() => { if (+v === a * b) surDebloquer(); }}>OK</button></details>
    </div>);
}

export function ReglageYeux() {
  const r = useSignal(reglages), on = r.yeux !== false;
  const [parent, setParent] = useState(false);
  const [a] = useState(() => 6 + Math.floor(Math.random() * 7)), [b] = useState(() => 3 + Math.floor(Math.random() * 7)), [v, setV] = useState('');
  return (
    <div class="carte yeux-reglage">
      <button class={'yeux-bouton' + (on ? ' yeux-bouton--on' : '')} aria-pressed={on} onClick={() => modifierReglages({ yeux: !on })}>
        <span aria-hidden="true">{on ? '🛡️' : '👁'}</span><span><b>Protéger mes yeux</b><small>{on ? 'Activé : couleurs douces et pause toutes les 20 minutes' : 'Désactivé'}</small></span></button>
      <details><summary class="lien">Temps de jeu des enfants : {r.limiteJeux ? r.limiteJeux + ' min par jour' : 'sans limite'}</summary>
        {!parent ? <p style="margin:8px 0">Parent : combien font {a} × {b} ? <input class="champ" inputMode="numeric" value={v} onInput={(e) => setV(e.target.value)} style="width:80px;text-align:center" />
          <button class="bouton bouton--petit bouton--plein" style="margin-left:6px" onClick={() => setParent(+v === a * b)}>OK</button></p>
        : <div class="segments" role="group" aria-label="Temps de jeu" style="margin-top:8px">
          {[[0, 'Libre'], [30, '30 min'], [45, '45 min'], [60, '1 h']].map(([m, t]) => <button aria-pressed={(r.limiteJeux || 0) === m} onClick={() => modifierReglages({ limiteJeux: m })}>{t}</button>)}</div>}
      </details>
    </div>);
}
