export function PaperPanel(props: {
  kicker?: string;
  title?: string;
  titleStyle?: string;
  body?: string;
  gap?: string;
  children?: unknown;
}) {
  return (
    <article panel surface="bw-panel" stack gap={props.gap ?? "0.75rem"}>
      {props.kicker ? <p kicker>{props.kicker}</p> : null}
      {props.title ? <h2 section-title={props.titleStyle}>{props.title}</h2> : null}
      {props.body ? <p copy="sm">{props.body}</p> : null}
      {props.children}
    </article>
  );
}
