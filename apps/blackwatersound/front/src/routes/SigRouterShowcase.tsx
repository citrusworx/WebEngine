import { Signal, effect, mount } from "@citrusworx/sigjs";
import { Render } from "../app/Render";
import { ChipSelect } from "../components/brand/ChipSelect";
import { ColorBar } from "../components/brand/ColorBar";
import { PageIntro } from "../components/brand/PageIntro";
import { PageFooter } from "../components/brand/PageFooter";
import { AMP_IMG, MIC_IMG, PHONES_IMG, STUDIO_IMG } from "../components/brand/brand";

type DemoRoute = "/" | "/crate-dig" | "/lesson-drop";

function formatStamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function DemoView(props: {
  title: string;
  kicker: string;
  body: string;
  image: string;
  tone: string;
  note: string;
  pushLog: (message: string) => void;
}) {
  const beats = Signal(0);

  effect(() => {
    props.pushLog(`Mounted ${props.title}`);

    const timer = window.setInterval(() => {
      beats.set(beats.get() + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
      props.pushLog(`Disposed ${props.title} after ${beats.get()} beats`);
    };
  });

  return (
    <article card sig-demo-view stack gap="1rem" data-tone={props.tone}>
      <div media-frame="wide">
        <img src={props.image} alt={props.title} media-image />
      </div>
      <div stack gap="0.7rem">
        <p kicker>{props.kicker}</p>
        <h3 heading sig-demo-title>{props.title}</h3>
        <p copy="sm">{props.body}</p>
      </div>
      <div sig-demo-meta row space="between" gap="1rem">
        <div stack gap="0.35rem">
          <span spec-label>Live beats</span>
          <strong sig-demo-counter>{() => beats.get()}</strong>
        </div>
        <div stack gap="0.35rem">
          <span spec-label>Cleanup note</span>
          <span copy="sm">{props.note}</span>
        </div>
      </div>
    </article>
  );
}

export function SigRouterShowcase() {
  const selectedRoute = Signal<DemoRoute>("/");
  const routeOptions = [
    { key: "/" as const, label: "/" },
    { key: "/crate-dig" as const, label: "/crate-dig" },
    { key: "/lesson-drop" as const, label: "/lesson-drop" },
  ] as const;
  let logHistory = ["Waiting for the first route mount..."];
  const logEntries = Signal<string[]>(logHistory);
  let previewRoot: HTMLElement | null = null;

  function pushLog(message: string) {
    logHistory = [`${formatStamp()}  ${message}`, ...logHistory].slice(0, 8);
    logEntries.set(logHistory);
  }

  const demoRoutes: Record<DemoRoute, () => Node> = {
    "/": () => (
      <DemoView
        title="Home lands fresh every visit"
        kicker="Route factory"
        body="This route is registered as a function, so the view is rebuilt after cleanup instead of reviving an old dead DOM node."
        image={STUDIO_IMG}
        tone="cyan"
        note="Navigate away and back to watch a brand-new counter start at zero."
        pushLog={pushLog}
      />
    ),
    "/crate-dig": () => (
      <DemoView
        title="Crate Dig view tears down clean"
        kicker="Dispose in action"
        body="Its timer effect is scoped to the mounted subtree. When the route changes, the interval is cleared and the cleanup is logged."
        image={AMP_IMG}
        tone="orange"
        note="This is the part that used to linger after navigation."
        pushLog={pushLog}
      />
    ),
    "/lesson-drop": () => (
      <DemoView
        title="Lesson Drop comes back alive"
        kicker="Fresh subtree"
        body="Route factories let us revisit the same page without stale listeners or frozen reactive text nodes hanging around."
        image={PHONES_IMG}
        tone="lime"
        note="Re-entering this route creates a new subtree with new effects."
        pushLog={pushLog}
      />
    ),
  };

  const previewSurface = (
    <div
      ref={(el: HTMLElement) => {
        previewRoot = el;
      }}
      sig-demo-shell
    />
  ) as HTMLElement;

  effect(() => {
    if (!previewRoot) {
      return;
    }

    const renderRoute = demoRoutes[selectedRoute.get()];
    mount(renderRoute(), previewRoot);
  });

  return (
    <div stack>
      <PageIntro
        kicker="Sig.js router preview"
        title="Fresh-route navigation, shown inside the Blackwater Sound system."
        titleStyle="xl"
        body="The preview below swaps route factories, remounts each view cleanly, and shows the lifecycle log without breaking the broader editorial rhythm of the app."
      >
        <div row gap="0.75rem">
          <a href="/" button-tone="ghost">Back to Home</a>
          <a href="/products" button-tone="ink">Open the Store</a>
        </div>
      </PageIntro>

      <section shell sig-grid>
        <div stack gap="1rem">
          <div card stack gap="1rem">
            <p kicker>The shape</p>
            <h2 heading>Register component functions, not prebuilt nodes.</h2>
            <pre code-block><code>{`router.set({
  "/": Home,
  crateDig: CrateDig,
  lessonDrop: () => <LessonLayout />
});`}</code></pre>
            <p copy="sm">
              The point is simple: cleanup can fully tear down the old subtree because the router can always ask for a fresh one next time.
            </p>
          </div>

          <div card card-tone="muted" stack gap="1rem">
            <p kicker>Preview controls</p>
            <Render>
              {() => (
                <ChipSelect
                  items={routeOptions}
                  active={selectedRoute.get()}
                  onSelect={(route) => selectedRoute.set(route)}
                />
              )}
            </Render>
            <p copy="sm">
              Each view below owns a timer effect. Switching routes remounts the next view and disposes the last one.
            </p>
            {previewSurface}
          </div>
        </div>

        <div stack gap="1rem">
          <div card card-tone="dark" stack gap="1rem">
            <p kicker="light">Cleanup log</p>
            <h2 heading>What the lifecycle looks like now.</h2>
            <p copy="sm inverse">
              Watch the log update as the old view disposes and the new one mounts. The behavior is technical, but the page still needs to feel like it belongs to the same Blackwater Sound product family.
            </p>
            <Render>
              {() => (
                <div sig-log stack gap="0.6rem">
                  {logEntries.get().map((entry) => (
                    <div key={entry} sig-log-entry>
                      {entry}
                    </div>
                  ))}
                </div>
              )}
            </Render>
            <ColorBar />
          </div>

          <div media-frame="portrait">
            <img src={MIC_IMG} alt="Blackwater Sound microphone rig" media-image />
            <div media-overlay>
              <div stack gap="0.75rem">
                <p kicker="light">Why it matters</p>
                <h2 display="article">Clean exits make repeat visits safe.</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
