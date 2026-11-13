import { Icone } from '../composants/Icone.jsx';

const ENGAGEMENTS = [
  ['bible', 'Une Parole fiable', 'La Bible Louis Segond 1910 et des enseignements fondés sur l\'Écriture.', '/assets/objets-bibliques/bible-ouverte.webp'],
  ['grandir', 'Une croissance réelle', 'Vous accompagner dans votre marche quotidienne avec Dieu.', '/assets/symboles/jeune-pousse.webp'],
  ['groupe', 'Un témoignage concret', 'Vous équiper pour annoncer l\'Évangile avec confiance et simplicité.', '/assets/evangelisation/dialogue-avec-un-ancien.webp'],
  ['horsligne', 'Un accès pour tous', 'Des contenus légers, disponibles hors ligne, même sans internet.', '/assets/personnages/femme-souriante.webp'],
  ['bouclier', 'Un usage sûr et respectueux', 'Sans compte, sans publicité, et respectueux de votre vie privée.', null],
];

const PRINCIPES = ['100 % gratuit', 'Aucune publicité', 'Aucun compte', 'Vos données restent sur votre téléphone', 'Fonctionne sans internet'];

// Écran 14 : à propos.
export function APropos() {
  return (
    <div class="page apropos">
      <div class="apropos__hero">
        <img src="/assets/symboles/bible-dans-la-lumiere.webp" alt="" />
      </div>

      <section class="carte apropos__nom">
        <h2>YESHAYA</h2>
        <span class="pastille pastille--or">Signification du nom</span>
        <p>Yeshaya est le nom hébreu du prophète Isaïe. Il signifie : "l'Éternel est salut".</p>
      </section>

      <h2 class="titre-section">Pourquoi Yeshaya ?</h2>
      <section class="carte apropos__texte">
        <p>Beaucoup de chrétiens ont un téléphone simple, une connexion lente et peu de données.
          Yeshaya leur offre gratuitement la Bible, la prière, des enseignements et des outils pour partager leur foi,
          dans une application légère qui fonctionne même sans internet.</p>
      </section>

      <section class="carte apropos__mission">
        <span class="apropos__mission-icone"><Icone nom="cible" taille={30} /></span>
        <div>
          <h3>Notre mission</h3>
          <p>Vous aider à connaître Jésus-Christ, à grandir dans la foi et à partager l'Évangile autour de vous,
            de façon simple, pratique et accessible.</p>
        </div>
      </section>

      <h2 class="titre-section titre-orne">Nos 5 engagements</h2>
      <ol class="engagements">
        {ENGAGEMENTS.map(([icone, titre, texte, image], i) => (
          <li class="carte engagement">
            <span class="engagement__icone"><Icone nom={icone} /></span>
            <div class="engagement__corps">
              <h3><span class="engagement__num">{i + 1}</span> {titre}</h3>
              <p>{texte}</p>
            </div>
            {image && <img src={image} alt="" loading="lazy" />}
          </li>
        ))}
      </ol>

      <h2 class="titre-section">Nos principes</h2>
      <ul class="carte principes">
        {PRINCIPES.map((p) => <li><Icone nom="verifie" taille={20} /> {p}</li>)}
      </ul>

      <section class="carte radio">
        <span class="ligne__icone"><Icone nom="radio" /></span>
        <div class="ligne__corps">
          <h3>Radio Yeshaya</h3>
          <p class="ligne__desc">Une écoute continue d'enseignements et de louanges.</p>
        </div>
        <span class="pastille pastille--or">Bientôt</span>
      </section>

      <h2 class="titre-section">Crédits</h2>
      <section class="carte apropos__texte credits">
        <p><strong>Bible :</strong> Louis Segond 1910, domaine public.</p>
        <p><strong>Enseignements et audios :</strong> la liste des auteurs et de leurs autorisations sera affichée ici.</p>
        <p><strong>Polices :</strong> Poppins (SIL Open Font License) et Roboto (Apache 2.0), hébergées dans l'application.</p>
        <p><strong>Icônes :</strong> dessinées pour Yeshaya, dans le style de Lucide (licence ISC).</p>
        <p><strong>Illustrations :</strong> créées pour Yeshaya.</p>
        <p class="ligne__desc">Version {__VERSION__}</p>
      </section>
    </div>
  );
}
