# Sig.js Router

`SigRouter` is a small client router. It intercepts in-app `<a>` clicks, listens for `popstate`, and replaces one container's children.

Implemented in `libraries/sig/src/sig-router.ts`. Import from `@citrusworx/sigjs` or `@citrusworx/sigjs/sig-router`.

## What it is for

- A static Juice (or HTML) shell with a changing `#view`
- Named pages (`/`, `/about`, `/contact`)
- Parametric pages (`/user/:id`)
- Cleaning up Sig effects when you leave a page

It is not a file-based router and not a data loader.

## Minimal app

```html
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
  <div id="root"></div>
</body>
```

```tsx
import { SigRouter } from "@citrusworx/sigjs";

function Home() {
  return <h1>Home</h1>;
}

function About() {
  return <h1>About</h1>;
}

const router = new SigRouter("#root");

router.set({
  "/": Home,
  about: About,
});

router.start();
```

`about` without a slash is stored as `/about` and registered under the name `"about"`. `navigate("about")` uses the same normalization, so it hits `/about`.

```ts
router.get("about"); // "/about"
router.navigate(router.get("about")!);
```

## Register views as functions

Pass `Home`, not `<Home />`.

On each navigation the router:

1. `disposeTree`s the current children of the target (effect cleanups run)
2. Calls the view function if the registered view is a function
3. `replaceChildren` with that node

A pre-created `Node` is reused. Effects attached when that node was first created will not re-run per visit, and they may already have been disposed.

```tsx
// Fresh tree + cleanup each visit
router.set("/about", About);

// Same node every time — avoid if About starts timers
router.set("/about", <About />);
```

Layouts wrap in a factory:

```tsx
function withShell(page: () => Node) {
  return () => (
    <div>
      <header>
        <a href="/">App</a>
      </header>
      <main>{page()}</main>
    </div>
  );
}

router.set({
  "/": withShell(Home),
  dashboard: withShell(Dashboard),
});
```

Put the router target on the region that should swap. Keep the nav **outside** `#root` if the nav should stay mounted.

## Link interception

After `start()`, a document-level click listener handles `<a href>`:

| Left alone | Intercepted |
|---|---|
| `http:` / `https:` | `/about` |
| `mailto:`, `tel:`, `ftp:` | `/` |
| `download` | |
| `target="_blank"` | |

`navigate(path)` normalizes a leading slash the same way as `has` / `set`. Unknown paths with no matching exact route, param pattern, or `"*"` fallback do nothing (no 404 view, no `pushState`).

Register `"*"` for a missing-route view. `navigate("/nope")` then `pushState`s `/nope` and renders that fallback. `has("/nope")` stays false; `has("*")` is true.

```tsx
router.set("*", () => <p>Not found</p>);
```

`goBack()` is `history.back()`. The `popstate` listener then renders `window.location.pathname`. If that path is unregistered and there is no `"*"` fallback, the target is emptied.

## Programmatic navigation

```tsx
function Login() {
  return (
    <button
      type="button"
      onClick={() => router.navigate("/dashboard")}
    >
      Continue
    </button>
  );
}
```

Guard it in your handler — the router does not have route hooks:

```ts
function goDashboard(isAuthed: boolean) {
  router.navigate(isAuthed ? "/dashboard" : "/login");
}
```

## Effects on a page

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

function About() {
  const ticks = Signal(0);

  effect(() => {
    const id = setInterval(() => ticks.set(ticks.get() + 1), 1000);
    return () => clearInterval(id);
  });

  return <p>Seconds: {() => String(ticks.get())}</p>;
}
```

Leaving `/about` disposes the interval because the effect was registered while `About()` ran.

## Parametric routes

A path segment that starts with `:` is a named param. The matched values are passed to the **view function** as a `Record<string, string>`:

```tsx
import type { RouteParams } from "@citrusworx/sigjs";

function UserPage(params: RouteParams) {
  return <h1>User {params.id}</h1>;
}

router.set("/user/:id", UserPage);
router.navigate("/user/42");
// UserPage receives { id: "42" }
```

Multiple params work the same way:

```tsx
router.set("/user/:id/post/:postId", (params) => (
  <p>
    {params.id} / {params.postId}
  </p>
));
```

Matching rules:

1. **Exact paths win.** `/user/new` registered exactly is chosen over `/user/:id` for `/user/new`.
2. Among param patterns, the **first registered** match wins.
3. `"*"` is last — only if nothing exact or parametric matched.
4. `normalizePath` still applies: `navigate("user/42")` hits `/user/:id`.
5. Segment counts must match. `/user/42/extra` does not match `/user/:id`. Trailing slashes still matter (`/user/42/` ≠ `/user/42`), same as exact paths.
6. `has()` is about **registration**, not “would this URL resolve.” `has("/user/:id")` is true; `has("/user/42")` is false unless you also registered that exact path.

Zero-arg factories keep working: extra `params` arguments are ignored.

A prebuilt `Node` view cannot see params — use a function.

`get("user")` for a named `/user/:id` returns the pattern string `/user/:id`, not a filled path. Navigate with a concrete URL (`/user/42`).

## What is not here

**Splat segments.** `/files/*` is not a catch-all. `"*"` is only a whole-path fallback.

**Query strings.** Ignored for matching. Read `window.location.search` in the view.

**Trailing slashes and case.** `/About` ≠ `/about`. `/about/` ≠ `/about`. `/user/42/` ≠ `/user/42`.

## Lifecycle

```ts
const router = new SigRouter("#root");
router.set({ "/": Home, about: About });
router.start();  // listeners + first render
router.stop();   // remove listeners; does not unmount the current view
```

Calling `start()` again after it has already started just re-renders the current pathname.

## Troubleshooting

- **Clicks do nothing** — `start()` missing, or the href is not an exact / parametric registered path (and there is no `"*"` fallback).
- **Back button empty** — previous history entry is an unregistered path.
- **Timers leak** — view was a prebuilt node, or the effect was created outside the component function.
- **Nav disappears** — `#root` wraps the nav; move the target to an inner element.

See [Troubleshooting](./sig-troubleshooting.md) for reactivity issues that show up after a route change. The [page tutorial](./sig-page-tutorial.md) adds an About route with a timer that cleans up. [Anti-patterns](./sig-anti-patterns.md) covers prebuilt `<About />` nodes and constructing two routers.
