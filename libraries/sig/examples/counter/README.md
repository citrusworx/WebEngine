# sigjs counter example

Tiny Vite app for `@citrusworx/sigjs`. No WebEngine, Juice, Nectarine, or Seltzer.

Shows `Signal`, function children, function props, `batch`, and `SigRouter` (exact, `:param`, `*`).

## From npm (any project)

This is the path for an outside consumer. The example depends on the published package, not a monorepo `file:` link.

```bash
npm install @citrusworx/sigjs@^0.3.0
npm install -D vite typescript
```

Copy `index.html`, `src/main.tsx`, `vite.config.ts`, and the `compilerOptions` in `tsconfig.json`.

Then:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Confirm the registry version with `npm view @citrusworx/sigjs version` if a newer minor is out.

## From this repo

This folder is its own npm project (not a Yarn workspace). `package.json` already pins `@citrusworx/sigjs` to `^0.3.0` from npm, so a fresh `npm install` here matches an outside consumer.

```bash
cd libraries/sig/examples/counter
npm install
npm run dev
```

### Monorepo (local `libraries/sig`, optional)

To exercise unpublished workspace source instead of npm:

```bash
yarn workspace @citrusworx/sigjs build
```

Point the example at the workspace package for one install:

```json
{
  "dependencies": {
    "@citrusworx/sigjs": "file:../.."
  }
}
```

Or, from the repo root, Yarn already resolves `@citrusworx/sigjs` as the `libraries/sig` workspace. The counter example is not a workspace member, so it does not pick that up unless you use `file:../..` (or copy the app into a workspace package).

Put the `file:` pin back to `^0.3.0` before treating this folder as the golden-path consumer example.
