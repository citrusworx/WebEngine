export function Stub(props: { title: string; body: string; actionHref?: string; actionLabel?: string }) {
  return (
    <main class="mm-stub">
      <h1 font="playfair-display">{props.title}</h1>
      <p font="poppins">{props.body}</p>
      {props.actionHref && props.actionLabel ? (
        <p>
          <a href={props.actionHref}>{props.actionLabel}</a>
        </p>
      ) : null}
    </main>
  );
}
