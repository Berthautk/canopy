import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { ACCOMPAGNEMENT, ENSEIGNEMENTS, chargerFiche } from '../../donnees/contenu.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { aller, remplacer, retourVers, revenirOuRemplacer } from '../../outils/routeur.js';
import { useSignal } from '../../outils/signal.js';
import { compter } from '../../donnees/mesure.js';
import { partager, copier } from '../../outils/partage.js';
import {
  lireCarnet, ecrireCarnet, marquerEnCours, lireBilan, ecrireBilan, effacerBilan,
  lireDisciples, ecrireDisciples,
} from '../../donnees/carnet.js';
import {
  lienDisciple, rejoindre, travaillerSeul, quitterLien, actualiserDisciple, etatEnvoi, formaterCode,
  creerDisciple, etatDuDisciple, avancerDisciple, retirerDisciple, renommerDisciple, effacerMesDonnees, rouvrirCode,
} from '../../donnees/suivi.js';

// Suivi des nouveaux convertis (« Former le chrétien ») : méthode inspirée de La Nouvelle Vie en Christ.
// Deux chemins séparés : le nouveau converti (son carnet) et le berger (ses disciples, ses fiches).

const tousLesPas = () => ACCOMPAGNEMENT.volumes.flatMap((v) => v.pas.map((p) => ({ ...p, volume: v.numero })));
const pasDe = (id) => tousLesPas().find((p) => p.id === id);
const pasSuivant = (id) => { const l = tousLesPas(), i = l.findIndex((p) => p.id === id); const v0 = l[i]?.volume === 0; return l.slice(i + 1).find((p) => p.id && (v0 ? p.volume === 0 : p.volume !== 0)) || null; };
// Les numéros de pas recommencent à 1 dans chaque volume : on dit toujours le volume, sauf pour le volume 1.
const nomPas = (p) => (!p ? '' : (p.volume != null && p.volume !== 1 ? `Volume ${p.volume} · ` : '') + `Pas ${p.numero} · ${p.titre}`);
// Le message à envoyer au nouveau converti. Le code et le prénom sont seuls sur leur ligne :
// sur WhatsApp, un appui long sélectionne alors la ligne entière, sans le reste de la phrase.
const messageCode = (d) => `Bonjour ${d.prenom} !

Pour notre suivi, ouvre l'application Yeshaya :
${location.origin}

Touche « Suivi des nouveaux convertis », puis « Je suis un nouveau converti ».

Ton code :
${d.code}

Ton prénom à écrire :
${d.prenom}`;

// Le bloc du code : on peut le copier, copier le prénom, copier tout le message, ou l'envoyer.
// Copier est important : sur WhatsApp, recopier un code à la main est pénible et source d'erreurs.
function CarteCode({ d, titre, apres }) {
  const envoyer = () => {
    const texte = messageCode(d);
    if (navigator.share) navigator.share({ text: texte }).catch(() => {});
    else open('https://wa.me/?text=' + encodeURIComponent(texte), '_blank');
  };
  const copie = async (quoi, texte) => notifier((await copier(texte)) ? quoi + ' copié' : 'Copie impossible sur ce téléphone');
  return (
    <section class="carte bloc acc-code-carte">
      {titre && <p class="ligne__desc" style="margin-top:0">{titre}</p>}
      <p class="acc-code-grand" onClick={() => copie('Code', d.code)} title="Toucher pour copier">{d.code}</p>
      <div class="acc-code-boutons">
        <button class="bouton bouton--contour bouton--petit" onClick={() => copie('Code', d.code)}><Icone nom="copier" taille={16} /> Copier le code</button>
        <button class="bouton bouton--contour bouton--petit" onClick={() => copie('Prénom', d.prenom)}><Icone nom="copier" taille={16} /> Copier le prénom</button>
      </div>
      <p class="ligne__desc">Prénom à écrire : <b class="acc-selection">{d.prenom}</b></p>
      <button class="bouton bouton--or" style="width:100%" onClick={envoyer}><Icone nom="partager" taille={18} /> Envoyer le code par WhatsApp</button>
      <button class="bouton bouton--contour" style="width:100%;margin-top:8px" onClick={() => copie('Message', messageCode(d))}><Icone nom="copier" taille={18} /> Copier le message (SMS, Telegram…)</button>
      {apres}
    </section>
  );
}

const lienRef = (t) => { const r = lireReference(t); return r ? `#/bible/lire/${r.code}/${r.c}${r.v ? '/' + r.v : ''}` : null; };
function Refs({ refs }) {
  if (!refs?.length) return null;
  return <span class="acc-refs">{refs.map((t) => { const l = lienRef(t); return l ? <a class="pastille pastille--ref" href={l}>{ecrireReference(lireReference(t))}</a> : <span class="pastille">{t}</span>; })}</span>;
}
function useFiche(id) {
  const [etat, setEtat] = useState({ chargement: true });
  useEffect(() => { let ok = true; setEtat({ chargement: true }); chargerFiche(id).then((f) => ok && setEtat({ f })).catch(() => ok && setEtat({ erreur: true })); return () => { ok = false; }; }, [id]);
  return etat;
}
const Attente = ({ etat }) => etat.chargement ? <div class="page"><p class="verset__attente" style="margin-top:16px">Chargement…</p></div>
  : <div class="page"><p class="verset__erreur" style="margin-top:16px">Cette fiche n'est pas encore sur ton téléphone. Connecte-toi une fois pour l'ouvrir.</p></div>;
const ilYA = (iso) => { if (!iso) return ''; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `le ${new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`; };
const Etapes = ({ n, total }) => <p class="acc-etapes">{Array.from({ length: total }, (_, k) => <i class={k < n ? 'fait' : ''} />)}<span>Étape {n} sur {total}</span></p>;

// ---------- Choisir son chemin ----------
export function AccompagnerAccueil() {
  const l = useSignal(lienDisciple), dsc = lireDisciples();
  const pasDisciple = l ? pasDe(l.pas) || pasDe('pas-01-le-salut') : null;
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/nouveau-converti/etude-de-la-bible.webp" alt="" />
        <div><h2>Suivi des nouveaux convertis</h2><p>Former le chrétien, pas à pas, avec un berger</p></div>
      </div>
      <p class="acc-question-role">Qui es-tu ?</p>
      <a class="carte acc-chemin" href="#/accompagner/disciple">
        <span class="acc-chemin__icone"><Icone nom="note" taille={28} /></span>
        <span class="ligne__corps"><b>Je suis un nouveau converti</b><span>{pasDisciple ? `Continuer : pas ${pasDisciple.numero} · ${pasDisciple.titre}` : 'Un berger m\'accompagne. Chaque semaine, je travaille un pas dans mon carnet.'}</span></span>
        <Icone nom="chevron" taille={22} />
      </a>
      <a class="carte acc-chemin" href="#/accompagner/encadreur">
        <span class="acc-chemin__icone"><Icone nom="groupe" taille={28} /></span>
        <span class="ligne__corps"><b>Je suis un berger</b><span>{dsc.length ? `Mes disciples : ${dsc.map((x) => x.prenom).join(', ')}` : 'J\'accompagne un nouveau converti, comme Paul avec Timothée (2 Timothée 2:2).'}</span></span>
        <Icone nom="chevron" taille={22} />
      </a>
      <details class="carte bloc acc-plus">
        <summary><b>Comment se passe le suivi ?</b></summary>
        {ACCOMPAGNEMENT.presentation.map((t) => <p>{t}</p>)}
        <p>Le berger inscrit son disciple et reçoit un <b>code</b>. Le disciple entre ce code avec son prénom : leurs deux applications sont alors reliées. Tout ce que le disciple écrit dans son carnet, bilan de vie compris, apparaît directement chez son berger, sans rien envoyer. Le bilan de vie, lui, reste toujours sur le téléphone du disciple.</p>
      </details>
      <details class="carte bloc acc-plus">
        <summary><b>Les pas du parcours</b></summary>
        {ACCOMPAGNEMENT.volumes.map((v) => <><h4 style="margin:10px 0 4px">{v.titre}</h4><ol class="acc-liste-pas">{v.pas.map((p) => <li class={p.id ? '' : 'a-venir'}>{p.titre}{p.id ? '' : ' (en préparation)'}</li>)}</ol></>)}
      </details>
      <p class="source-mention">{ACCOMPAGNEMENT.source} <a class="lien" href={ACCOMPAGNEMENT.lien_source} target="_blank" rel="noopener">Manuel original</a></p>
    </div>
  );
}

// ---------- Chemin du nouveau converti ----------
export function EspaceDisciple() {
  const l = useSignal(lienDisciple), env = useSignal(etatEnvoi);
  const [code, setCode] = useState(''), [prenom, setPrenom] = useState(''), [etat, setEtat] = useState({});
  useEffect(() => { actualiserDisciple(); }, []);
  if (!l) return (
    <div class="page">
      <h2 style="margin:16px 4px 4px">Bienvenue !</h2>
      <p class="ligne__desc" style="margin:0 4px 12px">Ton berger t'a donné un <b>code</b> de 7 signes (comme ABC-1234). Entre-le avec ton prénom, écrit comme il l'a noté.</p>
      <form class="carte bloc acc-form" onSubmit={async (e) => { e.preventDefault(); setEtat({ envoi: true }); try { await rejoindre(code, prenom); compter('suivi-rejoint'); notifier('Tu es relié à ton berger'); setEtat({}); } catch (err) { setEtat({ erreur: err.message }); } }}>
        <label class="etiquette-champ" for="acc-code">Le code de ton berger</label>
        <input id="acc-code" class="champ acc-code" value={code} onInput={(e) => setCode(formaterCode(e.currentTarget.value))} placeholder="_ _ _ - _ _ _ _" autocapitalize="characters" autocomplete="off" inputmode="text" />
        <label class="etiquette-champ" for="acc-prenom">Ton prénom</label>
        <input id="acc-prenom" class="champ" value={prenom} onInput={(e) => setPrenom(e.currentTarget.value)} autocomplete="given-name" />
        <p class="ligne__desc acc-accord"><Icone nom="info" taille={16} /> En validant, tu acceptes que ton berger voie ce que tu écris dans ton carnet, bilan de vie compris. C'est à deux qu'on avance : « Confessez vos péchés les uns aux autres… afin que vous soyez guéris » (Jacques 5:16).</p>
        {etat.erreur && <p class="verset__erreur">{etat.erreur}</p>}
        <button class="bouton bouton--or" style="width:100%" disabled={code.replace('-', '').length < 7 || prenom.trim().length < 2 || etat.envoi}>{etat.envoi ? 'Vérification…' : 'Valider'}</button>
      </form>
      <section class="carte bloc" style="margin-top:12px">
        <p class="ligne__desc" style="margin-top:0">Tu n'as pas encore de berger ? Tu peux commencer seul : écris ton prénom ci-dessus, puis touche ce bouton. Tu pourras entrer un code plus tard.</p>
        <button class="bouton bouton--contour" style="width:100%" disabled={prenom.trim().length < 2} onClick={() => travaillerSeul(prenom)}>Commencer seul</button>
      </section>
    </div>
  );
  const p = pasDe(l.pas) || pasDe('pas-01-le-salut');
  // Les pas déjà faits : ceux de SON volume qui viennent avant le sien.
  // (Les numéros recommencent à 1 dans chaque volume : sans ce filtre, on mélangeait tout.)
  const liste = tousLesPas().filter((x) => x.id && x.volume === p.volume);
  const faits = liste.slice(0, liste.findIndex((x) => x.id === p.id));
  return (
    <div class="page">
      <h2 style="margin:16px 4px 2px">Bonjour {l.prenom || ''} !</h2>
      <p class={'acc-statut' + (l.mode === 'relie' ? ' acc-statut--ok' : '')}>
        <Icone nom={l.mode === 'relie' ? 'verifie' : 'info'} taille={16} />
        {l.mode === 'relie' ? <span>Relié à ton berger : il voit ce que tu écris dans ton carnet{env.statut === 'attente' ? ' (envoi en attente de réseau)' : ''}</span> : <span>Tu travailles seul pour l'instant</span>}
      </p>

      <a class="carte acc-chemin acc-chemin--fort" href={'#/accompagner/pas/' + p.id}>
        <span class="acc-chemin__icone"><Icone nom="note" taille={28} /></span>
        <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">Mon pas de la semaine</span><b>{nomPas(p)}</b><span>Ouvrir mon carnet et travailler</span></span>
        <Icone nom="chevron" taille={22} />
      </a>

      {p.id === 'pas-01-le-salut' && <a class="carte ligne" href="#/accompagner/bilan" style="margin-top:10px">
        <span class="ligne__icone"><Icone nom="coeur" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon bilan de vie</span><span class="ligne__desc">À remplir cette semaine, puis à reprendre avec ton berger.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>}

      {faits.length > 0 && <>
        <h2 class="titre-section">Mes pas déjà faits ({faits.length})</h2>
        <div class="liste">{faits.map((x) => (
          <a class="carte ligne" href={'#/accompagner/pas/' + x.id}>
            <span class="enseignement__num enseignement__num--lu"><Icone nom="verifie" taille={13} /></span>
            <span class="ligne__corps"><span class="ligne__titre">{nomPas(x)}</span></span>
            <Icone nom="chevron" taille={20} />
          </a>))}</div>
      </>}

      <h2 class="titre-section">Mon lien avec mon berger</h2>
      <section class="carte bloc">
        {l.mode === 'relie'
          ? <p style="margin-top:0">Mon code : <b>{l.code}</b>. Ton berger voit ce que tu écris dans ton carnet, et il te remet le pas suivant après votre rencontre.</p>
          : <p style="margin-top:0">Tu n'as pas encore de berger. Quand tu en auras un, il te donnera un code de 7 signes à entrer ici.</p>}
        <button class="bouton bouton--contour" style="width:100%" onClick={async () => { if (l.mode === 'relie' && !confirm('Arrêter le lien avec ton berger ? Il ne verra plus tes réponses.')) return; await quitterLien(l.mode === 'relie'); }}>
          {l.mode === 'relie' ? 'Arrêter le lien avec mon berger' : 'Entrer le code de mon berger'}</button>
        <p class="ligne__desc" style="margin-top:14px">Pour repartir à zéro (par exemple après un essai), tu peux tout effacer : ton prénom, tes réponses, ton bilan de vie et ton lien.</p>
        <button class="bouton bouton--contour acc-danger" style="width:100%" onClick={async () => { if (confirm('Tout effacer de ce téléphone : ton prénom, tes réponses, ton bilan de vie et le lien avec ton berger ? Cela ne peut pas être annulé.')) { await effacerMesDonnees(); notifier('Tout a été effacé'); } }}>
          <Icone nom="corbeille" taille={18} /> Tout effacer de ce téléphone</button>
      </section>
    </div>
  );
}

// ---------- Chemin du berger ----------
export function EspaceEncadreur() {
  const [l, setL] = useState(lireDisciples);
  useEffect(() => { setL(lireDisciples()); }, []);
  return (
    <div class="page">
      <h2 style="margin:16px 4px 2px">Mes disciples</h2>
      <p class="ligne__desc" style="margin:0 4px 12px">Les nouveaux convertis que tu accompagnes. Touche un prénom pour ouvrir son suivi : son code, où il en est, tes notes.</p>

      {l.length > 0 && <div class="liste">{l.map((d) => { const p = pasDe(d.pas); return (
        <a class="carte acc-chemin" href={'#/accompagner/encadreur/' + d.id}>
          <span class="acc-chemin__icone acc-chemin__icone--lettre">{(d.prenom[0] || '?').toUpperCase()}</span>
          <span class="ligne__corps"><b>{d.prenom}</b>
            <span>{!d.accueil ? "Rencontre d'accueil à faire" : nomPas(p)}</span>
            <span class="ligne__desc">{d.code ? 'Code : ' + d.code : 'Sur papier, sans code'}{d.rdv ? ' · rendez-vous le ' + new Date(d.rdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</span></span>
          <Icone nom="chevron" taille={22} />
        </a>); })}</div>}

      <a class="bouton bouton--or" style="width:100%;margin-top:14px" href="#/accompagner/encadreur/nouveau">
        <Icone nom="groupe" taille={18} /> Inscrire un nouveau converti</a>

      {!l.length && (
        <section class="carte bloc" style="margin-top:14px">
          <h3 style="margin-top:0">Comment ça marche, en 3 temps</h3>
          <ol class="acc-liste-num">
            <li><b>Tu l'inscris.</b> Tu écris son prénom, et l'application te donne un code de 7 signes.</li>
            <li><b>Tu lui donnes le code.</b> Il l'entre dans son téléphone avec le même prénom. Vos deux applications sont alors reliées.</li>
            <li><b>Chaque semaine, vous vous voyez.</b> Il travaille un pas dans son carnet, tu vois ses réponses, puis tu lui remets le pas suivant.</li>
          </ol>
          <p class="ligne__desc" style="margin-bottom:0">S'il n'a pas de téléphone, ce n'est pas grave : tu l'inscris quand même et tu lui imprimes les fiches.</p>
        </section>
      )}

      <h2 class="titre-section">Pour t'aider</h2>
      <div class="liste">
        <a class="carte ligne" href="#/accompagner/orientations">
          <span class="ligne__icone"><Icone nom="ampoule" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Les orientations par domaine</span><span class="ligne__desc">Quoi dire et quoi faire selon ce que le bilan de vie révèle.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
        <a class="carte ligne" href="#/accompagner/accueil">
          <span class="ligne__icone"><Icone nom="coeur" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">La rencontre d'accueil</span><span class="ligne__desc">Le déroulé de la toute première rencontre, minute par minute.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
        <a class="carte ligne" href="#/grandir/enseignement/islam-25-suivi">
          <span class="ligne__icone"><Icone nom="groupe" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Tu accompagnes un ancien musulman ?</span><span class="ligne__desc">Méthode, précautions, thèmes à aborder pas à pas.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
        <a class="carte ligne" href="#/accompagner/essai">
          <span class="ligne__icone"><Icone nom="note" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Tu fais partie de l'essai ?</span><span class="ligne__desc">La liste de ce que tu dois tester, et ton compte rendu à envoyer.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
      </div>
    </div>
  );
}

// Inscrire un nouveau converti : une chose à la fois (prénom → code → rencontre d'accueil).
export function NouveauDisciple() {
  const [prenom, setPrenom] = useState(''), [d, setD] = useState(null), [etat, setEtat] = useState({});
  const valider = async (e) => {
    e.preventDefault(); setEtat({ envoi: true });
    try { setD(await creerDisciple(prenom)); compter('suivi-disciple-inscrit'); setEtat({}); }
    catch (err) { setEtat({ erreur: err.message }); }
  };
  const sansCode = () => { const n = { id: 'd' + Date.now().toString(36), prenom: prenom.trim(), pas: 'pas-01-le-salut', versets: [], notes: '', rdv: '', accueil: false }; ecrireDisciples([...lireDisciples(), n]); remplacer('accompagner/encadreur/' + n.id + '/accueil'); };
  if (!d) return (
    <div class="page">
      <Etapes n={1} total={3} />
      <h2 style="margin:6px 4px 4px">Qui accompagnes-tu ?</h2>
      <p class="ligne__desc" style="margin:0 4px 12px">Écris le prénom du nouveau converti. Il devra l'écrire de la même façon avec le code.</p>
      <form class="carte bloc acc-form" onSubmit={valider}>
        <label class="etiquette-champ" for="acc-prenom-d">Prénom du nouveau converti</label>
        <input id="acc-prenom-d" class="champ" value={prenom} onInput={(e) => setPrenom(e.currentTarget.value)} autofocus />
        {etat.erreur && <p class="verset__erreur">Le code n'a pas pu être créé : {etat.erreur} Tu peux réessayer quand tu auras du réseau, ou continuer sur papier juste en dessous.</p>}
        <button class="bouton bouton--or" style="width:100%;margin-top:10px" disabled={prenom.trim().length < 2 || etat.envoi}>{etat.envoi ? 'Création du code…' : 'Créer son code'}</button>
      </form>
      <section class="carte bloc" style="margin-top:12px">
        <h3 style="margin-top:0">Il n'a pas de téléphone ?</h3>
        <p class="ligne__desc">Inscris-le quand même : tu suivras son avancée dans ton application, et tu lui imprimeras les fiches de chaque pas.</p>
        <button type="button" class="bouton bouton--contour" style="width:100%" disabled={prenom.trim().length < 2} onClick={sansCode}>Continuer sur papier, sans code</button>
      </section>
    </div>
  );
  return (
    <div class="page">
      <Etapes n={2} total={3} />
      <h2 style="margin:6px 4px 4px">Le code de {d.prenom}</h2>
      <CarteCode d={d} titre={`Donne ce code à ${d.prenom}. Dans Yeshaya, il touche « Suivi des nouveaux convertis », puis « Je suis un nouveau converti », et l'entre avec son prénom.`}
        apres={<p class="ligne__desc" style="margin-bottom:0">Dès qu'il l'aura entré, ses réponses apparaîtront dans ta fiche. Tu retrouves ce code à tout moment dans sa page.</p>} />
      <button class="bouton bouton--or" style="width:100%;margin-top:12px" onClick={() => remplacer('accompagner/encadreur/' + d.id + '/accueil')}>Suivant : la rencontre d'accueil <Icone nom="chevron" taille={18} /></button>
    </div>
  );
}

// Page d'un disciple : tout son suivi au même endroit.
export function FicheDisciple({ id }) {
  const [l, setL] = useState(lireDisciples), [serveur, setServeur] = useState(null);
  const d = l.find((x) => x.id === id);
  const maj = (k, v) => { const n = l.map((x) => (x.id === id ? { ...x, [k]: v } : x)); setL(n); ecrireDisciples(n); };
  useEffect(() => { if (d?.code) etatDuDisciple(d).then((s) => { setServeur(s); if (s.pas && s.pas !== d.pas) maj('pas', s.pas); }).catch(() => setServeur({ horsLigne: true })); }, [id]);
  if (!d) return <div class="page"><p class="ligne__desc" style="margin-top:16px">Disciple introuvable. <a class="lien" href="#/accompagner/encadreur">Mes disciples</a></p></div>;
  const p = pasDe(d.pas) || pasDe('pas-01-le-salut');
  const aRepondu = serveur?.carnets?.[p.id] ? Object.values(serveur.carnets[p.id].r || {}).filter((x) => String(x).trim()).length : 0;
  return (
    <div class="page">
      <h2 style="margin:16px 4px 2px">{d.prenom}</h2>
      {d.code
        ? <p class={'acc-statut' + (serveur?.rejoint ? ' acc-statut--ok' : '')}><Icone nom={serveur?.rejoint ? 'verifie' : 'info'} taille={16} />
            <span>{serveur?.horsLigne ? 'Pas de réseau : ses réponses s\'afficheront plus tard.'
              : !serveur ? 'Chargement de ses réponses…'
              : serveur.rejoint ? `${d.prenom} est relié · ${aRepondu} réponse${aRepondu > 1 ? 's' : ''} écrite${aRepondu > 1 ? 's' : ''} sur ce pas`
              : `${d.prenom} n'a pas encore entré son code.`}</span></p>
        : <p class="acc-statut"><Icone nom="info" taille={16} /><span>Sans code : {d.prenom} travaille sur papier.</span></p>}

      {/* 1. Ce qu'il y a à faire maintenant */}
      {!d.accueil ? (
        <a class="carte acc-chemin acc-chemin--fort" href={'#/accompagner/encadreur/' + d.id + '/accueil'}>
          <span class="acc-chemin__icone"><Icone nom="coeur" taille={28} /></span>
          <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">À faire d'abord</span><b>La rencontre d'accueil</b><span>Accueillir, encourager, présenter le parcours</span></span>
          <Icone nom="chevron" taille={22} />
        </a>
      ) : (
        <a class="carte acc-chemin acc-chemin--fort" href={`#/accompagner/pas/${p.id}?role=encadreur&disciple=${d.id}`}>
          <span class="acc-chemin__icone"><Icone nom="groupe" taille={28} /></span>
          <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">Prochaine rencontre</span><b>{nomPas(p)}</b><span>Ses réponses, les réponses attendues, et le guide</span></span>
          <Icone nom="chevron" taille={22} />
        </a>
      )}

      {/* 2. Son code : la chose qu'on cherche le plus souvent */}
      {d.code && <CarteCode d={d} titre={`Le code de ${d.prenom}, à entrer dans son téléphone avec son prénom`}
        apres={serveur?.rejoint && (serveur.ouvert
          ? <p class="ligne__desc" style="margin-bottom:0"><Icone nom="info" taille={15} /> Le code est ouvert : {d.prenom} peut se relier depuis un nouveau téléphone. Il se refermera tout seul après.</p>
          : <><p class="ligne__desc">Le code a déjà servi : personne d'autre ne peut s'en servir pour voir son carnet. S'il a changé de téléphone, rouvre-le.</p>
            <button class="bouton bouton--contour" style="width:100%" onClick={async () => { try { await rouvrirCode(d); setServeur({ ...serveur, ouvert: true }); notifier('Code rouvert : ' + d.prenom + ' peut se relier une fois. Son ancien téléphone perdra l\'accès.'); } catch (err) { notifier(err.message); } }}>Rouvrir le code pour un nouveau téléphone</button></>)} />}

      {/* 3. Où il en est */}
      <h2 class="titre-section">Où en est {d.prenom}</h2>
      <section class="carte bloc">
        <label class="etiquette-champ" style="margin-top:0" for="fd-pas">Son pas en cours</label>
        <select id="fd-pas" class="champ" value={d.pas} onChange={async (e) => { try { await avancerDisciple(d, e.currentTarget.value); setL(lireDisciples()); notifier('Pas changé'); } catch (err) { notifier(err.message); } }}>
          {tousLesPas().filter((x) => x.id).map((x) => <option value={x.id}>{nomPas(x)}</option>)}
        </select>
        <p class="ligne__desc">En temps normal, tu n'y touches pas : le pas suivant se remet tout seul à la fin de votre rencontre.</p>
        <button class="bouton bouton--contour" style="width:100%" onClick={() => aller(`accompagner/pas/${p.id}?imprimer=vierge`)}><Icone nom="telecharger" taille={18} /> Imprimer la fiche vierge de ce pas</button>
        {d.accueil && <a class="lien" style="display:inline-block;margin-top:10px" href={'#/accompagner/encadreur/' + d.id + '/accueil'}>Revoir la rencontre d'accueil</a>}
      </section>

      {/* 4. Préparer la rencontre */}
      <h2 class="titre-section">Préparer votre rencontre</h2>
      <section class="carte bloc">
        <label class="etiquette-champ" style="margin-top:0" for="fd-rdv">Date et heure du rendez-vous</label>
        <input id="fd-rdv" class="champ" type="datetime-local" value={d.rdv} onInput={(e) => maj('rdv', e.currentTarget.value)} />
        {d.rdv && <button class="lien" onClick={() => agenda(d, p)}>Ajouter ce rendez-vous à mon agenda</button>}
        <label class="etiquette-champ" for="fd-notes">Mes notes : points à reprendre, sujets de prière</label>
        <textarea id="fd-notes" class="champ champ--zone" rows={4} value={d.notes} onInput={(e) => maj('notes', e.currentTarget.value)} />
        <p class="ligne__desc" style="margin-bottom:0">Ces notes restent sur ton téléphone. {d.prenom} ne les voit pas.</p>
      </section>

      {/* 5. Corriger ou arrêter */}
      <h2 class="titre-section">Corriger ou arrêter</h2>
      <section class="carte bloc">
        <label class="etiquette-champ" style="margin-top:0" for="fd-prenom">Corriger son prénom</label>
        <form style="display:flex;gap:8px" onSubmit={async (e) => { e.preventDefault(); const v = e.currentTarget.elements.nouveau.value; try { await renommerDisciple(d, v); setL(lireDisciples()); notifier('Prénom changé'); } catch (err) { notifier(err.message); } }}>
          <input id="fd-prenom" name="nouveau" class="champ" defaultValue={d.prenom} style="flex:1" />
          <button class="bouton bouton--contour">Changer</button>
        </form>
        {d.code && <p class="ligne__desc">Son lien ne bouge pas : seul le prénom affiché change.</p>}
        <button class="bouton bouton--contour acc-danger" style="width:100%;margin-top:12px" onClick={async () => { if (confirm('Arrêter le suivi de ' + d.prenom + ' ? Il disparaîtra de ta liste et ses réponses seront effacées du serveur.')) { await retirerDisciple(d); revenirOuRemplacer('accompagner/encadreur'); } }}>
          <Icone nom="corbeille" taille={18} /> Arrêter le suivi de {d.prenom}</button>
      </section>
    </div>
  );
}

// ---------- Rencontre d'accueil (étape 3 de l'inscription, ou relecture) ----------
export function RencontreAccueil({ disciple }) {
  const etat = useFiche('rencontre-accueil'), f = etat.f;
  const d = disciple ? lireDisciples().find((x) => x.id === disciple) : null;
  if (!f) return <Attente etat={etat} />;
  const fini = () => { if (d) { ecrireDisciples(lireDisciples().map((x) => (x.id === d.id ? { ...x, accueil: true } : x))); revenirOuRemplacer('accompagner/encadreur/' + d.id); } else retourVers('accompagner/encadreur'); };
  return (
    <div class="page">
      {d && !d.accueil && <Etapes n={3} total={3} />}
      <h2 style="margin:10px 4px 2px">{f.titre}{d ? ' avec ' + d.prenom : ''}</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">{f.sous_titre} · {f.duree}</p>
      <section class="carte bloc"><h3 style="margin-top:0">Le but</h3><ul class="acc-liste">{f.but.map((t) => <li>{t}</li>)}</ul></section>
      {f.etapes.map((e) => (
        <section class="carte bloc">
          <h3 style="margin-top:0">{e.titre} <small class="acc-minutes">{e.minutes} min</small></h3>
          <ul class="acc-liste">{e.points.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
          <Refs refs={e.versets} />
        </section>
      ))}
      <section class="carte bloc acc-vigilance"><h3 style="margin-top:0">Conseils</h3><ul class="acc-liste">{f.conseils.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></section>
      <button class="bouton bouton--or" style="width:100%;margin-top:12px" onClick={fini}>{d ? 'Rencontre d\'accueil faite · Suivant' : 'Terminer'} <Icone nom="chevron" taille={18} /></button>
    </div>
  );
}

// ---------- Un pas : carnet du nouveau converti, ou fiche du berger ----------
export function Pas({ id, role, imprimer, disciple }) {
  const etat = useFiche(id), f = etat.f;
  const [c, setC] = useState(() => lireCarnet(id));
  const vierge = imprimer === 'vierge', acc = (role === 'encadreur' || role === 'accompagnateur') && !vierge;
  const lien = useSignal(lienDisciple), env = useSignal(etatEnvoi);
  const d = acc ? lireDisciples().find((x) => x.id === disciple) : null;
  const [serveur, setServeur] = useState(null);
  const charger = () => { if (d?.code) etatDuDisciple(d).then(setServeur).catch(() => setServeur({ horsLigne: true })); };
  useEffect(() => { setC(lireCarnet(id)); if (!acc && !vierge) marquerEnCours(id); }, [id]);
  useEffect(() => { if (!d?.code) return; charger(); const t = setInterval(charger, 30000); return () => clearInterval(t); }, [id, disciple]);
  useEffect(() => { if (vierge && f) { const t = setTimeout(() => print(), 900); return () => clearTimeout(t); } }, [vierge, !!f]);
  if (!f) return <Attente etat={etat} />;
  const cv = vierge ? { r: {}, vf: {}, lect: [] } : acc ? (serveur?.carnets?.[id] || { r: {}, vf: {}, lect: [] }) : c;
  const maj = (k, v) => { if (vierge || acc) return; const n = { ...c, [k]: v }; setC(n); ecrireCarnet(id, n); };
  const repondre = (qid, v) => maj('r', { ...c.r, [qid]: v });
  const ens = ENSEIGNEMENTS.find((e) => e.id === f.enseignement);
  const suivant = pasSuivant(id);
  const questions = f.parties.flatMap((p) => p.elements.filter((e) => e.type === 'question'));
  const faites = questions.filter((q) => (cv.r[q.id] || '').trim()).length;
  const terminerRencontre = async () => {
    if (!d) return;
    if (!confirm(suivant ? `Rencontre terminée ? ${d.prenom} recevra le pas ${suivant.numero} « ${suivant.titre} ».` : 'Rencontre terminée ?')) return;
    try { if (suivant) await avancerDisciple(d, suivant.id); compter('suivi-pas-fini', id); notifier(suivant ? `Pas ${suivant.numero} remis à ${d.prenom}` : 'Parcours terminé !'); revenirOuRemplacer('accompagner/encadreur/' + d.id); }
    catch (err) { notifier(err.message); }
  };
  return (
    <div class={'page acc-pas' + (acc ? ' acc-pas--acc' : '') + (vierge ? ' acc-pas--vierge' : '')}>
      {vierge && <section class="carte bloc acc-sans-impression"><b>Fiche vierge à imprimer</b><p class="ligne__desc">Sans aucune réponse, avec des lignes pour écrire à la main. Choisis « Enregistrer en PDF » pour l'envoyer, ou imprime-la directement.</p>
        <div class="acc-actions"><button class="bouton bouton--or" onClick={() => print()}>Imprimer ou enregistrer en PDF</button><button class="bouton bouton--contour" onClick={() => history.back()}>Retour</button></div></section>}
      <p class="pastille pastille--or" style="display:inline-block;margin-top:10px">{acc && d ? `Rencontre avec ${d.prenom} · ` : ''}Pas {f.numero}</p>
      <h2 style="margin:6px 4px 2px">{f.titre}</h2>
      <p class="ligne__desc" style="margin:0 4px 6px">{f.sous_titre}</p>

      {acc && d && <section class="carte bloc acc-sans-impression acc-suivi-direct">
        {d.code ? (serveur?.horsLigne ? <p style="margin:0">Pas de réseau : les réponses de {d.prenom} s'afficheront dès que possible.</p>
          : !serveur ? <p style="margin:0">Chargement des réponses de {d.prenom}…</p>
          : !serveur.rejoint ? <p style="margin:0">{d.prenom} n'a pas encore entré son code (<b>{d.code}</b>). Ses réponses apparaîtront ici dès qu'il l'aura fait.</p>
          : <p style="margin:0"><Icone nom="verifie" taille={16} /> Réponses de {d.prenom} : <b>{faites} sur {questions.length}</b>{serveur.carnets?.[id]?.maj ? ` · mises à jour ${ilYA(serveur.carnets[id].maj)}` : ''}. <button class="lien" onClick={charger}>Actualiser</button></p>)
          : <p style="margin:0">{d.prenom} travaille sur papier : demande-lui ses réponses de vive voix.</p>}
      </section>}
      {acc && <GuideAccompagnateur a={f.accompagnateur} />}
      {!acc && <section class="carte bloc">{f.introduction.map((t) => <p><TexteRefs texte={t} /></p>)}
        {!vierge && <p class={'ligne__desc acc-sans-impression acc-statut' + (lien?.mode === 'relie' ? ' acc-statut--ok' : '')}>
          {lien?.mode === 'relie' ? <><Icone nom="verifie" taille={16} /><span>{faites} réponse{faites > 1 ? 's' : ''} sur {questions.length} · {env.statut === 'envoi' ? 'envoi…' : env.statut === 'attente' ? 'envoi en attente de réseau' : 'ton berger les voit'}</span></>
            : <span>{faites} réponse{faites > 1 ? 's' : ''} sur {questions.length}, enregistrées sur ce téléphone.</span>}</p>}</section>}

      <section class="carte bloc">
        <h3 style="margin-top:0">Verset à mémoriser</h3>
        <CarteVerset reference={f.verset_memoire} />
        {!acc && <a class="lien" href="#/jouer/memoriser" style="display:inline-block;margin-top:6px">S'entraîner avec le jeu « Mémoriser »</a>}
      </section>

      <section class="carte bloc">
        <h3 style="margin-top:0">{f.lecture.titre}</h3>
        {!acc && <p class="ligne__desc">{f.lecture.conseil}</p>}
        <div class="acc-lectures">{f.lecture.jours.map((j, k) => { const fait = (cv.lect || []).includes(k); const l = lienRef(j); return (
          <div class={'acc-lecture' + (fait ? ' acc-lecture--faite' : '')}>
            <button aria-pressed={fait} disabled={acc} onClick={() => maj('lect', fait ? c.lect.filter((x) => x !== k) : [...c.lect, k])} aria-label={'Jour ' + (k + 1) + ' lu'}>{fait ? <Icone nom="verifie" taille={16} /> : k + 1}</button>
            {l ? <a href={l}>{j}</a> : <span>{j}</span>}
          </div>); })}</div>
      </section>

      {f.parties.map((p) => (
        <section class="acc-partie">
          <h2 class="titre-section">{p.titre}</h2>
          {p.intro && <p class="ligne__desc" style="margin:-4px 4px 10px"><TexteRefs texte={p.intro} /></p>}
          {p.elements.map((e) => e.type === 'question' ? <Question q={e} n={questions.indexOf(e) + 1} valeur={cv.r[e.id] || ''} repondre={repondre} acc={acc} vierge={vierge} qui={d?.prenom} relie={!!d?.code} />
            : e.type === 'vf' ? <VraiFaux e={e} c={cv} maj={maj} acc={acc} />
            : e.type === 'encadre' ? <Encadre e={e} valeur={e.id ? cv.r[e.id] || '' : ''} repondre={repondre} acc={acc} vierge={vierge} qui={d?.prenom} />
            : e.type === 'bilan' ? <BlocBilan e={e} acc={acc} vierge={vierge} qui={d?.prenom} bilan={cv.bilan || {}} majBilan={(k, v) => maj('bilan', { ...(c.bilan || {}), [k]: v })} /> : null)}
        </section>
      ))}

      {ens && !acc && <a class="carte ligne" href={'#/grandir/enseignement/' + ens.id} style="margin-top:12px">
        <span class="ligne__icone"><Icone nom="musique" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Pour approfondir : {ens.titre}</span><span class="ligne__desc">L'enseignement de Yeshaya sur ce thème · {ens.lecture_minutes} min, à lire ou écouter</span></span>
        <Icone nom="chevron" taille={20} />
      </a>}

      {!vierge && <div class="acc-actions">
        {acc && d && <button class="bouton bouton--or" onClick={terminerRencontre}><Icone nom="verifie" taille={18} /> Rencontre terminée{suivant ? ` · remettre le pas ${suivant.numero}` : ''}</button>}
        {!acc && lien?.mode === 'relie' && <p class="ligne__desc" style="text-align:center;margin:0">Ton berger te remettra le pas suivant à la fin de votre rencontre.</p>}
        {!acc && lien?.mode !== 'relie' && suivant && <a class="bouton bouton--contour" href={'#/accompagner/pas/' + suivant.id}>Pas suivant : {suivant.titre} <Icone nom="chevron" taille={18} /></a>}
        <button class="bouton bouton--contour" onClick={() => { compter('fiche-imprimee', id); print(); }}><Icone nom="telecharger" taille={18} /> {acc ? 'Imprimer ma fiche' : 'Imprimer mes réponses'}</button>
      </div>}
      <p class="source-mention">{ACCOMPAGNEMENT.source}</p>
    </div>
  );
}

function GuideAccompagnateur({ a }) {
  const total = a.deroulement.reduce((t, x) => t + x.minutes, 0);
  return (
    <details class="carte bloc acc-guide acc-plus">
      <summary><b><Icone nom="groupe" taille={18} /> Préparer et mener la rencontre (environ {Math.floor(total / 60)} h{total % 60 ? ' ' + String(total % 60).padStart(2, '0') : ''})</b></summary>
      <h4>Le but de la rencontre</h4><ul class="acc-liste">{a.but.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
      <h4>Avant la rencontre</h4><ul class="acc-liste">{a.preparation.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
      <h4>Déroulé</h4>
      <ol class="acc-deroule">{a.deroulement.map((d) => <li><b>{d.titre}</b> <small class="acc-minutes">{d.minutes} min</small><ul>{d.conseils.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></li>)}</ol>
      <h4>Points de vigilance</h4><ul class="acc-liste">{a.vigilance.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
      <p class="ligne__desc">Pour chaque question : « Qu'as-tu répondu ? Pourquoi ? », puis explique avec les notes ci-dessous.</p>
    </details>
  );
}

function Question({ q, n, valeur, repondre, acc, vierge, qui, relie }) {
  const a = q.accompagnateur;
  return (
    <div class="carte bloc acc-question">
      <p class="acc-question__texte"><span class="enseignement__num">{n}</span> <TexteRefs texte={q.texte} /></p>
      <Refs refs={q.refs} />
      {!acc && !vierge && <textarea class="champ champ--zone" rows={3} value={valeur} placeholder="Ta réponse, avec tes propres mots…" onInput={(e) => repondre(q.id, e.currentTarget.value)} />}
      {!acc && (valeur && !vierge ? <div class="acc-reponse-imprimee">{valeur}</div> : <div class={'acc-lignes' + (vierge ? ' acc-lignes--visible' : '')} aria-hidden="true" />)}
      {acc && <>
        {qui && relie && <p class={'acc-reponse-disciple' + (valeur ? '' : ' acc-reponse-disciple--vide')}><b>Réponse de {qui} :</b> {valeur || 'pas encore écrite'}</p>}
        <div class="acc-attendu"><b>Réponse attendue</b><p><TexteRefs texte={a.attendu} /></p></div>
        {a.expliquer && <div class="acc-note"><b>À expliquer</b><ul>{a.expliquer.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></div>}
        {a.erreurs && <div class="acc-note acc-note--erreur"><b>Erreurs fréquentes</b><ul>{a.erreurs.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></div>}
        {a.relance && <div class="acc-note acc-note--relance"><b>Question de relance</b><p><TexteRefs texte={a.relance} /></p></div>}
      </>}
    </div>
  );
}

function VraiFaux({ e, c, maj, acc }) {
  return (
    <div class="carte bloc">
      {e.items.map((it) => { const v = (c.vf || {})[it.id]; return (
        <div class="acc-vf">
          <p>{it.texte}</p>
          <div class="segments" role="group">
            <button aria-pressed={v === true} disabled={acc} onClick={() => maj('vf', { ...c.vf, [it.id]: true })}>Vrai</button>
            <button aria-pressed={v === false} disabled={acc} onClick={() => maj('vf', { ...c.vf, [it.id]: false })}>Faux</button>
          </div>
          {acc && <p class={'acc-vf__rep' + (v === undefined ? '' : v === it.reponse ? ' acc-vf__rep--ok' : ' acc-vf__rep--non')}><b>{it.reponse ? 'Vrai' : 'Faux'}.</b> <TexteRefs texte={it.explication} /></p>}
        </div>); })}
      {!acc && <p class="ligne__desc" style="margin-bottom:0">Les réponses seront reprises avec ton berger.</p>}
    </div>
  );
}

function Encadre({ e, valeur, repondre, acc, vierge, qui }) {
  return (
    <div class={'carte bloc acc-encadre acc-encadre--' + e.style}>
      <h3 style="margin-top:0">{e.titre}</h3>
      {e.texte.map((t) => <p><TexteRefs texte={t} /></p>)}
      {e.champ && (acc ? (valeur ? <p class="acc-reponse-disciple"><b>{qui ? qui + ' · ' : ''}{e.champ} :</b> {valeur}</p> : null)
        : vierge ? <><label class="etiquette-champ">{e.champ}</label><div class="acc-lignes acc-lignes--visible acc-lignes--grand" /></>
        : <><label class="etiquette-champ">{e.champ}</label><textarea class="champ champ--zone" rows={5} value={valeur} onInput={(ev) => repondre(e.id, ev.currentTarget.value)} />{valeur ? <div class="acc-reponse-imprimee">{valeur}</div> : <div class="acc-lignes acc-lignes--grand" aria-hidden="true" />}</>)}
    </div>
  );
}

function BlocBilan({ e, acc, vierge, qui, bilan, majBilan }) {
  const etat = useFiche('bilan-de-vie'), f = etat.f;
  const nb = Object.values(bilan || {}).filter((v) => v && (Array.isArray(v) ? v.length : String(v).trim())).length;
  return (
    <div class="carte bloc acc-encadre acc-encadre--bilan">
      <h3 style="margin-top:0"><Icone nom="coeur" taille={18} /> {e.titre}</h3>
      {acc
        ? <p>Ce bilan fait partie du carnet de {qui || 'ton disciple'} : ses réponses arrivent ici comme les autres. Parcourez-le ensemble, sans juger, et priez domaine par domaine.{nb ? ` ${nb} réponse${nb > 1 ? 's' : ''} écrite${nb > 1 ? 's' : ''}.` : ' Rien n\'est encore écrit.'}</p>
        : e.texte.map((t2) => <p>{t2}</p>)}
      {!f ? <p class="ligne__desc">Chargement du bilan…</p> : <>
        <p class="ligne__desc acc-sans-impression">{f.sous_titre} · {f.duree}</p>
        {f.sections.map((s) => (
          <details class="acc-section" open={vierge || s.id === 'identite'}>
            <summary><b>{s.titre}</b></summary>
            {s.intro && <p class="ligne__desc"><TexteRefs texte={s.intro} /></p>}
            {s.blocs.map((bl) => <BlocChamp bl={bl} b={bilan || {}} maj={majBilan} lecture={acc || vierge} />)}
          </details>
        ))}
        {acc && <a class="bouton bouton--contour acc-sans-impression" style="width:100%;margin-top:10px" href="#/accompagner/orientations">Les orientations par domaine (pour te préparer)</a>}
        {!acc && !vierge && <a class="bouton bouton--contour acc-sans-impression" style="width:100%;margin-top:10px" href="#/accompagner/bilan/synthese">Voir la synthèse de mon bilan</a>}
      </>}
    </div>
  );
}

// Toutes les orientations, sans données personnelles : pour que le berger se prépare.
export function Orientations() {
  const etat = useFiche('bilan-de-vie'), f = etat.f;
  if (!f) return <Attente etat={etat} />;
  return (
    <div class="page">
      <h2 style="margin:14px 4px 2px">Orientations par domaine</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">Ce ne sont pas des prières à réciter : ce sont des directions. Laissez le Saint-Esprit vous conduire dans les mots.</p>
      <section class="carte bloc acc-guide"><h3 style="margin-top:0">Règles du berger</h3><ul class="acc-liste">{f.regles_accompagnateur.map((t) => <li>{t}</li>)}</ul></section>
      {Object.values(f.orientations).map((o) => (
        <details class="carte bloc acc-plus"><summary><b>{o.titre}</b></summary>
          <ul class="acc-liste">{o.orientations.map((t) => <li><TexteRefs texte={t} /></li>)}</ul><Refs refs={o.versets} /></details>
      ))}
    </div>
  );
}


// ---------- Fiche d'essai du berger ----------
const cleEssai = 'yeshaya:essai';
const lireEssai = () => { try { return JSON.parse(localStorage.getItem(cleEssai)) || { c: {}, r: {}, f: {} }; } catch { return { c: {}, r: {}, f: {} }; } };
export function Essai() {
  const etat = useFiche('essai-encadreur'), f = etat.f;
  const [e, setE] = useState(lireEssai);
  if (!f) return <Attente etat={etat} />;
  const maj = (cle, sous, v) => { const n = { ...e, [cle]: { ...e[cle], [sous]: v } }; setE(n); try { localStorage.setItem(cleEssai, JSON.stringify(n)); } catch {} };
  const total = f.sections.reduce((s, x) => s + x.items.length, 0), faits = f.sections.reduce((s, x) => s + x.items.filter((_, k) => e.c[x.id + k]).length, 0);
  const texte = () => {
    let s = "Compte rendu de l'essai (Suivi des nouveaux convertis)\n" + faits + ' points testés sur ' + total + '\n';
    f.sections.forEach((x) => { s += '\n' + x.titre + '\n'; x.items.forEach((it, k) => { s += (e.c[x.id + k] ? '[x] ' : '[ ] ') + it + '\n'; }); if ((e.r[x.id] || '').trim()) s += 'Remarques : ' + e.r[x.id].trim() + '\n'; });
    s += '\nBilan\n'; f.questions_finales.forEach((q, k) => { s += q + '\n' + ((e.f[k] || '').trim() || '(sans réponse)') + '\n'; });
    return s;
  };
  const envoyer = async () => { const r = await partager({ titre: "Compte rendu de l'essai", texte: texte() }); if (r === 'whatsapp') notifier('WhatsApp ouvert'); };
  const copierTout = async () => notifier((await copier(texte())) ? 'Compte rendu copié' : 'Copie impossible');
  const zone = { width: '100%', minHeight: '64px', marginTop: '6px', padding: '8px', borderRadius: '10px', border: '1px solid var(--bord, #ccc)', font: 'inherit', background: 'transparent', color: 'inherit' };
  return (
    <div class="page">
      <h2 style="margin:14px 4px 2px">{f.titre}</h2>
      {f.introduction.map((t) => <p class="ligne__desc" style="margin:0 4px 8px">{t}</p>)}
      <p class="pastille pastille--or" style="display:inline-block;margin:4px">{faits} sur {total} points testés</p>
      {f.sections.map((x) => (
        <section class="carte bloc"><h3 style="margin-top:0">{x.titre}</h3>
          {x.items.map((it, k) => <label style="display:flex;gap:10px;align-items:flex-start;margin:8px 0;line-height:1.35"><input type="checkbox" checked={!!e.c[x.id + k]} onChange={(ev) => maj('c', x.id + k, ev.target.checked)} style="margin-top:3px;width:20px;height:20px;flex:none" /><span>{it}</span></label>)}
          <label class="ligne__desc">Mes remarques</label>
          <textarea style={zone} value={e.r[x.id] || ''} onInput={(ev) => maj('r', x.id, ev.target.value)} placeholder="Ce qui a marché, ce qui a gêné, ce que je changerais" />
        </section>))}
      <section class="carte bloc"><h3 style="margin-top:0">Mon bilan</h3>
        {f.questions_finales.map((q, k) => <div style="margin-bottom:10px"><b>{q}</b><textarea style={zone} value={e.f[k] || ''} onInput={(ev) => maj('f', k, ev.target.value)} /></div>)}
        <p class="ligne__desc">{f.conseil}</p>
        <div class="acc-actions"><button class="bouton bouton--or" onClick={envoyer}>Envoyer mon compte rendu</button><button class="bouton bouton--contour" onClick={copierTout}>Copier le texte</button></div>
      </section>
    </div>
  );
}

// ---------- Bilan de vie ----------
export function Bilan() {
  const etat = useFiche('bilan-de-vie'), f = etat.f;
  const [b, setB] = useState(lireBilan);
  if (!f) return <Attente etat={etat} />;
  const maj = (k, v) => { const n = { ...b, [k]: v }; setB(n); ecrireBilan(n); };
  const nb = Object.values(b).filter((v) => v && (Array.isArray(v) ? v.length : String(v).trim())).length;
  return (
    <div class="page acc-bilan">
      <h2 style="margin:14px 4px 2px">{f.titre}</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">{f.sous_titre} · {f.duree}</p>
      <section class="carte bloc">{f.introduction.map((t) => <p><TexteRefs texte={t} /></p>)}</section>
      <section class="carte bloc acc-partage">
        <h3 style="margin-top:0"><Icone nom="groupe" taille={18} /> Ce bilan se partage avec ton berger</h3>
        <p>{f.confidentialite}</p>
        <ul class="acc-liste">{f.consignes.map((t) => <li>{t}</li>)}</ul>
      </section>
      {f.sections.map((s) => (
        <details class="carte bloc acc-section" open={s.id === 'identite'}>
          <summary><b>{s.titre}</b></summary>
          {s.intro && <p class="ligne__desc"><TexteRefs texte={s.intro} /></p>}
          {s.blocs.map((bl) => <BlocChamp bl={bl} b={b} maj={maj} />)}
        </details>
      ))}
      <div class="acc-actions">
        <a class="bouton bouton--or" href="#/accompagner/bilan/synthese">Voir la synthèse ({nb} réponse{nb > 1 ? 's' : ''})</a>
        <button class="bouton bouton--contour" onClick={() => { if (confirm('Effacer tout ton bilan de vie ? Il disparaîtra aussi du carnet envoyé à ton berger.')) { effacerBilan(); setB({}); notifier('Bilan effacé'); } }}><Icone nom="corbeille" taille={18} /> Tout effacer</button>
      </div>
      <p class="source-mention">{f.source}</p>
    </div>
  );
}

function BlocChamp({ bl, b, maj, lecture }) {
  if (bl.type === 'texte') return <><label class="etiquette-champ">{bl.label}</label>{bl.label.length < 60
    ? <input class="champ" value={b[bl.id] || ''} disabled={lecture} onInput={(e) => maj(bl.id, e.currentTarget.value)} />
    : <textarea class="champ champ--zone" rows={2} value={b[bl.id] || ''} disabled={lecture} onInput={(e) => maj(bl.id, e.currentTarget.value)} />}</>;
  if (bl.type === 'choix') return <div class="acc-choix"><p class="etiquette-champ">{bl.label}</p><div class="puces">{bl.options.map((o) => <button aria-pressed={b[bl.id] === o} disabled={lecture} onClick={() => maj(bl.id, b[bl.id] === o ? '' : o)}>{o}</button>)}</div></div>;
  if (bl.type === 'cases') { const v = b[bl.id] || []; return (
    <div class="acc-cases"><p class="etiquette-champ">{bl.titre}</p>
      <div class="acc-cases__grille">{bl.options.map((o) => <label class="choix-ens"><input type="checkbox" checked={v.includes(o)} disabled={lecture} onChange={() => maj(bl.id, v.includes(o) ? v.filter((x) => x !== o) : [...v, o])} /><span>{o}</span></label>)}</div>
    </div>); }
  if (bl.type === 'ouinon') return <div class="acc-ouinon">{bl.items.map((it) => (
    <div class="acc-ouinon__ligne">
      <p>{it.texte}</p>
      <div class="segments" role="group"><button aria-pressed={b[it.id] === 'oui'} disabled={lecture} onClick={() => maj(it.id, b[it.id] === 'oui' ? '' : 'oui')}>Oui</button><button aria-pressed={b[it.id] === 'non'} disabled={lecture} onClick={() => maj(it.id, b[it.id] === 'non' ? '' : 'non')}>Non</button></div>
      {it.precision && b[it.id] === 'oui' && <textarea class="champ champ--zone" rows={2} placeholder={it.precision} value={b[it.id + ':precision'] || ''} disabled={lecture} onInput={(e) => maj(it.id + ':precision', e.currentTarget.value)} />}
    </div>))}</div>;
  return null;
}

// Synthèse pour le berger : ce qui est coché, regroupé par domaine, avec les orientations.
export function BilanSynthese() {
  const etat = useFiche('bilan-de-vie'), f = etat.f;
  if (!f) return <Attente etat={etat} />;
  const b = lireBilan(), parAxe = {}, ajouter = (axe, t) => { if (!axe) return; (parAxe[axe] = parAxe[axe] || []).push(t); };
  const libres = [];
  for (const s of f.sections) for (const bl of s.blocs) {
    if (bl.type === 'cases' && b[bl.id]?.length) ajouter(bl.axe, bl.titre + ' : ' + b[bl.id].join(', '));
    else if (bl.type === 'ouinon') bl.items.forEach((it) => { if (b[it.id] === 'oui') { const p = (b[it.id + ':precision'] || '').trim(); (bl.axe ? (t) => ajouter(bl.axe, t) : (t) => libres.push(t))(it.texte.replace(/ \?$/, '') + ' : oui' + (p ? ' (' + p + ')' : '')); } });
    else if ((bl.type === 'texte' || bl.type === 'choix') && (b[bl.id] || '').trim()) (bl.axe ? ajouter(bl.axe, (bl.label || '') + ' : ' + b[bl.id]) : libres.push((bl.label || '') + ' : ' + b[bl.id]));
  }
  const axes = Object.keys(f.orientations).filter((a) => parAxe[a]);
  const urgent = parAxe.suicide || parAxe.abus;
  return (
    <div class="page acc-synthese">
      <h2 style="margin:14px 4px 2px">Synthèse du bilan de vie</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">Pour le berger, avec l'accord du disciple. Ce ne sont pas des prières à réciter : ce sont des orientations. Laissez le Saint-Esprit vous conduire dans les mots.</p>
      {urgent && <section class="carte bloc acc-urgent"><b>À traiter en priorité</b><p>Le bilan signale {parAxe.suicide ? 'des pensées suicidaires' : ''}{parAxe.suicide && parAxe.abus ? ' et ' : ''}{parAxe.abus ? 'des abus subis' : ''}. Commence par là, avec douceur, et suis les orientations ci-dessous.</p></section>}
      <section class="carte bloc acc-guide"><h3 style="margin-top:0">Règles du berger</h3><ul class="acc-liste">{f.regles_accompagnateur.map((t) => <li>{t}</li>)}</ul></section>
      {!axes.length && !libres.length && <p class="ligne__desc">Le bilan n'est pas encore rempli sur ce téléphone. <a class="lien" href="#/accompagner/bilan">Le remplir</a></p>}
      {libres.length > 0 && <section class="carte bloc"><h3 style="margin-top:0">Qui est la personne</h3><ul class="acc-liste">{libres.map((t) => <li>{t}</li>)}</ul></section>}
      {axes.map((a) => { const o = f.orientations[a]; return (
        <section class="carte bloc acc-axe">
          <h3 style="margin-top:0">{o.titre}</h3>
          <div class="acc-reponse-disciple"><b>Ce que la personne a indiqué</b><ul>{parAxe[a].map((t) => <li>{t}</li>)}</ul></div>
          <h4>Orientations</h4>
          <ul class="acc-liste">{o.orientations.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
          <Refs refs={o.versets} />
        </section>); })}
      <a class="bouton bouton--contour" style="width:100%;margin-top:10px" href="#/accompagner/bilan">Revenir au bilan</a>
    </div>
  );
}

function agenda(d, p) {
  const t = new Date(d.rdv), f = new Date(t.getTime() + 2 * 3600e3);
  const z = (x) => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yeshaya//Accompagnement//FR', 'BEGIN:VEVENT', `UID:yeshaya-${d.id}-${z(t)}@yeshaya`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(t)}`, `DTEND:${z(f)}`,
    `SUMMARY:Rencontre avec ${d.prenom}${p ? ' · pas ' + p.numero : ''}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Rencontre d\'accompagnement', 'TRIGGER:-PT2H', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const u = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), a = document.createElement('a');
  a.href = u; a.download = 'rencontre-' + d.prenom.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000); notifier('Ouvre le fichier pour l\'ajouter à ton agenda.');
}
