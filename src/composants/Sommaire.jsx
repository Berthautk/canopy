// Sommaire discret d'une page longue : une liste déroulante « Aller à… » qui fait descendre à la partie choisie.
export const allerA = (id) => {
  const el = document.getElementById(id); if (!el) return;
  const haut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--haut-entete')) || 110;
  scrollTo({ top: el.getBoundingClientRect().top + scrollY - haut - 8, behavior: 'smooth' });
};
export function Sommaire({ parties }) {
  return (
    <label class="sommaire">
      <span class="sr-only">Aller à une partie de la page</span>
      <select class="champ sommaire__liste" value="" onChange={(e) => { const v = e.currentTarget.value; e.currentTarget.value = ''; if (v) allerA(v); }}>
        <option value="">Aller à une partie de la page…</option>
        {parties.map(([id, nom]) => <option value={id}>{nom}</option>)}
      </select>
    </label>
  );
}
