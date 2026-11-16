// Petit « signal » réactif sans dépendance : une valeur + des abonnés.
import { useEffect, useState } from 'preact/hooks';

export function signal(initiale) {
  let v = initiale;
  const abonnes = new Set();
  return {
    get valeur() { return v; },
    set valeur(n) { v = n; abonnes.forEach((f) => f(n)); },
    abonner(f) { abonnes.add(f); return () => abonnes.delete(f); },
  };
}

export function useSignal(s) {
  const [v, setV] = useState(s.valeur);
  useEffect(() => s.abonner(setV), [s]);
  return v;
}

// État d'écran gardé pendant la session (étape ouverte, sujets cochés…) : quand on part lire un verset
// dans la Bible puis qu'on revient, la page se retrouve exactement comme on l'avait laissée.
export function useMemoire(cle, defaut) {
  const k = 'yeshaya:etat:' + (location.hash || '#/') + ':' + cle;
  const [v, setV] = useState(() => { try { const s = sessionStorage.getItem(k); return s == null ? (typeof defaut === 'function' ? defaut() : defaut) : JSON.parse(s); } catch { return typeof defaut === 'function' ? defaut() : defaut; } });
  const fixer = (x) => { const n = typeof x === 'function' ? x(v) : x; setV(n); try { sessionStorage.setItem(k, JSON.stringify(n)); } catch {} };
  return [v, fixer];
}
