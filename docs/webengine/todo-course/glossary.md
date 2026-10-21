# Glossary

Short meanings for this course. The library docs remain the full definitions.

**Ack.** The JSON `{ ok: true, rowCount: 1 }` a write returns when the SQL has no `RETURNING` clause and at least one row was affected. Status 200.

**`bindList`.** Sig's keyed list. Reuses the DOM node for an id that remains, creates one for a new id, disposes one that left. Not a JSX component.

**`createNectarineRoutes`.** The WebEngine helper that flattens `*API.yml` with Nectarine `listApiOperations` and registers Seltzer routes via `generateRoutes`.

**`gap`.** A Juice attribute. On this checkout the selector is numeric (`gap="1"`, `gap="2"`, `gap="0.5"`, plus `rem` and `px` forms). Padding has names. Gap does not.

**Grapevine config.** A yaml file with `provider: digitalocean` and a `resources` object. `grape validate` checks that schema. `grape apply` calls DigitalOcean. `grape status` reports the token and counts.

**Juice attribute.** An HTML attribute the Juice stylesheet matches (`stack`, `panel`, `btn`, `theme`). Sig sets it. Juice paints it.

**Nectarine resource.** One named triad: schema YAML, queries YAML, API YAML, listed in `nectarine.config.yaml`.

**`ResponseData`.** The object a Seltzer handler returns: optional `status`, optional `headers`, optional `body`. Not `ctx.json`, and not the raw Node response.

**Signal.** `{ get, set }` from `Signal(initial)`. `get` subscribes when an effect or a function child is running. `set` notifies.

**Whole-todo PATCH.** The client sends every column in the update `fields` list. A missing unbound column is SQL `NULL` if validation allowed the request through.
