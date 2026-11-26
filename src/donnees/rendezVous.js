// Rendez-vous d'accompagnement : fixé par le berger, lu par le berger ET par le disciple.
// Rappels : l'application les affiche à l'accueil et, si la personne l'a permis, envoie une notification
// à l'ouverture (la veille et le jour même). Le fichier d'agenda (.ics) programme en plus un rappel dans
// le calendrier du téléphone, qui sonne même application fermée.
import { lienDisciple } from './suivi.js';
import { lireDisciples } from './carnet.js';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DEUX_HEURES = 2 * 3600e3;

export const dateDe = (rdv) => { const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(rdv || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null; };
const jourCivil = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const heure = (d) => `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;

// « aujourd'hui à 16 h 00 », « demain à 16 h 00 », « jeudi 4 décembre à 16 h 00 »
export function quand(rdv, maintenant = new Date()) {
  const d = dateDe(rdv); if (!d) return '';
  const ecart = Math.round((jourCivil(d) - jourCivil(maintenant)) / 864e5);
  const jour = ecart === 0 ? "aujourd'hui" : ecart === 1 ? 'demain' : `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
  return `${jour} à ${heure(d)}`;
}

// Tous les rendez-vous à venir (ou commencés depuis moins de 2 h), du plus proche au plus lointain.
export function rendezVousAVenir(maintenant = new Date(), lien = lienDisciple.valeur, disciples = lireDisciples()) {
  const liste = [];
  if (lien?.mode === 'relie' && lien.rdv) liste.push({ role: 'disciple', rdv: lien.rdv, lieu: lien.lieu || '', avec: 'ton berger', id: 'moi' });
  for (const d of disciples || []) if (d.rdv) liste.push({ role: 'berger', rdv: d.rdv, lieu: d.lieu || '', avec: d.prenom, id: d.id });
  return liste.map((r) => ({ ...r, date: dateDe(r.rdv) })).filter((r) => r.date && r.date.getTime() > maintenant.getTime() - DEUX_HEURES)
    .sort((a, b) => a.date - b.date);
}

export function fichierAgenda(r) {
  const z = (x) => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const t = r.date, f = new Date(t.getTime() + DEUX_HEURES);
  const titre = r.role === 'berger' ? `Rencontre avec ${r.avec}` : 'Rencontre avec mon berger';
  const alarme = (decalage) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${titre}`, `TRIGGER:${decalage}`, 'END:VALARM'];
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yeshaya//Accompagnement//FR', 'BEGIN:VEVENT', `UID:yeshaya-${r.id}-${z(t)}@yeshaya`, `DTSTAMP:${z(new Date())}`,
    `DTSTART:${z(t)}`, `DTEND:${z(f)}`, `SUMMARY:${titre}`, ...(r.lieu ? [`LOCATION:${r.lieu}`] : []), ...alarme('-P1D'), ...alarme('-PT2H'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return new Blob([ics], { type: 'text/calendar' });
}
export function telechargerAgenda(r) {
  const u = URL.createObjectURL(fichierAgenda(r)), a = document.createElement('a');
  a.href = u; a.download = 'rencontre.ics'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}

export const messageRdv = (prenom, rdv, lieu) =>
  `Bonjour ${prenom}, notre prochaine rencontre est fixée ${quand(rdv)}${lieu ? ', ' + lieu : ''}. Que la paix de Dieu soit avec toi. À bientôt !`;

// Notification à l'ouverture : une fois la veille, une fois le jour même (si la personne l'a autorisée).
export const rappelsPossibles = () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
export const rappelsEtat = () => (typeof Notification === 'undefined' ? 'non' : Notification.permission);
export async function autoriserRappels() { try { return (await Notification.requestPermission()) === 'granted'; } catch { return false; } }

export async function rappelerSiProche(liste = rendezVousAVenir(), maintenant = new Date()) {
  if (!rappelsPossibles() || Notification.permission !== 'granted') return;
  let faits = {}; try { faits = JSON.parse(localStorage.getItem('yeshaya:rdv-rappels') || '{}'); } catch {}
  const reg = await navigator.serviceWorker.ready.catch(() => null); if (!reg) return;
  for (const r of liste) {
    const ecart = (r.date - maintenant) / 3600e3;
    const etape = ecart <= 6 ? 'jour' : ecart <= 30 ? 'veille' : null;
    if (!etape || faits[r.rdv + r.id] === 'jour' || faits[r.rdv + r.id] === etape) continue;
    const corps = `${r.role === 'berger' ? 'Rencontre avec ' + r.avec : 'Rencontre avec ton berger'} : ${quand(r.rdv, maintenant)}${r.lieu ? ', ' + r.lieu : ''}.`;
    try { await reg.showNotification('Rendez-vous', { body: corps, tag: 'rdv-' + r.id, icon: '/icons/apple-touch-icon.png' }); faits[r.rdv + r.id] = etape; } catch {}
  }
  try { localStorage.setItem('yeshaya:rdv-rappels', JSON.stringify(faits)); } catch {}
}
