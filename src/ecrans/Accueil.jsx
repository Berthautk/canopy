import { Icone } from '../composants/Icone.jsx';
import { usePassage, TextePassage, cheminMontrer } from '../composants/Verset.jsx';
import { BandeauTelephone } from '../composants/BandeauTelephone.jsx';
import { prochainParcours } from './grandir/NouveauConverti.jsx';
import { CartePlanJour } from './bible/Plan.jsx';
import { versetDuJour, veilleDuMoment, ENSEIGNEMENTS } from '../donnees/contenu.js';
import { orizon, jourCourant } from '../donnees/orizon.js';
import { parcours } from '../donnees/priere.js';
import { lectures } from '../donnees/lectures.js';
import { plan } from '../bible/plans.js';
import { profil } from '../donnees/profil.js';
import { derniereEcoute, jouer, formatTemps, lecteur } from '../audio/lecteur.js';
import { useSignal } from '../outils/signal.js';
import { ecrireReference } from '../bible/references.js';
import { partagerImageVerset } from '../outils/partage.js';


// Six grandes portes, avec des mots simples : on sait où aller sans connaître l'application.
const TUILES = [
  ['#/priere', 'prier-femme-bible-matin', 'Prier', () => { const v = veilleDuMoment(); return v ? `${v.titre} · ${v.heures}` : 'Veilles, prières et combat spirituel'; }, '#6a4fc4'],
  ['#/accompagner', 'grandir-accompagnement', 'Nouveaux convertis', 'Je suis un nouveau converti, ou un berger', '#c4553b'],
  ['#/grandir', 'grandir-groupe-manguier', 'Grandir', 'Enseignements, parcours, accompagnement', '#3fa66b'],
  ['#/bible', 'bible-ouverte-table', 'La Bible', 'Lire, chercher, méditer', '#3b6fc4'],
  ['#/evangeliser', 'partager-conversation-boutique', 'Évangéliser', 'Partager ma foi et parler de Jésus avec amour', '#d69a1c'],
  ['#/jouer', 'jouer-cartes-enfants', 'Jouer et apprendre', 'Quiz, défis, jeux pour tous âges', '#2a9db0'],
];

// Une seule carte : la meilleure prochaine étape pour cette personne, choisie selon ce qu'elle a déjà commencé.
function ProchaineEtape({ reprendre }) {
  const p = useSignal(parcours), o = useSignal(orizon), pl = useSignal(plan), { lus, dernier } = useSignal(lectures);
  const v = veilleDuMoment();
  const carte = (lien, image, tag, titre, desc, extra) => (
    <a class="carte ligne carte-parcours prochaine-etape" href={lien} onClick={extra}>
      {image && <img src={image} alt="" loading="lazy" />}
      <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">{tag}</span>
        <span class="ligne__titre" style="display:block">{titre}</span>
        <span class="ligne__desc">{desc}</span></span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
  if (reprendre) return (
    <button class="carte ligne carte-parcours prochaine-etape" onClick={() => jouer(reprendre.piste)} style="width:100%;text-align:left">
      <span class="continuer__icone"><Icone nom="lecture" taille={22} /></span>
      <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">Ta prochaine étape</span>
        <span class="ligne__titre" style="display:block">Continuer l'écoute : {reprendre.piste.titre}</span>
        <span class="ligne__desc">{formatTemps(reprendre.position)} sur {formatTemps(reprendre.duree)}</span></span>
      <Icone nom="chevron" taille={20} />
    </button>
  );
  const pc = prochainParcours(p);
  if (pc) return carte(pc.lien, pc.image, 'Ta prochaine étape · ' + pc.tag, pc.titre, pc.desc);
  if (o.faits.length && o.faits.length < 90) return carte('#/orizon/jour/' + jourCourant(), '/assets/temoignage/chaines-brisees.webp', 'Ta prochaine étape', 'Vaincre en 90 jours : jour ' + jourCourant(), 'Ta journée t\'attend. Un pas à la fois.');
  if (pl) return <CartePlanJour style="margin:0" />;
  const reprise = dernier && !lus.includes(dernier) ? ENSEIGNEMENTS.find((e) => e.id === dernier) : null;
  if (reprise) return carte('#/grandir/enseignement/' + reprise.id, reprise.image, 'Ta prochaine étape', 'Reprendre : ' + reprise.titre, 'Là où tu t\'es arrêté.');
  if (!(p.dj || []).length && !p.faits.length) return carte('#/grandir/decouvrir-jesus', '/assets/jesus/jesus-main-tendue.webp', 'Nouveau ici ?', 'Découvrir Jésus', 'Qui est-il vraiment ? Comment lui donner ta vie ? 10 courtes leçons.');
  return v ? carte('#/priere/veille/' + v.id.replace('veille-', ''), v.image, 'Ta prochaine étape · ' + v.heures, v.titre, v.theme) : null;
}

const salutation = (prenom) => {
  const h = new Date().getHours(), mot = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return prenom ? `${mot}, ${prenom} !` : `${mot} !`;
};

// Écran 2 : accueil.
export function Accueil() {
  const prenom = useSignal(profil).prenom;
  const etat = usePassage(versetDuJour());
  const derniere = useSignal(derniereEcoute);
  const enCours = useSignal(lecteur).piste;
  const reprendre = derniere && derniere.position > 5 && derniere.position < derniere.duree - 5 && enCours?.id !== derniere.piste.id ? derniere : null;
  return (
    <div class="accueil">
      <div class="accueil__hero">
        <img src="/assets/photos/banniere-accueil.webp" alt="" />
        <div class="accueil__salut"><h2>{salutation(prenom)}</h2><p>Que la paix de Dieu soit avec toi aujourd'hui.</p></div>
      </div>

      <div class="page">
        {/* Verset du jour : texte lu dans la Bible LSG 1910 (référence tirée de content/versets-du-jour.json). */}
        <section class="carte verset-jour" aria-labelledby="vj">
          <span class="pastille pastille--or verset-jour__pastille"><Icone nom="calendrier" taille={16} /> <span id="vj">Verset du jour</span></span>
          <TextePassage etat={etat} />
          {etat.ref && <a class="pastille pastille--ref" href={'#/' + cheminMontrer(etat.ref)}>{ecrireReference(etat.ref)}</a>}
          {etat.texte && <button class="lien" style="display:flex;align-items:center;gap:6px;margin:8px auto 0" onClick={() => partagerImageVerset({ texte: etat.texte, reference: ecrireReference(etat.ref) })}><Icone nom="partager" taille={16} /> Partager en image</button>}
        </section>

        <ProchaineEtape reprendre={reprendre} />

        <h2 class="titre-section sous-rubrique">Que veux-tu faire ?</h2>
        <nav class="tuiles-accueil" aria-label="Rubriques">
          {TUILES.map(([lien, photo, titre, desc, couleur]) => (
            <a class="tuile-accueil" href={lien} style={{ '--c': couleur }}>
              <img src={'/assets/photos/' + photo + '.webp'} alt="" loading="lazy" />
              <b>{titre}</b><span>{typeof desc === 'function' ? desc() : desc}</span>
            </a>
          ))}
        </nav>

        <BandeauTelephone />
      </div>
    </div>
  );
}
