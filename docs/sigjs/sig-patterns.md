# Sig.js Patterns

Reusable UI patterns built from current Sig.js primitives. These are not new APIs. They are recommended compositions you can copy and adapt.

Each pattern follows the same general rules:

- Juice (or HTML) owns structure
- signals own values
- function children own live text
- function-valued props own live attributes
- effects own lists, resources, and multi-property writes
- app code owns behavior

Related:

- [Page tutorial](./sig-page-tutorial.md) — these patterns composed into one desk
- [Best practices](./sig-best-practices.md)
- [Examples](./sig-examples.md) — longer showcases of the same ideas

## Live label

Use this when the only thing that changes is text inside markup that already exists.

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Price() {
  const cents = Signal(2000);

  return (
    <article card padding="1.25rem" stack gap="0.75rem">
      <h2>Plan</h2>
      <p>
        <span>$</span>
        {() => (cents.get() / 100).toFixed(2)}
        <span> / month</span>
      </p>
      <button type="button" onClick={() => cents.set(cents.get() + 500)}>
        Add $5
      </button>
    </article>
  );
}

mount(<Price />, document.getElementById("root")!);
```

## Counter cluster

Use this for tallies, steppers, and quantity pickers.

```tsx
function Stepper() {
  const qty = Signal(1);

  return (
    <div row gap="0.75rem" centered>
      <button
        type="button"
        onClick={() => qty.set(Math.max(1, qty.get() - 1))}
      >
        −
      </button>
      <span>{() => String(qty.get())}</span>
      <button type="button" onClick={() => qty.set(qty.get() + 1)}>
        +
      </button>
    </div>
  );
}
```

The buttons are static. Only the `<span>`’s text node is subscribed.

## Disclosure / accordion row

Use this for show/hide. Juice's own accordion uses this shape: a `Signal` for expanded, an `effect` that writes `hidden` and `aria-expanded`.

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

function Disclosure(props: { title: string; children?: Node }) {
  const open = Signal(false);

  const button = (
    <button type="button" onClick={() => open.set(!open.get())}>
      {props.title}
    </button>
  ) as HTMLButtonElement;

  const panel = (
    <div hidden>{props.children}</div>
  ) as HTMLDivElement;

  effect(() => {
    const value = open.get();
    panel.hidden = !value;
    button.setAttribute("aria-expanded", String(value));
  });

  return (
    <section stack gap="0.5rem">
      {button}
      {panel}
    </section>
  );
}
```

Keep the panel mounted if it holds form state. If the body is expensive, `replaceChildren` instead of `hidden`.

## Tabs

Use this when one region should swap bodies. There is no `<Switch>`. Hold the region and rewrite it.

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

function Tabs() {
  const tab = Signal<"queue" | "notes">("queue");
  const body = <div /> as HTMLDivElement;

  function TabButton(id: "queue" | "notes", label: string) {
    const button = (
      <button type="button" onClick={() => tab.set(id)}>
        {label}
      </button>
    ) as HTMLButtonElement;

    effect(() => {
      button.setAttribute("aria-selected", String(tab.get() === id));
    });

    return button;
  }

  effect(() => {
    if (tab.get() === "queue") {
      body.replaceChildren(
        <p>Jobs waiting for the next window.</p>,
      );
      return;
    }
    body.replaceChildren(
      <p>Shift notes stay on this tab only while it is open.</p>,
    );
  });

  return (
    <section stack gap="1rem">
      <div row gap="0.5rem" role="tablist">
        {TabButton("queue", "Queue")}
        {TabButton("notes", "Notes")}
      </div>
      {body}
    </section>
  );
}
```

Each tab body is a fresh tree. State inside a hidden tab is gone unless you lift it to a signal outside the effect.

## Filter chips

Use this when a list should shrink without a framework `<For>`.

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

type Item = { id: string; title: string; tag: "docs" | "app" };

function Catalog(props: { items: Item[] }) {
  const tag = Signal<"all" | Item["tag"]>("all");
  const list = <div stack gap="0.75rem"></div> as HTMLDivElement;

  function Chip(value: "all" | Item["tag"], label: string) {
    const button = (
      <button type="button" onClick={() => tag.set(value)}>
        {label}
      </button>
    ) as HTMLButtonElement;

    effect(() => {
      button.setAttribute("aria-pressed", String(tag.get() === value));
    });

    return button;
  }

  effect(() => {
    const selected = tag.get();
    const visible =
      selected === "all"
        ? props.items
        : props.items.filter((item) => item.tag === selected);

    list.replaceChildren(
      ...visible.map((item) => (
        <article card padding="1rem" stack gap="0.5rem">
          <h3>{item.title}</h3>
          <p muted>{item.tag}</p>
        </article>
      )),
    );
  });

  return (
    <section stack gap="1.5rem" padding="2rem">
      <div row gap="0.5rem">
        {Chip("all", "All")}
        {Chip("docs", "Docs")}
        {Chip("app", "Apps")}
      </div>
      {list}
    </section>
  );
}
```

Juice lays out the chips and cards. Sig.js decides which cards exist.

## Todo / queue list

Use this when the user can add and remove rows. `batch` the add path so the list effect runs once.

```tsx
import { Signal, effect, batch } from "@citrusworx/sigjs";

type Todo = { id: number; text: string; done: boolean };

function TodoList() {
  const todos = Signal<Todo[]>([]);
  const draft = Signal("");
  const nextId = Signal(1);

  const input = (
    <input
      placeholder="Add a todo"
      onInput={(e) => draft.set((e.target as HTMLInputElement).value)}
    />
  ) as HTMLInputElement;

  const list = <ul stack gap="0.5rem"></ul> as HTMLUListElement;
  const stats = <p muted></p> as HTMLParagraphElement;

  function add() {
    const text = draft.get().trim();
    if (!text) return;

    batch(() => {
      todos.set([
        ...todos.get(),
        { id: nextId.get(), text, done: false },
      ]);
      nextId.set(nextId.get() + 1);
      draft.set("");
    });
    input.value = "";
  }

  function toggle(id: number) {
    todos.set(
      todos.get().map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    );
  }

  effect(() => {
    const items = todos.get();
    list.replaceChildren(
      ...items.map((todo) => (
        <li row gap="0.75rem" centered>
          <label row gap="0.5rem" centered>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggle(todo.id)}
            />
            {todo.text}
          </label>
        </li>
      )),
    );
    const done = items.filter((todo) => todo.done).length;
    stats.textContent = `${done}/${items.length} done`;
  });

  return (
    <section stack gap="1rem">
      <div row gap="0.75rem">
        {input}
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
      {stats}
      {list}
    </section>
  );
}
```

Replace whole item objects when toggling. Mutating `todo.done = true` in place will not notify. See [Signals](./sig-signals.md#arrays-objects-and-identity).

## Text field + derived label

Use this for names, search boxes, and any input that should echo into copy.

```tsx
import { Signal, effect, memo } from "@citrusworx/sigjs";

function NameField() {
  const name = Signal("");
  const greeting = memo(() => name.get().trim() || "stranger");

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
      gap="0.75rem"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div field stack>
        <label>Name</label>
        {input}
        <p>Hello, {() => greeting.get()}</p>
      </div>
    </form>
  );
}
```

The effect keeps the input controlled when some other writer calls `name.set("")`. The `if` avoids fighting the cursor on every keystroke.

## Validation hint

Use this when a field needs a derived invalid state. `memo` is the shared derivation; an effect writes the hint and `aria-invalid`.

```tsx
import { Signal, effect, memo } from "@citrusworx/sigjs";

function EmailField() {
  const email = Signal("");
  const touched = Signal(false);
  const valid = memo(() => email.get().includes("@"));

  const input = (
    <input
      type="email"
      onInput={(e) => email.set((e.target as HTMLInputElement).value)}
      onBlur={() => touched.set(true)}
    />
  ) as HTMLInputElement;

  const hint = <small></small> as HTMLElement;

  effect(() => {
    const show = touched.get() && !valid.get();
    hint.textContent = show ? "Enter an email with @" : "";
    input.setAttribute("aria-invalid", String(show));
  });

  return (
    <form
      stack
      gap="1rem"
      onSubmit={(e) => {
        e.preventDefault();
        touched.set(true);
        if (!valid.get()) return;
      }}
    >
      <div field stack>
        <label>Email</label>
        {input}
        {hint}
      </div>
      <button type="submit">Continue</button>
    </form>
  );
}
```

Juice can style `[field]` and invalid states from attributes you set. Sig.js does not ship a form library.

## Disabled / busy button

Use this when an action should not fire twice. `disabled` is a DOM property — write it from an effect, not `disabled={() => …}`.

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

function SaveButton(props: { onSave: () => Promise<void> }) {
  const busy = Signal(false);
  const button = (
    <button
      type="button"
      onClick={async () => {
        if (busy.get()) return;
        busy.set(true);
        try {
          await props.onSave();
        } finally {
          busy.set(false);
        }
      }}
    >
      Save
    </button>
  ) as HTMLButtonElement;

  effect(() => {
    const value = busy.get();
    button.disabled = value;
    button.textContent = value ? "Saving…" : "Save";
  });

  return button;
}
```

## Fetch on a signal

Use this when a value should load from the network. Return `abort` so the previous request dies.

```tsx
import { Signal, effect, batch } from "@citrusworx/sigjs";

type User = { id: number; name: string };

function UserCard() {
  const userId = Signal(1);
  const user = Signal<User | null>(null);
  const error = Signal<string | null>(null);
  const loading = Signal(false);
  const body = <pre></pre> as HTMLPreElement;

  effect(() => {
    const id = userId.get();
    const controller = new AbortController();

    batch(() => {
      loading.set(true);
      error.set(null);
    });

    fetch(`/api/users/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<User>;
      })
      .then((data) => {
        batch(() => {
          user.set(data);
          loading.set(false);
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        batch(() => {
          error.set(err instanceof Error ? err.message : "failed");
          loading.set(false);
        });
      });

    return () => controller.abort();
  });

  effect(() => {
    if (loading.get()) {
      body.textContent = "Loading…";
      return;
    }
    if (error.get()) {
      body.textContent = error.get() as string;
      return;
    }
    body.textContent = user.get()?.name ?? "";
  });

  return (
    <article card padding="1.25rem" stack gap="1rem">
      <button type="button" onClick={() => userId.set(userId.get() + 1)}>
        Next user
      </button>
      {body}
    </article>
  );
}
```

Two effects keep loading UI out of the fetch effect. The first owns the request; the second owns the text.

## Router views

Use this for a static shell with a changing `#view`. Register functions so cleanup runs per visit.

```tsx
import { Signal, effect } from "@citrusworx/sigjs";
import { SigRouter } from "@citrusworx/sigjs";

function Home() {
  return (
    <section stack gap="1rem" padding="2rem">
      <h1>Home</h1>
      <a href="/about">About</a>
    </section>
  );
}

function About() {
  const ticks = Signal(0);

  effect(() => {
    const id = window.setInterval(() => ticks.set(ticks.get() + 1), 1000);
    return () => window.clearInterval(id);
  });

  return (
    <section stack gap="1rem" padding="2rem">
      <h1>About</h1>
      <p>Seconds: {() => String(ticks.get())}</p>
      <a href="/">Home</a>
    </section>
  );
}

const router = new SigRouter("#view");
router.set({
  "/": Home,
  about: About,
});
router.start();
```

Keep the nav outside `#view`. Use `/user/:id` when a segment is part of the URL; exact paths still win over param patterns. See [Router](./sig-router.md).

## Lifted state across views

Use a module-scope signal only when the value must survive navigation (auth, theme). Everything else belongs inside the view function.

```ts
export const operatorName = Signal("");
```

```tsx
function Desk() {
  return <p>Hello, {() => operatorName.get() || "operator"}</p>;
}
```

If `Desk` created `operatorName` internally, leaving and returning would reset it. That is usually what you want for a tally; not what you want for “who is signed in.”

## Pattern notes

- Prefer function children for labels, counts, and greetings.
- Prefer `hidden` when the structure should stay mounted.
- Prefer `replaceChildren` when membership changes.
- Prefer `batch` when one gesture writes several signals.
- Prefer `memo` when several readers share one derivation.
- Prefer Juice attributes for layout (`stack`, `row`, `gap`, `card`) instead of rebuilding layout in an effect on resize.
- Avoid `{() => items.map(<li />)}` — function children are text, not lists.
- Prefer `className={() => …}` (or an effect) over `className={flag.get()}`.

## How to adapt these

These patterns are meant to be customized with:

- Juice attributes (`stack`, `row`, `gap`, `card`, `panel`, `hero`, `padding`, `surface`)
- real DOM writes (`textContent`, `hidden`, `disabled`, `className`, `setAttribute`)
- platform APIs (`fetch`, `setInterval`, `AbortController`)

They are not meant to lock you into one widget kit. Their job is to give you a strong behavioral starting point that matches `libraries/sig/src`.
