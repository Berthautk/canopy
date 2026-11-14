import { useEffect, useRef, useState } from 'preact/hooks';
import { Icone } from '../composants/Icone.jsx';
import { choisirStats } from '../donnees/mesure.js';
import { reglages, modifierReglages } from '../donnees/reglages.js';
import { useSignal } from '../outils/signal.js';
import { profil, changerPhoto, retirerPhoto, changerPrenom } from '../donnees/profil.js';
import { Avatar } from '../composants/Avatar.jsx';
import { notifier } from '../composants/Notification.jsx';
import { telechargerSauvegarde, partagerSauvegarde, lireSauvegarde, restaurer, libelle } from '../donnees/sauvegarde.js';

// Sauvegarder / restaurer la progression (fichier .json, partage WhatsApp possible).
function MesDonnees() {
  const entree = useRef(null);
  const [aRestaurer, setARestaurer] = useState(null);
  const [erreur, setErreur] = useState('');
  async function choisir(e) {
    const f = e.target.files?.[0]; e.target.value = ''; setErreur('');
    if (!f) return;
    try { setARestaurer(await lireSauvegarde(f)); } catch (x) { setErreur(x.message); }
  }
  return (
    <>
      <div class="carte ligne-bloc">
        <div class="ligne">
          <span class="ligne__icone"><Icone nom="sauvegarder" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Sauvegarder ma progression</span>
            <span class="ligne__desc">Favoris, notes, journal, plan, parcours, badges, réglages et photo, dans un fichier à garder.</span></span>
        </div>
        <div class="verset__actions" style="padding:0 12px 12px">
          <button class="bouton bouton--plein bouton--petit" onClick={async () => { const k = await telechargerSauvegarde(); notifier(`Sauvegarde enregistrée (${k.length} éléments)`); }}>
            <Icone nom="telecharger" taille={18} /> Enregistrer le fichier</button>
          <button class="bouton bouton--whatsapp bouton--petit" onClick={async () => { const r = await partagerSauvegarde(); if (r === 'impossible') notifier('Partage impossible ici : enregistrez le fichier, puis envoyez-le.'); }}>
            <Icone nom="partager" taille={18} /> Envoyer (WhatsApp…)</button>
        </div>
      </div>
      <div class="carte ligne-bloc">
        <div class="ligne">
          <span class="ligne__icone"><Icone nom="restaurer" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Restaurer ma progression</span>
            <span class="ligne__desc">Sur un nouveau téléphone, ou après avoir réinstallé l'application.</span></span>
        </div>
        <div style="padding:0 12px 12px">
          {!aRestaurer ? <button class="bouton bouton--contour bouton--petit" onClick={() => entree.current.click()}>Choisir le fichier de sauvegarde</button> : (
            <div class="restauration">
              <p><b>Sauvegarde du {new Date(aRestaurer.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</b></p>
              <p class="ligne__desc">Contient : {Object.keys(aRestaurer.donnees).map(libelle).join(', ')}.</p>
              <p class="restauration__alerte">Vos données actuelles sur ce téléphone seront remplacées.</p>
              <div class="note-edition__pied">
                <button class="bouton bouton--contour bouton--petit" onClick={() => setARestaurer(null)}>Annuler</button>
                <button class="bouton bouton--plein bouton--petit" onClick={async () => { await restaurer(aRestaurer); notifier('Progression restaurée'); setTimeout(() => location.reload(), 700); }}>Restaurer</button>
              </div>
            </div>
          )}
          {erreur && <p class="verset__erreur" style="margin-top:8px">{erreur}</p>}
          <input ref={entree} type="file" accept="application/json,.json" hidden onChange={choisir} />
        </div>
      </div>
    </>
  );
}

// Section « Mon profil » : photo et prénom, gardés uniquement sur ce téléphone.
function MonProfil() {
  const p = useSignal(profil);
  const entree = useRef(null);
  const [message, setMessage] = useState('');
  const [prenom, setPrenom] = useState(p.prenom);
  useEffect(() => setPrenom(p.prenom), [p.prenom]);

  async function choisir(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setMessage('Préparation de la photo…');
    try { await changerPhoto(f); setMessage('Photo enregistrée sur ce téléphone.'); }
    catch { setMessage('Cette image ne peut pas être lue. Essayez une autre photo.'); }
  }

  return (
    <section class="carte profil">
      <button class="profil__photo" onClick={() => entree.current.click()} aria-label="Changer ma photo de profil">
        <Avatar taille={96} />
        <span class="profil__badge" aria-hidden="true"><Icone nom="appareil" taille={16} /></span>
      </button>
      <div class="profil__corps">
        <label class="profil__label" for="prenom">Mon prénom (facultatif)</label>
        <input id="prenom" class="champ" value={prenom} maxLength={40} placeholder="Ex. : Grâce"
          onInput={(e) => setPrenom(e.currentTarget.value)} onBlur={() => changerPrenom(prenom)} autocomplete="given-name" />
        <div class="profil__actions">
          <button class="bouton bouton--plein bouton--petit" onClick={() => entree.current.click()}>
            {p.photo ? 'Changer la photo' : 'Ajouter une photo'}
          </button>
          {p.photo && <button class="bouton bouton--contour bouton--petit" onClick={() => { retirerPhoto(); setMessage('Photo retirée.'); }}>Retirer</button>}
        </div>
      </div>
      <input ref={entree} type="file" accept="image/*" hidden onChange={choisir} />
      {message && <p class="profil__message" role="status">{message}</p>}
      <p class="profil__note"><Icone nom="bouclier" taille={14} /> Votre photo reste sur ce téléphone. Elle n'est jamais envoyée sur internet.</p>
    </section>
  );
}

const TAILLES = [['normal', 'Normale'], ['grand', 'Grande'], ['tres-grand', 'Très grande']];
const THEMES = [['clair', 'Clair', 'soleil'], ['sombre', 'Sombre', 'lune'], ['auto', 'Auto', 'reglages']];

function Segments({ options, valeur, surChoix, libelle }) {
  return (
    <div class="segments" role="group" aria-label={libelle}>
      {options.map(([v, texte, icone]) => (
        <button aria-pressed={valeur === v} onClick={() => surChoix(v)}>
          {icone && <Icone nom={icone} taille={16} style="vertical-align:-3px;margin-right:5px" />}{texte}
        </button>
      ))}
    </div>
  );
}

// Écran 13 : paramètres. Pas de compte, pas de déconnexion, pas de choix de langue (application en français).
export function Parametres() {
  const r = useSignal(reglages);
  const [persistant, setPersistant] = useState(null);
  useEffect(() => { navigator.storage?.persisted?.().then(setPersistant).catch(() => {}); }, []);

  return (
    <div class="page">
      <h2 class="titre-section">Mon profil</h2>
      <MonProfil />

      <h2 class="titre-section">Affichage</h2>
      <div class="carte param-bloc">
        <div class="param-bloc__titre"><span class="ligne__icone"><Icone nom="texte" /></span> Taille du texte</div>
        <Segments libelle="Taille du texte" options={TAILLES} valeur={r.taille} surChoix={(taille) => modifierReglages({ taille })} />
        <p class="param-apercu">« Aperçu : voici la taille du texte des versets et des enseignements. »</p>
      </div>
      <div class="carte param-bloc">
        <div class="param-bloc__titre"><span class="ligne__icone"><Icone nom="lune" /></span> Thème</div>
        <Segments libelle="Thème" options={THEMES} valeur={r.theme} surChoix={(theme) => modifierReglages({ theme })} />
        <p class="ligne__desc" style="margin-top:8px">« Auto » suit le réglage de votre téléphone.</p>
      </div>

      <h2 class="titre-section">Mes données</h2>
      <div class="liste">
        <MesDonnees />
        <a class="carte ligne" href="#/telechargements">
          <span class="ligne__icone"><Icone nom="telecharger" /></span>
          <span class="ligne__corps"><span class="ligne__titre">Mes téléchargements</span>
            <span class="ligne__desc" style="display:block">Espace utilisé, contenus hors ligne.</span></span>
          <span class="ligne__fin"><Icone nom="chevron" taille={20} /></span>
        </a>
        <div class="carte param-bloc">
          <div class="param-bloc__titre"><span class="ligne__icone"><Icone nom="donnees" /></span> Données et confidentialité</div>
          <p class="ligne__desc">Ton profil, ton journal, tes notes et tes réponses restent sur ce téléphone et ne sont jamais envoyés.
            {persistant === true && ' Stockage protégé contre l\'effacement automatique.'}</p>
          <p class="ligne__desc" style="margin-top:8px"><b>Statistiques anonymes</b> : des compteurs sans nom ni contact (rubriques et contenus utilisés, sujets priés, décisions pour Jésus) qui aident à améliorer Yeshaya et à prier pour ses utilisateurs.</p>
          <Segments libelle="Statistiques anonymes" options={[['oui', 'Activées'], ['non', 'Désactivées']]} valeur={r.statsAnonymes ? 'oui' : 'non'} surChoix={(v) => choisirStats(v === 'oui')} />
          <a class="lien" href="#/confidentialite" style="display:inline-block;margin-top:8px">Lire la politique de confidentialité</a>
        </div>
        <a class="carte ligne" href="#/a-propos">
          <span class="ligne__icone"><Icone nom="info" /></span>
          <span class="ligne__corps"><span class="ligne__titre">À propos de Yeshaya</span>
            <span class="ligne__desc" style="display:block">Version {__VERSION__} · Principes · Crédits</span></span>
          <span class="ligne__fin"><Icone nom="chevron" taille={20} /></span>
        </a>
      </div>
      <p style="text-align:center;margin-top:18px"><a class="lien" href="#/admin" style="font-size:.8rem;color:var(--texte-doux)">Espace administrateur</a></p>
    </div>
  );
}
