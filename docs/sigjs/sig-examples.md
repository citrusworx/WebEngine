# Sig.js Examples

Vanilla DOM examples. Copy these into a Vite or `tsc` project configured with `"jsxImportSource": "@citrusworx/sigjs"`. Juice, WebEngine, and the rest of this monorepo are not used here.

A runnable Vite app is in [`libraries/sig/examples/counter`](../../libraries/sig/examples/counter).

## Counter

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Count: {() => count.get()}</h1>
      <button onClick={() => count.set(count.get() + 1)}>+</button>
      <button onClick={() => count.set(count.get() - 1)}>-</button>
    </div>
  );
}

mount(<Counter />, document.getElementById("root")!);
```

Function children (`{() => count.get()}`) keep a text node in sync. `onClick` is a listener.

## Reactive props

```tsx
function Toggle() {
  const on = Signal(false);

  return (
    <button
      className={() => (on.get() ? "on" : "off")}
      aria-pressed={() => String(on.get())}
      onClick={() => on.set(!on.get())}
    >
      {() => (on.get() ? "On" : "Off")}
    </button>
  );
}
```

Any host prop except `ref` and `on*` can be a function. The runtime re-applies it when signals change.

## Todos with `batch` and `memo`

```tsx
import { Signal, batch, memo, mount } from "@citrusworx/sigjs";

type Filter = "all" | "active" | "done";

function TodoApp() {
  const todos = Signal<Array<{ id: number; text: string; done: boolean }>>([]);
  const input = Signal("");
  const nextId = Signal(1);
  const filter = Signal<Filter>("all");

  const addTodo = () => {
    const text = input.get().trim();
    if (!text) return;

    batch(() => {
      todos.set([
        ...todos.get(),
        { id: nextId.get(), text, done: false },
      ]);
      nextId.set(nextId.get() + 1);
      input.set("");
    });
  };

  const visible = memo(() => {
    const all = todos.get();
    switch (filter.get()) {
      case "active":
        return all.filter((t) => !t.done);
      case "done":
        return all.filter((t) => t.done);
      default:
        return all;
    }
  });

  return (
    <div>
      <input
        value={() => input.get()}
        onInput={(e) => input.set((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => e.key === "Enter" && addTodo()}
      />
      <button onClick={addTodo}>Add</button>

      {(["all", "active", "done"] as Filter[]).map((f) => (
        <button
          className={() => (filter.get() === f ? "active" : "")}
          onClick={() => filter.set(f)}
        >
          {f}
        </button>
      ))}

      <ul>
        {() =>
          (visible.get() ?? [])
            .map((todo) => `${todo.done ? "[x]" : "[ ]"} ${todo.text}`)
            .join("\n")
        }
      </ul>
    </div>
  );
}

mount(<TodoApp />, document.getElementById("root")!);
```

List **function children stringify to text**. For a live list of elements, rebuild the list in an `effect` + `ref`, or map at create time if the list is static. The string join above stays in the reactive-text model the runtime implements.

A list of real nodes:

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

function TodoList() {
  const todos = Signal<string[]>(["Write docs"]);
  const list = (<ul />) as HTMLUListElement;

  const render = () => {
    list.replaceChildren(
      ...todos.get().map((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        return li;
      }),
    );
  };

  effect(() => {
    todos.get();
    render();
  });

  return list;
}
```

## Form field

```tsx
import { Signal, memo, mount } from "@citrusworx/sigjs";

function EmailField() {
  const email = Signal("");
  const error = memo(() =>
    email.get().includes("@") ? "" : email.get() ? "Invalid email" : "",
  );

  return (
    <label>
      Email
      <input
        type="email"
        value={() => email.get()}
        onInput={(e) => email.set((e.target as HTMLInputElement).value)}
      />
      <span>{() => error.get()}</span>
    </label>
  );
}

mount(<EmailField />, document.getElementById("root")!);
```

## Fetch in an effect

```tsx
import { Signal, effect, mount } from "@citrusworx/sigjs";

function Users() {
  const users = Signal<string[]>([]);
  const error = Signal<string | null>(null);

  effect(() => {
    let cancelled = false;

    fetch("/api/users")
      .then((r) => r.json())
      .then((data: { name: string }[]) => {
        if (!cancelled) users.set(data.map((u) => u.name));
      })
      .catch((err: Error) => {
        if (!cancelled) error.set(err.message);
      });

    return () => {
      cancelled = true;
    };
  });

  return (
    <div>
      <p>{() => error.get() ?? ""}</p>
      <p>{() => users.get().join(", ")}</p>
    </div>
  );
}

mount(<Users />, document.getElementById("root")!);
```

## Router: exact, `:param`, `*`

```tsx
import { SigRouter } from "@citrusworx/sigjs/sig-router";

function Home() {
  return (
    <nav>
      <a href="/">Home</a>
      <a href="/user/42">User 42</a>
      <a href="/nope">Missing</a>
    </nav>
  );
}

const router = new SigRouter("#root");

router.set({
  "/": Home,
  "/user/:id": (params) => <p>User {params.id}</p>,
  "*": () => <p>Not found</p>,
});

router.start();
```

See the [Router Guide](./sig-router.md) for named routes and `navigate`.

## Optional: Juice

These examples are plain DOM. If you also use Juice for styling, see [Sig.js + Juice](./sig-juice-integration.md). Juice is not required.
