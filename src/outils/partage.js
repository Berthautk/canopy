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
