import { LIVRES, PAR_CODE } from '../../bible/references.js';

// Choix du livre (AT / NT), puis du chapitre.
export function Livres({ code }) {
  if (code && PAR_CODE[code]) {
    const l = PAR_CODE[code];
    return (
      <div class="page">
        <h2 class="titre-section">{l.nom} — choisir un chapitre</h2>
        <div class="grille-chapitres">
          {l.chapitres.map((_, i) => <a class="carte pastille-chapitre" href={`#/bible/lire/${code}/${i + 1}`}>{i + 1}</a>)}
        </div>
      </div>
    );
  }
  const bloc = (titre, livres) => (
    <>
      <h2 class="titre-section">{titre}</h2>
      <div class="grille-livres">
        {livres.map((l) => (
          <a class="carte livre" href={l.chapitres.length === 1 ? `#/bible/lire/${l.code}/1` : `#/bible/livres/${l.code}`}>
            <span class="livre__nom">{l.nom}</span>
            <span class="livre__ch">{l.chapitres.length} ch.</span>
          </a>
        ))}
      </div>
    </>
  );
  return <div class="page">{bloc('Ancien Testament', LIVRES.slice(0, 39))}{bloc('Nouveau Testament', LIVRES.slice(39))}</div>;
}
