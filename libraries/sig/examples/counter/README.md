# sigjs counter example

Tiny Vite app for `@citrusworx/sigjs`. No WebEngine, Juice, Nectarine, or Seltzer.

Shows `Signal`, function children, function props, `batch`, and `SigRouter` (exact, `:param`, `*`).

## From this repo

```bash
yarn workspace @citrusworx/sigjs build
cd libraries/sig/examples/counter
yarn
yarn dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## From npm (any project)

```bash
npm install @citrusworx/sigjs
npm install -D vite typescript
```

Copy `index.html`, `src/main.tsx`, `vite.config.ts`, and the `compilerOptions` in `tsconfig.json`. Point `"@citrusworx/sigjs"` at the published package instead of `file:../..`.
