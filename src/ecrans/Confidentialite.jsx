// Politique de confidentialité : affichée et acceptée à l'entrée, consultable dans les Paramètres.
// Toute modification importante de ce texte doit faire monter VERSION_POLITIQUE (l'utilisateur l'accepte à nouveau).
export const VERSION_POLITIQUE = 1;
export const DATE_POLITIQUE = '14 novembre 2026';

export const RESUME_POLITIQUE = [
  "Yeshaya est gratuit, sans publicité et sans compte.",
  "Pour améliorer l'application et prier pour ses utilisateurs, nous recevons des statistiques d'utilisation anonymes : quelles rubriques et quels contenus sont utilisés, combien de sujets sont priés, combien de personnes disent avoir donné leur vie à Jésus.",
  "Nous ne recevons ni votre nom, ni votre numéro, ni votre adresse, ni votre position, ni ce que vous écrivez dans votre journal ou vos notes.",
  "Ces données ne seront jamais vendues ni utilisées contre vous.",
];

const SECTIONS = [
  ['Qui sommes-nous ?', ["Yeshaya (« L'Éternel est salut ») est une application chrétienne gratuite, conçue pour aider chacun à lire la Bible, prier, grandir dans la foi et partager l'Évangile."]],
  ['Ce qui reste uniquement sur votre téléphone', [
    "Votre profil (prénom, photo), votre journal de prière, vos notes, vos surlignages, vos favoris, vos réponses aux quiz, votre progression et vos téléchargements restent sur votre téléphone. Nous n'y avons pas accès.",
    "Vous pouvez en faire une sauvegarde (Paramètres → Mes données) : le fichier est enregistré sur votre téléphone, nulle part ailleurs."]],
  ['Ce que nous recevons : des statistiques anonymes', [
    "Lorsque vous êtes connecté à internet, l'application envoie des compteurs, regroupés par jour, par exemple : « la rubrique Prière a été ouverte 3 fois », « l'enseignement Le salut a été ouvert », « 12 sujets de prière ont été priés », « une personne a indiqué avoir donné sa vie à Jésus après la présentation Le cœur de l'homme ».",
    "Ces compteurs ne contiennent aucun identifiant : nous ne pouvons pas savoir qui a fait quoi, ni relier deux envois à la même personne. Sans internet, ils attendent sur le téléphone et partent plus tard."]],
  ['Ce que vous choisissez de nous envoyer', [
    "Si vous utilisez « Demander la prière », votre message nous est envoyé, avec le prénom et le moyen de contact que vous choisissez d'indiquer (facultatifs). Il sert uniquement à prier pour vous et, si vous le demandez, à vous répondre. Il est supprimé au plus tard 12 mois après réception, ou plus tôt si vous nous le demandez."]],
  ['Pourquoi nous utilisons ces données', [
    "Pour savoir ce qui aide vraiment les utilisateurs et améliorer l'application ; pour prier pour les personnes qui utilisent Yeshaya et pour celles qui nous confient un sujet de prière.",
    "Ces données ne seront jamais vendues, louées, utilisées pour de la publicité, ni utilisées contre vous."]],
  ['Hébergement et sécurité', [
    "L'application et les statistiques sont hébergées chez Cloudflare. Comme tout service sur internet, ses serveurs peuvent traiter techniquement l'adresse de connexion pour acheminer les données et protéger le service ; nous ne l'enregistrons pas dans nos statistiques.",
    "Seul le responsable de Yeshaya peut consulter les statistiques et les demandes de prière, avec un mot de passe."]],
  ['Vos choix', [
    "L'utilisation de l'application suppose d'accepter cette politique. Si vous ne l'acceptez plus, vous pouvez désinstaller l'application et effacer ses données depuis les réglages de votre téléphone.",
    "Pour toute question ou pour faire supprimer une demande de prière, écrivez-nous via « Demander la prière » en le précisant."]],
  ['Modifications', ["Si cette politique change de façon importante, elle vous sera présentée à nouveau à l'ouverture de l'application."]],
];

export function TextePolitique() {
  return (
    <div class="politique">
      {SECTIONS.map(([t, ps]) => <section><h3>{t}</h3>{ps.map((p) => <p>{p}</p>)}</section>)}
      <p class="ligne__desc">Version {VERSION_POLITIQUE} · {DATE_POLITIQUE}</p>
    </div>
  );
}

export function Confidentialite() {
  return <div class="page"><section class="carte bloc" style="margin-top:12px"><h2 style="margin-top:0">Politique de confidentialité</h2><TextePolitique /></section></div>;
}
