// Petit sommaire en haut d'une page longue : chaque puce fait descendre à sa partie (sous l'en-tête).
export const allerA = (id) => {
  const el = document.getElementById(id); if (!el) return;
  const haut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--haut-entete')) || 110;
  scrollTo({ top: el.getBoundingClientRect().top + scrollY - haut - 8, behavior: 'smooth' });
};
export function Sommaire({ parties, titre = 'Aller à' }) {
  return (
    <nav class="sommaire" aria-label="Sommaire de la page">
      <span class="sommaire__titre">{titre} :</span>
      {parties.map(([id, nom]) => <button class="puce" onClick={() => allerA(id)}>{nom}</button>)}
    </nav>
  );
}
