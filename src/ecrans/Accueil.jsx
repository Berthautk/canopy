import { Icone } from '../composants/Icone.jsx';

const ACCES = [
  ['priere', 'Prière', 'priere', 'var(--tuile-priere)', '#2F6FB5'],
  ['grandir', 'Grandir', 'grandir', 'var(--tuile-grandir)', '#3E8A3A'],
  ['evangeliser', 'Évangéliser', 'evangeliser', 'var(--tuile-evang)', '#B7832A'],
  ['bible', 'Bible', 'bible', 'var(--tuile-bible)', '#6A55A8'],
];

// Écran 2 : accueil.
export function Accueil() {
  return (
    <div class="accueil">
      <div class="accueil__hero">
        <img src="/assets/vie-chretienne/homme-louange-soleil.webp" alt="" />
      </div>

      <div class="page">
        {/* Verset du jour : le texte sera lu dans le fichier Louis Segond 1910 (phase 2), jamais tapé à la main. */}
        <section class="carte verset-jour" aria-labelledby="vj">
          <span class="pastille pastille--or verset-jour__pastille"><Icone nom="calendrier" taille={16} /> <span id="vj">Verset du jour</span></span>
          <p class="verset-jour__attente">Le texte du verset s'affichera ici dès que la Bible Louis Segond 1910 sera installée.</p>
          <span class="pastille pastille--ref">Psaume 3:9</span>
        </section>

        <section class="carte audio-jour">
          <img src="/assets/audio/casque-et-bible.webp" alt="" loading="lazy" />
          <div class="audio-jour__corps">
            <h2>Audio du jour <span class="etiquette-exemple">EXEMPLE</span></h2>
            <p class="audio-jour__auteur">Nom de l'orateur</p>
            <p class="audio-jour__titre">Le salut en Jésus-Christ</p>
          </div>
          <button class="audio-jour__lecture" disabled aria-label="Écouter (disponible avec le lecteur audio)">
            <Icone nom="lecture" taille={22} />
          </button>
        </section>

        <nav class="acces" aria-label="Accès rapides">
          {ACCES.map(([id, libelle, icone, fond, couleur]) => (
            <a class="acces__tuile" href={'#/' + id} style={{ background: fond }}>
              <span style={{ color: couleur }}><Icone nom={icone} taille={34} stroke-width="1.8" /></span>
              <span class="acces__libelle">{libelle}</span>
            </a>
          ))}
        </nav>

        <a class="jouer-carte" href="#/jouer">
          <img src="/assets/objets-bibliques/couronne-or.webp" alt="" loading="lazy" />
          <div>
            <h2>Jouer et apprendre</h2>
            <p>Quiz, défis et jeux bibliques pour affermir ta foi</p>
          </div>
          <span class="jouer-carte__fleche"><Icone nom="chevron" taille={22} /></span>
        </a>
      </div>
    </div>
  );
}
