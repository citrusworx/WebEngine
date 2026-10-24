# KiwiPress Bridge

WordPress plugin that lets [KiwiPress](../../apps/kiwipress) pair with a site. It lives on the WordPress side only. The TypeScript client in `packages/kiwipress` still owns HTTP and content. This plugin does not sync posts, open a tunnel, or call out to KiwiPress.

KiwiPress already knows the site URL. It checks the public health route, stores one [application password](https://wordpress.org/documentation/article/application-passwords/) for an administrator, then writes the frontend URL here. Content keeps moving over core `/wp-json/wp/v2`.

This folder is `plugins/kiwipress-bridge` rather than `apps/kiwipress` or `packages/kiwipress`: it is installed into `wp-content/plugins`, and it is not part of the Sig/Juice front or the Seltzer back.

Version 0.2.0 is the B0 slice (health, settings, lockdown, and a status screen) plus B2 draft preview. WordPress holds the only preview secret and mints a short-lived token when a logged-in editor opens a core preview URL.

## What lockdown does

When lockdown is on (the default after activation):

- A logged-out visitor to the public theme is redirected (**302**) to `frontend_url` when that URL is set.
- If it is empty, or it points back at this same WordPress site, the theme is not loaded. The response is a blank page that says **Headless Mode Activated**.
- Logged-in users still see the theme. `wp-admin`, `wp-login.php`, REST (`/wp-json` and `?rest_route=`), cron, and admin-ajax are never redirected.

The front-end admin bar is hidden while lockdown is on.

Draft preview runs first, on `template_redirect` priority `-1`. A logged-in editor who can `edit_post` the requested item, on a paired site with a usable frontend URL, is sent (**302**) to `{frontend_url}{preview_path}?kiwipress_preview=<token>`. The response sets `Referrer-Policy: no-referrer` and `nocache_headers()`. Anonymous `?preview=true` goes to `wp-login.php` and never receives a token. If the site is not paired, or the frontend URL is empty or points at this WordPress site, a logged-in preview stays on the theme (the B0 behavior).

That lockdown behavior is seeded from Drew Winkles' **Activate Headless Mode** plugin, which was not in this repo. Three bugs in that plugin are fixed:

- `deactivate_theme_for_headless_mode()` never received `$template`, so it could not return the original theme template. The `template_include` callback here always accepts `$template` and returns it when the request is not locked.
- The admin-bar callback was `__return false`. The WordPress function is `__return_false`.
- The REST auth stub wrote `$restult` and dropped the result. The stub now returns `$result` unchanged. B0 does not add its own REST auth scheme.

## Options

### `kiwipress_bridge`

| Key | Type | Default | Who writes it |
| --- | --- | --- | --- |
| `frontend_url` | string | `""` | wp-admin or `POST /settings`. Empty, or an absolute `http`/`https` URL. |
| `lockdown` | bool | `true` | wp-admin or `POST /settings`. |
| `paired` | bool | `false` | `POST /settings` from the KiwiPress app when it pairs or unpairs. The status screen shows it and will not overwrite it. |
| `project_label` | string | `""` | `POST /settings`. Shown on the status screen, not edited there. |
| `preview_path` | string | `"/preview"` | wp-admin or `POST /settings`. A path only: it must start with `/`, and it must not include a scheme, a host, or `//`. An empty value is saved as `/preview`. |

Deactivating the plugin leaves this option in place. Deleting the plugin removes it (`uninstall.php`).

### `kiwipress_bridge_preview_secret`

A separate row, **autoload no**, created on activation and again on first use if an in-place upgrade from 0.1.0 skipped the activation hook. It is 64 hex characters (`bin2hex(random_bytes(32))`). The options table is utf8mb4, so the secret is not stored as 32 raw bytes; `hex2bin` restores 32 bytes before the HMAC key is derived.

Health, settings, and the wp-admin form never return this value. KiwiPress does not store it. The pairing flow is unchanged.

`KIWIPRESS_PREVIEW_SECRET` in `wp-config.php`, when set to a non-empty string, overrides the stored row for signing. A 64-character hex string is decoded to 32 bytes. Any other non-empty string is used as the raw key material. Revoke and unpair still rotate the stored row, but they cannot change the constant.

The secret rotates when `paired` changes from true to false (REST unpair, wp-cli, or any other `update_option`) and when an administrator uses **Revoke preview links** (`admin-post.php` plus a nonce). Deleting the plugin deletes the row.

The signing key is `hash_hmac('sha256', 'kiwipress-preview-v1', $secret_bytes, true)`. Tokens look like `kp1.<base64url json>.<base64url hmac>` and last 10 minutes (`kiwipress_bridge_preview_ttl`, a negative value is kept so a test can mint an already-expired token). The payload is `{v, iss, pid, pt, src, uid, iat, exp, jti}` with `src` of `post` or `autosave`. Fetch checks the signature (`hash_equals`), expiry (30 second skew), that `iss` is this site, that the site is still paired, that the post exists, is not trashed, and is `show_in_rest`, and that `user_can(uid, 'edit_post', pid)` is still true.

## REST

Namespace: `kiwipress/v1`.

### `GET /wp-json/kiwipress/v1/health`

Public. No secrets. The frontend URL is not included, only whether one is set.

```json
{
  "plugin_version": "0.2.0",
  "wp_version": "6.6",
  "lockdown": true,
  "paired": false,
  "frontend_url_set": false,
  "site_url": "https://cms.example.com",
  "features": ["preview"]
}
```

`site_url` is the WordPress address (`siteurl`), the origin `/wp-json` is served from.

```bash
curl -sS "https://cms.example.com/wp-json/kiwipress/v1/health"
```

### `GET /wp-json/kiwipress/v1/settings`

Requires `manage_options`. An administrator application password is enough.

```json
{
  "frontend_url": "",
  "lockdown": true,
  "paired": false,
  "project_label": "",
  "preview_path": "/preview"
}
```

```bash
curl -sS -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  "https://cms.example.com/wp-json/kiwipress/v1/settings"
```

### `POST /wp-json/kiwipress/v1/settings`

Same capability. Send any subset of `frontend_url`, `lockdown`, `paired`, `project_label`, and `preview_path`. Omitted keys stay as they are. Unknown keys are ignored. An invalid `preview_path` is **400**. The response is the saved settings object (same shape as GET). The preview secret is not on this route.

`frontend_url` must be `""` or an absolute `http`/`https` URL (`esc_url_raw`). `localhost` and a port are allowed. Anything else is **400**.

```bash
curl -sS -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  -H "Content-Type: application/json" \
  -d '{"frontend_url":"https://app.example.com","lockdown":true,"paired":true,"project_label":"Acme"}' \
  "https://cms.example.com/wp-json/kiwipress/v1/settings"
```

### `GET /wp-json/kiwipress/v1/preview`

Public. The credential is the `X-KiwiPress-Preview` header, not an application password. A bad `Authorization` header makes WordPress reject the route, so clients must omit it.

The plugin switches to the token's user, loads the post type's own `/wp/v2` route with `context=view`, and restores the previous user. When `src` is `autosave`, title, content, excerpt, and modified are replaced with that user's latest autosave (or the latest autosave on the post). The response is `{preview, source, post_id, post_type, expires_at, post}` with `Cache-Control: no-store, private` and `X-Robots-Tag: noindex`.

| Code | HTTP | When |
| --- | --- | --- |
| `kiwipress_bridge_preview_missing` | 401 | No token header. |
| `kiwipress_bridge_preview_invalid` | 401 | Bad structure, bad signature, or a different site. |
| `kiwipress_bridge_preview_expired` | 401 | Past `exp` plus the 30 second skew. |
| `kiwipress_bridge_preview_forbidden` | 403 | The embedded user can no longer edit the post. |
| `kiwipress_bridge_preview_disabled` | 403 | The site is not paired, or preview cannot be signed. |
| `kiwipress_bridge_preview_not_found` | 404 | Missing, trashed, or not exposed over REST. |

### `POST /wp-json/kiwipress/v1/preview/token`

Requires the current user to `edit_post` the given `post_id`. A logged-in subscriber gets WordPress's **403**. Body: `{post_id, source}` where `source` is `auto` (autosave when one exists, otherwise the post), `post`, or `autosave`. Response: `{token, url, expires_at}`. The URL is `{frontend_url}{preview_path}?kiwipress_preview=<token>`.

Classic, Gutenberg (`?p=<id>&preview=true`, which does not pass through `preview_post_link`), autosave (`preview_id` / `preview_nonce`), and list-table Preview links all hit the same handoff. `preview_id` mints `src=autosave`. Anything else mints `src=post`.

## wp-admin

After activation there is a top-level **KiwiPress** menu. It is a status page, not a second app:

- **Connection** — Connected when `paired` is true, otherwise Disconnected. Frontend URL, lockdown checkbox, and preview path. Save uses the Settings API.
- **Preview** — On or Off, an example URL with no token, the TTL, and **Revoke preview links**.
- **Health** — the same facts as `GET /health`, including features.

No build step and no admin JavaScript.

## Install locally

Zip from the monorepo so the plugin directory is the top level inside the archive:

```bash
cd plugins
zip -r kiwipress-bridge.zip kiwipress-bridge
```

Then either:

- **Plugins → Add New → Upload Plugin**, choose `kiwipress-bridge.zip`, install, and activate, or
- copy the `kiwipress-bridge` folder to `wp-content/plugins/kiwipress-bridge` and activate it on the Plugins screen.

Create an application password under **Users → Profile → Application Passwords** for an administrator. KiwiPress keeps that password. This plugin never sees it, and it is not stored in `kiwipress_bridge`.

There is no Composer package and no PHPUnit suite. Syntax-check with `php -l` on each file if you want a local smoke test. The Docker end-to-end suite below is the check against a real site.

## Pairing (B1)

KiwiPress already knows the site and starts every call. This plugin never looks up the app. The app flow, in [`apps/kiwipress`](../../apps/kiwipress/README.md):

1. `GET /health` with no credentials. If this 404s, the plugin is not active.
2. One authenticated `GET /wp/v2/users/me?context=edit`. The user must have `manage_options` (an administrator application password).
3. `POST /settings` with `frontend_url`, `paired: true`, and `project_label`.
4. `GET /settings` to confirm those values stuck. The app stores the application password only after that, encrypted on the KiwiPress side. This plugin still does not see or store the password.
5. Later status checks call `GET /health` again (still public) and GET the frontend URL. Disconnect sends `POST /settings` with `paired: false`, then deletes the copy stored by KiwiPress even if this site is down.

Content keeps moving over `/wp/v2` with the same application password. This folder is still the only thing you install into `wp-content/plugins`.

## End-to-end test

`yarn test:e2e:bridge` boots MariaDB and WordPress in Docker, mounts this plugin and a mu-plugin that registers a REST custom post type, installs the site, turns on pretty permalinks, and creates an administrator, an editor, and a subscriber with application passwords. It then runs the real `kiwi.bridge` client and the KiwiPress back routes (`/projects/:id/bridge/probe|pair|status|unpair|preview`) against that site. The stub frontend's `/preview` route calls `Bridge.preview()` with credentials that must not be sent.

The site URL is always `http://127.0.0.1:18080` (or `KIWIPRESS_E2E_WP_PORT`). How that port is reached depends on the Docker network:

- **Host network** (`docker-compose.yml`). WordPress, MariaDB, and wp-cli share the host network namespace. Apache listens on port 18080 and MariaDB listens on `127.0.0.1:3306`. This is the default on Linux, including the manual GitHub Actions workflow, because some nested VMs drop traffic between containers.
- **Bridge network** (`docker-compose.bridge.yml`). MariaDB is only `db:3306` on the compose network. Apache listens on container port 80, and Docker publishes host port 18080. This is the default under Git Bash / MSYS2 and when the daemon reports Docker Desktop, because host networking there is the utility VM (or is turned off) and Windows cannot open `127.0.0.1:18080`.

The suite is opt-in. It is not part of `yarn workspace @citrusworx/kiwipress test` or the back unit tests, because it needs a Docker daemon. From the repo root:

```bash
yarn test:e2e:bridge
```

That script is `plugins/kiwipress-bridge/tests/e2e/run.sh`. Useful overrides:

| Env | Default | Role |
| --- | --- | --- |
| `KIWIPRESS_E2E_WP_PORT` | `18080` | Host port for WordPress. |
| `KIWIPRESS_E2E_KEEP` | unset | Set to `1` to leave the containers up after the run. |
| `KIWIPRESS_E2E_NETWORK` | auto | `host` or `bridge`. Unset uses host on Linux Docker and bridge on Git Bash, MSYS2, and Docker Desktop. |

Application passwords over plain HTTP require `WP_ENVIRONMENT_TYPE=local`. The compose file sets that in `wp-config.php`. The suite generates its own `KIWIPRESS_SECRET_KEY` for the test process and does not read `apps/kiwipress/back/.env`.

GitHub Actions workflow **KiwiPress Bridge E2E** is manual (`workflow_dispatch` only). It runs the same command on `ubuntu-latest`, which selects host networking.

### Windows (Git Bash or MSYS2 UCRT64)

Run the same command from **Git Bash** or the **MSYS2 UCRT64** prompt, with Docker Desktop's Linux engine running (`docker context` `desktop-linux` is fine):

```bash
yarn test:e2e:bridge
```

No extra environment variables. The script prints which `bash` and `docker` it is using, then selects the bridge compose file.

Do not prefix the command with `MSYS_NO_PATHCONV=1`. That switch stops MSYS from rewriting paths for every Windows program, and corepack then fails with `Cannot find module G:\c\Program Files\nodejs\node_modules\corepack\dist\yarn.js`. The runner turns conversion off only for `docker.exe`, and only after host paths have been converted with `cygpath -m`. Container paths such as `/var/www/html` are not converted.

`*.sh` is stored as LF (`.gitattributes`). If `run.sh` was checked out with CRLF before that rule, Bash stops on line 4 (`set: pipefail\r: invalid option name`). Re-checkout the script so the attribute is applied:

```bash
git checkout -- plugins/kiwipress-bridge/tests/e2e/run.sh
```

PowerShell is not the supported shell for this command. `yarn` there often runs `C:\Windows\System32\bash.exe` (WSL). That bash does not see Docker Desktop unless WSL integration is enabled for the distro, and the error names the `bash` and `docker` binaries so you can tell them apart. Use Git Bash instead.

## Not in this version

- **B3** — webhooks and revalidate. That will use its own shared secret, not the preview secret.
- Pinned revisions, guest or shareable links, meta/ACF preview, native Nectarine preview, Gutenberg JavaScript changes, and multisite.

No GraphQL. Preview tokens are signed by WordPress only. They are not stored by KiwiPress.
