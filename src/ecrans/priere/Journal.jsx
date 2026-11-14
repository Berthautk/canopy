import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { journal, ajouterRequete, marquerExaucee, remettreEnPriere, supprimerRequete, dateCourte } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';

function Requete({ r }) {
  const [ouvert, setOuvert] = useState(false);
  const [temoignage, setTemoignage] = useState('');
  return (
    <article class={'carte requete' + (r.exaucee ? ' requete--exaucee' : '')}>
      <div class="requete__tete">
        <h3>{r.titre}</h3>
        <span class="ligne__desc">{dateCourte(r.date)}</span>
      </div>
      {r.detail && <p class="requete__detail">{r.detail}</p>}
      {r.exaucee ? (
        <>
          <span class="statut statut--ok"><Icone nom="verifie" taille={14} /> Dieu a répondu · {dateCourte(r.exaucee.date)}</span>
          {r.exaucee.temoignage && <p class="requete__temoignage">« {r.exaucee.temoignage} »</p>}
        </>
      ) : <span class="statut"><Icone nom="priere" taille={14} /> En prière</span>}
      {ouvert ? (
        <div class="requete__exaucer">
          <label class="ligne__desc" for={'t' + r.id}>Comment Dieu a-t-il répondu ? (facultatif)</label>
          <textarea id={'t' + r.id} class="champ" rows="3" value={temoignage} onInput={(e) => setTemoignage(e.currentTarget.value)} style="padding:10px" />
          <div class="note-edition__pied">
            <button class="bouton bouton--contour bouton--petit" onClick={() => setOuvert(false)}>Annuler</button>
            <button class="bouton bouton--plein bouton--petit" onClick={() => { marquerExaucee(r.id, temoignage); setOuvert(false); notifier('Gloire à Dieu !'); }}>Enregistrer</button>
          </div>
        </div>
      ) : (
        <div class="requete__actions">
          {r.exaucee ? <button class="lien" onClick={() => remettreEnPriere(r.id)}>Remettre en prière</button>
            : <button class="bouton bouton--plein bouton--petit" onClick={() => setOuvert(true)}><Icone nom="verifie" taille={16} /> Dieu a répondu</button>}
          <button class="rond" aria-label={'Supprimer ' + r.titre} onClick={() => { if (confirm('Supprimer cette requête ?')) supprimerRequete(r.id); }}><Icone nom="corbeille" taille={18} /></button>
        </div>
      )}
    </article>
  );
}

// Écran 5 : journal de prière (mes requêtes / prières exaucées).
export function Journal({ nouveau }) {
  const j = useSignal(journal);
  const [onglet, setOnglet] = useState('requetes');
  const [form, setForm] = useState(!!nouveau);
  const [titre, setTitre] = useState(''), [detail, setDetail] = useState('');
  const liste = j.filter((r) => (onglet === 'requetes' ? !r.exaucee : r.exaucee));
  const valider = async (e) => { e.preventDefault(); if (!titre.trim()) return; await ajouterRequete(titre, detail); setTitre(''); setDetail(''); setForm(false); setOnglet('requetes'); notifier('Requête ajoutée à ton journal'); };

  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/vie-chretienne/mains-en-priere-sur-bible.webp" alt="" />
        <div><h2>Mon journal de prière</h2><p>Garde la trace de tes prières et des réponses de Dieu. Il reste sur ton téléphone.</p></div>
      </div>
      <div class="onglets-internes onglets-internes--2" role="tablist">
        <button role="tab" aria-selected={onglet === 'requetes'} onClick={() => setOnglet('requetes')}>Mes requêtes<span class="onglets-internes__nb">{j.filter((r) => !r.exaucee).length}</span></button>
        <button role="tab" aria-selected={onglet === 'exaucees'} onClick={() => setOnglet('exaucees')}>Prières exaucées<span class="onglets-internes__nb">{j.filter((r) => r.exaucee).length}</span></button>
      </div>

      {form ? (
        <form class="carte bloc" onSubmit={valider}>
          <label class="ligne__titre" for="rq-titre">Pour quoi veux-tu prier ?</label>
          <input id="rq-titre" class="champ" value={titre} maxLength={80} onInput={(e) => setTitre(e.currentTarget.value)} placeholder="Ex. : La santé de maman" autoFocus />
          <label class="ligne__desc" for="rq-detail">Détails (facultatif)</label>
          <textarea id="rq-detail" class="champ" rows="3" value={detail} maxLength={1000} onInput={(e) => setDetail(e.currentTarget.value)} style="padding:10px" />
          <div class="note-edition__pied">
            <button type="button" class="bouton bouton--contour bouton--petit" onClick={() => setForm(false)}>Annuler</button>
            <button type="submit" class="bouton bouton--plein bouton--petit" disabled={!titre.trim()}>Ajouter</button>
          </div>
        </form>
      ) : (
        <button class="bouton bouton--or" style="width:100%;margin-top:12px" onClick={() => setForm(true)}><Icone nom="note" taille={18} /> Écrire une nouvelle requête</button>
      )}

      <div class="liste" style="margin-top:12px">{liste.map((r) => <Requete r={r} />)}</div>
      {!liste.length && !form && (
        <div class="carte vide" style="margin-top:12px">
          <Icone nom={onglet === 'requetes' ? 'priere' : 'verifie'} taille={32} />
          <p>{onglet === 'requetes' ? 'Aucune requête pour le moment. Écris ce que tu veux confier à Dieu.' : 'Quand Dieu répond à une prière, marque-la ici : tu pourras te souvenir de sa fidélité.'}</p>
        </div>
      )}
    </div>
  );
}
