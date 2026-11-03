# Examples

Standalone apps that depend only on `@citrusworx/sigjs`. The [counter](./counter) example pins `@citrusworx/sigjs@^1.0.0` from npm so a fresh consumer does not need this monorepo. The lock records **1.0.0** (published 2026-10-29). The workspace `package.json` is **1.1.2**, matching npm `latest`. **1.1.2** binds 32 runtimes, including sheet. **1.1.1** binds 31 and does not name sheet. **1.1.0** was never published.

| Example | What it shows |
|---------|----------------|
| [counter](./counter) | Vite + JSX, `Signal`, reactive props/children, `SigRouter` (`/`, `/about`, `/user/:id`, `*`) |
