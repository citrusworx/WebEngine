# Sig.js Router

`SigRouter` is a small exact-path client router. It intercepts in-app `<a>` clicks, listens for `popstate`, and replaces one container's children.

Implemented in `libraries/sig/src/sig-router.ts`. Import from `@citrusworx/sigjs` or `@citrusworx/sigjs/sig-router`.

## What it is for

- A static Juice (or HTML) shell with a changing `#view`
- A few named pages (`/`, `/about`, `/contact`)
- Cleaning up Sig effects when you leave a page

It is not a file-based router, not a param matcher, and not a data loader.

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

`about` without a slash is stored as `/about` and registered under the name `"about"`.

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

`navigate(path)` only succeeds if `has(path)` is true. Unknown paths do nothing (no 404 view).

`goBack()` is `history.back()`. The `popstate` listener then renders `window.location.pathname`. If that path is unregistered, the target is emptied.

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

## What is not here

**Parametric routes.** `router.set("/user/:id", UserPage)` registers the literal string `/user/:id`. A browser visit to `/user/42` will not match.

If you need a segment today, register a concrete path or read `window.location.pathname` yourself after a known prefix:

```tsx
function UserPage() {
  const id = window.location.pathname.slice("/user/".length);
  return <h1>User {id}</h1>;
}

// Still must navigate to an exact registered path, or
// extend the router — do not pretend :id works.
```

**Query strings.** Ignored for matching. Read `window.location.search` in the view.

**Trailing slashes and case.** `/About` ≠ `/about`. `/about/` ≠ `/about`.

## Lifecycle

```ts
const router = new SigRouter("#root");
router.set({ "/": Home, about: About });
router.start();  // listeners + first render
router.stop();   // remove listeners; does not unmount the current view
```

Calling `start()` again after it has already started just re-renders the current pathname.

## Troubleshooting

- **Clicks do nothing** — `start()` missing, or the href is not an exact registered path.
- **Back button empty** — previous history entry is an unregistered path.
- **Timers leak** — view was a prebuilt node, or the effect was created outside the component function.
- **Nav disappears** — `#root` wraps the nav; move the target to an inner element.

See [Troubleshooting](./sig-troubleshooting.md) for reactivity issues that show up after a route change. The [page tutorial](./sig-page-tutorial.md) adds an About route with a timer that cleans up. [Anti-patterns](./sig-anti-patterns.md) covers prebuilt `<About />` nodes and `navigate("about")`.
