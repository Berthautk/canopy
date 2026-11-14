import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { PLANS } from '../../donnees/contenu.js';
import { plan, commencerPlan, arreterPlan, bilan, basculerLu, rattraper, grouper, programme, JOURS } from '../../bible/plans.js';
import { useSignal } from '../../outils/signal.js';

function Choix() {
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/objets-quotidien/calendrier.webp" alt="" />
        <div><h2>Lire la Bible en un an</h2><p>Quelques chapitres par jour, à votre rythme.</p></div>
      </div>
      <h2 class="titre-section">Choisir un plan</h2>
      <div class="liste">
        {PLANS.map((p) => (
          <div class="carte plan-choix">
            <div class="ligne__corps">
              <span class="ligne__titre">{p.titre}</span>
              <span class="ligne__desc" style="display:block">{p.description}</span>
              {!p.disponible && <span class="ligne__desc" style="display:block;margin-top:4px">{p.note}</span>}
            </div>
            {p.disponible ? <button class="bouton bouton--plein bouton--petit" onClick={() => commencerPlan(p.id)}>Commencer</button>
              : <span class="pastille pastille--ref">Bientôt</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Écran 18 : plan de lecture en un an.
export function Plan() {
  const p = useSignal(plan);
  const [apercu, setApercu] = useState(false);
  if (!p) return <Choix />;
  const b = bilan(p);
  const lus = new Set(p.lus);
  const groupes = grouper(b.aujourdhui);
  const nomPlan = PLANS.find((x) => x.id === p.id)?.titre ?? p.id;
  const fin = new Date(); fin.setDate(fin.getDate() + b.joursRestants - 1);

  return (
    <div class="page">
      <section class="carte plan-tete">
        <span class="ligne__icone"><Icone nom="calendrier" /></span>
        <div class="ligne__corps">
          <span class="ligne__titre">Mon plan : {nomPlan}</span>
          <span class="ligne__desc" style="display:block">Jour {b.jour} sur {JOURS}</span>
          <div class="progression progression--fine"><span style={{ width: b.pourcentage + '%' }} /></div>
        </div>
        <b class="plan-tete__pct">{b.pourcentage} %</b>
      </section>

      {b.retard.length > 0 && (
        <section class="carte rattrapage">
          <p><b>{b.retard.length} chapitre{b.retard.length > 1 ? 's' : ''} en attente.</b> Ce n'est pas grave : on avance ensemble, à votre rythme.</p>
          <button class="bouton bouton--or bouton--petit" onClick={() => { rattraper(p); notifier('Lectures réparties sur les jours suivants'); }}>Rattraper mon retard</button>
        </section>
      )}

      <section class="carte lecture-jour">
        <div class="lecture-jour__date"><span>Jour</span><b>{b.jour}</b></div>
        <div class="ligne__corps">
          <h3>Lecture d'aujourd'hui</h3>
          {groupes.length === 0 && <p class="ligne__desc">Rien de prévu aujourd'hui : profitez-en pour relire un passage.</p>}
          <ul class="cases">
            {groupes.map((g) => {
              const fait = g.cles.every((k) => lus.has(k));
              return (
                <li>
                  <label class="case">
                    <input type="checkbox" checked={fait} onChange={(e) => basculerLu(p, g.cles, e.currentTarget.checked)} />
                    <span class={fait ? 'barre' : ''}>{g.libelle}{g.theme && <small class="plan-theme">{g.theme}</small>}</span>
                  </label>
                  <a class="lien" href={`#/bible/lire/${g.code}/${g.debut}${g.verset ? '/' + g.verset : ''}`}>Lire</a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section class="carte plan-bilan">
        <div><b>{b.lus}</b><span>chapitres lus</span></div>
        <div><b>{b.total - b.lus}</b><span>à lire</span></div>
        <div><b>{fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</b><span>fin prévue</span></div>
      </section>

      <button class="bouton bouton--contour" style="width:100%;margin-top:12px" onClick={() => setApercu(!apercu)}>
        <Icone nom="liste" taille={18} /> {apercu ? 'Masquer' : 'Voir'} les prochains jours</button>
      {apercu && (
        <ul class="carte apercu-plan">
          {programme(p).slice(b.jour, b.jour + 7).map((j, i) => <li><b>Jour {b.jour + i + 1}</b> {grouper(j).map((g) => g.libelle).join(', ') || '—'}</li>)}
        </ul>
      )}

      <p class="conseil"><Icone nom="ampoule" taille={18} /> Lisez à votre rythme. Même quelques minutes par jour suffisent pour avancer.</p>
      <button class="lien" style="margin:6px auto;display:block" onClick={() => { if (confirm('Changer de plan ? Votre progression actuelle sera effacée.')) arreterPlan(); }}>Changer de plan</button>
    </div>
  );
}
