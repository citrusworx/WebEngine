# Grapevine Secrets and Environment

How Grapevine authenticates to DigitalOcean, and what it does with SSH material.

There is no vault, no encrypted grape file, and no OAuth helper. The schema’s only credential source is `"env"`.

## API token

Apply, live `grape status`, and every `doRequest` need a DigitalOcean personal access token with **write** scope for creates.

```bash
export DO_TOKEN=dop_v1_...
```

Default env name is the constant `DEFAULT_TOKEN_ENV` in `client.ts`: `"DO_TOKEN"`.

Grape configs name the variable, they do not contain the secret:

```yaml
credentials:
  source: env
  env: DO_TOKEN
```

`source` cannot be anything else. `credentials` omitted → same default.

### Custom env name

```yaml
credentials:
  source: env
  env: MY_DO_TOKEN
```

```bash
export MY_DO_TOKEN=dop_v1_...
```

`applyGrapeConfig` → `resolveToken`:

1. `getDoToken("MY_DO_TOKEN")`
2. because the name is not `DO_TOKEN`, `process.env.DO_TOKEN = token`

The HTTP client always reads `DO_TOKEN` via `authHeaders()`. The copy exists so a renamed variable still works for apply.

### `grape status` does not follow `credentials.env`

The CLI status command checks the literal `"DO_TOKEN"` even when `-c` points at a file that names `MY_DO_TOKEN`. If you renamed the variable:

- `grape apply -c` works
- `grape status` may print `DO_TOKEN is not set` and skip live counts

Export both, or alias: `export DO_TOKEN="$MY_DO_TOKEN"`.

### Missing token

`getDoToken` throws `DigitalOceanError`:

```text
DO_TOKEN is not set. Export a DigitalOcean personal access token (for example: export DO_TOKEN=dop_v1_…).
```

`validate` never calls this. You can schema-check YAML in CI without a token.

### Do not

- Commit `dop_v1_…` in YAML, JSON, or examples
- Put the token in `user_data`
- Expect a `~/.config/grapevine` credentials file
- Expect DigitalOcean OAuth inside this package

## SSH keys

Two honest paths.

### Bring a public key

```yaml
resources:
  ssh_keys:
    - name: laptop
      public_key: ssh-ed25519 AAAA...
```

`publicKey` is an alias. Apply uploads it with `uploadSSHKey`. You already have the private key on disk; Grapevine never sees it.

This is the path to use for any droplet you will log into.

### `generate: true`

```yaml
ssh_keys:
  - name: grapevine
    generate: true
    # private_key_path: .grape/ssh/grapevine  # optional default
```

Apply calls `createSSHKey(name)`:

- RSA 4096 via `generateKeyPairSync`
- public key converted to OpenSSH with `sshpk`
- SHA256 fingerprint locally
- private key converted to OpenSSH and written (mode `0600`) to `private_key_path` or `.grape/ssh/<name>`
- **only** `publicKey` is passed to `uploadSSHKey`

The apply result includes the saved path, never the key bytes. `.grape/` is local-only — do not commit it. Connect with `ssh -i <path>`. Blueprints `02` and `04` use this default.

If you generate from TypeScript yourself, you can keep it:

```ts
import { createSSHKey, uploadSSHKey } from "@citrusworx/grapevine";

const local = createSSHKey("deploy");
// local.keys.privateKey  — save this if you need it
await uploadSSHKey({ name: local.name, public_key: local.publicKey });
```

Missing both `public_key` and `generate` throws at apply:

```text
SSH key "laptop" is missing public_key (or set generate: true)
```

Zod still accepts that object, because both fields are optional. Validate will not catch it.

## App Platform env vars

`resources.apps[].spec` is passed to `POST /apps`. If DigitalOcean’s spec allows env bindings, you can put them there. Grapevine does not interpolate `${DO_TOKEN}`, does not read a `.env` file into the spec, and does not store app secrets.

## Firewall “secrets”

SSH source CIDRs (`REPLACE_WITH_YOUR_IP/32`) are not credentials, but they are sensitive enough not to commit if they identify a home network. Use an env-driven TypeScript apply, or a gitignored overlay, if that matters.

## `user_data`

Cloud-init can contain keys you should not commit. Grapevine forwards the string. It does not redact apply JSON.

## Related

- [Getting Started](./grapevine-getting-started.md)
- [Apply lifecycle](./grapevine-apply.md)
- [Anti-Patterns](./grapevine-anti-patterns.md)
