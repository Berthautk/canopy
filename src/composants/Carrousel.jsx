import { useEffect, useRef, useState } from 'preact/hooks';

// Bannières qui défilent toutes seules (environ 6 secondes chacune), en boucle sans fin :
// après la dernière, la première revient par la droite, sans jamais rembobiner.
// Pour cela, on place un double de la dernière avant la première et un double de la première après
// la dernière ; quand le défilement s'arrête sur un double, on saute sans animation sur l'original.
// Le défilement s'arrête quand la personne touche l'écran, quand l'application passe en arrière-plan,
// quand les bannières ne sont plus visibles, et si le téléphone demande moins d'animations.
export function Carrousel({ diapos, delai = 6000, etiquette = 'À la une aujourd\'hui' }) {
  const piste = useRef(null), visible = useRef(true), repos = useRef(0), arret = useRef(null), reel = useRef(0);
  const [i, setI] = useState(0);
  const n = diapos.length, boucle = n > 1;
  const ordre = boucle ? [n - 1, ...diapos.map((_, k) => k), 0] : [0];   // [double de la fin][1…n][double du début]
  const depart = boucle ? 1 : 0;

  const pas = () => Math.max(1, piste.current?.clientWidth || 1);
  const place = () => Math.round((piste.current?.scrollLeft || 0) / pas());

  // Position de départ : la vraie première bannière, pas son double.
  useEffect(() => {
    const el = piste.current; if (!el || !boucle) return;
    const poser = () => { el.scrollLeft = depart * pas(); };
    const r = requestAnimationFrame(poser);
    addEventListener('resize', poser);
    return () => { cancelAnimationFrame(r); removeEventListener('resize', poser); };
  }, [boucle, n]);

  // Suit la bannière affichée, et saute sur l'original dès que le défilement s'arrête sur un double.
  useEffect(() => {
    const el = piste.current; if (!el) return;
    let attente = false;
    const f = () => {
      if (!attente) {
        attente = true;
        requestAnimationFrame(() => {
          attente = false;
          const p = place();
          reel.current = boucle ? ((p - 1) % n + n) % n : 0;
          setI(reel.current);
        });
      }
      if (!boucle) return;
      clearTimeout(arret.current);
      arret.current = setTimeout(() => {
        const p = place();
        if (p === 0) el.scrollTo({ left: n * pas(), behavior: 'auto' });            // double de la fin → vraie fin
        else if (p === n + 1) el.scrollTo({ left: pas(), behavior: 'auto' });       // double du début → vrai début
      }, 170);
    };
    el.addEventListener('scroll', f, { passive: true });
    return () => { el.removeEventListener('scroll', f); clearTimeout(arret.current); };
  }, [boucle, n]);

  // Ne travaille que si les bannières sont à l'écran : rien ne tourne pour rien.
  useEffect(() => {
    const el = piste.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const o = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.3 });
    o.observe(el); return () => o.disconnect();
  }, []);

  useEffect(() => {
    if (!boucle) return;
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch { /* sans matchMedia */ }
    const t = setInterval(() => {
      const el = piste.current;
      if (!el || document.hidden || !visible.current || Date.now() < repos.current) return;
      el.scrollTo({ left: (place() + 1) * pas(), behavior: 'smooth' });   // toujours vers la droite
    }, delai);
    return () => clearInterval(t);
  }, [boucle, n, delai]);

  // Dès qu'on touche ou qu'on fait défiler à la main, on laisse 15 secondes de tranquillité.
  const attendre = () => { repos.current = Date.now() + 15000; };
  const allerA = (k) => { attendre(); piste.current?.scrollTo({ left: (k + depart) * pas(), behavior: 'smooth' }); };

  return (
    <section class="carrousel" aria-roledescription="carrousel" aria-label={etiquette}>
      <div class="carrousel__piste" ref={piste} onPointerDown={attendre} onTouchStart={attendre} onWheel={attendre}>
        {ordre.map((k, rang) => (
          <div class="carrousel__case" role="group" aria-roledescription="diapositive"
            aria-label={`${k + 1} sur ${n}`} aria-hidden={rang === i + depart ? undefined : 'true'}>{diapos[k]}</div>
        ))}
      </div>
      {boucle && (
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
