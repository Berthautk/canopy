// Grande bannière photo (2:1) avec le titre dessus : l'entrée visuelle de chaque rubrique.
export function Banniere({ image, titre, sous, bas = 'center' }) {
  return (
    <header class="banniere">
      <img src={image} alt="" style={{ objectPosition: 'center ' + bas }} />
      <div class="banniere__texte"><h2>{titre}</h2>{sous && <p>{sous}</p>}</div>
    </header>
  );
}
