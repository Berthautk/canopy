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
