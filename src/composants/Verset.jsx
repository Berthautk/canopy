import { useEffect, useState } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { lireReference, ecrireReference, cleVerset } from '../bible/references.js';
import { textePassage } from '../bible/bible.js';
import { annotations, basculerFavori } from '../donnees/annotations.js';
import { useSignal } from '../outils/signal.js';
import { partager } from '../outils/partage.js';

// Charge le texte LSG d'une référence écrite dans un fichier de contenu (« Jn 3:16 »).
export function usePassage(refTexte) {
  const [etat, setEtat] = useState({ chargement: true });
  useEffect(() => {
    const r = typeof refTexte === 'string' ? lireReference(refTexte) : refTexte;
    if (!r) { setEtat({ erreur: 'Référence inconnue : ' + refTexte }); return; }
    let actif = true; setEtat({ chargement: true, ref: r });
    textePassage(r).then((vs) => actif && setEtat({ ref: r, versets: vs, texte: vs.map((x) => x.texte.replace(/\n/g, ' ')).join(' ') }))
      .catch(() => actif && setEtat({ ref: r, erreur: 'Texte indisponible hors connexion. Téléchargez la Bible pour l\'utiliser sans internet.' }));
    return () => { actif = false; };
  }, [typeof refTexte === 'string' ? refTexte : JSON.stringify(refTexte)]);
  return etat;
}

export const cheminMontrer = (r) => `montrer/${r.code}/${r.c}/${r.v}${r.fin ? '-' + r.fin : ''}`;
export const cheminLire = (r) => `bible/lire/${r.code}/${r.c}${r.v ? '/' + r.v : ''}`;

// Texte d'un passage entre guillemets français + référence.
export function TextePassage({ etat, grand }) {
  if (etat.erreur) return <p class="verset__erreur">{etat.erreur}</p>;
  if (etat.chargement) return <p class="verset__attente">Chargement du verset…</p>;
  return <p class={'verset__texte' + (grand ? ' verset__texte--grand' : '')}>«&nbsp;{etat.texte}&nbsp;»</p>;
}

// Carte de verset (sujets, chemin du salut…) : texte + Montrer / Partager / Favori.
export function CarteVerset({ reference }) {
  const etat = usePassage(reference);
  const notes = useSignal(annotations);
  const r = etat.ref;
  const cle = r ? cleVerset(r.code, r.c, r.v) : null;
  const favori = cle && notes[cle]?.favori;
  return (
    <article class="carte verset">
      <div class="verset__tete">
        <a class="verset__ref" href={r ? '#/' + cheminLire(r) : undefined}><Icone nom="bible" taille={18} /> {r ? ecrireReference(r) : reference}</a>
        {r && <button class={'verset__favori' + (favori ? ' actif' : '')} onClick={() => basculerFavori(cle)} aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={!!favori}><Icone nom="coeur" taille={20} /></button>}
      </div>
      <TextePassage etat={etat} />
      {etat.texte && (
        <div class="verset__actions">
          <a class="bouton bouton--contour bouton--petit" href={'#/' + cheminMontrer(r)}><Icone nom="agrandir" taille={18} /> Montrer</a>
          <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: ecrireReference(r), texte: `« ${etat.texte} » — ${ecrireReference(r)} (LSG)`, chemin: cheminLire(r) })}>
            <Icone nom="partager" taille={18} /> Partager
          </button>
        </div>
      )}
    </article>
  );
}
