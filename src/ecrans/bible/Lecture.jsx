import { useEffect, useRef, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { chargerLivre } from '../../bible/bible.js';
import { PAR_CODE, LIVRES, cleVerset, ecrireReference } from '../../bible/references.js';
import { annotations, COULEURS, surligner, basculerFavori, ecrireNote, memoriserPosition } from '../../donnees/annotations.js';
import { useSignal } from '../../outils/signal.js';
import { partager, copier } from '../../outils/partage.js';
import { aller, remplacer } from '../../outils/routeur.js';

function voisin(code, c, sens) {
  const l = PAR_CODE[code], i = LIVRES.indexOf(l);
  if (sens > 0) return c < l.chapitres.length ? [code, c + 1] : LIVRES[i + 1] ? [LIVRES[i + 1].code, 1] : null;
  return c > 1 ? [code, c - 1] : LIVRES[i - 1] ? [LIVRES[i - 1].code, LIVRES[i - 1].chapitres.length] : null;
}

// Écran 16 : lecture libre. Toucher (ou appui long) sur un verset ouvre les actions.
export function Lecture({ code, c, vise }) {
  const livre = PAR_CODE[code];
  const [chap, setChap] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [sel, setSel] = useState(null);           // numéro du verset sélectionné
  const [palette, setPalette] = useState(false);
  const [note, setNote] = useState(null);          // texte de la note en cours d'édition
  const notes = useSignal(annotations);
  const appui = useRef(null);

  useEffect(() => {
    let actif = true; setChap(null); setErreur(null); setSel(null); setNote(null);
    chargerLivre(code).then((l) => { if (!actif) return; setChap(l.chapitres[c - 1]); memoriserPosition(code, c); })
      .catch(() => actif && setErreur('Ce livre n\'est pas encore sur votre téléphone. Connectez-vous une fois ou téléchargez la Bible.'));
    return () => { actif = false; };
  }, [code, c]);

  useEffect(() => {        // aller au verset demandé
    if (chap && vise) {
      const el = document.getElementById('v' + vise);
      if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setSel(vise); }
    }
  }, [chap, vise]);

  if (!livre) return <div class="page"><p>Livre inconnu.</p></div>;
  const prec = voisin(code, c, -1), suiv = voisin(code, c, 1);
  const cle = sel ? cleVerset(code, c, sel) : null;
  const a = cle ? notes[cle] || {} : {};
  const texteSel = sel && chap ? chap[sel - 1].replace(/\n/g, ' ') : '';
  const refSel = sel ? ecrireReference({ code, c, v: sel }) : '';

  const debutAppui = (v) => { appui.current = setTimeout(() => { setSel(v); navigator.vibrate?.(15); }, 450); };
  const finAppui = () => clearTimeout(appui.current);

  return (
    <div class="lecture">
      <div class="lecture__barre">
        <a class="selecteur" href="#/bible/livres"><Icone nom="bible" taille={18} /> {livre.nom}</a>
        <a class="selecteur" href={`#/bible/livres/${code}`}>Chapitre {c}</a>
        <button class="rond" disabled={!prec} onClick={() => prec && aller(`bible/lire/${prec[0]}/${prec[1]}`)} aria-label="Chapitre précédent"><Icone nom="precedent" taille={20} /></button>
        <button class="rond" disabled={!suiv} onClick={() => suiv && aller(`bible/lire/${suiv[0]}/${suiv[1]}`)} aria-label="Chapitre suivant"><Icone nom="chevron" taille={20} /></button>
      </div>

      <article class="page lecture__texte" lang="fr">
        <h2 class="lecture__titre">{ecrireReference({ code, c })}</h2>
        {erreur && <p class="verset__erreur">{erreur}</p>}
        {!chap && !erreur && <p class="verset__attente">Chargement…</p>}
        {chap && chap.map((t, i) => {
          if (!t) return null;
          const v = i + 1, k = cleVerset(code, c, v), an = notes[k] || {};
          return (
            <p id={'v' + v} class={'v' + (sel === v ? ' v--sel' : '')} style={an.couleur ? { background: COULEURS[an.couleur] } : undefined}
              onClick={() => { setSel(sel === v ? null : v); setPalette(false); setNote(null); }}
              onTouchStart={() => debutAppui(v)} onTouchEnd={finAppui} onTouchMove={finAppui}
              role="button" tabIndex={0} aria-pressed={sel === v} onKeyDown={(e) => e.key === 'Enter' && setSel(v)}>
              <sup class="v__n">{v}</sup>
              {t.split('\n').map((ligne, j) => <span class={j ? 'v__vers' : ''}>{ligne}{' '}</span>)}
              {an.favori && <Icone nom="coeur" taille={14} class="v__marque" />}
              {an.note && <Icone nom="note" taille={14} class="v__marque" />}
            </p>
          );
        })}
        {chap && suiv && (
          <a class="bouton bouton--contour lecture__suivant" href={`#/bible/lire/${suiv[0]}/${suiv[1]}`}>
            Chapitre suivant : {PAR_CODE[suiv[0]].nom} {suiv[1]} <Icone nom="chevron" taille={18} />
          </a>
        )}
      </article>

      {sel && note === null && (
        <div class="actions-verset" role="toolbar" aria-label={'Actions pour ' + refSel}>
          <div class="actions-verset__ref">{refSel}<button onClick={() => setSel(null)} aria-label="Fermer"><Icone nom="fermer" taille={18} /></button></div>
          {palette && (
            <div class="palette">
              {Object.entries(COULEURS).map(([nom, coul]) => (
                <button style={{ background: coul }} aria-label={'Surligner en ' + nom} aria-pressed={a.couleur === nom}
                  onClick={() => { surligner(cle, a.couleur === nom ? null : nom); setPalette(false); }} />
              ))}
              {a.couleur && <button class="palette__effacer" onClick={() => { surligner(cle, null); setPalette(false); }}>Effacer</button>}
            </div>
          )}
          <div class="actions-verset__boutons">
            <button onClick={() => setPalette(!palette)}><Icone nom="surligner" /><span>Surligner</span></button>
            <button onClick={() => { basculerFavori(cle); notifier(a.favori ? 'Retiré des favoris' : 'Ajouté aux favoris'); }} class={a.favori ? 'actif' : ''}>
              <Icone nom="coeur" /><span>Favori</span></button>
            <button onClick={() => setNote(a.note || '')}><Icone nom="note" /><span>Note</span></button>
            <button onClick={async () => notifier((await copier(`« ${texteSel} » — ${refSel} (LSG)`)) ? 'Verset copié' : 'Copie impossible')}>
              <Icone nom="copier" /><span>Copier</span></button>
            <button onClick={() => partager({ titre: refSel, texte: `« ${texteSel} » — ${refSel} (LSG)`, chemin: `bible/lire/${code}/${c}/${sel}` })}>
              <Icone nom="partager" /><span>Partager</span></button>
            <a href={`#/montrer/${code}/${c}/${sel}`}><Icone nom="agrandir" /><span>Montrer</span></a>
          </div>
        </div>
      )}

      {sel && note !== null && (
        <div class="actions-verset note-edition">
          <label class="ligne__titre" for="note">Ma note sur {refSel}</label>
          <textarea id="note" class="champ" rows="4" maxLength={500} value={note} onInput={(e) => setNote(e.currentTarget.value)} autoFocus />
          <div class="note-edition__pied">
            <span class="ligne__desc">{note.length} / 500</span>
            {a.note && <button class="bouton bouton--contour bouton--petit" onClick={() => { ecrireNote(cle, ''); setNote(null); notifier('Note supprimée'); }}>Supprimer</button>}
            <button class="bouton bouton--contour bouton--petit" onClick={() => setNote(null)}>Annuler</button>
            <button class="bouton bouton--plein bouton--petit" onClick={() => { ecrireNote(cle, note); setNote(null); notifier('Note enregistrée'); }}>Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Redirige « bible/lire » sans paramètre vers la dernière position ou Genèse 1.
export function allerLecture(pos) { remplacer(pos ? `bible/lire/${pos.code}/${pos.c}` : 'bible/lire/GEN/1'); }
