# 04 — Front-end shell with Sig and Vite

[Previous](./03-seltzer.md) · [Course](./README.md) · [Next](./05-list.md)

**Goal:** mount one Sig tree into `#root` and load Juice's CSS. No todos yet in this lesson's reading, even though the file you open already has them. You are learning the shell those later lines sit in.

## What you'll build

`apps/todo/front/index.html`, `vite.config.ts`, and `src/main.tsx`. The page is the `App` function from lesson 05 onward. This lesson stops at `mount`.

## Steps

### 1. HTML shell

`apps/todo/front/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ToDos</title>
  </head>
  <body theme="citrusmint">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`theme="citrusmint"` is a Juice attribute on `body`. The stylesheet that paints it is imported from `main.tsx`, not linked here. Vite injects the CSS.

Seltzer is not serving this file. Vite is.

### 2. Vite proxies the API

`apps/todo/front/vite.config.ts`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});
```

The browser calls `/api/todos` on port 5173. Vite forwards that to the Seltzer process. One origin, so lesson 03's CORS config is idle during dev.

`strictPort` means a busy 5173 fails the dev server instead of picking 5174 and invalidating the lesson.

### 3. Mount

`apps/todo/front/src/main.tsx`:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/citrusmint";
import { mount } from "@citrusworx/sigjs";
import { App } from "./App";
import "./todo.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("ToDo root element was not found.");
}

mount(<App />, root);
```

`jsx()` is not imported by hand. `apps/todo/front/tsconfig.json` sets `jsx` to `react-jsx` and `jsxImportSource` to `@citrusworx/sigjs`. The compiler rewrites `<App />` into a `jsx` call from `@citrusworx/sigjs/jsx-runtime`. That runtime creates DOM nodes. It is not React and it is not a virtual DOM.

`mount` clears `#root` and inserts the node `App` returns.

The two Juice imports are the published CSS entrypoints: core attributes, then the citrusmint theme. `todo.css` is the small exception in lesson 07.

### 4. Start the front end

API still running. From the repository root:

```bash
yarn workspace @citrusworx/todo dev
```

Open `http://127.0.0.1:5173`. If that address refuses the connection and `http://localhost:5173` works, your Vite bound IPv6 localhost only. The port is still 5173.

## Checkpoint

The browser shows the heading ToDos, a title field, and an Add button. The network panel shows `GET /api/todos` returning `[]` or your rows, via the dev server, not via a second origin.

If the heading is missing, the root element was not found or `mount` threw. The console message is the one in `main.tsx`.

## What's happening

Vite transforms TypeScript and serves modules. Sig's `jsx` walks props and creates elements. A function child becomes a text node subscribed with `effect`. You will use that in the next lesson. Juice's CSS matches attributes such as `theme`, `stack`, and `gap` after the browser has the elements. Sig does not know those names. It sets them as attributes, and the stylesheet does the rest.

Blackwater's `front/src/main.tsx` is the same shape: Juice styles, `mount`, a root check.

## Gap

**Seltzer does not serve this page.** Stopping the API does not stop Vite, and stopping Vite does not stop the API. Production keeps that split. There is no static middleware to turn on.

**`kiwi dev` does not start either process.** Two Yarn scripts do.

## Next

[05 — State with signals, and the list](./05-list.md)
