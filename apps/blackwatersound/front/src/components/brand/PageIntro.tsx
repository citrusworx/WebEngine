export function PageIntro(props: {
  kicker: string;
  title: string;
  body: string;
  titleStyle?: string;
  children?: unknown;
}) {
  return (
    <section shell route-head stack gap="0.75rem">
      <p kicker>{props.kicker}</p>
      <h1 heading={props.titleStyle ?? "xl"}>{props.title}</h1>
      <p copy="lead">{props.body}</p>
      {props.children}
    </section>
  );
}
