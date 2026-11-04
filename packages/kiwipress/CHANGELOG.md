# @citrusworx/kiwipress

## 0.5.0

### Minor Changes

- changeset overdue
- 1ac9f22: Add `kiwi.bridge` for the KiwiPress Bridge plugin: public health, settings read/write, and a `manage_options` check against `/wp/v2/users/me?context=edit`, with typed errors for bad credentials, role, a missing plugin, and an unreachable site.
- 782d3cf: Add draft preview on `kiwi.bridge`. `preview()` reads `GET /kiwipress/v1/preview` with the token header and no application password, even when credentials are configured. `createPreviewLink()` mints `POST /kiwipress/v1/preview/token`. Plugin error codes are mapped before HTTP status, so an expired token is `preview_expired` and a missing preview post is `preview_not_found`. Health `features` defaults to an empty list when a 0.1.0 site omits the field. Settings include `preview_path`.
- fbed903: Add create/update/delete for Categories, Tags, Comments, and Media, including a working WordPress media upload path.
- 4cf3616: Add a generic WordPress CPT client (`CustomPostType` / `kiwi.wordpress.cpt(restBase)`) for any `/wp/v2/{restBase}` collection.
- 1f33f35: Keep ContentRecord title/content as best-available text and store raw vs rendered, WordPress meta, and ACF on meta. Add withEditContext for authenticated raw fields without changing public getAll() defaults.
- 80e3f71: Add a read-only WordPress REST search client (`WordPressSearch` / `kiwi.wordpress.search`) for `/wp/v2/search`, returning light `SearchHit`s.
- 2bc41b4: Keep KiwiPress a standalone WordPress + native CMS library: opt-in file and Nectarine Postgres persistence, no WebEngine coupling.
- 02b1509: WPSync can transfer media and named CPT rest bases into NectarineStore. Add WordPress type discovery at wordpress.types.
- c7569f6: Add a generic WordPress taxonomy client (`CustomTaxonomy` / `kiwi.wordpress.taxonomy(restBase)`), taxonomy discovery at `wordpress.taxonomies`, and opt-in WPSync transfer via `taxonomies`.
- 08ce4ff: Make KiwiPress the WordPress entry point into WebEngine: WPAuth, content normalization, Nectarine API loading, and WPSync transfer into a native CMS store.

### Patch Changes

- 5f67cd6: `kiwi.bridge.verifyCredentials()` reads public plugin health before the application-password check, so a deactivated KiwiPress Bridge reports `plugin_missing` instead of accepting credentials for a site that does not have the plugin.
- b3fb890: Alias Users city and city+state reads onto `/users?city=` and `/users?state=&city=` without changing the public paths.
- d39c0f0: Align page tag and category reads with the post query keys (`tags`, `categories`) and accept `string | number` for id-like page lookups.
- 6e68e0e: Route Posts, Pages, and Users create() through a WPCreate collaborator instead of WPRead.mutate.
- f6be26e: Route Posts, Pages, and Users delete() through a WPDelete collaborator instead of WPRead.mutate.
- f0c384d: Route Posts, Pages, and Users update() through a WPUpdate collaborator instead of WPRead.mutate.
- Updated dependencies
- Updated dependencies [ba0b206]
- Updated dependencies [f343927]
- Updated dependencies [93a3bbe]
- Updated dependencies [53f27b5]
- Updated dependencies [4a0b598]
- Updated dependencies [910b8f1]
- Updated dependencies [6fac3e4]
- Updated dependencies [3d9489f]
- Updated dependencies [dc82995]
  - @citrusworx/seltzer@0.11.0
  - @citrusworx/nectarine@0.6.0

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
