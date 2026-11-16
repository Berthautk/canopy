import { useMessageEchecs } from '../../composants/MessageEchecs.jsx';
import { VoixJeu } from '../../composants/VoixJeu.jsx';
import { useRef, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { HISTOIRES } from '../../donnees/contenu.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { ajouter, badge } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';
import { BarreEtapes, TitreEtape, FinEtape, etapesOuvertes, reussirEtape } from '../../composants/Etapes.jsx';

// Étape n : plus d'histoires à remettre dans l'ordre, moins d'erreurs permises.
const regle = (n) => ({ histoires: Math.min(2 + Math.floor(n / 2), 6), erreurs: Math.max(0, 3 - Math.floor(n / 2)) });
const tirer = (n) => melanger(HISTOIRES).slice(0, regle(n).histoires);

// Écran 32 : remets dans l'ordre. Glisser-déposer (poignée) ou boutons ▲ ▼, pratiques sur les petits téléphones.
export function Ordre({ id }) {
  const [echecMsg, voileMsg] = useMessageEchecs(2);
  const choisir = (h) => { let m; do { m = melanger(h.etapes.map((_, i) => i)); } while (m.every((x, i) => x === i)); return m; };
  const libre = !id; // depuis la liste des jeux : mode étapes
  const [etape, setEtape] = useState(() => etapesOuvertes('ordre'));
  const [serie, setSerie] = useState(() => (id ? [HISTOIRES.find((x) => x.id === id) || HISTOIRES[0]] : tirer(etapesOuvertes('ordre'))));
  const [k, setK] = useState(0), [erreurs, setErreurs] = useState(0), [issue, setIssue] = useState(null);
  const h = serie[Math.min(k, serie.length - 1)];
  const [ordre, setOrdre] = useState(() => choisir(serie[0]));
  const [verifie, setVerifie] = useState(false);
  const r = regle(etape);
  const lancer = (e) => { const l = tirer(e); setEtape(e); setSerie(l); setK(0); setErreurs(0); setIssue(null); setOrdre(choisir(l[0])); setVerifie(false); scrollTo(0, 0); };
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
  const valider = async () => { setVerifie(true);
    if (!juste) { echecMsg(); if (libre) { const e = erreurs + 1; setErreurs(e); if (e > r.erreurs) setIssue('perdu'); } }
    if (juste) { const b = await ajouter('ordre'); notifier('Bravo, c\'est le bon ordre !'); b.forEach((x) => notifier('Badge obtenu : ' + badge(x)[1])); } };
  const autre = () => {
    if (libre) { if (k + 1 >= serie.length) { reussirEtape('ordre', etape); setIssue('gagne'); return; } setK(k + 1); setOrdre(choisir(serie[k + 1])); setVerifie(false); scrollTo(0, 0); return; }
    const n = HISTOIRES[(HISTOIRES.indexOf(h) + 1) % HISTOIRES.length]; setSerie([n]); setOrdre(choisir(n)); setVerifie(false);
  };
  if (issue) return <FinEtape icone="liste" etape={etape} reussi={issue === 'gagne'} score={issue === 'gagne' ? `${serie.length} / ${serie.length}` : `${k} / ${serie.length}`}
    texte={issue === 'gagne' ? `Bravo ! Tu as remis ${serie.length} histoires dans l'ordre. L'étape suivante en propose davantage.` : `Trop d'erreurs pour cette étape (${r.erreurs} permise${r.erreurs > 1 ? 's' : ''}). Relis bien chaque histoire dans la Bible et réessaie.`}
    suivante={() => lancer(etape + 1)} rejouer={() => lancer(etape)} />;

  return (
    <div class="page">{voileMsg}
      <VoixJeu cle={h.titre + (verifie ? (juste ? ':ok' : ':non' + ordre.join('')) : '')} blocs={verifie
        ? [{ texte: juste ? 'Bravo, c\'est le bon ordre !' : 'Ce n\'est pas encore le bon ordre. Les étapes en rouge ne sont pas à leur place.' }]
        : [{ texte: `Remets dans l'ordre : ${h.titre}.` }, ...ordre.map((x, i) => ({ texte: `${i + 1}. ${h.etapes[x].texte}` }))]} />
      {libre && k === 0 && !verifie && erreurs === 0 && <BarreEtapes jeu="ordre" etape={etape} choisir={lancer} />}
      {libre && <TitreEtape etape={etape} but={`Histoire ${k + 1} / ${serie.length} · erreurs : ${erreurs} sur ${r.erreurs} permise${r.erreurs > 1 ? 's' : ''}`} />}
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
        : <button class="bouton bouton--plein quiz__suivant" onClick={autre}>{libre && k + 1 >= serie.length ? 'Terminer l\'étape' : 'Histoire suivante'} <Icone nom="chevron" taille={18} /></button>}
      {verifie && !juste && <p class="ligne__desc" style="text-align:center;margin-top:8px">Les étapes en rouge ne sont pas à leur place. Déplace-les et vérifie à nouveau.</p>}
    </div>
  );
}
