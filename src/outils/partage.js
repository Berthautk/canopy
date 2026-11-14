// Partage : Web Share API, sinon WhatsApp (wa.me), sinon copie.
export function lienApp(chemin) { return `${location.origin}/#/${chemin}`; }

export async function partager({ titre, texte, chemin }) {
  const url = chemin ? lienApp(chemin) : undefined;
  if (navigator.share) {
    try { await navigator.share({ title: titre, text: texte, url }); return 'partage'; }
    catch (e) { if (e?.name === 'AbortError') return 'annule'; }
  }
  open(`https://wa.me/?text=${encodeURIComponent(texte + (url ? '\n' + url : ''))}`, '_blank', 'noopener');
  return 'whatsapp';
}

export async function copier(texte) {
  try { await navigator.clipboard.writeText(texte); return true; }
  catch {
    const t = document.createElement('textarea'); t.value = texte; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} t.remove(); return ok;
  }
}

// Image d'un verset (format carré, pour WhatsApp et les statuts) : fond, texte, référence, signature.
export async function imageVerset({ texte, reference, fond = '/assets/paysages/lever-soleil-collines.webp' }) {
  const T = 1080, c = document.createElement('canvas'); c.width = T; c.height = T;
  const x = c.getContext('2d');
  try { const img = new Image(); img.src = fond; await img.decode(); const r = Math.max(T / img.width, T / img.height); x.drawImage(img, (T - img.width * r) / 2, (T - img.height * r) / 2, img.width * r, img.height * r); } catch { x.fillStyle = '#172B49'; x.fillRect(0, 0, T, T); }
  x.fillStyle = 'rgba(10,19,34,.62)'; x.fillRect(0, 0, T, T);
  // Texte coupé en lignes, taille adaptée à la longueur.
  let taille = texte.length > 380 ? 40 : texte.length > 220 ? 48 : texte.length > 120 ? 58 : 68;
  x.font = `italic ${taille}px Georgia, serif`; x.fillStyle = '#fff'; x.textAlign = 'center';
  const mots = ('« ' + texte + ' »').split(' '), lignes = []; let l = '';
  for (const m of mots) { const t = l ? l + ' ' + m : m; if (x.measureText(t).width > T - 160) { lignes.push(l); l = m; } else l = t; }
  lignes.push(l);
  const h = taille * 1.35, y0 = T / 2 - (lignes.length * h) / 2 + taille / 2 - 40;
  lignes.forEach((t, i) => x.fillText(t, T / 2, y0 + i * h));
  x.font = `bold 44px sans-serif`; x.fillStyle = '#E0B324'; x.fillText(reference + ' (LSG)', T / 2, y0 + lignes.length * h + 40);
  x.font = '30px sans-serif'; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText('Yeshaya · L\'Éternel est salut', T / 2, T - 60);
  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}
export async function partagerImageVerset(v) {
  const blob = await imageVerset(v);
  const f = new File([blob], 'verset.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: v.reference }); return 'partage'; } catch (e) { if (e?.name === 'AbortError') return 'annule'; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'verset.png'; a.click(); return 'telecharge';
}
