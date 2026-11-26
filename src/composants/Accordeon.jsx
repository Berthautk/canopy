import { useState } from 'preact/hooks';
import { Icone } from './Icone.jsx';

// Liste déroulante : un seul volet ouvert à la fois (ouvrir l'un referme l'autre).
// Chaque titre porte un rond avec une flèche et la mention « Touche pour lire » : on voit qu'on peut l'ouvrir.
export function Accordeon({ volets, ouvert = null, mention = 'Touche pour lire' }) {
  const [o, setO] = useState(ouvert);
  return (
    <div class="accordeon">
      {volets.filter((v) => v && v.contenu).map((v, i) => {
        const id = v.id ?? i, est = o === id;
        return (
          <section class={'carte accordeon__volet' + (est ? ' accordeon__volet--ouvert' : '')}>
            <button class="accordeon__titre" aria-expanded={est} onClick={() => setO(est ? null : id)}>
              <span class="ligne__icone"><Icone nom={v.icone || 'ampoule'} /></span>
              <span class="accordeon__texte"><b>{v.titre}</b>{!est && <small>{mention}</small>}</span>
              <span class="accordeon__rond"><Icone nom="chevron" taille={20} /></span>
            </button>
            {est && <div class="accordeon__corps">{v.contenu}</div>}
          </section>
        );
      })}
    </div>
  );
}
