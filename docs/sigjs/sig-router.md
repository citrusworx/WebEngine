# Sig.js Router Guide

`SigRouter` is a client-side router with no extra packages. It intercepts same-origin `<a href>` clicks, listens to `popstate`, and mounts a view into a container. Route-owned effects are disposed when the view is replaced.

Register **functions** (`Home`, `() => <About />`) rather than pre-rendered nodes (`<Home />`) so each visit gets a fresh tree.

## Setup

```tsx
import { SigRouter } from "@citrusworx/sigjs/sig-router";
// also exported from "@citrusworx/sigjs"

const router = new SigRouter("#root");

router.set({
  "/": Home,
  about: About,
  "/user/:id": (params) => <UserPage id={params.id} />,
  "*": NotFound,
});

router.start();
```

```html
<div id="root"></div>
<script type="module" src="./main.tsx"></script>
```

Matching order:

1. **Exact** path (`/`, `/about`, `/user/new`)
2. **`:param`** (`/user/:id` → `{ id: "42" }`)
3. **`*`** if registered

Exact routes win over a param pattern on the same URL. `navigate("/missing")` is a no-op unless `*` exists.

## Exact paths and named routes

Object-map keys without a leading `/` are stored as `/${key}` and as a name:

```ts
router.set({
  "/": Home,
  about: About,
});

router.has("/about");     // true
router.get("about");      // "/about"
router.navigate("about"); // normalized to "/about"
```

`set(path, view, name?)` does the same one route at a time.

## `:param` routes

```tsx
router.set("/user/:id", (params) => {
  return <p>User {params.id}</p>;
});

router.set("/user/:id/post/:postId", (params) => {
  return <p>{params.id} / {params.postId}</p>;
});
```

- Segments are `decodeURIComponent`'d.
- The factory argument is `Record<string, string>`.
- `/user/new` registered as an **exact** route beats `/user/:id`.

## `*` fallback

```tsx
router.set("*", () => <p>Not found</p>);
```

Unknown paths render this view and still update `history` (including back/forward). `has("*")` is true; `has("/ghost")` is still false unless you registered that path.

## Links and history

After `start()`, internal links do not reload the page:

```tsx
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/user/42">User</a>
</nav>
```

Left alone: `http(s):`, `mailto:`, `tel:`, `ftp:`, `target="_blank"`, `download`.

```ts
router.navigate("/about");
router.navigate(router.get("about")!);
router.goBack();
router.stop();
```

## Layout around the outlet

Keep chrome outside the router target so it does not remount:

```html
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
  <main id="root"></main>
</body>
```

Or wrap a view in a layout factory:

```tsx
router.set("dashboard", () => (
  <div>
    <Nav />
    <Dashboard />
  </div>
));
```

## Programmatic navigation

```tsx
function Login() {
  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const ok = await fetch("/api/login", { method: "POST" });
    if (ok.ok) router.navigate("/dashboard");
  };

  return (
    <form onSubmit={onSubmit}>
      <button type="submit">Log in</button>
    </form>
  );
}
```

## API

| Method | Purpose |
|--------|---------|
| `new SigRouter(selector = "#root")` | Container to replace on each render |
| `set({ nameOrPath: view })` | Register many routes |
| `set(path, view, name?)` | Register one route |
| `get(name)` | Path for a named route |
| `has(path)` | Whether that pattern/path was registered |
| `start()` | Intercept clicks, listen to `popstate`, render current URL |
| `navigate(path)` | `pushState` + render (no-op if unmatched and no `*`) |
| `goBack()` | `history.back()` |
| `stop()` | Remove listeners |

## Troubleshooting

**Clicks do nothing.** Call `start()` after `set()`.

**Back button does nothing.** Same — `start()` attaches `popstate`.

**`/user/42` is blank.** Register `/user/:id` as a **function** that uses `params`, not a static node.

**`/user/new` hits `:id`.** Register the exact path `/user/new` as well; exact wins.

**External site is intercepted.** Use an absolute `https://` URL or `target="_blank"`.
