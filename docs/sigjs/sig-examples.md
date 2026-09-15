# Sig.js Examples

Showcases that match `libraries/sig/src` — `Signal` as a factory, function children as text, effects for everything else. These are meant to be copied as starting points, not as a second API.

For the step-by-step build, use the [page tutorial](./sig-page-tutorial.md). For smaller recipes, use [Patterns](./sig-patterns.md).

## Counter on a Juice card

The heading element is static. Only the text node after `Count:` is subscribed.

```tsx
import "@citrusworx/juiceui/styles";
import "./generated/my-theme.css";
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <main stack gap="2rem" padding="2rem">
      <article card padding="1.25rem" stack gap="1rem">
        <h1>Count: {() => String(count.get())}</h1>
        <div row gap="0.75rem">
          <button type="button" onClick={() => count.set(count.get() + 1)}>
            +
          </button>
          <button type="button" onClick={() => count.set(count.get() - 1)}>
            −
          </button>
        </div>
      </article>
    </main>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

## Disclosure with attributes

`hidden={() => !open.get()}` is a live boolean prop. This example still uses an effect because it also writes `aria-expanded` on a second node — the same shape Juice's accordion uses.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Disclosure() {
  const open = Signal(false);

  const panel = (
    <aside panel padding="1.25rem" hidden>
      Extra detail stays mounted. Only `hidden` flips.
    </aside>
  ) as HTMLElement;

  const button = (
    <button type="button" onClick={() => open.set(!open.get())}>
      Show
    </button>
  ) as HTMLButtonElement;

  effect(() => {
    const value = open.get();
    panel.hidden = !value;
    button.textContent = value ? "Hide" : "Show";
    button.setAttribute("aria-expanded", String(value));
  });

  return (
    <section stack gap="1rem" padding="2rem">
      {button}
      {panel}
    </section>
  );
}

mount(<Disclosure />, document.getElementById("root")!);
```

## Form field + derived label

Inputs are not two-way bound. `memo` is a good fit when submit and the hint share one derivation.

```tsx
import { Signal, effect, memo, mount } from "@citrusworx/sigjs";

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
    if (input.value !== email.get()) {
      input.value = email.get();
    }
    const show = touched.get() && !valid.get();
    hint.textContent = show ? "Enter an email with @" : "";
    input.setAttribute("aria-invalid", String(show));
  });

  return (
    <main stack gap="2rem" padding="2rem">
      <section card padding="1.25rem">
        <form
          stack
          gap="1rem"
          onSubmit={(e) => {
            e.preventDefault();
            touched.set(true);
            if (!valid.get()) return;
            console.log("submit", email.get());
          }}
        >
          <div field stack>
            <label>Email</label>
            {input}
            {hint}
          </div>
          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}

mount(<EmailField />, document.getElementById("root")!);
```

## Todo board (replaceChildren)

Sig.js does not reconcile `{() => items.map(<li />)}`. Rebuild the list nodes when the signal changes. `batch` keeps the add path to one effect run.

```tsx
import { Signal, effect, batch, mount } from "@citrusworx/sigjs";

type Todo = { id: number; text: string; done: boolean };

function TodoApp() {
  const todos = Signal<Todo[]>([]);
  const draft = Signal("");
  const nextId = Signal(1);

  const input = (
    <input
      placeholder="Add a todo"
      onInput={(e) => draft.set((e.target as HTMLInputElement).value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") add();
      }}
    />
  ) as HTMLInputElement;

  const list = <div stack gap="0.75rem"></div> as HTMLDivElement;
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

  function remove(id: number) {
    todos.set(todos.get().filter((todo) => todo.id !== id));
  }

  effect(() => {
    const items = todos.get();
    list.replaceChildren(
      ...items.map((todo) => (
        <article card padding="1rem" row space="between" centered>
          <label row gap="0.5rem" centered>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggle(todo.id)}
            />
            {todo.text}
          </label>
          <button type="button" onClick={() => remove(todo.id)}>
            Delete
          </button>
        </article>
      )),
    );

    const done = items.filter((todo) => todo.done).length;
    stats.textContent = `${done}/${items.length} done`;
  });

  return (
    <main stack gap="1.5rem" padding="2rem">
      <section hero padding="2rem" stack gap="0.75rem">
        <h1>Todo board</h1>
        <p muted>Juice owns the cards. Sig.js rewrites the list.</p>
      </section>
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
    </main>
  );
}

mount(<TodoApp />, document.getElementById("root")!);
```

## Filterable catalog

A live filter over static data. Chips write a signal; the list effect decides which cards exist.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

type Item = { id: string; title: string; tag: "docs" | "app" };

const ITEMS: Item[] = [
  { id: "1", title: "Juice attributes", tag: "docs" },
  { id: "2", title: "Operator desk", tag: "app" },
  { id: "3", title: "Sig router", tag: "docs" },
];

function Catalog() {
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
        ? ITEMS
        : ITEMS.filter((item) => item.tag === selected);

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

mount(<Catalog />, document.getElementById("root")!);
```

## Fetch on a signal

The first effect's cleanup aborts the in-flight request when `userId` changes or the view is disposed.

```tsx
import { Signal, effect, batch, mount } from "@citrusworx/sigjs";

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
      <div row gap="0.75rem" centered>
        <button
          type="button"
          onClick={() => userId.set(Math.max(1, userId.get() - 1))}
        >
          Previous
        </button>
        <span>User {() => String(userId.get())}</span>
        <button type="button" onClick={() => userId.set(userId.get() + 1)}>
          Next
        </button>
      </div>
      {body}
    </article>
  );
}

mount(<UserCard />, document.getElementById("root")!);
```

## Two views with SigRouter

`About`'s interval is disposed when you leave `/about` because the router calls `disposeTree` on the previous view. Nav stays outside `#view`.

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";
import { SigRouter } from "@citrusworx/sigjs";

function Home() {
  return (
    <section stack gap="1rem" padding="2rem">
      <h1>Home</h1>
      <p muted>The shell around this view never remounts.</p>
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
      <p>Seconds on this page: {() => String(ticks.get())}</p>
      <a href="/">Home</a>
    </section>
  );
}

mount(
  <div stack>
    <nav row gap="1" padding="1rem">
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
    <main id="view"></main>
  </div>,
  document.body,
);

const router = new SigRouter("#view");
router.set({
  "/": Home,
  about: About,
});
router.start();
```

## Operator desk (composed)

The [page tutorial](./sig-page-tutorial.md) builds this incrementally. The full source lives there: tally, disclosure, queue, name field, and an About route with a timer.

## Practices these examples rely on

1. `Signal(initial)` — factory
2. Function children — text only
3. `effect` — attributes, lists, fetch, timers
4. `batch` — related writes
5. `memo` — shared derivations
6. Route views as functions — cleanup per visit
7. Juice attributes as static HTML — structure, not state

Patterns that look familiar from other libraries but **do not work here**:

```tsx
// These are not Sig.js APIs / behaviors
const count = new Signal(0);
{() => items.get().map((item) => <li>{item}</li>)}
className={on.get() ? "on" : "off"}  // snapshot, not live
useEffect(() => { … }, []);
```

See [Anti-patterns](./sig-anti-patterns.md) for why, and [Best practices](./sig-best-practices.md) for the replacements.
