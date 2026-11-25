import { Icone } from '../composants/Icone.jsx';
import { Avatar } from '../composants/Avatar.jsx';
import { profil } from '../donnees/profil.js';
import { useSignal } from '../outils/signal.js';

// Tout ce qui ne mérite pas un onglet, rangé en trois groupes, avec des mots simples.
const GROUPES = [
  ['Partager et apprendre en jouant', [
    ['#/evangeliser', 'evangeliser', 'Partager ma foi', "Parler de Jésus avec amour : approches, dialogues, témoignage."],
    ['#/jouer', 'trophee', 'Jouer et apprendre', 'Quiz, défis et jeux bibliques, pour les petits et les grands.'],
  ]],
  ['Pour moi', [
    ['#/priere/demander', 'coeur', 'Un fardeau ? Nous prions pour toi', "Écris ton sujet de prière en toute discrétion."],
    ['#/equilibre', 'calendrier', 'Mon équilibre avec Dieu', 'Mon rythme de prière, de Parole et de méditation, avec rappels.'],
    ['#/priere/journal', 'note', 'Mon journal de prière', 'Mes requêtes et mes prières exaucées.'],
    ['#/accompagner', 'groupe', 'Suivi des nouveaux convertis', 'Tu es nouveau converti, ou tu en accompagnes un ? Commence ici.'],
  ]],
  ["Mon application", [
    ['#/telechargements', 'telecharger', 'Installer et utiliser sans internet', 'Garder Yeshaya sur ton téléphone, avec la Bible et les enseignements.'],
    ['#/parametres', 'reglages', 'Paramètres', 'Mon prénom, la taille du texte, la voix, le thème, mes données.'],
    ['#/a-propos', 'info', 'À propos de Yeshaya', 'Qui sommes-nous ? Pour qui ? Pourquoi ?'],
    ['#/confidentialite', 'bouclier', 'Confidentialité', 'Ce qui reste sur ton téléphone et ce que nous ne collectons pas.'],
  ]],
];

// Onglet « Plus ».
export function Plus() {
  const p = useSignal(profil);
  return (
    <div class="page">
      <a class="carte ligne" href="#/parametres" style="margin-top:12px">
        <Avatar taille={48} />
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">{p.prenom ? 'Bonjour ' + p.prenom : 'Mon profil'}</span>
          <span class="ligne__desc">Modifier ma photo et mon prénom</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      {GROUPES.map(([titre, lignes]) => (
        <section>
          <h2 class="titre-section">{titre}</h2>
          <div class="liste">
            {lignes.map(([lien, icone, t, d]) => (
              <a class="carte ligne" href={lien}>
                <span class="ligne__icone"><Icone nom={icone} /></span>
                <span class="ligne__corps"><span class="ligne__titre" style="display:block">{t}</span><span class="ligne__desc">{d}</span></span>
                <Icone nom="chevron" taille={20} />
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
