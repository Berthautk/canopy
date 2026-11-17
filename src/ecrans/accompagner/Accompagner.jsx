import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { ACCOMPAGNEMENT, ENSEIGNEMENTS, chargerFiche } from '../../donnees/contenu.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { aller } from '../../outils/routeur.js';
import { compter } from '../../donnees/mesure.js';
import {
  lireCarnet, ecrireCarnet, pasEnCours, marquerEnCours, lireBilan, ecrireBilan, effacerBilan,
  aUnCode, definirCode, verifierCode, bilanOuvert, ouvrirBilan, lireDisciples, ecrireDisciples,
} from '../../donnees/carnet.js';

// « Former le chrétien » : accompagnement d'un nouveau converti, pas à pas (méthode inspirée de La Nouvelle Vie en Christ).

const tousLesPas = () => ACCOMPAGNEMENT.volumes.flatMap((v) => v.pas.map((p) => ({ ...p, volume: v.numero })));
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

// ---------- Accueil du parcours ----------
export function AccompagnerAccueil() {
  const enCours = pasEnCours(), liste = tousLesPas(), suivant = liste.find((p) => p.id === enCours) || liste.find((p) => p.id);
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/nouveau-converti/etude-de-la-bible.webp" alt="" />
        <div><h2>{ACCOMPAGNEMENT.titre}</h2><p>{ACCOMPAGNEMENT.sous_titre}</p></div>
      </div>
      <section class="carte bloc">
        {ACCOMPAGNEMENT.presentation.map((t) => <p>{t}</p>)}
      </section>
      <div class="acc-roles">
        <a class="carte acc-role" href={'#/accompagner/pas/' + suivant.id}>
          <Icone nom="note" taille={26} /><b>Je suis accompagné</b><span>Mon carnet : {enCours ? 'reprendre le pas ' + suivant.numero : 'commencer le pas 1'}</span>
        </a>
        <a class="carte acc-role" href="#/accompagner/disciples">
          <Icone nom="groupe" taille={26} /><b>J'accompagne</b><span>Mes disciples, fiches de l'accompagnateur</span>
        </a>
      </div>
      <details class="carte bloc acc-comment" style="margin-top:12px">
        <summary><b>Comment ça marche à deux ?</b></summary>
        <p>Les deux téléphones ne sont pas reliés : chacun a sa propre fiche. Rien ne passe par Internet, sauf ce que vous envoyez vous-mêmes par WhatsApp.</p>
        <ul class="acc-liste">
          <li><b>Le disciple a un smartphone :</b> l'accompagnateur lui envoie le lien du pas (bouton « Envoyer ce pas au disciple »). Le disciple remplit son carnet pendant la semaine, puis touche « Envoyer mes réponses ». L'accompagnateur ouvre la rencontre depuis « Mes disciples », choisit son nom et colle le message : les réponses s'affichent sous chaque question, séparées pour chaque disciple.</li>
          <li><b>Ils se voient avec leurs deux téléphones :</b> le disciple garde son carnet ouvert, l'accompagnateur sa fiche, et ils avancent question par question.</li>
          <li><b>Le disciple n'a pas de smartphone :</b> l'accompagnateur imprime la « Fiche vierge pour le disciple » (ou l'envoie en PDF). Le disciple écrit à la main, et apporte sa feuille à la rencontre.</li>
          <li><b>Le bilan de vie</b> se remplit sur le téléphone du disciple (ou sur papier) et ne s'envoie jamais : on le regarde ensemble pendant la rencontre.</li>
        </ul>
      </details>
      <a class="carte ligne" href="#/accompagner/accueil" style="margin-top:12px">
        <span class="ligne__icone"><Icone nom="coeur" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Avant de commencer : la rencontre d'accueil</span>
          <span class="ligne__desc">Pour l'accompagnateur : accueillir, encourager, présenter le parcours et engager le nouveau converti.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <a class="carte ligne" href="#/accompagner/bilan" style="margin-top:8px">
        <span class="ligne__icone"><Icone nom="cadenas" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon bilan de vie (confidentiel)</span>
          <span class="ligne__desc">À remplir pendant la semaine du pas 1. Il reste sur ce téléphone.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      {ACCOMPAGNEMENT.volumes.map((v) => (
        <section class="carte bloc">
          <h3 style="margin-top:0">{v.titre}</h3>
          <p class="ligne__desc" style="margin-top:-4px">{v.sous_titre} · {v.pas.length} pas</p>
          <ol class="formation">
            {v.pas.map((p) => <li class={'formation__lecon' + (p.id ? '' : ' formation__lecon--a-venir')}>
              {p.id ? <a href={'#/accompagner/pas/' + p.id}><span class="formation__num">{p.numero}</span><span class="ligne__corps"><span class="ligne__titre">{p.titre}</span><span class="ligne__desc" style="display:block">{p.id === enCours ? 'En cours' : 'Fiche disponible'}</span></span><Icone nom="chevron" taille={18} /></a>
                : <span><span class="formation__num">{p.numero}</span><span class="ligne__corps"><span class="ligne__titre">{p.titre}</span><span class="ligne__desc" style="display:block">En préparation</span></span></span>}
            </li>)}
          </ol>
        </section>
      ))}
      <p class="source-mention">{ACCOMPAGNEMENT.source} <a class="lien" href={ACCOMPAGNEMENT.lien_source} target="_blank" rel="noopener">Manuel original</a></p>
    </div>
  );
}

// ---------- Rencontre d'accueil ----------
export function RencontreAccueil() {
  const etat = useFiche('rencontre-accueil'), f = etat.f;
  if (!f) return <Attente etat={etat} />;
  return (
    <div class="page">
      <h2 style="margin:14px 4px 2px">{f.titre}</h2>
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
      <a class="bouton bouton--or" style="width:100%;margin-top:12px" href="#/accompagner/pas/pas-01-le-salut">Ouvrir le pas 1 « Le salut »</a>
    </div>
  );
}

// ---------- Un pas : carnet du disciple, ou fiche de l'accompagnateur ----------
export function Pas({ id, role, imprimer, disciple }) {
  const etat = useFiche(id), f = etat.f;
  const [c, setC] = useState(() => lireCarnet(id));
  const vierge = imprimer === 'vierge', acc = role === 'accompagnateur' && !vierge;
  const [disciples, setDisciples] = useState(lireDisciples);
  const d = acc ? disciples.find((x) => x.id === disciple) : null;
  useEffect(() => { setC(lireCarnet(id)); if (!acc && !vierge) marquerEnCours(id); }, [id]);
  useEffect(() => { setDisciples(lireDisciples()); }, [id, disciple, role]);
  useEffect(() => { if (vierge && f) { const t = setTimeout(() => print(), 900); return () => clearTimeout(t); } }, [vierge, !!f]);
  if (!f) return <Attente etat={etat} />;
  const cv = vierge ? { r: {}, vf: {}, lect: [] } : c;   // fiche vierge : aucune réponse
  const maj = (k, v) => { if (vierge) return; const n = { ...c, [k]: v }; setC(n); ecrireCarnet(id, n); };
  const repondre = (qid, v) => maj('r', { ...c.r, [qid]: v });
  const ens = ENSEIGNEMENTS.find((e) => e.id === f.enseignement);
  const liste = tousLesPas(), i = liste.findIndex((p) => p.id === id), suivant = liste.slice(i + 1).find((p) => p.id);
  const questions = f.parties.flatMap((p) => p.elements.filter((e) => e.type === 'question'));
  const faites = questions.filter((q) => (cv.r[q.id] || '').trim()).length;
  const recues = d?.reponses?.[id] || null;   // réponses du disciple collées depuis WhatsApp
  const importer = (texte) => {
    const r = lireMessageReponses(texte, f);
    if (!Object.keys(r.q).length && !Object.keys(r.e).length) { notifier('Aucune réponse reconnue dans ce message.'); return; }
    const n = disciples.map((x) => (x.id === d.id ? { ...x, reponses: { ...(x.reponses || {}), [id]: r } } : x));
    setDisciples(n); ecrireDisciples(n); notifier(Object.keys(r.q).length + ' réponses enregistrées pour ' + d.prenom);
  };
  return (
    <div class={'page acc-pas' + (acc ? ' acc-pas--acc' : '') + (vierge ? ' acc-pas--vierge' : '')}>
      {vierge && <section class="carte bloc acc-sans-impression"><b>Fiche vierge à imprimer</b><p class="ligne__desc">Sans aucune réponse, avec des lignes pour écrire à la main. Choisis « Enregistrer en PDF » pour l'envoyer, ou imprime-la directement.</p>
        <div class="acc-actions"><button class="bouton bouton--or" onClick={() => print()}>Imprimer ou enregistrer en PDF</button><button class="bouton bouton--contour" onClick={() => history.back()}>Retour</button></div></section>}
      {!vierge && <div class="segments acc-bascule" role="group" aria-label="Version">
        <button aria-pressed={!acc} onClick={() => aller('accompagner/pas/' + id)}>Mon carnet</button>
        <button aria-pressed={acc} onClick={() => aller('accompagner/pas/' + id + '?role=accompagnateur')}>Accompagnateur</button>
      </div>}
      <p class="pastille pastille--or" style="display:inline-block;margin-top:10px">Volume {f.volume} · Pas {f.numero}</p>
      <h2 style="margin:6px 4px 2px">{f.titre}</h2>
      <p class="ligne__desc" style="margin:0 4px 6px">{f.sous_titre}</p>
      <p class="ligne__desc acc-duree" style="margin:0 4px 10px"><Icone nom="calendrier" taille={14} /> {f.duree}</p>

      {acc && <ChoixDisciple id={id} d={d} disciples={disciples} recues={recues} importer={importer} />}
      {acc && <GuideAccompagnateur a={f.accompagnateur} />}
      {!acc && <section class="carte bloc">{f.introduction.map((t) => <p><TexteRefs texte={t} /></p>)}
        {!vierge && <p class="ligne__desc acc-sans-impression">{faites} réponse{faites > 1 ? 's' : ''} écrite{faites > 1 ? 's' : ''} sur {questions.length}. Tes réponses sont enregistrées sur ce téléphone.</p>}</section>}

      <section class="carte bloc">
        <h3 style="margin-top:0">Verset à mémoriser</h3>
        <CarteVerset reference={f.verset_memoire} />
        <a class="lien" href="#/jouer/memoriser" style="display:inline-block;margin-top:6px">S'entraîner avec le jeu « Mémoriser »</a>
      </section>

      <section class="carte bloc">
        <h3 style="margin-top:0">{f.lecture.titre}</h3>
        <p class="ligne__desc">{f.lecture.conseil}</p>
        <div class="acc-lectures">{f.lecture.jours.map((j, k) => { const fait = cv.lect.includes(k); const l = lienRef(j); return (
          <div class={'acc-lecture' + (fait ? ' acc-lecture--faite' : '')}>
            <button aria-pressed={fait} onClick={() => maj('lect', fait ? c.lect.filter((x) => x !== k) : [...c.lect, k])} aria-label={'Jour ' + (k + 1) + ' lu'}>{fait ? <Icone nom="verifie" taille={16} /> : k + 1}</button>
            {l ? <a href={l}>{j}</a> : <span>{j}</span>}
          </div>); })}</div>
      </section>

      {f.parties.map((p) => (
        <section class="acc-partie">
          <h2 class="titre-section">{p.titre}</h2>
          {p.intro && <p class="ligne__desc" style="margin:-4px 4px 10px"><TexteRefs texte={p.intro} /></p>}
          {p.elements.map((e) => e.type === 'question' ? <Question q={e} n={questions.indexOf(e) + 1} valeur={cv.r[e.id] || ''} repondre={repondre} acc={acc} vierge={vierge} recue={recues?.q?.[questions.indexOf(e) + 1]} qui={d?.prenom} />
            : e.type === 'vf' ? <VraiFaux e={e} c={cv} maj={maj} acc={acc} />
            : e.type === 'encadre' ? <Encadre e={e} valeur={e.id ? cv.r[e.id] || '' : ''} repondre={repondre} acc={acc} vierge={vierge} recue={e.champ ? recues?.e?.[e.champ] : null} qui={d?.prenom} />
            : e.type === 'bilan' ? <BlocBilan e={e} acc={acc} /> : null)}
        </section>
      ))}

      {ens && <a class="carte ligne" href={'#/grandir/enseignement/' + ens.id} style="margin-top:12px">
        <span class="ligne__icone"><Icone nom="musique" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Pour approfondir : {ens.titre}</span><span class="ligne__desc">L'enseignement de Yeshaya sur ce thème · {ens.lecture_minutes} min, à lire ou écouter</span></span>
        <Icone nom="chevron" taille={20} />
      </a>}

      {!vierge && <div class="acc-actions">
        {!acc && <button class="bouton bouton--or" onClick={() => envoyerReponses(f, c)}><Icone nom="partager" taille={18} /> Envoyer mes réponses à mon accompagnateur</button>}
        {acc && <button class="bouton bouton--or" onClick={() => aller('accompagner/pas/' + id + '?imprimer=vierge')}><Icone nom="telecharger" taille={18} /> Fiche vierge pour le disciple (PDF ou papier)</button>}
        {acc && <button class="bouton bouton--contour" onClick={() => envoyerLien(f)}><Icone nom="partager" taille={18} /> Envoyer ce pas au disciple (lien WhatsApp)</button>}
        <button class="bouton bouton--contour" onClick={() => { compter('fiche-imprimee', id); print(); }}><Icone nom="telecharger" taille={18} /> {acc ? 'Imprimer la fiche de l\'accompagnateur' : 'Imprimer mes réponses'}</button>
        {!acc && <button class="bouton bouton--contour" onClick={() => aller('accompagner/pas/' + id + '?imprimer=vierge')}><Icone nom="telecharger" taille={18} /> Fiche vierge à imprimer</button>}
        {suivant ? <a class="bouton bouton--contour" href={'#/accompagner/pas/' + suivant.id + (acc ? '?role=accompagnateur' + (d ? '&disciple=' + d.id : '') : '')}>Pas suivant : {suivant.titre} <Icone nom="chevron" taille={18} /></a>
          : <a class="bouton bouton--contour" href="#/accompagner">Tous les pas</a>}
      </div>}
      <p class="source-mention">{ACCOMPAGNEMENT.source}</p>
    </div>
  );
}

function GuideAccompagnateur({ a }) {
  const total = a.deroulement.reduce((t, x) => t + x.minutes, 0);
  return (
    <section class="carte bloc acc-guide">
      <h3 style="margin-top:0"><Icone nom="groupe" taille={18} /> Fiche de l'accompagnateur</h3>
      <h4>Le but de la rencontre</h4><ul class="acc-liste">{a.but.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
      <h4>Avant la rencontre</h4><ul class="acc-liste">{a.preparation.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
      <h4>Déroulé (environ {Math.round(total / 60 * 10) / 10} h)</h4>
      <ol class="acc-deroule">{a.deroulement.map((d) => <li><b>{d.titre}</b> <small class="acc-minutes">{d.minutes} min</small><ul>{d.conseils.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></li>)}</ol>
      <h4>Points de vigilance</h4><ul class="acc-liste">{a.vigilance.map((t) => <li><TexteRefs texte={t} /></li>)}</ul>
      <p class="ligne__desc">Pendant la rencontre, demande pour chaque question : « Qu'as-tu répondu ? Pourquoi ? », puis explique. Si le disciple a rempli son carnet sur ce téléphone, ses réponses s'affichent sous chaque question.</p>
    </section>
  );
}

function Question({ q, n, valeur, repondre, acc, vierge, recue, qui }) {
  const a = q.accompagnateur;
  return (
    <div class="carte bloc acc-question">
      <p class="acc-question__texte"><span class="enseignement__num">{n}</span> <TexteRefs texte={q.texte} /></p>
      <Refs refs={q.refs} />
      {!acc && !vierge && <textarea class="champ champ--zone" rows={3} value={valeur} placeholder="Ta réponse, avec tes propres mots…" onInput={(e) => repondre(q.id, e.currentTarget.value)} />}
      {!acc && (valeur && !vierge ? <div class="acc-reponse-imprimee">{valeur}</div> : <div class={'acc-lignes' + (vierge ? ' acc-lignes--visible' : '')} aria-hidden="true" />)}
      {acc && <>
        {qui ? <p class={'acc-reponse-disciple' + (recue ? '' : ' acc-reponse-disciple--vide')}><b>Réponse de {qui} :</b> {recue || 'pas reçue (fais-la dire de vive voix)'}</p>
          : valeur ? <p class="acc-reponse-disciple"><b>Écrite sur ce téléphone :</b> {valeur}</p> : null}
        <div class="acc-attendu"><b>Réponse attendue</b><p><TexteRefs texte={a.attendu} /></p></div>
        {a.expliquer && <div class="acc-note"><b>À expliquer</b><ul>{a.expliquer.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></div>}
        {a.erreurs && <div class="acc-note acc-note--erreur"><b>Erreurs fréquentes</b><ul>{a.erreurs.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></div>}
        {a.relance && <div class="acc-note acc-note--relance"><b>Question de relance</b><p><TexteRefs texte={a.relance} /></p></div>}
      </>}
    </div>
  );
}

// En mode accompagnateur : pour quel disciple ? Les réponses de chacun restent séparées.
function ChoixDisciple({ id, d, disciples, recues, importer }) {
  const [texte, setTexte] = useState('');
  return (
    <section class="carte bloc acc-choix-disciple acc-sans-impression">
      <h3 style="margin-top:0"><Icone nom="groupe" taille={18} /> {d ? 'Rencontre avec ' + d.prenom : 'Pour quel disciple ?'}</h3>
      <select class="champ" value={d?.id || ''} onChange={(e) => aller('accompagner/pas/' + id + '?role=accompagnateur' + (e.currentTarget.value ? '&disciple=' + e.currentTarget.value : ''))}>
        <option value="">Aucun : le disciple me montre son téléphone</option>
        {disciples.map((x) => <option value={x.id}>{x.prenom}</option>)}
      </select>
      {!disciples.length && <p class="ligne__desc">Ajoute tes disciples dans <a class="lien" href="#/accompagner/disciples">Mes disciples</a> pour garder les réponses de chacun séparées.</p>}
      {d ? <>
        <p class="ligne__desc">{recues ? `Réponses de ${d.prenom} enregistrées : elles s'affichent sous chaque question.` : `${d.prenom} t'a envoyé ses réponses par WhatsApp ? Copie son message et colle-le ici.`}</p>
        <textarea class="champ champ--zone" rows={3} placeholder="Colle ici le message de réponses reçu" value={texte} onInput={(e) => setTexte(e.currentTarget.value)} />
        <button class="bouton bouton--contour" style="width:100%;margin-top:8px" disabled={!texte.trim()} onClick={() => { importer(texte); setTexte(''); }}>{recues ? 'Remplacer les réponses' : 'Enregistrer ces réponses'}</button>
      </> : <p class="ligne__desc">Sans disciple choisi, cette fiche montre seulement les réponses écrites sur ce téléphone. Si le disciple a rempli son carnet sur son propre téléphone, regardez-le ensemble, ou choisis son nom et colle ses réponses.</p>}
    </section>
  );
}

function VraiFaux({ e, c, maj, acc }) {
  return (
    <div class="carte bloc">
      {e.items.map((it) => { const v = c.vf[it.id]; return (
        <div class="acc-vf">
          <p>{it.texte}</p>
          <div class="segments" role="group">
            <button aria-pressed={v === true} onClick={() => maj('vf', { ...c.vf, [it.id]: true })}>Vrai</button>
            <button aria-pressed={v === false} onClick={() => maj('vf', { ...c.vf, [it.id]: false })}>Faux</button>
          </div>
          {acc && <p class={'acc-vf__rep' + (v === undefined ? '' : v === it.reponse ? ' acc-vf__rep--ok' : ' acc-vf__rep--non')}><b>{it.reponse ? 'Vrai' : 'Faux'}.</b> <TexteRefs texte={it.explication} /></p>}
        </div>); })}
      {!acc && <p class="ligne__desc" style="margin-bottom:0">Les réponses seront reprises avec ton accompagnateur.</p>}
    </div>
  );
}

function Encadre({ e, valeur, repondre, acc, vierge, recue, qui }) {
  return (
    <div class={'carte bloc acc-encadre acc-encadre--' + e.style}>
      <h3 style="margin-top:0">{e.titre}</h3>
      {e.texte.map((t) => <p><TexteRefs texte={t} /></p>)}
      {e.champ && (acc ? ((qui ? recue : valeur) ? <p class="acc-reponse-disciple"><b>{e.champ} :</b> {qui ? recue : valeur}</p> : null)
        : vierge ? <><label class="etiquette-champ">{e.champ}</label><div class="acc-lignes acc-lignes--visible acc-lignes--grand" /></>
        : <><label class="etiquette-champ">{e.champ}</label><textarea class="champ champ--zone" rows={5} value={valeur} onInput={(ev) => repondre(e.id, ev.currentTarget.value)} />{valeur ? <div class="acc-reponse-imprimee">{valeur}</div> : <div class="acc-lignes acc-lignes--grand" aria-hidden="true" />}</>)}
    </div>
  );
}

function BlocBilan({ e, acc }) {
  return (
    <div class="carte bloc acc-encadre acc-encadre--bilan">
      <h3 style="margin-top:0"><Icone nom="cadenas" taille={18} /> {e.titre}</h3>
      {e.texte.map((t) => <p>{t}</p>)}
      <a class="bouton bouton--or" style="width:100%" href={acc ? '#/accompagner/bilan/synthese' : '#/accompagner/bilan'}>{acc ? 'Voir la synthèse et les orientations' : 'Remplir mon bilan de vie'}</a>
      {acc && <p class="ligne__desc" style="margin-bottom:0">La synthèse lit le bilan rempli sur ce téléphone. Demande toujours l'accord du disciple avant de l'ouvrir.</p>}
    </div>
  );
}

// Message prêt à envoyer (WhatsApp ou autre) : réponses du carnet, sans le bilan de vie.
function envoyerReponses(f, c) {
  const qs = f.parties.flatMap((p) => p.elements.filter((e) => e.type === 'question' || (e.type === 'encadre' && e.champ)));
  let n = 0;
  const lignes = [`*Yeshaya · ${f.titre} (pas ${f.numero})*`, `Lecture : ${c.lect.length} jour(s) sur ${f.lecture.jours.length}`, ''];
  for (const q of qs) {
    const v = (c.r[q.id] || '').trim();
    if (q.type === 'question') { n++; lignes.push(`${n}. ${q.texte}`, v ? '→ ' + v : '→ (pas encore répondu)', ''); }
    else if (v) lignes.push(`*${q.champ}*`, v, '');
  }
  lignes.push('(Mon bilan de vie n\'est pas inclus : nous en parlerons de vive voix.)');
  const texte = lignes.join('\n');
  compter('reponses-envoyees', f.id);
  if (navigator.share) navigator.share({ title: f.titre, text: texte }).catch(() => {});
  else open('https://wa.me/?text=' + encodeURIComponent(texte), '_blank');
}

// Lien du pas à envoyer au disciple (il ouvre son carnet sur son propre téléphone).
function envoyerLien(f) {
  const lien = location.origin + '/#/accompagner/pas/' + f.id;
  const texte = `Yeshaya · Pas ${f.numero} : ${f.titre}\nTravaille ce pas cette semaine : lis le chapitre du jour, réponds aux questions avec tes mots et apprends le verset. Quand tu as fini, touche « Envoyer mes réponses à mon accompagnateur ».\n${lien}`;
  if (navigator.share) navigator.share({ title: f.titre, text: texte }).catch(() => {});
  else open('https://wa.me/?text=' + encodeURIComponent(texte), '_blank');
}

// Relit le message envoyé par « Envoyer mes réponses » : numéro de question → réponse ; encadrés → texte.
export function lireMessageReponses(texte, f) {
  const q = {}, e = {}, champs = f.parties.flatMap((p) => p.elements.filter((x) => x.type === 'encadre' && x.champ).map((x) => x.champ));
  const lignes = texte.replace(/\r/g, '').split('\n');
  let num = null, champ = null, buf = [];
  const vider = () => { const v = buf.join('\n').trim(); if (v && !/^\(pas encore répondu\)$/.test(v)) { if (num) q[num] = v; else if (champ) e[champ] = v; } buf = []; num = null; champ = null; };
  for (const l of lignes) {
    const mq = l.match(/^(\d{1,2})\.\s/), mc = l.match(/^\*(.+)\*$/);
    if (mq) { vider(); num = +mq[1]; continue; }
    if (mc && champs.includes(mc[1])) { vider(); champ = mc[1]; continue; }
    if (/^\(Mon bilan de vie/.test(l)) { vider(); continue; }
    if (num && !buf.length && !l.startsWith('→')) continue;   // suite du texte de la question
    if (num || champ) buf.push(l.replace(/^→\s?/, ''));
  }
  vider();
  return { q, e };
}

// ---------- Bilan de vie ----------
export function Bilan() {
  const etat = useFiche('bilan-de-vie'), f = etat.f;
  const [ouvert, setOuvert] = useState(bilanOuvert);
  const [b, setB] = useState(lireBilan);
  const [code, setCode] = useState('');
  if (!f) return <Attente etat={etat} />;
  if (!ouvert) return (
    <div class="page"><section class="carte bloc" style="margin-top:14px">
      <h3 style="margin-top:0"><Icone nom="cadenas" taille={18} /> Bilan protégé</h3>
      <form onSubmit={(e) => { e.preventDefault(); if (verifierCode(code)) { ouvrirBilan(); setOuvert(true); } else notifier('Code incorrect'); }}>
        <input class="champ" type="password" inputmode="numeric" placeholder="Ton code" value={code} onInput={(e) => setCode(e.currentTarget.value)} />
        <button class="bouton bouton--plein" style="width:100%;margin-top:10px">Ouvrir</button>
      </form>
      <button class="lien" style="margin-top:10px" onClick={() => { if (confirm('Code oublié : effacer tout le bilan pour recommencer ?')) { effacerBilan(); setB({}); setOuvert(true); } }}>Code oublié ?</button>
    </section></div>
  );
  const maj = (k, v) => { const n = { ...b, [k]: v }; setB(n); ecrireBilan(n); };
  const nb = Object.values(b).filter((v) => v && (Array.isArray(v) ? v.length : true)).length;
  return (
    <div class="page acc-bilan">
      <h2 style="margin:14px 4px 2px">{f.titre}</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">{f.sous_titre} · {f.duree}</p>
      <section class="carte bloc">{f.introduction.map((t) => <p><TexteRefs texte={t} /></p>)}</section>
      <section class="carte bloc acc-confidentiel"><h3 style="margin-top:0"><Icone nom="cadenas" taille={18} /> Confidentialité</h3><p>{f.confidentialite}</p>
        <ul class="acc-liste">{f.consignes.map((t) => <li>{t}</li>)}</ul>
        <div class="acc-actions">
          <button class="bouton bouton--contour" onClick={() => { const c = prompt(aUnCode() ? 'Nouveau code (laisser vide pour retirer le code) :' : 'Choisis un code (chiffres ou lettres) :'); if (c === null) return; definirCode(c.trim()); if (c.trim()) ouvrirBilan(); notifier(c.trim() ? 'Code enregistré' : 'Code retiré'); }}>{aUnCode() ? 'Changer le code' : 'Protéger par un code'}</button>
        </div>
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
        <button class="bouton bouton--contour" onClick={() => { if (confirm('Effacer définitivement tout ton bilan de vie de ce téléphone ?')) { effacerBilan(); setB({}); notifier('Bilan effacé'); } }}><Icone nom="corbeille" taille={18} /> Effacer mon bilan</button>
      </div>
      <p class="source-mention">{f.source}</p>
    </div>
  );
}

function BlocChamp({ bl, b, maj }) {
  if (bl.type === 'texte') return <><label class="etiquette-champ">{bl.label}</label>{bl.label.length < 60
    ? <input class="champ" value={b[bl.id] || ''} onInput={(e) => maj(bl.id, e.currentTarget.value)} />
    : <textarea class="champ champ--zone" rows={2} value={b[bl.id] || ''} onInput={(e) => maj(bl.id, e.currentTarget.value)} />}</>;
  if (bl.type === 'choix') return <div class="acc-choix"><p class="etiquette-champ">{bl.label}</p><div class="puces">{bl.options.map((o) => <button aria-pressed={b[bl.id] === o} onClick={() => maj(bl.id, b[bl.id] === o ? '' : o)}>{o}</button>)}</div></div>;
  if (bl.type === 'cases') { const v = b[bl.id] || []; return (
    <div class="acc-cases"><p class="etiquette-champ">{bl.titre}</p>
      <div class="acc-cases__grille">{bl.options.map((o) => <label class="choix-ens"><input type="checkbox" checked={v.includes(o)} onChange={() => maj(bl.id, v.includes(o) ? v.filter((x) => x !== o) : [...v, o])} /><span>{o}</span></label>)}</div>
    </div>); }
  if (bl.type === 'ouinon') return <div class="acc-ouinon">{bl.items.map((it) => (
    <div class="acc-ouinon__ligne">
      <p>{it.texte}</p>
      <div class="segments" role="group"><button aria-pressed={b[it.id] === 'oui'} onClick={() => maj(it.id, b[it.id] === 'oui' ? '' : 'oui')}>Oui</button><button aria-pressed={b[it.id] === 'non'} onClick={() => maj(it.id, b[it.id] === 'non' ? '' : 'non')}>Non</button></div>
      {it.precision && b[it.id] === 'oui' && <textarea class="champ champ--zone" rows={2} placeholder={it.precision} value={b[it.id + ':precision'] || ''} onInput={(e) => maj(it.id + ':precision', e.currentTarget.value)} />}
    </div>))}</div>;
  return null;
}

// Synthèse pour l'accompagnateur : ce qui est coché, regroupé par domaine, avec les orientations.
export function BilanSynthese() {
  const etat = useFiche('bilan-de-vie'), f = etat.f;
  const [ouvert] = useState(bilanOuvert);
  if (!f) return <Attente etat={etat} />;
  if (!ouvert) return <div class="page"><p class="ligne__desc" style="margin-top:16px">Ce bilan est protégé. <a class="lien" href="#/accompagner/bilan">Entrer le code</a></p></div>;
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
      <p class="ligne__desc" style="margin:0 4px 10px">Pour l'accompagnateur, avec l'accord du disciple. Ce ne sont pas des prières à réciter : ce sont des orientations. Laissez le Saint-Esprit vous conduire dans les mots.</p>
      {urgent && <section class="carte bloc acc-urgent"><b>À traiter en priorité</b><p>Le bilan signale {parAxe.suicide ? 'des pensées suicidaires' : ''}{parAxe.suicide && parAxe.abus ? ' et ' : ''}{parAxe.abus ? 'des abus subis' : ''}. Commence par là, avec douceur, et suis les orientations ci-dessous.</p></section>}
      <section class="carte bloc acc-guide"><h3 style="margin-top:0">Règles de l'accompagnateur</h3><ul class="acc-liste">{f.regles_accompagnateur.map((t) => <li>{t}</li>)}</ul></section>
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

// ---------- Mes disciples (accompagnateur) ----------
export function MesDisciples() {
  const [l, setL] = useState(lireDisciples), [nom, setNom] = useState(''), [ouvert, setOuvert] = useState(null);
  const pas = tousLesPas();
  const sauver = (n) => { setL(n); ecrireDisciples(n); };
  const majD = (id, k, v) => sauver(l.map((d) => (d.id === id ? { ...d, [k]: v } : d)));
  return (
    <div class="page">
      <h2 style="margin:14px 4px 2px">Mes disciples</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">Ceux que tu accompagnes. Ces notes restent sur ton téléphone.</p>
      <form class="acc-ajout" onSubmit={(e) => { e.preventDefault(); if (!nom.trim()) return; sauver([...l, { id: 'd' + Date.now().toString(36), prenom: nom.trim(), pas: 'accueil', versets: [], notes: '', rdv: '' }]); setNom(''); compter('disciple-ajoute'); }}>
        <input class="champ" placeholder="Prénom du nouveau converti" value={nom} onInput={(e) => setNom(e.currentTarget.value)} />
        <button class="bouton bouton--or">Ajouter</button>
      </form>
      {!l.length && <p class="ligne__desc" style="margin:10px 4px">Commence par la <a class="lien" href="#/accompagner/accueil">rencontre d'accueil</a>, puis ajoute ici la personne.</p>}
      {l.map((d) => { const p = pas.find((x) => x.id === d.pas); const ouv = ouvert === d.id; return (
        <section class="carte bloc acc-disciple">
          <button class="acc-disciple__tete" onClick={() => setOuvert(ouv ? null : d.id)}>
            <span class="ligne__corps"><b>{d.prenom}</b><span class="ligne__desc">{d.pas === 'accueil' ? 'Rencontre d\'accueil' : p ? `Pas ${p.numero} · ${p.titre}` : ''}{d.rdv ? ' · prochaine rencontre le ' + new Date(d.rdv).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}</span></span>
            <Icone nom="chevron" taille={18} />
          </button>
          {ouv && <div class="acc-disciple__corps">
            <label class="etiquette-champ">Où il en est</label>
            <select class="champ" value={d.pas} onChange={(e) => majD(d.id, 'pas', e.currentTarget.value)}>
              <option value="accueil">Rencontre d'accueil</option>
              {pas.map((x) => <option value={x.id || 'v' + x.volume + '-' + x.numero} disabled={!x.id}>Vol. {x.volume} · Pas {x.numero} · {x.titre}{x.id ? '' : ' (en préparation)'}</option>)}
            </select>
            {p && <div class="acc-actions"><a class="bouton bouton--or" href={'#/accompagner/pas/' + p.id + '?role=accompagnateur&disciple=' + d.id}>Ouvrir la rencontre avec {d.prenom}</a></div>}
            <label class="etiquette-champ">Prochaine rencontre</label>
            <input class="champ" type="datetime-local" value={d.rdv} onInput={(e) => majD(d.id, 'rdv', e.currentTarget.value)} />
            {d.rdv && <button class="lien" onClick={() => agenda(d, p)}>Ajouter ce rendez-vous à mon agenda</button>}
            <label class="etiquette-champ">Versets récités</label>
            <div class="puces">{pas.filter((x) => x.id).map((x) => <button aria-pressed={d.versets.includes(x.id)} onClick={() => majD(d.id, 'versets', d.versets.includes(x.id) ? d.versets.filter((v) => v !== x.id) : [...d.versets, x.id])}>Pas {x.numero}</button>)}</div>
            <label class="etiquette-champ">Notes (points à reprendre, sujets de prière)</label>
            <textarea class="champ champ--zone" rows={5} value={d.notes} onInput={(e) => majD(d.id, 'notes', e.currentTarget.value)} />
            <button class="lien" style="color:var(--rouge, #b3261e)" onClick={() => confirm('Retirer ' + d.prenom + ' de la liste ?') && sauver(l.filter((x) => x.id !== d.id))}>Retirer de la liste</button>
          </div>}
        </section>); })}
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
