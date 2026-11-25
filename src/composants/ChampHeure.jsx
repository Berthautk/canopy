// Choix d'une heure en format 24 h (le champ « time » du navigateur affiche parfois AM/PM en anglais).
const deux = (n) => String(n).padStart(2, '0');
export function ChampHeure({ id, valeur, surChangement }) {
  const [h, m] = (valeur || '19:00').split(':').map((x) => parseInt(x, 10) || 0), mm = Math.round(m / 5) * 5 % 60;
  const maj = (nh, nm) => surChangement(`${deux(nh)}:${deux(nm)}`);
  return (
    <span class="champ-heure" role="group" aria-label="Heure">
      <select id={id} class="champ" aria-label="Heures" value={h} onChange={(e) => maj(+e.currentTarget.value, mm)}>{Array.from({ length: 24 }, (_, i) => <option value={i}>{deux(i)}</option>)}</select>
      <b>h</b>
      <select class="champ" aria-label="Minutes" value={mm} onChange={(e) => maj(h, +e.currentTarget.value)}>{Array.from({ length: 12 }, (_, i) => <option value={i * 5}>{deux(i * 5)}</option>)}</select>
    </span>
  );
}
