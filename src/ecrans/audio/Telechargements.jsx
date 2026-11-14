import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BoutonLecture } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { telecharges, enCours, supprimer, toutSupprimer, tailleTotale, formatTaille } from '../../audio/telechargements.js';
import { etatTelechargement, verifierHorsLigne, CACHE_BIBLE } from '../../bible/bible.js';
import { useSignal } from '../../outils/signal.js';
import { etatImages, verifierImages, telechargerImages } from '../../outils/horsLigne.js';

// Écran 12 : mes téléchargements (audios hors ligne, Bible, espace utilisé).
export function Telechargements() {
  const t = useSignal(telecharges), e = useSignal(enCours), bible = useSignal(etatTelechargement);
  const [estimation, setEstimation] = useState(null);
  const img = useSignal(etatImages);
  useEffect(() => { verifierImages(); }, []);
  useEffect(() => { verifierHorsLigne(); navigator.storage?.estimate?.().then(setEstimation).catch(() => {}); }, [t, bible.statut]);
  const liste = Object.entries(t).sort(([, a], [, b]) => b.date.localeCompare(a.date));
  const total = tailleTotale(t);
  const pct = estimation?.quota ? Math.min(100, (estimation.usage / estimation.quota) * 100) : 0;

  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/audio/femme-ecouteurs.webp" alt="" />
        <div><h2>Mes audios hors ligne</h2><p>Écoutez les enseignements même sans connexion.</p></div>
      </div>

      {Object.keys(e).length > 0 && <p class="ligne__desc" style="margin:0 4px 8px">{Object.keys(e).length} téléchargement(s) en cours…</p>}

      <div class="liste">
        {liste.map(([id, x]) => (
          <article class="carte dl">
            <img class="dl__image" src={x.piste.image} alt="" loading="lazy" />
            <div class="ligne__corps">
              <span class="ligne__titre" style="display:block">{x.piste.titre}</span>
              <span class="ligne__desc" style="display:block">{x.piste.type} · {x.piste.auteur}</span>
              <span class="dl__ok"><Icone nom="verifie" taille={14} /> Hors ligne · {formatTaille(x.taille)}</span>
            </div>
            <BoutonLecture piste={x.piste} taille={42} />
            <button class="rond" aria-label={'Supprimer ' + x.piste.titre} onClick={() => { supprimer(id); notifier('Supprimé de ce téléphone'); }}><Icone nom="corbeille" taille={18} /></button>
          </article>
        ))}
        {!liste.length && (
          <div class="carte vide">
            <Icone nom="telecharger" taille={32} />
            <p>Aucun audio téléchargé. Sur un enseignement, appuyez sur « Télécharger » pour l'écouter sans internet.</p>
          </div>
        )}
      </div>

      <h2 class="titre-section">Toute l'application sans internet</h2>
      <section class="carte bloc">
        <p style="margin-top:0">Les textes de l'application (enseignements, prières, parcours, jeux) sont déjà gardés sur ce téléphone : ils fonctionnent sans internet. Pour que <b>tout</b> fonctionne hors ligne, téléchargez aussi les illustrations (environ 7 Mo) et la Bible (environ 4,5 Mo), une seule fois.</p>
        <p class="ligne__desc">Illustrations : {img.total ? `${img.fait} sur ${img.total}` : '…'}{img.statut === 'complet' ? ' · toutes disponibles hors ligne' : ''}</p>
        {img.total > 0 && <div class="progression"><span style={{ width: (img.fait / img.total) * 100 + '%' }} /></div>}
        {img.statut !== 'complet' && <button class="bouton bouton--or" style="width:100%;margin-top:10px" disabled={img.statut === 'encours'} onClick={async () => { await telechargerImages(); notifier('Illustrations disponibles sans internet'); }}>
          <Icone nom="telecharger" taille={18} /> {img.statut === 'encours' ? 'Téléchargement…' : 'Télécharger les illustrations'}</button>}
      </section>

      <h2 class="titre-section">Bible</h2>
      <div class="carte ligne">
        <span class="ligne__icone"><Icone nom="bible" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Bible Louis Segond 1910</span>
          <span class="ligne__desc">{bible.statut === 'complet' ? 'Disponible hors ligne (environ 4,5 Mo)' : `${bible.fait} livre${bible.fait > 1 ? 's' : ''} sur ${bible.total} sur ce téléphone`}</span></span>
        {bible.statut === 'complet'
          ? <button class="rond" aria-label="Supprimer la Bible de ce téléphone" onClick={async () => { if (confirm('Supprimer la Bible de ce téléphone ? Il faudra la retélécharger pour la lire sans internet.')) { await caches.delete(CACHE_BIBLE); verifierHorsLigne(); notifier('Bible supprimée de ce téléphone'); } }}><Icone nom="corbeille" taille={18} /></button>
          : <a class="bouton bouton--plein bouton--petit" href="#/bible">Télécharger</a>}
      </div>

      <section class="carte stockage">
        <span class="ligne__icone"><Icone nom="donnees" /></span>
        <div class="ligne__corps">
          <span class="ligne__titre" style="display:block">Espace utilisé par les audios : {formatTaille(total)}</span>
          {estimation?.quota > 0 && (
            <>
              <div class="progression progression--fine"><span style={{ width: Math.max(pct, 1) + '%' }} /></div>
              <span class="ligne__desc">Yeshaya utilise {formatTaille(estimation.usage)} au total · {formatTaille(estimation.quota - estimation.usage)} encore disponibles</span>
            </>
          )}
        </div>
      </section>
      {liste.length > 0 && (
        <button class="bouton bouton--contour" style="width:100%;margin-top:12px"
          onClick={() => { if (confirm('Supprimer tous les audios téléchargés ?')) { toutSupprimer(); notifier('Tous les audios ont été supprimés'); } }}>
          <Icone nom="corbeille" taille={18} /> Tout effacer ({formatTaille(total)})</button>
      )}
      <a class="bouton bouton--or" style="width:100%;margin-top:10px" href="#/grandir"><Icone nom="telecharger" taille={18} /> Trouver d'autres enseignements</a>
    </div>
  );
}
