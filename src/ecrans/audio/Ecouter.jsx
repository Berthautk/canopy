import { useEffect } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BoutonTelecharger } from '../../composants/Audio.jsx';
import { lecteur, jouer, basculer, deplacer, allerA, changerVitesse, VITESSES, formatTemps, positionMemorisee } from '../../audio/lecteur.js';
import { AUDIOS } from '../../donnees/contenu.js';
import { useSignal } from '../../outils/signal.js';
import { partager } from '../../outils/partage.js';

// Écran 11 : lecteur audio plein écran.
export function Ecouter({ id }) {
  const l = useSignal(lecteur);
  const piste = (id && AUDIOS[id]) || l.piste;
  const actif = piste && l.piste?.id === piste.id;
  useEffect(() => { if (piste && !l.piste) jouer(piste); }, [piste?.id]);   // ouvert depuis un lien partagé : prépare la lecture

  if (!piste) return <div class="page"><p class="ligne__desc" style="margin-top:20px">Aucun audio en cours. Choisissez un enseignement à écouter.</p></div>;
  const pos = actif ? l.position : positionMemorisee(piste.id), duree = actif ? l.duree : 0;

  return (
    <div class="page ecouter">
      <div class="ecouter__visuel">
        <img src={piste.image} alt="" />
        {piste.exemple && <span class="etiquette-exemple ecouter__exemple">EXEMPLE</span>}
      </div>
      <section class="carte ecouter__infos">
        <div class="ligne__corps">
          <span class="ligne__desc" style="display:block">{piste.type}</span>
          <h2>{piste.titre}</h2>
          <p class="ecouter__auteur">{piste.auteur}</p>
          {piste.autorisation && <p class="ecouter__autorisation"><Icone nom="verifie" taille={14} /> Utilisé avec autorisation</p>}
        </div>
        <button class="rond rond--grand" aria-label="Partager"
          onClick={() => partager({ titre: piste.titre, texte: `Écoute « ${piste.titre} » (${piste.auteur}) sur Yeshaya`, chemin: 'ecouter/' + piste.id })}>
          <Icone nom="partager" taille={20} /></button>
      </section>

      <div class="ecouter__barre">
        <span>{formatTemps(pos)}</span>
        <input type="range" min="0" max={duree || 1} step="1" value={pos} disabled={!actif || !duree} aria-label="Position dans l'audio"
          onInput={(e) => allerA(+e.currentTarget.value)} style={{ '--pct': (duree ? (pos / duree) * 100 : 0) + '%' }} />
        <span>{duree ? formatTemps(duree) : piste.duree || '--:--'}</span>
      </div>

      <div class="ecouter__commandes">
        <button class="rond rond--grand" onClick={() => deplacer(-15)} disabled={!actif} aria-label="Reculer de 15 secondes"><Icone nom="reculer15" taille={26} /></button>
        <button class="ecouter__lecture" onClick={() => (actif ? basculer() : jouer(piste))} aria-label={actif && l.lecture ? 'Pause' : 'Lecture'}>
          {actif && l.chargement && l.lecture ? <span class="rotation" /> : <Icone nom={actif && l.lecture ? 'pause' : 'lecture'} taille={34} />}
        </button>
        <button class="rond rond--grand" onClick={() => deplacer(15)} disabled={!actif} aria-label="Avancer de 15 secondes"><Icone nom="avancer15" taille={26} /></button>
      </div>
      {actif && l.erreur && <p class="verset__erreur" style="margin-top:10px">{l.erreur}</p>}

      <section class="carte ecouter__options">
        <span class="ligne__titre">Vitesse</span>
        <div class="segments" role="group" aria-label="Vitesse de lecture">
          {VITESSES.map((v) => <button aria-pressed={l.vitesse === v} onClick={() => changerVitesse(v)}>{String(v).replace('.', ',')}×</button>)}
        </div>
      </section>
      <section class="carte ecouter__options">
        <span class="ligne__titre">Écouter sans internet</span>
        <BoutonTelecharger piste={piste} />
      </section>
    </div>
  );
}
