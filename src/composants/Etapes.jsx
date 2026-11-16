import { Icone } from './Icone.jsx';

// Étapes communes aux petits jeux : chaque étape réussie ouvre la suivante, un peu plus difficile.
const NOMS = ['Premiers pas', 'Apprenti', 'Disciple', 'Serviteur', 'Témoin', 'Ouvrier', 'Sentinelle', 'Ancien', 'Champion', 'Maître'];
export const nomEtape = (n) => NOMS[n] || `Maître ${n - NOMS.length + 2}`;
const cle = (jeu) => 'yeshaya:etape:' + jeu;
export function etapesOuvertes(jeu) { try { return +localStorage.getItem(cle(jeu)) || 0; } catch { return 0; } }
export function reussirEtape(jeu, n) { try { if (n + 1 > etapesOuvertes(jeu)) localStorage.setItem(cle(jeu), String(n + 1)); } catch { /* stockage indisponible */ } }

// Rangée d'étapes : réussies, en cours, suivante verrouillée.
export function BarreEtapes({ jeu, etape, choisir }) {
  const ouvertes = etapesOuvertes(jeu), max = Math.max(ouvertes, etape) + 1;
  return (
    <div class="etapes-jeu" role="list" aria-label="Étapes">
      {Array.from({ length: max + 1 }, (_, k) => {
        const libre = k <= ouvertes, actuelle = k === etape;
        return <button role="listitem" class={'etapes-jeu__pas' + (actuelle ? ' etapes-jeu__pas--actuelle' : '') + (k < ouvertes ? ' etapes-jeu__pas--faite' : '')}
          disabled={!libre || actuelle} onClick={() => choisir(k)} aria-label={`Étape ${k + 1}${libre ? '' : ' (verrouillée)'}`}>
          {libre ? (k < ouvertes && !actuelle ? <Icone nom="verifie" taille={14} /> : k + 1) : <Icone nom="cadenas" taille={14} />}</button>;
      })}
    </div>
  );
}

// Bandeau en haut de la partie.
export const TitreEtape = ({ etape, but }) => (
  <p class="etape-jeu__titre"><b>Étape {etape + 1} · {nomEtape(etape)}</b><span>{but}</span></p>
);

// Écran de fin d'étape.
export function FinEtape({ icone = 'trophee', etape, reussi, score, texte, suivante, rejouer }) {
  return (
    <div class="page resultat-quiz">
      <div class="resultat-quiz__trophee"><Icone nom={icone} taille={56} /></div>
      <p class="resultat-quiz__libelle">Étape {etape + 1} · {nomEtape(etape)}</p>
      <p class="resultat-quiz__score">{score}</p>
      <h2>{reussi ? 'Étape réussie !' : 'Pas encore…'}</h2>
      <p class="resultat-quiz__texte">{texte}</p>
      <div class="resultat-quiz__actions">
        {reussi && <button class="bouton bouton--or" onClick={suivante}>Étape {etape + 2} : {nomEtape(etape + 1)} <Icone nom="chevron" taille={18} /></button>}
        <button class={'bouton ' + (reussi ? 'bouton--contour' : 'bouton--plein')} onClick={rejouer}>{reussi ? 'Rejouer cette étape' : 'Réessayer l\'étape'}</button>
      </div>
    </div>
  );
}
