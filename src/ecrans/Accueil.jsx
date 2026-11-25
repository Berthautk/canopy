import { useEffect } from 'preact/hooks';
import { Icone } from '../composants/Icone.jsx';
import { usePassage, cheminMontrer } from '../composants/Verset.jsx';
import { Carrousel, Diapo } from '../composants/Carrousel.jsx';
import { BandeauTelephone } from '../composants/BandeauTelephone.jsx';
import { prochainParcours } from './grandir/NouveauConverti.jsx';
import { CartePlanJour } from './bible/Plan.jsx';
import { versetDuJour, veilleDuMoment, enseignementDuJour, meditationDuJour, ENSEIGNEMENTS } from '../donnees/contenu.js';
import { orizon, jourCourant } from '../donnees/orizon.js';
import { parcours } from '../donnees/priere.js';
import { lectures } from '../donnees/lectures.js';
import { plan } from '../bible/plans.js';
import { profil } from '../donnees/profil.js';
import { rythme, temps, chargerRythme, bilan, ACTIVITES } from '../donnees/rythme.js';
import { derniereEcoute, jouer, formatTemps, lecteur } from '../audio/lecteur.js';
import { useSignal } from '../outils/signal.js';
import { ecrireReference } from '../bible/references.js';

// Six grandes portes, avec des mots simples : on sait où aller sans connaître l'application.
const TUILES = [
  ['#/priere', 'prier-femme-bible-matin', 'Prier', () => { const v = veilleDuMoment(); return v ? `${v.titre} · ${v.heures}` : 'Veilles, prières et combat spirituel'; }],
  ['#/accompagner', 'grandir-accompagnement', 'Nouveaux convertis', 'Je suis un nouveau converti, ou un berger'],
  ['#/grandir', 'grandir-groupe-manguier', 'Grandir', 'Enseignements, parcours, accompagnement'],
  ['#/bible', 'bible-ouverte-table', 'La Bible', 'Lire, chercher, méditer'],
  ['#/evangeliser', 'partager-conversation-boutique', 'Évangéliser', 'Partager ma foi et parler de Jésus avec amour'],
  ['#/jouer', 'jouer-cartes-enfants', 'Jouer et apprendre', 'Quiz, défis, jeux pour tous âges'],
];

const court = (s, n) => (s && s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s || '');

// Les bannières du jour : ce qui change chaque matin, l'un après l'autre.
function BannieresDuJour() {
  const etat = usePassage(versetDuJour());      // etat.ref : la référence analysée (code, chapitre, verset)
  const ens = enseignementDuJour(new Date()), med = meditationDuJour(new Date()), v = veilleDuMoment();
  const diapos = [];
  if (etat.ref) diapos.push(<Diapo lien={'#/' + cheminMontrer(etat.ref)} image="/assets/photos/banniere-accueil.webp" bas="40%"
    etiquette="Verset du jour" titre={etat.texte ? '« ' + court(etat.texte, 95) + ' »' : 'Le verset de ce jour'} texte={ecrireReference(etat.ref) + ' · toucher pour le lire en grand'} />);
  if (v) diapos.push(<Diapo lien={'#/priere/veille/' + v.id.replace('veille-', '')} image={v.image}
    etiquette={'Prier maintenant · ' + v.heures} titre={v.titre} texte={v.theme} />);
  if (ens) diapos.push(<Diapo lien={'#/grandir/enseignement/' + ens.id} image={ens.image}
    etiquette="Enseignement du jour" titre={ens.titre} texte={`${ens.lecture_minutes} min · à lire ou à écouter`} />);
  if (med) diapos.push(<Diapo lien="#/bible/meditation" image="/assets/photos/bible-ouverte-table.webp"
    etiquette="Méditation du jour" titre={med.titre} texte={`${med.reference} · un texte, une question, un verset à retenir`} />);
  return <Carrousel diapos={diapos} etiquette="À la une aujourd'hui" />;
}

// Une seule carte : la meilleure prochaine étape pour cette personne, choisie selon ce qu'elle a déjà commencé.
function ProchaineEtape({ reprendre }) {
  const p = useSignal(parcours), o = useSignal(orizon), pl = useSignal(plan), { lus, dernier } = useSignal(lectures);
  const carte = (lien, image, tag, titre, desc) => (
    <a class="carte ligne carte-parcours prochaine-etape" href={lien}>
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
  return null;
}

const duree = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)} min`);

// Mes temps avec Dieu : calculé sur ce téléphone seulement, jamais envoyé nulle part.
function MesTemps() {
  useSignal(temps); useSignal(rythme);
  useEffect(() => { if (rythme.valeur === null) chargerRythme(); }, []);
  const b = bilan(7);
  const l = Object.entries(b).map(([k, v]) => ({ k, ...ACTIVITES[k], minutes: v.minutes })).filter((x) => x.minutes >= 1).sort((a, c) => c.minutes - a.minutes);
  const total = l.reduce((s, x) => s + x.minutes, 0);
  if (!total) return null;
  return (
    <>
      <div class="titre-rang">
        <h2 class="titre-section sous-rubrique" style="margin:0">Mes temps avec Dieu</h2>
        <a class="lien" href="#/equilibre">Tout voir</a>
      </div>
      <p class="ligne__desc" style="margin:-6px 4px 10px">Ces 7 derniers jours, {duree(total)} au total. Ce décompte reste sur ton téléphone.</p>
      <div class="stats-perso">
        {l.slice(0, 4).map((x) => (
          <div class="stat-perso">
            <span class="stat-perso__nom"><Icone nom={x.icone} taille={15} /> {x.nom}</span>
            <b>{duree(x.minutes)}</b>
            <span class="stat-perso__part"><i style={{ width: Math.max(4, (x.minutes / total) * 100) + '%' }} /></span>
            <span class="stat-perso__pc">{Math.round((x.minutes / total) * 100)} % de ton temps</span>
          </div>
        ))}
      </div>
    </>
  );
}

const salutation = (prenom) => {
  const h = new Date().getHours(), mot = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return prenom ? `${mot}, ${prenom}` : mot;
};

// Écran 2 : accueil.
export function Accueil() {
  const prenom = useSignal(profil).prenom;
  const derniere = useSignal(derniereEcoute);
  const enCours = useSignal(lecteur).piste;
  const reprendre = derniere && derniere.position > 5 && derniere.position < derniere.duree - 5 && enCours?.id !== derniere.piste.id ? derniere : null;
  return (
    <div class="page accueil">
      <header class="accueil__tete">
        <h2>{salutation(prenom)}</h2>
        <p>Que la paix de Dieu soit avec toi aujourd'hui.</p>
      </header>

      <BannieresDuJour />

      <ProchaineEtape reprendre={reprendre} />

      <h2 class="titre-section sous-rubrique">Que veux-tu faire ?</h2>
      <nav class="tuiles" aria-label="Rubriques">
        {TUILES.map(([lien, photo, titre, desc]) => (
          <a class="tuile" href={lien}>
            <img src={'/assets/photos/' + photo + '.webp'} alt="" loading="lazy" />
            <b>{titre}</b><span>{typeof desc === 'function' ? desc() : desc}</span>
          </a>
        ))}
      </nav>

      <MesTemps />
      <BandeauTelephone />
    </div>
  );
}
