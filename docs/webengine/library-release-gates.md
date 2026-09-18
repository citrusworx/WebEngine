# Library release gates (before WebEngine kernel)

Standing checklist: what each core library **should be** and **must offer** before we label it ready to release — and before we scaffold a proper WebEngine kernel.

WebEngine owns **sequence**, not capability. Libraries own capability. Until the gates below are green, treat `engines/webengine` as a lifecycle sketch, not a product bootstrap. See [README.md](./README.md), [Make A Web App](./make-a-web-app.md), and [Nectarine <-> kernel contract](./nectarine-kernel-contract.md).

## Rule of thumb

A library is “ready to release” when an outside developer can:

1. Install it from npm (or a published tarball),
2. Follow docs without monorepo tribal knowledge,
3. Ship a thin real surface (page, API, query, or provision),
4. Not discover that a core promise is a silent stub.

**Kernel scaffolding starts when Juice + Sig + Seltzer + Nectarine clear their gates.** Grapevine clears its own infra gate in parallel (optional for kernel v0; required before promising deploy).

## Shared bar (every package)

- [ ] Honest status label in docs (alpha / beta / 0.x) matches the code
- [ ] `package.json` `exports`, README entrypoints, and `dist/` agree
- [ ] Package verify script green (`yarn workspace <pkg> verify` or documented equivalent)
- [ ] Changeset + changelog; no surprise hand-edited versions on publish
- [ ] One golden-path example that runs for a fresh consumer
- [ ] Semver policy written; 0.x breaking changes called out explicitly

---

## 1. Juice — `@citrusworx/juiceui`

**Should be:** CSS-first, attribute-driven styling and composition, shipped themes, and a small set of auto-enhance runtimes (nav / accordion / tabs). Not a large JS component library.

**Ready when:**

- [ ] Promises in [juice-beta.md](../juice/juice-beta.md) are true and gated by `yarn workspace @citrusworx/juiceui verify`
- [ ] Core areas remain **Stable-ish** per [juice-maturity-matrix.md](../juice/juice-maturity-matrix.md): layout, spacing, color, typography, icons
- [ ] Shipped themes (`aquaflux`, `kiwipress`, `citrusmint`, `tide`) install via documented entrypoints; `_draft` themes are never in public `exports` / tarball
- [ ] Navigation, accordion, and tabs auto-enhance are documented and tested; `sideEffects` includes the JS entry so bundlers do not drop auto-start
- [ ] Artifact budgets and runtime/e2e tests pass ([release-checklist.md](../juice/release-checklist.md))
- [ ] Forms, cards, and responsive behavior are labeled **Emerging** with known limits (no fake “complete design system” claim)
- [ ] Theme authoring contract is documented; config-driven branding stays **Draft** until it is a real contract

**Release label:** stay on **Beta** until forms + nav feel settled; **1.0** only if attribute contracts freeze.

---

## 2. Sig — `@citrusworx/sigjs`

**Should be:** a tiny client UI runtime (signals, JSX to real DOM, client router) that Juice composes with. No VDOM requirement; no SSR requirement for release.

**Ready when:**

- [ ] `Signal` / `effect` / `batch` / `memo` / `mount` / `disposeTree` are documented and tested (**Stable-ish** per [sig-status.md](../sigjs/sig-status.md))
- [ ] JSX factory + `jsxImportSource` recipes work for Vite and `tsc` from a fresh install
- [ ] `SigRouter` supports exact paths, `:param` segments, optional `*`, and dispose-on-navigate; Juice attributes survive `setProp`
- [ ] An example under `libraries/sig/examples/` (or a Juice+Sig shell) runs without monorepo-only magic
- [ ] Non-goals are explicit in docs: no SSR, no `<For>` / `<Show>` primitives yet, function children are text-only
- [ ] List/conditional usage has a blessed **pattern** in docs even if primitives remain Draft ([sig-roadmap.md](../sigjs/sig-roadmap.md))
- [ ] Publish follows [sigjs release-checklist.md](../sigjs/release-checklist.md): next npm version is **0.3.0**; `yarn version-packages` will also patch-bump Juice/Sugar because `^0.2.0` does not include `0.3.0`

**Release label:** **0.3+ usable alpha/beta** for app shells; **1.0** only after the list/conditional story is intentional (primitive or documented pattern).

---

## 3. Seltzer — `@citrusworx/seltzer`

**Should be:** a small Node `http` runtime with object routes, `ResponseData` handlers, and a named pipeline. Nectarine joins via `generateRoutes` / `ApiOperation[]`. Not Express.

**Ready when:**

- [ ] `init` / `route` / `listen` / `before` / `replace` match the status matrix (**Stable-ish** core per [seltzer-status.md](../seltzer/seltzer-status.md))
- [ ] Parametric routes, static-prefix ranking, JSON parse + 400, and CORS / OPTIONS are documented and tested
- [ ] Handlers must return `ResponseData`; bare values are 500; no live `ctx.json` write API in current docs
- [ ] Default `validate` (`.required`) is documented; Zod (or richer) validation is shown as `replace("validate")`
- [ ] `generateRoutes` + Nectarine `listApiOperations` is a published recipe with a test
- [ ] Outbound `client.*` is either hardened (URL join, timeout/abort) or clearly **Emerging** with limits
- [ ] Non-goals explicit: HTTPS listen, middleware `app.use`, form bodies remain Draft until shipped
- [ ] Docs on the default branch match the shipped version (no obsolete 0.2 essays describing current APIs)

**Release label:** **0.9 / 1.0-candidate** once listen edges (host bind, timeouts) and the Nectarine generate path are boring.

---

## 4. Nectarine — `@citrusworx/nectarine`

**Should be:** YAML config + phonics compiler + DB adapters + migrator. App/kernel code never embeds SQL. Nectarine does **not** listen on HTTP.

**Ready when:** (see [production.md](../nectarine/production.md), [release-checklist.md](../nectarine/release-checklist.md), [nectarine-kernel-contract.md](./nectarine-kernel-contract.md))

- [ ] `loadNectarineConfig` is the only bootstrap story: YAML names env **keys**; secrets stay in the environment
- [ ] Named DML from `*Queries.yml` and DDL from `*Schema.yml` go through the compiler; adapters only `query(sql, params)`
- [ ] `applyMigrations` ledger + versioned phonics migrations; destructive ops require `destructive` + `confirm`
- [ ] Postgres path is production-shaped (pool lifecycle; partial vendor env is a boot error); MySQL/Mongo documented as peer adapters
- [ ] `listApiOperations` is stable for Seltzer / WebEngine; adapters are **not** loaded from the package root entry
- [ ] `yarn verify:nectarine` (typecheck, build, tests, pack dry-run) is green
- [ ] Showcase + at least one host reference (Blackwater or slim equivalent) stays green on the named-query path
- [ ] Status docs do not oversell; leave “early alpha” until CREATE / migrate / query / boot are dull

**Release label:** **0.4+ hostable alpha** for kernel work; **1.0** after migrations + a non-Blackwater consumer.

---

## 5. Grapevine — `@citrusworx/grapevine`

**Should be:** DigitalOcean provisioning library + `grape` CLI. Not multi-cloud theater. Not the app HTTP server.

**Ready when:** (see [grapevine-roadmap.md](../grapevine/grapevine-roadmap.md))

- [ ] Schema `provider` is DigitalOcean-only; other clouds are rejected
- [ ] `grape validate` / `plan` / `apply` / `destroy` / `status` / `init` match the README; dry-run does not bill by accident
- [ ] Apply order and same-apply name maps are documented; create vs update / idempotency gaps are labeled honestly
- [ ] Blueprint examples (`01`–`04`) smoke in a real or recorded fixture path
- [ ] Schema fields that do not provision are marked **not implemented** (no fake product surface)
- [ ] Generated private keys never print key material (paths only)
- [ ] `kiwi --grape` is documented as shell-out to `grape` when present on `PATH`

**Release label:** **0.3+ DO provisioner**; multi-cloud out of scope until a second `providers/` adapter exists.

---

## Kernel gate (start proper WebEngine scaffolding)

Start kernel scaffolding only when **all** of the following are true:

1. **Juice + Sig** — a multi-route Juice shell can be built without weekly API thrash
2. **Seltzer + Nectarine** - config -> migrate -> `generateRoutes` -> `listen` is a copy-pasteable host recipe
3. **Kernel contract** — [nectarine-kernel-contract.md](./nectarine-kernel-contract.md) remains the only blessed join (no second YAML bootstrap, no Express, no SQL in host wrappers)
4. **Types** — `Blueprint` / `Environment` / `DeploymentManifest` match what kernel methods will actually accept
5. **Grapevine** — optional for kernel v0 (`buildEnvironment` may stub); required before promising `deployApplication`

### Kernel v0 scope (honest)

- Module registry + Nectarine handle + start Seltzer from kernel (as sketched in the contract)
- Lifecycle methods that call real library entrypoints **or** throw “not implemented” — no silent success stubs
- Do not treat compiled leftovers under `dist/kernel/` / fictional `kiwi.config.toml` loaders as public API unless they exist in current `src/`

### Kernel v0 non-goals

Full PaaS, multi-cloud, CMS, auto SSL — those stay in libraries (Grapevine, DNS, KiwiPress, etc.).

---

## Suggested sequencing

1. Freeze the **Seltzer <-> Nectarine** join (largest kernel dependency)
2. Land a **Juice + Sig** shell golden path
3. Grapevine apply/destroy smoke (parallel is fine)
4. Scaffold WebEngine kernel against the contract

## Related docs

- [WebEngine README (reality check)](./README.md)
- [Make A Web App](./make-a-web-app.md)
- [Nectarine <-> kernel contract](./nectarine-kernel-contract.md)
- [Juice release checklist](../juice/release-checklist.md)
- [Nectarine release checklist](../nectarine/release-checklist.md)
