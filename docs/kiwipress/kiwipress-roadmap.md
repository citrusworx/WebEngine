# KiwiPress Roadmap

## Current position

KiwiPress is no longer “a README and three topic pages.” The **library** at 0.4.3 is a real WordPress client, a real transfer, and a real in-process CMS with file / Postgres persistence.

The strongest part today is the WordPress domain spine plus `WPSync` → `NectarineStore`. The next strongest is native collections and file persistence.

The inbound gateway now returns Seltzer `ResponseData` and hosts native type definitions plus `/content/:kind`. Dashboard chrome (wizard, billing, projects) is not a library roadmap item. WordPress CPT sync is still out of scope.

This page is engineer-honest direction, not a committed release plan. For the matrix, see [Status](./kiwipress-status.md).

---

## What is already true

### 1. WordPress is an elective on-ramp

`Posts` / `Pages` / `Users` CRUD and read-only taxonomies/comments exist. Greenfield `mode: "nectarine"` exists. Transfer is explicit.

### 2. The destination is `ContentRecord`, not `wp-json`

Normalize + `WPSync` + native collections are source, not essays.

### 3. Persistence is opt-in and kernel-free

File and Nectarine Postgres adapters ship. WebEngine is not in the import graph.

### 4. The app is a consumer

`apps/kiwipress` demonstrates Content + transfer. It does not define the package API.

---

## What is still holding KiwiPress back

### 1. Content item URLs still use `?id=`

`/content/:kind` is parameterized. PATCH/DELETE still take `?id=` for the current front. `/content/:kind/:id` can follow later.

### 2. Native writes are a subset

`NativeCollection.create` / `update` drop most WordPress keys and ignore numeric `author`. A small, documented field list — or “normalize then upsert” — would stop silent Untitled posts.

### 3. Postgres save is delete-then-insert

No transactions. A crash can empty `kiwipress_content`. Worth fixing when someone actually runs that adapter in production.

### 4. No media / WordPress CPT sync / plugin objects

Native custom types exist. Featured image ids still have no blobs. No `Media` class. No WooCommerce. No WordPress CPT pull. Do not fake those in docs.

### 5. Package DX

No `test` script in `package.json` despite Vitest files. No `.env` loader (correct for a library; the app should document its own).

### 6. Echo / visual CMS

Not started in this package. The dashboard wysiwyg folder is an experiment. Do not schedule it as “almost shipped.”

### 7. WebEngine orchestration

`Blueprint.adapters.cms = "kiwipress"` remains Types vocabulary. Do not block library work on the kernel.

---

## What would not help

- A `docs/kiwipress/course/` that retells the tutorial
- Teaching `ctx.json` as the future
- Pulling WebEngine in to get a JSON file
- MySQL/Mongo adapters before the Postgres crash window is honest
- Pretending apply works without a server-side DigitalOcean token

---

## Suggested order if someone touches code

1. Gateway `ResponseData` (unlocks honest Seltzer integration)
2. Native write field honesty (or reuse `normalizeWordPressItem`)
3. Postgres transactional save (or document + warn only — already documented)
4. Media as a `WPRead` when a host needs it
5. Package `test` script

Docs in this folder should stay aligned with source after each of those, not ahead of them.
