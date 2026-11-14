// « Mon équilibre avec Dieu » : rythme personnel (emploi du temps spirituel), temps passé par activité, rappels de calendrier.
// Tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

export const ACTIVITES = {
  priere: { nom: 'Prière', icone: 'priere', conseil: "Prends un moment fixe chaque jour pour prier, même 10 minutes. Les moments de prière guidés (Aube, Midi, Soir) peuvent t'aider." },
  parole: { nom: 'Lecture de la Bible', icone: 'bible', conseil: "Lis un chapitre par jour, par exemple avec un plan de lecture. Tu peux aussi l'écouter : l'application lit la Bible à voix haute." },
  meditation: { nom: 'Méditation', icone: 'ampoule', conseil: "Choisis un verset, lis-le lentement plusieurs fois, et demande : que me dit Dieu aujourd'hui ? La méditation du jour est faite pour cela." },
  enseignement: { nom: 'Enseignements', icone: 'grandir', conseil: "Écoute un enseignement par semaine, puis réponds aux questions pour vérifier que tu as compris." },
  evangelisation: { nom: 'Évangélisation', icone: 'evangeliser', conseil: "Prie pour une personne de ton entourage et cherche une occasion de lui parler de Jésus cette semaine." },
  communion: { nom: 'Église et communion', icone: 'groupe', conseil: "Ne reste pas seul : retrouve tes frères et sœurs au culte et dans un petit groupe chaque semaine." },
};

const CLE_RYTHME = 'yeshaya:rythme', CLE_TEMPS = 'yeshaya:temps';
export const rythme = signal(null);               // { items: [{ id, activite, heure, minutes, jours: [0..6] }], cree }
export const temps = signal({});                  // { 'AAAA-MM-JJ': { activite: secondes } }
export async function chargerRythme() {
  try { rythme.valeur = (await get(CLE_RYTHME)) || null; temps.valeur = (await get(CLE_TEMPS)) || {}; } catch {}
}
export const sauverRythme = (r) => { rythme.valeur = r; return set(CLE_RYTHME, r).catch(() => {}); };

export const jourCle = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
let minuteur = null;
function ajouterSecondes(activite, s, jour = jourCle()) {
  if (!ACTIVITES[activite] || s <= 0) return;
  const t = temps.valeur, j = { ...(t[jour] || {}) };
  j[activite] = (j[activite] || 0) + Math.round(s);
  temps.valeur = { ...t, [jour]: j };
  clearTimeout(minuteur); minuteur = setTimeout(() => set(CLE_TEMPS, temps.valeur).catch(() => {}), 1000);
}
// « Fait » coché hors de l'application (prière dans sa chambre, culte…) : on ajoute la durée prévue.
export const marquerFait = (item) => ajouterSecondes(item.activite, item.minutes * 60);
export const faitsDuJour = () => { try { return JSON.parse(localStorage.getItem('yeshaya:faits-' + jourCle()) || '[]'); } catch { return []; } };
export function cocher(item) {
  const f = faitsDuJour(); if (f.includes(item.id)) return;
  try { localStorage.setItem('yeshaya:faits-' + jourCle(), JSON.stringify([...f, item.id])); } catch {}
  marquerFait(item);
}

// Temps passé dans l'application, selon la rubrique ouverte (au plus 20 minutes comptées par passage).
const RUBRIQUE = (seg) => {
  const [a, b] = seg;
  if (a === 'priere') return 'priere';
  if (a === 'bible') return b === 'meditation' ? 'meditation' : 'parole';
  if (a === 'grandir' || a === 'ecouter') return 'enseignement';
  if (a === 'evangeliser') return 'evangelisation';
  return null;
};
let courant = null, depuis = 0;
function cloturer() { if (courant && depuis) ajouterSecondes(courant, Math.min((Date.now() - depuis) / 1000, 20 * 60)); depuis = 0; }
export function suivreRubrique(segments) { cloturer(); courant = RUBRIQUE(segments); depuis = courant ? Date.now() : 0; }
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') cloturer(); else if (courant) depuis = Date.now();
});

// Bilan : minutes par activité sur une période, et objectif (minutes prévues) sur la même période.
export function bilan(jours = 7, fin = new Date()) {
  const r = rythme.valeur, res = {};
  for (const k of Object.keys(ACTIVITES)) res[k] = { minutes: 0, objectif: 0 };
  for (let i = 0; i < jours; i++) {
    const d = new Date(fin); d.setDate(d.getDate() - i);
    const t = temps.valeur[jourCle(d)] || {};
    for (const [k, s] of Object.entries(t)) if (res[k]) res[k].minutes += s / 60;
    for (const it of r?.items || []) if (it.jours.includes(d.getDay())) res[it.activite].objectif += it.minutes;
  }
  return res;
}

const origine = () => (typeof location !== 'undefined' ? location.origin : 'https://yeshaya.pages.dev');

// Fichier de calendrier (.ics) : rappels récurrents que le téléphone affichera à l'heure prévue.
const JOURS_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
export function fichierCalendrier(r) {
  const deb = new Date(); const ymd = jourCle(deb).replaceAll('-', '');
  const echappe = (s) => s.replace(/[,;\\]/g, (c) => '\\' + c);
  const ev = r.items.map((it) => {
    const [h, m] = it.heure.split(':');
    const fin = new Date(2000, 0, 1, +h, +m + it.minutes);
    const a = ACTIVITES[it.activite];
    return ['BEGIN:VEVENT', `UID:yeshaya-${it.id}-${ymd}@yeshaya`, `DTSTAMP:${ymd}T000000`,
      `DTSTART:${ymd}T${h}${m}00`, `DTEND:${ymd}T${String(fin.getHours()).padStart(2, '0')}${String(fin.getMinutes()).padStart(2, '0')}00`,
      `RRULE:FREQ=WEEKLY;BYDAY=${it.jours.map((j) => JOURS_ICS[j]).join(',')}`,
      `SUMMARY:${echappe('Yeshaya · ' + (it.libelle || a.nom))}`,
      `DESCRIPTION:${echappe(`C'est l'heure : ${it.libelle || a.nom}. ${a.conseil}${it.lien ? ' Ouvrir : ' + origine() + '/' + it.lien : ''}`)}`,
      ...(it.lien ? [`URL:${origine()}/${it.lien}`] : []),
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${echappe('C\'est l\'heure : ' + (it.libelle || a.nom))}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yeshaya//Rythme//FR', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n');
}

// Rappels prêts à ajouter (l'utilisateur choisit ensuite l'heure, les jours et la durée).
export const MODELES_RAPPEL = [
  { cle: 'aube', libelle: "Prière de l'aube", activite: 'priere', heure: '05:00', minutes: 30, lien: '#/priere/veille/aube' },
  { cle: 'midi', libelle: 'Prière de midi', activite: 'priere', heure: '12:30', minutes: 15, lien: '#/priere/veille/midi' },
  { cle: 'soir', libelle: 'Prière du soir', activite: 'priere', heure: '21:00', minutes: 20, lien: '#/priere/veille/soir' },
  { cle: 'parole', libelle: 'Lecture de la Bible', activite: 'parole', heure: '06:00', minutes: 20, lien: '#/bible' },
  { cle: 'meditation', libelle: 'Méditation', activite: 'meditation', heure: '21:30', minutes: 10, lien: '#/bible/meditation' },
  { cle: 'enseignement', libelle: 'Écouter un enseignement', activite: 'enseignement', heure: '19:00', minutes: 30, lien: '#/grandir' },
  { cle: 'evangelisation', libelle: 'Évangélisation', activite: 'evangelisation', heure: '16:00', minutes: 60, lien: '#/evangeliser' },
  { cle: 'communion', libelle: 'Culte ou groupe', activite: 'communion', heure: '09:00', minutes: 120, lien: '' },
  { cle: 'jeune', libelle: 'Jeûne et prière', activite: 'priere', heure: '12:00', minutes: 60, lien: '#/priere' },
];

// Rappels quand l'application est ouverte (en plus de l'agenda du téléphone, qui sonne même application fermée).
const dejaSonnes = new Set();
export function verifierRappels(notifier) {
  const r = rythme.valeur; if (!r?.items?.length) return;
  const d = new Date(), hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  for (const it of r.items) {
    if (!it.jours.includes(d.getDay()) || it.heure !== hm) continue;
    const cle = jourCle(d) + it.id + hm; if (dejaSonnes.has(cle)) continue; dejaSonnes.add(cle);
    const texte = `C'est l'heure : ${it.libelle || ACTIVITES[it.activite].nom}`;
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker?.ready.then((sw) => sw.showNotification('Yeshaya', { body: texte, icon: '/icons/icon-192.png', tag: cle, data: { lien: it.lien } })).catch(() => new Notification('Yeshaya', { body: texte }));
      }
    } catch {}
    notifier?.(texte);
  }
}
