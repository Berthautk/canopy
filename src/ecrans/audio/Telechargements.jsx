import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BoutonLecture } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { telecharges, enCours, supprimer, toutSupprimer, tailleTotale, formatTaille } from '../../audio/telechargements.js';
import { etatTelechargement, verifierHorsLigne } from '../../bible/bible.js';
import { useSignal } from '../../outils/signal.js';
import { etatImages } from '../../outils/horsLigne.js';
import { installation, installer, estIOS, toutTelecharge, verifierTout, toutTelecharger } from '../../outils/telephone.js';

// Écran 12 : mes téléchargements (audios hors ligne, Bible, espace utilisé).
export function Telechargements() {
  const t = useSignal(telecharges), e = useSignal(enCours), bible = useSignal(etatTelechargement);
  const [estimation, setEstimation] = useState(null);
  const img = useSignal(etatImages);
  const inst = useSignal(installation), tout = useSignal(toutTelecharge);
  useEffect(() => { verifierTout(); }, []);
  useEffect(() => { verifierHorsLigne(); navigator.storage?.estimate?.().then(setEstimation).catch(() => {}); }, [t, bible.statut]);
  const liste = Object.entries(t).sort(([, a], [, b]) => b.date.localeCompare(a.date));
  const total = tailleTotale(t);
  const pct = estimation?.quota ? Math.min(100, (estimation.usage / estimation.quota) * 100) : 0;

  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/audio/femme-ecouteurs.webp" alt="" />
        <div><h2>Sans internet</h2><p>Installer Yeshaya et tout garder sur ce téléphone.</p></div>
      </div>

      <section class="carte bloc tel">
        <h3 style="margin-top:0">1 · Installer l'application</h3>
        {inst.installee
          ? <p class="hors-ligne-ok" style="margin:0"><Icone nom="verifie" taille={18} /> Yeshaya est installée sur ce téléphone.</p>
          : inst.pret
            ? <><p class="ligne__desc" style="margin-top:0">Une icône Yeshaya sera ajoutée sur ton écran d'accueil, comme une application.</p>
                <button class="bouton bouton--or" style="width:100%" onClick={async () => { if (await installer() === 'accepted') notifier('Yeshaya est installée'); }}><Icone nom="telecharger" taille={18} /> Installer sur mon téléphone</button></>
            : estIOS()
              ? <ol class="tel__etapes"><li>Touche le bouton <b>Partager</b> de Safari (le carré avec une flèche).</li><li>Choisis <b>Sur l'écran d'accueil</b>.</li><li>Touche <b>Ajouter</b>.</li></ol>
              : <ol class="tel__etapes"><li>Ouvre le menu de ton navigateur (les trois points en haut).</li><li>Choisis <b>Installer l'application</b> ou <b>Ajouter à l'écran d'accueil</b>.</li></ol>}
      </section>

      <section class="carte bloc tel">
        <h3 style="margin-top:0">2 · Tout télécharger</h3>
        <p class="ligne__desc" style="margin-top:0">Une seule fois, de préférence avec le wifi (environ 12 Mo).</p>
        <ul class="tel__liste">
          <li><Icone nom="verifie" taille={16} /> Enseignements, prières, parcours et jeux <span>déjà là</span></li>
          <li><Icone nom={bible.statut === 'complet' ? 'verifie' : 'telecharger'} taille={16} /> Bible Louis Segond <span>{bible.statut === 'complet' ? 'téléchargée' : `${bible.fait} / ${bible.total} livres`}</span></li>
          <li><Icone nom={img.statut === 'complet' ? 'verifie' : 'telecharger'} taille={16} /> Illustrations <span>{img.statut === 'complet' ? 'téléchargées' : img.total ? `${img.fait} / ${img.total}` : '…'}</span></li>
        </ul>
        {tout.total > 0 && <div class="progression"><span style={{ width: Math.min(100, (tout.fait / tout.total) * 100) + '%' }} /></div>}
        {tout.statut === 'complet'
          ? <p class="hors-ligne-ok" style="margin:10px 0 0"><Icone nom="verifie" taille={18} /> Tout fonctionne maintenant sans internet.</p>
          : <button class="bouton bouton--or" style="width:100%;margin-top:10px" disabled={tout.statut === 'encours'} onClick={async () => { const ok = await toutTelecharger(); notifier(ok ? 'Tout est disponible sans internet' : 'Connexion interrompue : touche pour reprendre'); }}>
              <Icone nom="telecharger" taille={18} /> {tout.statut === 'encours' ? 'Téléchargement…' : tout.fait ? 'Terminer le téléchargement' : 'Tout télécharger'}</button>}
      </section>

      <h2 class="titre-section">3 · Mes audios</h2>
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
