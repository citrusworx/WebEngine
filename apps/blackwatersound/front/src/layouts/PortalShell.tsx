import { PageFooter } from "../components/brand/PageFooter";

export type PortalTone = "bw-orange" | "bw-blue" | "bw-lime" | "bw-dark";

export function PortalShell(props: {
  tone: PortalTone;
  kicker: string;
  title: string;
  body: string;
  children?: unknown;
}) {
  return (
    <div portal-shell stack>
      <header site-nav={props.tone}>
        <div shell nav-inner row space="between" gap="1rem">
          <a href="/" nav-brand>Blackwater Sound</a>
          <nav nav-links row gap="0.5rem">
            <a href="/portal/studio" nav-link>Studio</a>
            <a href="/portal/label" nav-link>Label</a>
            <a href="/portal/learner" nav-link>Learner</a>
          </nav>
          <a href="/" nav-cta>Public site</a>
        </div>
      </header>

      <main stack gap="1.5rem">
        <section shell route-head stack gap="0.75rem">
          <p kicker>{props.kicker}</p>
          <h1 heading="xl">{props.title}</h1>
          <p copy="lead">{props.body}</p>
        </section>
        {props.children}
      </main>

      <PageFooter />
    </div>
  );
}
