# Glossary

Short meanings for this course. The library docs remain the full definitions.

**Ack.** The JSON `{ ok: true, rowCount: 1 }` a PATCH or DELETE returns when the SQL has no `RETURNING` clause and at least one row was affected. Status 200. POST is not an ack in this app. The insert lists `returning: '*'`, so the body is the row, still at 200.

**`bindList`.** Sig's keyed list. Reuses the DOM node for an id that remains, creates one for a new id, disposes one that left. Not a JSX component. The render function receives `{ get() }` and is called once per key.

**`createNectarineRoutes`.** A helper this course used to assume. It is not exported by `@citrusworx/webengine` 0.2.1. The published module's keys are `WebEngine`. The app lists operations with `listApiOperations` from `@citrusworx/nectarine/api` and registers them with `generateRoutes` from `@citrusworx/seltzer`.

**`gap`.** A Juice attribute. In `@citrusworx/juiceui` 0.9.2 the selector is numeric (`gap="1"`, `gap="2"`, `gap="0.5"`, `gap="0.75"`). Padding has names such as `comfortable`. Gap does not.

**Grapevine config.** A yaml file with `provider: digitalocean` and a `resources` object. In 0.2.2 the resource kinds are tags, ssh keys, vpcs, droplets, firewalls, domains, load balancers, alert policies, and apps. `grape validate` checks that schema and drops unknown keys. `grape apply` calls DigitalOcean. `grape status` reports the token and counts. The npm `.bin/grape` symlink exits without printing. The scripts call `node` on `dist/bin/cli.js`.

**Juice attribute.** An HTML attribute the Juice stylesheet matches (`stack`, `tide-card`, `btn`, `theme`). Sig sets it when the name is not already a DOM property. Juice paints it.

**Nectarine resource.** One named triad: schema YAML, queries YAML, API YAML, listed in `nectarine.config.yaml`.

**`ResponseData`.** The object a Seltzer handler returns: optional `status`, optional `headers`, optional `body`. Not `ctx.json`, and not the raw Node response. A plain object returned from `execute` is wrapped as `{ body }` at status 200. `response()` brands an explicit `ResponseData`.

**SERIAL.** What `integer PRIMARY KEY AUTO_INCREMENT` compiles to on the Postgres adapter in `@citrusworx/nectarine` 0.5.0. The database assigns `id`. The client does not. Path segments arrive as strings, so the host passes an all-digit id as a number before it binds `WHERE id = $n`.

**Signal.** `{ get, set }` from `Signal(initial)`. `get` subscribes when an effect or a function child is running. `set` notifies, including when the next value is the same identity.

**Tide.** The dark theme shipped at `@citrusworx/juiceui/styles/themes/tide` in juiceui 0.9.2. Near-black page, Inter, one teal accent. `body` sets `theme="tide"`.

**Whole-todo PATCH.** The client sends every column in the update `fields` list. A missing unbound column is SQL `NULL` if validation allowed the request through. `.required` keys fail earlier with 400.
