# Sig.js Examples

Patterns that match `libraries/sig/src` — `Signal` as a factory, function children as text, effects for everything else.

## Counter (function-child text)

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Count: {() => String(count.get())}</h1>
      <button onClick={() => count.set(count.get() + 1)}>+</button>
      <button onClick={() => count.set(count.get() - 1)}>-</button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

The heading element is static. Only the text node after `Count:` is subscribed.

## Toggle with attributes

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Disclosure() {
  const open = Signal(false);

  const panel = <p hidden>Extra detail</p> as HTMLParagraphElement;
  const button = (
    <button
      type="button"
      onClick={() => open.set(!open.get())}
    >
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
    <div>
      {button}
      {panel}
    </div>
  );
}

mount(<Disclosure />, document.getElementById("root")!);
```

## Form field + derived label

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

  const hint = <p></p> as HTMLParagraphElement;

  effect(() => {
    if (input.value !== email.get()) {
      input.value = email.get();
    }
    hint.textContent =
      touched.get() && !valid.get() ? "Enter an email with @" : "";
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        touched.set(true);
        if (!valid.get()) return;
        console.log("submit", email.get());
      }}
    >
      <label>
        Email
        {input}
      </label>
      {hint}
      <button type="submit">Continue</button>
    </form>
  );
}

mount(<EmailField />, document.getElementById("root")!);
```

`memo` is a good fit here: several readers (submit + hint) share one derivation.

## Todo list (replaceChildren)

Sig.js does not reconcile `{() => items.map(<li />)}`. Rebuild the list nodes when the signal changes.

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
    />
  ) as HTMLInputElement;

  const list = <ul /> as HTMLUListElement;
  const stats = <p></p> as HTMLParagraphElement;

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
      ...items.map((todo) => {
        const row = (
          <li>
            <label>
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
          </li>
        );
        return row;
      }),
    );

    const done = items.filter((todo) => todo.done).length;
    stats.textContent = `${done}/${items.length} done`;
  });

  return (
    <div>
      <div>
        {input}
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
      {stats}
      {list}
    </div>
  );
}

mount(<TodoApp />, document.getElementById("root")!);
```

`batch` keeps the add path to one effect run.

## Fetch on a signal

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
      body.textContent = error.get();
      return;
    }
    body.textContent = user.get()?.name ?? "";
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => userId.set(userId.get() + 1)}
      >
        Next user
      </button>
      {body}
    </div>
  );
}

mount(<UserCard />, document.getElementById("root")!);
```

The first effect's cleanup aborts the in-flight request when `userId` changes or the view is disposed.

## Two views with SigRouter

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";
import { SigRouter } from "@citrusworx/sigjs";

function Home() {
  return (
    <section>
      <h1>Home</h1>
      <a href="/about">About</a>
    </section>
  );
}

function About() {
  const ticks = Signal(0);

  effect(() => {
    const id = setInterval(() => ticks.set(ticks.get() + 1), 1000);
    return () => clearInterval(id);
  });

  return (
    <section>
      <h1>About</h1>
      <p>Seconds on this page: {() => String(ticks.get())}</p>
      <a href="/">Home</a>
    </section>
  );
}

mount(
  <div>
    <nav>
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

`About`'s interval is disposed when you leave `/about` because the router calls `disposeTree` on the previous view.

## Practices these examples rely on

1. `Signal(initial)` — factory
2. Function children — text only
3. `effect` — attributes, lists, fetch, timers
4. `batch` — related writes
5. `memo` — shared derivations
6. Route views as functions — cleanup per visit

Patterns that look familiar from other libraries but **do not work here**:

```tsx
// These are not Sig.js APIs / behaviors
const count = new Signal(0);
{() => items.get().map((item) => <li>{item}</li>)}
className={() => (on.get() ? "on" : "off")}
useEffect(() => { … }, []);
```
