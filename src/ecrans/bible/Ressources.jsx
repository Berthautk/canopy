import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { annotations, COULEURS } from '../../donnees/annotations.js';
import { lireCle, ecrireReference, simplifier } from '../../bible/references.js';
import { texteVerset } from '../../bible/bible.js';
import { useSignal } from '../../outils/signal.js';

const ONGLETS = [['favoris', 'Favoris', 'coeur'], ['surlignages', 'Surlignages', 'surligner'], ['notes', 'Notes', 'note']];

function Element({ cle, a }) {
  const r = lireCle(cle);
  const [texte, setTexte] = useState('');
  useEffect(() => { texteVerset(r.code, r.c, r.v).then((t) => setTexte((t || '').replace(/\n/g, ' '))).catch(() => setTexte('')); }, [cle]);
  return (
    <a class="carte ressource" href={`#/bible/lire/${r.code}/${r.c}/${r.v}`} style={a.couleur ? { borderLeftColor: COULEURS[a.couleur] } : undefined}>
      <span class="ressource__tete">
        <span class="resultat__ref">{ecrireReference(r)}</span>
        {a.favori && <span class="ressource__favori"><Icone nom="coeur" taille={14} /> Favori</span>}
      </span>
      {texte && <span class="resultat__texte">« {texte} »</span>}
      {a.note && <span class="ressource__note"><Icone nom="note" taille={14} /> <b>Ma note :</b> {a.note}</span>}
    </a>
  );
}

// Écran 24 : favoris, surlignages et notes.
export function Ressources() {
  const tout = useSignal(annotations);
  const [onglet, setOnglet] = useState('favoris');
  const [filtre, setFiltre] = useState('');
  const liste = Object.entries(tout).filter(([, a]) => (onglet === 'favoris' ? a.favori : onglet === 'notes' ? a.note : a.couleur));
  const f = simplifier(filtre);
  const visibles = liste.filter(([k, a]) => !f || simplifier(ecrireReference(lireCle(k)) + ' ' + (a.note || '')).includes(f))
    .sort(([, a], [, b]) => (b.favori || b.noteDate || '').localeCompare(a.favori || a.noteDate || ''));
  const compte = (id) => Object.values(tout).filter((a) => (id === 'favoris' ? a.favori : id === 'notes' ? a.note : a.couleur)).length;

  return (
    <div class="page">
      <div class="onglets-internes" role="tablist">
        {ONGLETS.map(([id, libelle, icone]) => (
          <button role="tab" aria-selected={onglet === id} onClick={() => setOnglet(id)}>{libelle}<span class="onglets-internes__nb">{compte(id)}</span></button>
        ))}
      </div>
      <div class="barre-recherche" style="margin-top:10px">
        <Icone nom="recherche" taille={20} />
        <input class="barre-recherche__champ" type="search" value={filtre} onInput={(e) => setFiltre(e.currentTarget.value)} placeholder="Rechercher dans mes ressources" aria-label="Filtrer" />
      </div>
      <div class="liste" style="margin-top:10px">
        {visibles.map(([k, a]) => <Element cle={k} a={a} />)}
      </div>
      {!liste.length && (
        <div class="carte vide">
          <Icone nom={ONGLETS.find((o) => o[0] === onglet)[2]} taille={32} />
          <p>Rien pour l'instant. Dans la lecture, touchez un verset pour {onglet === 'favoris' ? "l'ajouter aux favoris" : onglet === 'notes' ? 'écrire une note' : 'le surligner'}.</p>
          <a class="bouton bouton--plein bouton--petit" href="#/bible/livres">Ouvrir la Bible</a>
        </div>
      )}
    </div>
  );
}
