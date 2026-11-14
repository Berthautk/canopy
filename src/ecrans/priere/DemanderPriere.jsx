import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { envoyerDemande, compter } from '../../donnees/mesure.js';

// « Demander la prière » : message envoyé à l'équipe de Yeshaya, qui prie (et répond si la personne le souhaite).
export function DemanderPriere() {
  const [f, setF] = useState({ texte: '', prenom: '', contact: '', repondre: false, accord: false });
  const [etat, setEtat] = useState(null);
  const maj = (k) => (e) => setF({ ...f, [k]: e.currentTarget.type === 'checkbox' ? e.currentTarget.checked : e.currentTarget.value });
  async function envoyer(e) {
    e.preventDefault(); setEtat('envoi');
    const r = await envoyerDemande({ texte: f.texte, prenom: f.prenom, contact: f.repondre ? f.contact : '', repondre: f.repondre });
    compter('demande-priere');
    setEtat(r.envoye ? 'ok' : 'attente');
  }
  if (etat === 'ok' || etat === 'attente') return (
    <div class="page"><section class="carte bloc" style="margin-top:12px;text-align:center">
      <Icone nom="priere" taille={36} />
      <h3 style="justify-content:center">Merci, nous allons prier pour toi</h3>
      <p>{etat === 'ok' ? 'Ta demande a bien été envoyée.' : 'Tu n\'as pas internet pour le moment : ta demande partira automatiquement dès que tu seras connecté.'}</p>
      <p class="ligne__desc">« Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. » (Philippiens 4:6)</p>
      <a class="bouton bouton--contour" href="#/priere" style="width:100%;margin-top:10px">Retour à la prière</a>
    </section></div>
  );
  return (
    <div class="page">
      <section class="carte bloc" style="margin-top:12px">
        <h3><span class="ligne__icone"><Icone nom="priere" /></span> Demander la prière</h3>
        <p class="ligne__desc">Confie ton sujet de prière à l'équipe de Yeshaya. Nous prierons pour toi. Ton message n'est lu que par le responsable de l'application.</p>
        <form onSubmit={envoyer}>
          <label class="etiquette-champ" for="dp-texte">Ton sujet de prière</label>
          <textarea id="dp-texte" class="champ champ--zone" rows={6} maxLength={1500} required value={f.texte} onInput={maj('texte')} placeholder="Ex. : Priez pour la guérison de ma mère…" />
          <label class="etiquette-champ" for="dp-prenom">Ton prénom (facultatif)</label>
          <input id="dp-prenom" class="champ" maxLength={40} value={f.prenom} onInput={maj('prenom')} />
          <label class="choix-ens" style="margin-top:12px"><input type="checkbox" checked={f.repondre} onChange={maj('repondre')} /><span>Je souhaite qu'on me recontacte</span></label>
          {f.repondre && <><label class="etiquette-champ" for="dp-contact">Numéro WhatsApp ou e-mail</label>
            <input id="dp-contact" class="champ" maxLength={80} value={f.contact} onInput={maj('contact')} required /></>}
          <label class="choix-ens" style="margin-top:12px"><input type="checkbox" checked={f.accord} onChange={maj('accord')} required />
            <span>J'accepte que ce message (qui peut parler de ma foi ou de ma santé) soit envoyé à l'équipe de Yeshaya pour prier pour moi, et conservé 12 mois au plus. J'ai au moins 15 ans, ou un parent est d'accord.</span></label>
          <button class="bouton bouton--plein" style="width:100%;margin-top:14px" disabled={f.texte.trim().length < 3 || !f.accord || etat === 'envoi'}>{etat === 'envoi' ? 'Envoi…' : 'Envoyer ma demande'}</button>
        </form>
        <p class="ligne__desc" style="margin-top:10px">Voir la <a class="lien" href="#/confidentialite">politique de confidentialité</a>.</p>
      </section>
    </div>
  );
}
