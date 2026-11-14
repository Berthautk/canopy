import { useRef, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { HISTOIRES } from '../../donnees/contenu.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { ajouter, badge } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';

// Écran 32 : remets dans l'ordre. Glisser-déposer (poignée) ou boutons ▲ ▼, pratiques sur les petits téléphones.
export function Ordre({ id }) {
  const choisir = (h) => { let m; do { m = melanger(h.etapes.map((_, i) => i)); } while (m.every((x, i) => x === i)); return m; };
  const [h, setH] = useState(() => HISTOIRES.find((x) => x.id === id) || melanger(HISTOIRES)[0]);
  const [ordre, setOrdre] = useState(() => choisir(h));
  const [verifie, setVerifie] = useState(false);
  const liste = useRef(null), glisse = useRef(null);

  const deplacer = (de, vers) => { if (vers < 0 || vers >= ordre.length) return; const o = [...ordre]; const [x] = o.splice(de, 1); o.splice(vers, 0, x); setOrdre(o); setVerifie(false); };
  const debut = (e, i) => { e.preventDefault(); glisse.current = i; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const bouge = (e) => {
    if (glisse.current === null) return;
    const items = [...liste.current.children]; const y = e.clientY;
    let cible = items.findIndex((el) => { const r = el.getBoundingClientRect(); return y < r.top + r.height / 2; });
    if (cible === -1) cible = items.length - 1;
    if (cible !== glisse.current) { deplacer(glisse.current, cible); glisse.current = cible; }
  };
  const fin = () => { glisse.current = null; };
  const juste = ordre.every((x, i) => x === i);
  const valider = async () => { setVerifie(true); if (juste) { const b = await ajouter('ordre'); notifier('Bravo, c\'est le bon ordre !'); b.forEach((x) => notifier('Badge obtenu : ' + badge(x)[1])); } };
  const autre = () => { const n = HISTOIRES[(HISTOIRES.indexOf(h) + 1) % HISTOIRES.length]; setH(n); setOrdre(choisir(n)); setVerifie(false); };

  return (
    <div class="page">
      <p class="jouer-intro" style="margin-top:12px">Remets ces étapes de <b>{h.titre.charAt(0).toLowerCase() + h.titre.slice(1)}</b> dans le bon ordre.</p>
      <ol class="ordre" ref={liste} onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin}>
        {ordre.map((x, i) => {
          const e = h.etapes[x], r = lireReference(e.reference);
          const etat = verifie ? (x === i ? ' etape-ordre--juste' : ' etape-ordre--faux') : '';
          return (
            <li class={'carte etape-ordre' + etat}>
              <span class="etape-ordre__num">{i + 1}</span>
              <span class="ligne__corps"><span>{e.texte}</span>{verifie && <a class="indice__ref" href={`#/bible/lire/${r.code}/${r.c}/${r.v}`}>{ecrireReference(r)}</a>}</span>
              <span class="etape-ordre__fleches">
                <button aria-label="Monter" disabled={i === 0} onClick={() => deplacer(i, i - 1)}>▲</button>
                <button aria-label="Descendre" disabled={i === ordre.length - 1} onClick={() => deplacer(i, i + 1)}>▼</button>
              </span>
              <span class="etape-ordre__poignee" onPointerDown={(ev) => debut(ev, i)} aria-hidden="true"><Icone nom="liste" taille={20} /></span>
            </li>
          );
        })}
      </ol>
      {!verifie || !juste ? <button class="bouton bouton--or quiz__suivant" onClick={valider}>Vérifier l'ordre</button>
        : <button class="bouton bouton--plein quiz__suivant" onClick={autre}>Histoire suivante <Icone nom="chevron" taille={18} /></button>}
      {verifie && !juste && <p class="ligne__desc" style="text-align:center;margin-top:8px">Les étapes en rouge ne sont pas à leur place. Déplace-les et vérifie à nouveau.</p>}
    </div>
  );
}
