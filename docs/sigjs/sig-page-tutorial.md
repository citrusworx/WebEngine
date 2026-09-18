# Sig.js Tutorial — Building an Operator Desk

This tutorial walks through building a small interactive page with Sig.js the way the library works today.

The goal is to show how Sig.js should be composed in real markup:

- Juice (or HTML) owns structure and identity
- signals own the few values that change
- function children own live **text**
- effects own attributes, lists, and anything that is not text
- the router owns view swap and effect cleanup

If you have already built a static page with the [Juice page tutorial](../juice/juice-page-tutorial.md), this is the same kind of guided build — except the page also moves.

## What we are building

An **operator desk**: a small studio page with

1. a Juice page shell and hero
2. a session tally (live text)
3. a disclosure for shift notes (conditional via `effect`)
4. a work queue you can add to (list rewrite via `effect`)
5. an operator name field (form input + derived greeting)
6. a second route that starts a timer and cleans it up when you leave

By the end you will have used every public primitive that is worth teaching: `Signal`, `effect`, `batch`, `memo`, function-child text, `mount`, and `SigRouter`.

## Setup

```bash
yarn add @citrusworx/sigjs@^0.3.0 @citrusworx/juiceui
```

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

```html
<body theme="my-theme">
  <nav row gap="1" padding="1rem">
    <a href="/">Desk</a>
    <a href="/about">About</a>
  </nav>
  <div id="root"></div>
</body>
```

```ts
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
```

Keep the nav **outside** `#root`. The router will replace the target's children; a nav inside `#root` would disappear on every navigation.

Juice attributes (`stack`, `row`, `gap`, `card`, `hero`, `padding`, `panel`, `muted`) are ordinary HTML attributes. Sig writes them once at create time. They are not a Sig API — see [Sig.js + Juice](./sig-juice-integration.md).

## Step 1: Mount a static shell

Start with structure only. Nothing is reactive yet.

```tsx
import { mount } from "@citrusworx/sigjs";

function Desk() {
  return (
    <main stack gap="2rem" padding="2rem">
      <section hero surface="brand-stage" padding="2rem" stack gap="1rem">
        <p muted>Operations</p>
        <h1>Operator desk</h1>
        <p>
          Juice keeps layout in markup. Sig.js will own the values that
          change after first paint.
        </p>
      </section>
    </main>
  );
}

mount(<Desk />, document.getElementById("root")!);
```

Why this works:

- `Desk` is a function that returns a `Node`. It runs once.
- `mount` disposes whatever was in `#root` and `replaceChildren`s with that node.
- The hero is a real `HTMLElement`. Juice CSS matches `[hero]`, `[stack]`, `[gap="2rem"]`.

There is no component re-render later. If you want this heading to change, you will subscribe a child of it — not re-call `Desk()`.

## Step 2: Add a session tally

A counter is the smallest live surface. Put the changing number in a `Signal`. Read it from a **function child** so the JSX runtime can attach an effect to a text node.

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Desk() {
  const sessions = Signal(0);

  return (
    <main stack gap="2rem" padding="2rem">
      <section hero surface="brand-stage" padding="2rem" stack gap="1rem">
        <p muted>Operations</p>
        <h1>Operator desk</h1>
      </section>

      <article card padding="1.25rem" stack gap="1rem">
        <h2>Session tally</h2>
        <p>Open sessions: {() => String(sessions.get())}</p>
        <div row gap="0.75rem">
          <button
            type="button"
            onClick={() => sessions.set(sessions.get() + 1)}
          >
            Open one
          </button>
          <button
            type="button"
            onClick={() => sessions.set(Math.max(0, sessions.get() - 1))}
          >
            Close one
          </button>
        </div>
      </article>
    </main>
  );
}

mount(<Desk />, document.getElementById("root")!);
```

Best-practice notes:

- `Signal(0)` is a factory. `new Signal(0)` is not the API.
- `{() => String(sessions.get())}` is live text. `{sessions.get()}` would snapshot `0` forever.
- `onClick` is lowercased to `click` and passed to `addEventListener`. `onclick` also works.
- The card, heading, and buttons are created once. Only the text node after `Open sessions:` is subscribed.

This is the pattern to reach for whenever the thing that changes is **a string or a number inside existing markup**.

## Step 3: Show and hide shift notes

Function children cannot return elements. `{() => (open.get() ? <aside /> : null)}` becomes the text `"[object HTMLElement]"` (or `"null"`). For a panel that already exists, hold the element and flip `hidden` from an effect.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Desk() {
  const sessions = Signal(0);
  const notesOpen = Signal(false);

  const notes = (
    <aside panel padding="1.25rem" stack gap="0.75rem" hidden>
      <h3>Shift notes</h3>
      <p>Hand off at 18:00. Do not restart the ingest workers from this desk.</p>
    </aside>
  ) as HTMLElement;

  const notesButton = (
    <button type="button" onClick={() => notesOpen.set(!notesOpen.get())}>
      Show notes
    </button>
  ) as HTMLButtonElement;

  effect(() => {
    const open = notesOpen.get();
    notes.hidden = !open;
    notesButton.textContent = open ? "Hide notes" : "Show notes";
    notesButton.setAttribute("aria-expanded", String(open));
  });

  return (
    <main stack gap="2rem" padding="2rem">
      {/* hero + tally from step 2 */}

      <section stack gap="1rem">
        {notesButton}
        {notes}
      </section>
    </main>
  );
}

mount(<Desk />, document.getElementById("root")!);
```

Why this works:

- JSX runs during `Desk()`. `notes` and `notesButton` already exist before the effect runs.
- `effect` runs **immediately**, then again whenever `notesOpen` notifies.
- You decide which properties to write. Sig.js does not guess `hidden` or `aria-expanded` from JSX.

When the structure itself should come and go (a list of cards, a tab body), skip `hidden` and use `replaceChildren` instead. That is the next step.

## Step 4: Build a work queue

There is no keyed list diff. The honest pattern is: keep a `Signal` of data, keep an empty container, and rewrite its children when the signal changes.

```tsx
import { Signal, effect, batch, mount } from "@citrusworx/sigjs";

type Job = { id: number; title: string };

function Desk() {
  const jobs = Signal<Job[]>([
    { id: 1, title: "Review the deploy window" },
    { id: 2, title: "Rotate the staging token" },
  ]);
  const draft = Signal("");
  const nextId = Signal(3);

  const input = (
    <input
      type="text"
      placeholder="Queue a job"
      onInput={(e) => draft.set((e.target as HTMLInputElement).value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") add();
      }}
    />
  ) as HTMLInputElement;

  const list = <div stack gap="0.75rem"></div> as HTMLDivElement;

  function add() {
    const title = draft.get().trim();
    if (!title) return;

    batch(() => {
      jobs.set([...jobs.get(), { id: nextId.get(), title }]);
      nextId.set(nextId.get() + 1);
      draft.set("");
    });
    input.value = "";
  }

  function remove(id: number) {
    jobs.set(jobs.get().filter((job) => job.id !== id));
  }

  effect(() => {
    const items = jobs.get();
    list.replaceChildren(
      ...items.map((job) => (
        <article card padding="1rem" row space="between" centered>
          <p>{job.title}</p>
          <button type="button" onClick={() => remove(job.id)}>
            Done
          </button>
        </article>
      )),
    );
  });

  return (
    <section stack gap="1rem">
      <h2>Work queue</h2>
      <div row gap="0.75rem">
        {input}
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
      <p muted>{() => `${jobs.get().length} open`}</p>
      {list}
    </section>
  );
}
```

Best-practice notes:

- `batch` keeps add to **one** effect run. Without it, `jobs`, `nextId`, and `draft` would each notify.
- `{() => `${jobs.get().length} open`}` is live **text**. The cards themselves are created inside the effect.
- Each `replaceChildren` throws the previous `<article>` nodes away. That is your code, not a reconciler. For a small queue this is the right default.
- `{() => jobs.get().map((job) => <article>{job.title}</article>)}` would stringify the array. Do not do that.

The queue is the moment most people coming from React have to change habits. The [JSX guide](./sig-jsx.md) and [anti-patterns](./sig-anti-patterns.md) stay on this point because it is the largest mismatch.

## Step 5: Bind a name field

Inputs are not two-way bound. Read from `onInput`. If something else can change the signal (a reset button, a route), write `input.value` from an effect.

```tsx
import { Signal, effect, memo, mount } from "@citrusworx/sigjs";

function Desk() {
  const name = Signal("");
  const greeting = memo(() => {
    const value = name.get().trim();
    return value ? value : "operator";
  });

  const input = (
    <input
      type="text"
      onInput={(e) => name.set((e.target as HTMLInputElement).value)}
    />
  ) as HTMLInputElement;

  effect(() => {
    if (input.value !== name.get()) {
      input.value = name.get();
    }
  });

  return (
    <form
      stack
      gap="1rem"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div field stack>
        <label>Operator name</label>
        {input}
      </div>
      <p>Signed in as {() => greeting.get()}</p>
    </form>
  );
}
```

Why `memo` belongs here:

- The greeting is derived. Several readers can call `greeting.get()` without recomputing the trim.
- `memo` has `{ get }` only. You do not `set` it.
- It is lazy. Nothing runs until something calls `greeting.get()` — here, the function child.

`field` and `stack` on the wrapper are Juice form composition, not Sig APIs. Keep `field` inside forms. See [Juice forms](../juice/juice-forms.md).

## Step 6: Add an About route with a timer

A second view is how you learn cleanup. `SigRouter` disposes the previous tree before it mounts the next one. Effects created **while the view function ran** are cleaned up automatically.

Keep the nav outside the router target, as in Setup.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";
import { SigRouter } from "@citrusworx/sigjs";

function About() {
  const seconds = Signal(0);

  effect(() => {
    const id = window.setInterval(() => {
      seconds.set(seconds.get() + 1);
    }, 1000);
    return () => window.clearInterval(id);
  });

  return (
    <main stack gap="1.5rem" padding="2rem">
      <section card padding="1.25rem" stack gap="1rem">
        <h1>About this desk</h1>
        <p>
          Seconds on this page: {() => String(seconds.get())}
        </p>
        <p muted>
          Leave this route and the interval is cleared, because About is a
          function view and the effect was created while it ran.
        </p>
        <a href="/">Back to the desk</a>
      </section>
    </main>
  );
}
```

Register **functions**, not prebuilt nodes:

```tsx
const router = new SigRouter("#root");

router.set({
  "/": Desk,
  about: About,
});

router.start();
```

`about` without a slash is stored as `/about` and named `"about"`. Paths are exact unless a segment starts with `:`: `/about` ≠ `/about/`. `/user/:id` receives `{ id }` in the view function.

Do not write `router.set({ about: <About /> })`. That builds the tree once. After the first visit, `disposeTree` runs those effects and they will not come back.

You do not need `mount` and `SigRouter` on the same target. `start()` renders `window.location.pathname` into `#root`. If you still want a static shell around the view, put the shell in the HTML (the nav) or wrap views in a factory — see [Router](./sig-router.md).

## Full example

This is the desk with every step composed together. It is still only public APIs.

```tsx
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
import { Signal, effect, batch, memo } from "@citrusworx/sigjs";
import { SigRouter } from "@citrusworx/sigjs";

type Job = { id: number; title: string };

function Desk() {
  const sessions = Signal(0);
  const notesOpen = Signal(false);
  const name = Signal("");
  const greeting = memo(() => name.get().trim() || "operator");
  const jobs = Signal<Job[]>([
    { id: 1, title: "Review the deploy window" },
    { id: 2, title: "Rotate the staging token" },
  ]);
  const draft = Signal("");
  const nextId = Signal(3);

  const notes = (
    <aside panel padding="1.25rem" stack gap="0.75rem" hidden>
      <h3>Shift notes</h3>
      <p>Hand off at 18:00. Do not restart the ingest workers from this desk.</p>
    </aside>
  ) as HTMLElement;

  const notesButton = (
    <button type="button" onClick={() => notesOpen.set(!notesOpen.get())}>
      Show notes
    </button>
  ) as HTMLButtonElement;

  effect(() => {
    const open = notesOpen.get();
    notes.hidden = !open;
    notesButton.textContent = open ? "Hide notes" : "Show notes";
    notesButton.setAttribute("aria-expanded", String(open));
  });

  const nameInput = (
    <input
      type="text"
      onInput={(e) => name.set((e.target as HTMLInputElement).value)}
    />
  ) as HTMLInputElement;

  effect(() => {
    if (nameInput.value !== name.get()) {
      nameInput.value = name.get();
    }
  });

  const jobInput = (
    <input
      type="text"
      placeholder="Queue a job"
      onInput={(e) => draft.set((e.target as HTMLInputElement).value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") addJob();
      }}
    />
  ) as HTMLInputElement;

  const jobList = <div stack gap="0.75rem"></div> as HTMLDivElement;

  function addJob() {
    const title = draft.get().trim();
    if (!title) return;

    batch(() => {
      jobs.set([...jobs.get(), { id: nextId.get(), title }]);
      nextId.set(nextId.get() + 1);
      draft.set("");
    });
    jobInput.value = "";
  }

  function removeJob(id: number) {
    jobs.set(jobs.get().filter((job) => job.id !== id));
  }

  effect(() => {
    jobList.replaceChildren(
      ...jobs.get().map((job) => (
        <article card padding="1rem" row space="between" centered>
          <p>{job.title}</p>
          <button type="button" onClick={() => removeJob(job.id)}>
            Done
          </button>
        </article>
      )),
    );
  });

  return (
    <main stack gap="2rem" padding="2rem">
      <section hero surface="brand-stage" padding="2rem" stack gap="1rem">
        <p muted>Operations</p>
        <h1>Operator desk</h1>
        <p>
          Signed in as {() => greeting.get()}. Juice owns the shell. Sig.js
          owns the tally, the notes panel, the queue, and this greeting.
        </p>
      </section>

      <section grid gap="1rem">
        <article card padding="1.25rem" stack gap="1rem">
          <h2>Session tally</h2>
          <p>Open sessions: {() => String(sessions.get())}</p>
          <div row gap="0.75rem">
            <button
              type="button"
              onClick={() => sessions.set(sessions.get() + 1)}
            >
              Open one
            </button>
            <button
              type="button"
              onClick={() => sessions.set(Math.max(0, sessions.get() - 1))}
            >
              Close one
            </button>
          </div>
        </article>

        <article card padding="1.25rem" stack gap="1rem">
          <h2>Operator</h2>
          <form
            stack
            gap="0.75rem"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div field stack>
              <label>Name</label>
              {nameInput}
            </div>
          </form>
        </article>
      </section>

      <section stack gap="1rem">
        {notesButton}
        {notes}
      </section>

      <section stack gap="1rem">
        <h2>Work queue</h2>
        <div row gap="0.75rem">
          {jobInput}
          <button type="button" onClick={addJob}>
            Add
          </button>
        </div>
        <p muted>{() => `${jobs.get().length} open`}</p>
        {jobList}
      </section>
    </main>
  );
}

function About() {
  const seconds = Signal(0);

  effect(() => {
    const id = window.setInterval(() => {
      seconds.set(seconds.get() + 1);
    }, 1000);
    return () => window.clearInterval(id);
  });

  return (
    <main stack gap="1.5rem" padding="2rem">
      <section card padding="1.25rem" stack gap="1rem">
        <h1>About this desk</h1>
        <p>Seconds on this page: {() => String(seconds.get())}</p>
        <a href="/">Back to the desk</a>
      </section>
    </main>
  );
}

const router = new SigRouter("#root");
router.set({
  "/": Desk,
  about: About,
});
router.start();
```

## What to notice

- The hero, grid, cards, and panel never re-mount when the tally changes. That is the point of Sig.js.
- Live **text** uses function children. Live **structure** uses an effect that writes to a node you already hold.
- `batch` is how add-job stays one paint. `memo` is how the greeting stays cheap.
- `About`'s interval dies when you click Desk, because the view is a function and the effect was registered while it ran.
- Juice attributes can be static or function-valued. `padding={space.get()}` is a snapshot; `padding={() => space.get()}` is live.

## What this tutorial does not pretend

- There is no `useState`, `useEffect`, or keyed `<For>` / `.map()` in JSX.
- Function children are still text, not elements.
- There is no Sig `<Button>` or Juice `<Button>` to import. HTML plus attributes is the composition.

## Next steps

After building a desk like this, the next good Sig patterns to learn are:

- [Signals](./sig-signals.md) — when `set` fires, and why `{count.get()}` is static
- [Effects](./sig-effects.md) — tracking, cleanup, batching, memos
- [JSX and the DOM](./sig-jsx.md) — the child model in full
- [Patterns](./sig-patterns.md) — tabs, filters, fetch, validation
- [Best practices](./sig-best-practices.md) and [anti-patterns](./sig-anti-patterns.md)
