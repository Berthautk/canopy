import { useEffect, useRef, useState } from 'preact/hooks';

// Bannières qui défilent toutes seules (environ 6 secondes chacune).
// Le défilement s'arrête quand la personne touche l'écran, quand l'application passe en arrière-plan,
// quand les bannières ne sont plus visibles, et si le téléphone demande moins d'animations.
export function Carrousel({ diapos, delai = 6000, etiquette = 'À la une aujourd\'hui' }) {
  const piste = useRef(null), visible = useRef(true), repos = useRef(0);
  const [i, setI] = useState(0);
  const n = diapos.length;

  // Suit la diapositive affichée, au doigt comme au défilement automatique.
  useEffect(() => {
    const el = piste.current; if (!el) return;
    let attente = false;
    const f = () => {
      if (attente) return; attente = true;
      requestAnimationFrame(() => { attente = false; setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); });
    };
    el.addEventListener('scroll', f, { passive: true });
    return () => el.removeEventListener('scroll', f);
  }, []);

  // Ne travaille que si les bannières sont à l'écran : rien ne tourne pour rien.
  useEffect(() => {
    const el = piste.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const o = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.3 });
    o.observe(el); return () => o.disconnect();
  }, []);

  useEffect(() => {
    if (n < 2) return;
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch { /* sans matchMedia */ }
    const t = setInterval(() => {
      const el = piste.current;
      if (!el || document.hidden || !visible.current || Date.now() < repos.current) return;
      const suivant = (Math.round(el.scrollLeft / Math.max(1, el.clientWidth)) + 1) % n;
      el.scrollTo({ left: suivant * el.clientWidth, behavior: 'smooth' });
    }, delai);
    return () => clearInterval(t);
  }, [n, delai]);

  // Dès qu'on touche ou qu'on fait défiler à la main, on laisse 15 secondes de tranquillité.
  const attendre = () => { repos.current = Date.now() + 15000; };
  const allerA = (k) => { attendre(); piste.current?.scrollTo({ left: k * piste.current.clientWidth, behavior: 'smooth' }); };

  return (
    <section class="carrousel" aria-roledescription="carrousel" aria-label={etiquette}>
      <div class="carrousel__piste" ref={piste} onPointerDown={attendre} onTouchStart={attendre} onWheel={attendre}>
        {diapos.map((d, k) => (
          <div class="carrousel__case" role="group" aria-roledescription="diapositive" aria-label={`${k + 1} sur ${n}`} aria-hidden={k === i ? undefined : 'true'}>{d}</div>
        ))}
      </div>
      {n > 1 && (
        <div class="carrousel__points">
          {diapos.map((_, k) => (
            <button type="button" aria-current={k === i ? 'true' : undefined} aria-label={`Aller à la bannière ${k + 1}`} onClick={() => allerA(k)} />
          ))}
        </div>
      )}
    </section>
  );
}

// Une bannière : photo, petite étiquette, titre, et une ligne d'explication.
export function Diapo({ lien, image, etiquette, titre, texte, bas = 'center' }) {
  return (
    <a class="diapo" href={lien}>
      <img src={image} alt="" loading="lazy" style={{ objectPosition: 'center ' + bas }} />
      <span class="diapo__texte">
        {etiquette && <span class="diapo__etiquette">{etiquette}</span>}
        <b>{titre}</b>
        {texte && <span>{texte}</span>}
      </span>
    </a>
  );
}
