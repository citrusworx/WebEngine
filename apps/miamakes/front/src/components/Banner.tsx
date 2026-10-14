export function Banner(props: {
  title: string;
  surface: string;
  href?: string;
  photoUrl?: string | null;
  heading?: "h1" | "h2";
}) {
  const title =
    props.heading === "h1" ? (
      <h1 font="playfair-display" fontColor="white-100" fontSize="xxl">
        {props.title}
      </h1>
    ) : (
      <h2 font="playfair-display" fontColor="white-100" fontSize="xxl">
        {props.title}
      </h2>
    );

  const banner = (
    <section class="mm-banner" surface={props.surface}>
      {props.photoUrl ? <img src={props.photoUrl} alt="" /> : null}
      {title}
    </section>
  );

  if (!props.href) {
    return banner;
  }

  return (
    <a class="mm-banner-link" href={props.href} aria-label={props.title}>
      {banner}
    </a>
  );
}
