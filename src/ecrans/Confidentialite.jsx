import POLITIQUE from '../../content/politique-confidentialite.json';
// Politique de confidentialité (texte dans content/politique-confidentialite.json ; une copie publique est
// générée dans public/confidentialite.html par tools/generer-politique.mjs, pour le Play Store et les moteurs de recherche).
// Toute modification importante doit faire monter « version » : le choix est alors redemandé.
export const VERSION_POLITIQUE = POLITIQUE.version;
export const RESUME_POLITIQUE = POLITIQUE.resume;
const remplir = (t) => t.replaceAll('{contact}', POLITIQUE.contact);

export function TextePolitique() {
  return (
    <div class="politique">
      {POLITIQUE.sections.map(([t, ps]) => <section><h3>{t}</h3>{ps.map((p) => <p>{remplir(p)}</p>)}</section>)}
      <p class="ligne__desc">Version {POLITIQUE.version} · {POLITIQUE.date}</p>
    </div>
  );
}

export function Confidentialite() {
  return <div class="page"><section class="carte bloc" style="margin-top:12px"><h2 style="margin-top:0">Politique de confidentialité</h2><TextePolitique /></section></div>;
}
