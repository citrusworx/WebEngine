# Getting Started With DNS

This is the usable path: construct `ResellerClub`, wrap it in `DNS`, call `availability`. Everything else on the provider interface throws.

## What you need

- A ResellerClub **Auth User ID** (number) and **API key**
- Network access to `https://domaincheck.httpapi.com/api`
- `@citrusworx/dns` built or installed

```bash
yarn add @citrusworx/dns
```

In this monorepo:

```bash
yarn workspace @citrusworx/dns build
```

## Construct the adapter and the façade

`ResellerClub` implements `RegistrarProvider`. `DNS` only stores that provider and forwards `availability` to `search`.

```ts
import { DNS, ResellerClub } from "@citrusworx/dns";

const authUserId = Number(process.env.RESELLERCLUB_AUTH_USERID);
const apiKey = process.env.RESELLERCLUB_API_KEY;

if (!Number.isFinite(authUserId) || !apiKey) {
  throw new Error("Set RESELLERCLUB_AUTH_USERID and RESELLERCLUB_API_KEY");
}

const dns = new DNS(new ResellerClub(authUserId, apiKey));
```

The package does not read environment variables itself. You pass the two constructor arguments.

ResellerClub's HTTP API receives `auth-userid` and `api-key` as query parameters on the availability URL. Treat the key like a password. Do not log the request URL.

## Check availability

```ts
const results = await dns.availability({
  name: "citrusworx",
  tlds: ["com", "net", "io"]
});

// [
//   { domain: "citrusworx.com", status: "taken" | "available" | "unknown", raw?: string },
//   { domain: "citrusworx.net", status: "...", raw?: string },
//   { domain: "citrusworx.io", status: "...", raw?: string }
// ]
```

`name` is the second-level label only. `tlds` is an array. The adapter builds `https://domaincheck.httpapi.com/api/domains/available.json` with one `domain-name` and one `tlds` query param per TLD.

`TLDs` is a union of common suffixes plus `(string & {})`, so `"com"` type-checks and so does a custom `"pizza"`.

## Read the result

```ts
import type { AvailabilityResult } from "@citrusworx/dns";

function pickAvailable(rows: AvailabilityResult[]) {
  return rows.filter((row) => row.status === "available").map((row) => row.domain);
}
```

`unknown` means the adapter could not map the vendor status — not that the domain is free. Use `raw` when you see it.

## What you cannot do yet

```ts
import { ResellerClub } from "@citrusworx/dns";
import type { RegisterDomainInput } from "@citrusworx/dns";

const rc = new ResellerClub(authUserId, apiKey);

const input: RegisterDomainInput = {
  domain: "example.com",
  years: 1,
  nameservers: ["ns1.example.net", "ns2.example.net"],
  contacts: {
    registrant: -1,
    admin: -1,
    tech: -1,
    billing: -1
  },
  autoRenew: false
};

await rc.register(input); // throws Error: ResellerClub.register not implemented
```

`renew`, `transfer`, and `restore` throw the same way. `DNS` does not expose them — you would have to call the adapter directly, and you would still get a throw.

## Call `search` without the façade

`DNS.availability` is `registrar.search`. These are equivalent:

```ts
await dns.availability(query);
await registrar.search(query);
```

Use `DNS` when you want application code to depend on the façade. Use `ResellerClub` directly in tests or when you are implementing another method on that class.

## Pitfalls

- **Empty inputs.** `name === ""` or `tlds.length === 0` returns `[]` and does not fetch.
- **Non-OK HTTP.** The adapter throws `ResellerClub availability check failed (<status>): <body>`.
- **Register-shaped types look complete.** `RegisterDomainInput` is a real exported type. The method is not.
- **No other providers in `src/providers/`.** A `Registrar` union of `'resellerclub' | 'godaddy' | 'namecheap' | 'cloudflare'` is a vocabulary, not a factory.

## Where to go next

- [Examples](./dns-examples.md)
- [Grapevine](../grapevine/README.md) if you are provisioning cloud, not domains
- [Make A Web App](../webengine/make-a-web-app.md) chapter 5
