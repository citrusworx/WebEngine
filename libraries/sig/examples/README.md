# Examples

Standalone apps that depend only on `@citrusworx/sigjs`. The [counter](./counter) example pins `@citrusworx/sigjs@^0.7.0` from npm so a fresh consumer does not need this monorepo. That range resolves. npm latest is **0.7.2**. The workspace `package.json` is still `0.7.0`.

| Example | What it shows |
|---------|----------------|
| [counter](./counter) | Vite + JSX, `Signal`, reactive props/children, `SigRouter` (`/`, `/about`, `/user/:id`, `*`) |
