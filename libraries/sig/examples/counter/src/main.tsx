import { Signal, batch } from "@citrusworx/sigjs";
import { SigRouter } from "@citrusworx/sigjs/sig-router";

function Counter() {
  const count = Signal(0);

  return (
    <section>
      <h1>Count: {() => count.get()}</h1>
      <p>Function props update className without rebuilding the button.</p>
      <button
        className={() => (count.get() > 0 ? "hot" : "")}
        onClick={() => count.set(count.get() + 1)}
      >
        Increment
      </button>
      <button
        onClick={() =>
          batch(() => {
            count.set(0);
          })
        }
      >
        Reset
      </button>
    </section>
  );
}

function About() {
  return (
    <section>
      <h1>About</h1>
      <p>
        This page is an exact <code>/about</code> route. The counter is a
        different view; navigating disposes it.
      </p>
    </section>
  );
}

function User(params: { id: string }) {
  return (
    <section>
      <h1>User {params.id}</h1>
      <p>
        Matched <code>/user/:id</code>. Try{" "}
        <a href="/user/ada">/user/ada</a>.
      </p>
    </section>
  );
}

function NotFound() {
  return (
    <section>
      <h1>Not found</h1>
      <p>
        The <code>*</code> fallback rendered this view.
      </p>
    </section>
  );
}

const router = new SigRouter("#root");
router.set({
  "/": Counter,
  about: About,
  "/user/:id": (params) => User(params),
  "*": NotFound,
});
router.start();
