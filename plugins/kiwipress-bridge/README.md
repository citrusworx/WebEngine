# KiwiPress Bridge

WordPress plugin that lets [KiwiPress](../../apps/kiwipress) pair with a site. It lives on the WordPress side only. The TypeScript client in `packages/kiwipress` still owns HTTP and content. This plugin does not sync posts, open a tunnel, or call out to KiwiPress.

KiwiPress already knows the site URL. It checks the public health route, stores one [application password](https://wordpress.org/documentation/article/application-passwords/) for an administrator, then writes the frontend URL here. Content keeps moving over core `/wp-json/wp/v2`.

This folder is `plugins/kiwipress-bridge` rather than `apps/kiwipress` or `packages/kiwipress`: it is installed into `wp-content/plugins`, it is not part of the Sig/Juice front or the Seltzer back, and new paths under `apps/` are gitignored in this repo.

Version 0.1.0 is the B0 slice: health, settings, lockdown, and a status screen.

## What lockdown does

When lockdown is on (the default after activation):

- A logged-out visitor to the public theme is redirected (**302**) to `frontend_url` when that URL is set.
- If it is empty, or it points back at this same WordPress site, the theme is not loaded. The response is a blank page that says **Headless Mode Activated**.
- Logged-in users still see the theme. `wp-admin`, `wp-login.php`, REST (`/wp-json` and `?rest_route=`), cron, and admin-ajax are never redirected.

The front-end admin bar is hidden while lockdown is on.

That behavior is seeded from Drew Winkles' **Activate Headless Mode** plugin, which was not in this repo. Three bugs in that plugin are fixed:

- `deactivate_theme_for_headless_mode()` never received `$template`, so it could not return the original theme template. The `template_include` callback here always accepts `$template` and returns it when the request is not locked.
- The admin-bar callback was `__return false`. The WordPress function is `__return_false`.
- The REST auth stub wrote `$restult` and dropped the result. The stub now returns `$result` unchanged. B0 does not add its own REST auth scheme.

Preview requests are not special-cased yet (B2).

## Option

One row in `wp_options`: **`kiwipress_bridge`**.

| Key | Type | Default | Who writes it |
| --- | --- | --- | --- |
| `frontend_url` | string | `""` | wp-admin or `POST /settings`. Empty, or an absolute `http`/`https` URL. |
| `lockdown` | bool | `true` | wp-admin or `POST /settings`. |
| `paired` | bool | `false` | `POST /settings` from the KiwiPress app when it pairs or unpairs. The status screen shows it and will not overwrite it. |
| `project_label` | string | `""` | `POST /settings`. Shown on the status screen, not edited there. |

Deactivating the plugin leaves the option in place. Deleting the plugin removes it (`uninstall.php`).

## REST

Namespace: `kiwipress/v1`.

### `GET /wp-json/kiwipress/v1/health`

Public. No secrets. The frontend URL is not included, only whether one is set.

```json
{
  "plugin_version": "0.1.0",
  "wp_version": "6.6",
  "lockdown": true,
  "paired": false,
  "frontend_url_set": false,
  "site_url": "https://cms.example.com"
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
  "project_label": ""
}
```

```bash
curl -sS -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  "https://cms.example.com/wp-json/kiwipress/v1/settings"
```

### `POST /wp-json/kiwipress/v1/settings`

Same capability. Send any subset of `frontend_url`, `lockdown`, `paired`, and `project_label`. Omitted keys stay as they are. Unknown keys are ignored. The response is the saved settings object (same shape as GET).

`frontend_url` must be `""` or an absolute `http`/`https` URL (`esc_url_raw`). `localhost` and a port are allowed. Anything else is **400**.

```bash
curl -sS -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  -H "Content-Type: application/json" \
  -d '{"frontend_url":"https://app.example.com","lockdown":true,"paired":true,"project_label":"Acme"}' \
  "https://cms.example.com/wp-json/kiwipress/v1/settings"
```

## wp-admin

After activation there is a top-level **KiwiPress** menu. It is a status page, not a second app:

- **Connection** — Connected when `paired` is true, otherwise Disconnected. Frontend URL field and lockdown checkbox. Save uses the Settings API.
- **Health** — the same facts as `GET /health`.

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

There is no Composer package and no PHPUnit suite. Syntax-check with `php -l` on each file if you want a local smoke test.

## Pairing (B1)

KiwiPress already knows the site and starts every call. This plugin never looks up the app. The app flow, in [`apps/kiwipress`](../../apps/kiwipress/README.md):

1. `GET /health` with no credentials. If this 404s, the plugin is not active.
2. One authenticated `GET /wp/v2/users/me?context=edit`. The user must have `manage_options` (an administrator application password).
3. `POST /settings` with `frontend_url`, `paired: true`, and `project_label`.
4. `GET /settings` to confirm those values stuck. The app stores the application password only after that, encrypted on the KiwiPress side. This plugin still does not see or store the password.
5. Later status checks call `GET /health` again (still public) and GET the frontend URL. Disconnect sends `POST /settings` with `paired: false`, then deletes the copy stored by KiwiPress even if this site is down.

Content keeps moving over `/wp/v2` with the same application password. This folder is still the only thing you install into `wp-content/plugins`.

## Not in this version

- **B2** — draft preview bypass.
- **B3** — webhooks.

No GraphQL and no preview tokens.
