// Attestation de résultat (HTML → PDF A5 paysage). Utilisée par Valérie ET par l'écran du candidat
// (qui reçoit uniquement ce résultat publié, jamais les corrigés).
import { esc, loadScript, IMG } from './ui.js';
import { civ } from './identity.js';

export const CECR = { 'Pré-A1': 'Découverte', A1: 'Utilisateur élémentaire (débutant)', A2: 'Utilisateur élémentaire', B1: 'Utilisateur indépendant', B2: 'Utilisateur indépendant avancé', C1: 'Utilisateur expérimenté', Débutant: 'Découverte', Starter: 'Utilisateur élémentaire (débutant)', '< B1': 'Niveau inférieur à B1' };
export const CECR_LONG = { 'Pré-A1': 'Peut reconnaître quelques mots et expressions très courants.', A1: 'Peut comprendre et utiliser des expressions familières et très simples.', A2: 'Peut communiquer lors de tâches simples et habituelles sur des sujets familiers.', B1: 'Peut comprendre les points essentiels, s’exprimer clairement sur des sujets familiers et gérer la plupart des situations de la vie quotidienne.', B2: 'Peut comprendre des textes complexes, communiquer avec spontanéité et argumenter son point de vue.', C1: 'Peut s’exprimer avec aisance et de façon structurée sur des sujets variés, y compris abstraits.', Débutant: 'Découvre l’anglais.', Starter: 'Comprend et utilise des mots et phrases très simples.', '< B1': 'Doit consolider les bases avant de viser un examen.' };
export const SKILLS = [['listening', 'Compréhension orale', 'Listening', '🎧'], ['language', 'Langue & lecture', 'Language & Reading', '📖'], ['writing', 'Expression écrite', 'Writing', '✍️'], ['oral', 'Expression orale', 'Speaking', '🎤']];
export const DEFAULT_DIRECTOR = 'Mme FOTSA NOUMESSING Valérie épouse TEKEUTSA';

const longDate = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
export const durText = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`; };

/** Données publiables d'un résultat (sans aucun corrigé). */
export function buildAttData(S, R, set, scale) {
  return {
    id: S.id, testCode: S.testCode, identity: S.identity || {}, startedAt: S.startedAt || null, finishedAt: S.finishedAt || null,
    validatedAt: R.validatedAt, attestationNo: R.attestationNo, levels: R.levels, global: R.global, estimate: R.estimate || '',
    details: R.details || {}, appr: R.appr || {}, formation: (R.formations && R.formations.length ? R.formations.join(' · ') : R.placement) || '',
    priorities: R.priorities || [], scale,
    centre: { city: set.city || 'Garoua', director: set.director ?? DEFAULT_DIRECTOR, directorTitle: set.directorTitle || 'La Directrice', signature: set.signature || '', address: set.address || 'Valérie Language Academy · Garoua', phones: set.phones || '' },
  };
}

export function attestationHtml(d) {
  const I = d.identity || {}, lv = d.levels || {}, c = d.centre || {};
  const name = `${I.prenom || ''} ${I.nom || ''}`.trim();
  const until = new Date(d.validatedAt); until.setMonth(until.getMonth() + 6);
  const long = d.startedAt && d.finishedAt && d.finishedAt - d.startedAt >= 60000 ? durText(d.finishedAt - d.startedAt) : '';
  return `<div class="att" id="att"><img class="wm" src="${IMG.logo}" alt=""><div class="topband"></div><div class="gline"></div><div class="frame"></div>
    <img class="logo" src="${IMG.logo}" alt=""><div class="org">Valérie<br>Language Academy<small>English Opens Doors, We Give You The Keys</small></div>
    <div class="refno">Réf. VLA-PT-${esc(d.testCode)}<br><b>N° ${esc(d.attestationNo)}</b></div>
    <h1>Attestation de Résultat</h1><div class="ribbon">Test de placement en anglais</div>
    <div class="certify">La Valérie Language Academy (VLA) atteste que :</div>
    ${I.photo ? `<img class="photo" src="${esc(I.photo)}" alt="">` : ''}
    <div class="idl"><div><span>Nom et prénoms</span><b>: ${esc(civ(I))} ${esc(name)}</b></div><div><span>Né(e) le</span>: ${I.naissance ? esc(longDate(I.naissance)) : '—'}</div><div><span>Code candidat</span>: ${esc(d.id)}</div><div><span>Date du test</span>: ${esc(longDate(d.finishedAt || d.validatedAt))}</div>${long ? `<div><span>Durée de l’écrit</span>: ${esc(long)}</div>` : ''}</div>
    <div class="glbox"><div class="h">Niveau global (CECR)</div><div class="v">${esc(d.global)}</div><div class="d">${esc(CECR[d.global] || '')}${d.estimate ? `<br><b>${esc(d.estimate)}</b>` : ''}</div></div>
    <div class="lower"><table><tr><th style="text-align:left;width:31%">Compétence</th><th style="width:11%">Niveau</th><th style="width:19%">Résultat</th><th>Appréciation</th></tr>
    ${SKILLS.map(([k, lab, en, ic]) => `<tr><td class="l">${ic} ${lab} <span style="font-weight:400;color:#6b7280">(${en})</span></td><td class="lv"><b>${esc(lv[k] || '—')}</b></td><td>${esc(d.details[k] || '')}</td><td class="ap">${esc(d.appr[k] || '')}</td></tr>`).join('')}</table>
    <div class="bottom"><div><div class="formation"><span style="font-size:22px">🎓</span><div><b>Formation conseillée :</b>${esc(d.formation)}</div></div>
    <div class="prio">${d.priorities?.length ? '<b>À travailler en priorité :</b> ' + esc(d.priorities.join(' · ')) : ''}</div>
    <div class="fait">Fait à ${esc(c.city)}, le ${esc(longDate(d.validatedAt))}.</div></div>
    <img class="seal" src="assets/seal.png" alt="">
    <div class="sign">${esc(c.directorTitle)},<div class="box">${c.signature ? `<img src="${esc(c.signature)}" style="mix-blend-mode:multiply" alt="">` : ''}</div><b>${esc(c.director)}</b></div></div></div>
    <div class="valid l2"><span>Test de placement : il oriente vers le bon cours et ne remplace pas un examen officiel.</span><span>Résultat valable 6 mois, jusqu’au ${esc(longDate(until))}.</span></div>
    <div class="valid"><span>${esc(c.address)}</span><span>${esc(c.phones)}</span></div></div>`;
}

export const attFileName = (d) => `Attestation_${d.attestationNo}_${((d.identity || {}).nom || 'candidat').replace(/[^\w-]+/g, '_')}.pdf`;

/** Génère le PDF (A5 paysage) à partir de l'élément .att affiché. */
export async function buildPdf(el, d) {
  await loadScript('js/vendor/html2canvas.min.js'); await loadScript('js/vendor/jspdf.umd.min.js');
  const z = el.style.zoom; el.style.zoom = '1';
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#fffdf8', useCORS: true, logging: false });
  el.style.zoom = z;
  const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 210, 148);
  pdf.setProperties({ title: `Attestation ${d.attestationNo}`, author: 'Valérie Language Academy', subject: 'Attestation de résultat — test de placement' });
  return pdf;
}
export function fitAtt(el, width) { if (width < 794) { el.style.transformOrigin = 'top left'; el.style.zoom = String(width / 794); } }
