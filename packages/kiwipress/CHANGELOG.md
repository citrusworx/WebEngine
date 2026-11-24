# @citrusworx/kiwipress

## Unreleased

- File persistence uses a unique temporary file for each save and attempts cleanup when the write or rename fails.
- `Users.delete(id, { reassign })` sends the WordPress core deletion parameters and reassigns the deleted user's posts and links to the specified user on a single-site install.
- `WPAuth` replaces custom authentication headers case-insensitively when it generates `Authorization` or `X-API-Key`.
- The default PostgreSQL adapter commits snapshot replacements in one transaction. Custom executors can opt in by implementing `SqlExecutor.transaction`.
- The default PostgreSQL adapter retries connection initialization on the next operation if its first connection attempt fails.
- The gateway rejects invalid JSON body shapes, blank content IDs, unsupported transfer fields, and requests to switch to WordPress mode without a WordPress URL.

## 0.5.0

### Minor Changes

- 1ac9f22: Add `kiwi.bridge` for the KiwiPress Bridge plugin: public health, settings read/write, and a `manage_options` check against `/wp/v2/users/me?context=edit`, with typed errors for bad credentials, role, a missing plugin, and an unreachable site.
- 782d3cf: Add draft preview on `kiwi.bridge`. `preview()` reads `GET /kiwipress/v1/preview` with the token header and no application password, even when credentials are configured. `createPreviewLink()` mints `POST /kiwipress/v1/preview/token`. Plugin error codes are mapped before HTTP status, so an expired token is `preview_expired` and a missing preview post is `preview_not_found`. Health `features` defaults to an empty list when a 0.1.0 site omits the field. Settings include `preview_path`.
- fbed903: Add create, update, and delete methods for `Categories`, `Tags`, `Comments`, and `Media`. `Media.create({ file, filename })` supports file uploads. The category and tag helpers send a bare `DELETE`. WordPress core requires `force=true` for those deletions, so use the REST endpoint directly for them in 0.5.0.
- 4cf3616: Add a generic WordPress CPT client (`CustomPostType` / `kiwi.wordpress.cpt(restBase)`) for any `/wp/v2/{restBase}` collection.
- 1f33f35: Normalize the best available title and content text into `ContentRecord`. Preserve raw and rendered variants when present, plus `meta.wpMeta` and `meta.acf` when supplied by WordPress. Use `withEditContext` to request authenticated edit-context fields. `getAll()` keeps its existing default context.
- 80e3f71: Add a read-only WordPress REST search client (`WordPressSearch` / `kiwi.wordpress.search`) for `/wp/v2/search`, returning light `SearchHit`s.
- 2bc41b4: Keep KiwiPress usable as a standalone library. The native CMS defaults to in-memory storage, with opt-in JSON file or Nectarine Postgres persistence. The default Postgres adapter requires `pg@8` in the host. A Postgres save replaces the snapshot with a delete followed by inserts without a transaction.
- 02b1509: Add WordPress type discovery at `kiwi.wordpress.types` and opt-in `WPSync` transfer of media records and selected custom post types into `NectarineStore`. Media transfer preserves metadata and references to the source assets.
- c7569f6: Add a generic WordPress taxonomy client (`CustomTaxonomy` / `kiwi.wordpress.taxonomy(restBase)`), taxonomy discovery at `wordpress.taxonomies`, and opt-in WPSync transfer via `taxonomies`.
- 08ce4ff: Add `WPAuth`, WordPress content normalization, Nectarine API YAML loading, and `WPSync` transfer into a native CMS store. These features are available from the standalone package.

### Patch Changes

- 5f67cd6: `kiwi.bridge.verifyCredentials()` reads public plugin health before the application-password check, so a deactivated KiwiPress Bridge reports `plugin_missing` instead of accepting credentials for a site that does not have the plugin.
- b3fb890: Alias Users city and city+state reads onto `/users?city=` and `/users?state=&city=` without changing the public paths.
- d39c0f0: Align page tag and category reads with the post query keys (`tags`, `categories`) and accept `string | number` for id-like page lookups.
- 6e68e0e: Route Posts, Pages, and Users create() through a WPCreate collaborator instead of WPRead.mutate.
- f6be26e: Route Posts, Pages, and Users delete() through a WPDelete collaborator instead of WPRead.mutate.
- f0c384d: Route Posts, Pages, and Users update() through a WPUpdate collaborator instead of WPRead.mutate.
- The published manifest declares `@citrusworx/seltzer@^0.11.0` and `@citrusworx/nectarine@^0.6.0`.

## 0.4.3

### Patch Changes

- Updated dependencies [815b941]
  - @citrusworx/seltzer@0.8.1

## 0.4.2

### Patch Changes

- Updated dependencies [aec9ec7]
- Updated dependencies [5accf92]
- Updated dependencies [7634d3a]
  - @citrusworx/nectarine@0.3.0
  - @citrusworx/seltzer@0.7.0

## 0.4.1

### Patch Changes

- Updated dependencies [a85ffb4]
- Updated dependencies [ebe30a7]
- Updated dependencies [d6c213e]
- Updated dependencies [39b06f0]
- Updated dependencies [da4d534]
- Updated dependencies [ff777bb]
- Updated dependencies [39c325b]
- Updated dependencies [632d20f]
- Updated dependencies [2150bb9]
- Updated dependencies [12ec2bc]
  - @citrusworx/nectarine@0.2.0
  - @citrusworx/seltzer@0.6.0

## 0.4.0

### Minor Changes

- Removed resolve() usage for better security

## 0.3.0

### Minor Changes

- Updates

### Patch Changes

- Updated dependencies
  - @citrusworx/seltzer@0.2.0

## 0.2.1

### Patch Changes

- Replace monorepo-only internal dependency ranges with published semver ranges so consumers outside the workspace can install these packages correctly.

## 0.2.0

### Minor Changes

- Added READMEs to each

### Patch Changes

- Updated dependencies
  - @citrusworx/nectarine@0.1.0
  - @citrusworx/seltzer@0.1.0

## 0.1.1

### Patch Changes

- e7a1584: Standardize library package manifests for independent publishing, align build outputs with published entrypoints, and add Changesets-based release automation for the monorepo.
- Updated dependencies [e7a1584]
- Updated dependencies [e7a1584]
  - @citrusworx/nectarine@0.0.2
  - @citrusworx/seltzer@0.0.2
