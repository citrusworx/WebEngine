# DNS

`@citrusworx/dns` is the CitrusWorx domain and registrar abstraction.

It is not a nameserver, not a DNS hosting panel, and not a multi-vendor platform. It is a small TypeScript layer that says: *talk to a registrar through one interface, and keep vendor quirks inside an adapter.*

The current model is:

- `DNS` is a thin façade over a `RegistrarProvider`
- `ResellerClub` is the one implemented adapter, and only `search` (availability) works
- types describe more vendors and more actions than the code can perform

DNS is strongest when you treat it as a registrar client with a provider interface — not as Grapevine-for-domains, and not as something WebEngine calls during `deployApplication()`.

## Who this is for

- Someone who needs to check whether a name is available at ResellerClub
- Someone writing a second `RegistrarProvider` and wanting the contract in one place
- Readers of [Make A Web App With WebEngine](../webengine/make-a-web-app.md) who have reached **chapter 5** (Grapevine and DNS)

On that course, DNS is a **deploy appendix / elective**. You can ship a Juice + Sig.js + Nectarine + Seltzer app without it. Use it when you actually talk to a registrar.

## Why it exists

Registrar HTTP APIs do not agree on anything that matters: query string names, status vocabularies, contact handles, what "available" means. If every CitrusWorx app talks to ResellerClub (or Namecheap, or GoDaddy) directly, those differences leak into application code.

`@citrusworx/dns` exists so application code can say:

```ts
const results = await dns.availability({ name: "citrusworx", tlds: ["com", "dev"] });
```

and a provider adapter can translate that into ResellerClub's `domains/available.json` and map `regthroughus` / `regthroughothers` to `taken`.

That is the same split Juice makes with attributes vs theme CSS, and Types makes with shared objects vs runtime. DNS owns the **shape of the conversation**. The adapter owns the vendor.

What DNS is not:

- a recursive resolver or authoritative DNS server
- DigitalOcean/AWS DNS record hosting (those names exist on the `DnsHost` type only)
- a WebEngine module — WebEngine does not import this package
- a replacement for Grapevine. Grapevine provisions cloud. DNS talks to registrars.

## Mental model

Two provider roles, one façade:

```
Application
    │
    ▼
  DNS.availability(query)     ← the only method on the façade
    │
    ▼
  RegistrarProvider.search()  ← ResellerClub implements this
```

`RegistrarProvider` also declares `register`, `renew`, `transfer`, and `restore`. `ResellerClub` implements them by throwing `"... not implemented"`.

`DnsHostProvider` declares nameserver and record updates. Nothing in the public export implements it. There is no Namecheap or OpenSRS adapter in `libraries/dns/src/providers/` — only `resellerclub/`.

`AvailabilityQuery` is a second-level name plus a list of TLDs, not a FQDN:

```ts
{ name: "citrusworx", tlds: ["com", "dev"] }
// becomes citrusworx.com and citrusworx.dev
```

## What it can do today

Check availability through ResellerClub, then read `available` / `taken` / `unknown` per domain.

```ts
import { DNS, ResellerClub } from "@citrusworx/dns";

const registrar = new ResellerClub(AUTH_USER_ID, API_KEY);
const dns = new DNS(registrar);

const results = await dns.availability({
  name: "citrusworx",
  tlds: ["com", "dev", "io"]
});

for (const row of results) {
  console.log(row.domain, row.status, row.raw);
}
```

A successful ResellerClub payload is remapped in `libraries/dns/src/providers/resellerclub/resellerclub.ts`:

| ResellerClub `status` | `AvailabilityResult.status` |
|---|---|
| `available` | `available` |
| `regthroughus` or `regthroughothers` | `taken` |
| anything else, or a missing record | `unknown` |

`row.raw` keeps the vendor string so you can debug mapping mistakes.

Empty `name` or an empty `tlds` array returns `[]` without calling the network.

That is the shipped capability. Registering, renewing, transferring, restoring, and hosting records are interface placeholders. See [Getting started](./dns-getting-started.md) and [Examples](./dns-examples.md).

## Status

**Early** — one working adapter method on a real public API.

Shipped:

- package `@citrusworx/dns`
- `DNS`, `ResellerClub`
- `RegistrarProvider`, `DnsHostProvider`, `DnsProvider`
- `AvailabilityQuery`, `AvailabilityResult`
- registrar / DNS-host / TLD / action string unions

Not shipped:

- `ResellerClub.register` / `renew` / `transfer` / `restore` (they throw)
- any `DnsHostProvider` implementation
- Namecheap, OpenSRS, GoDaddy, or Cloudflare adapters (older notes mentioned scaffolds; they are not in `libraries/dns/src/providers/` now)
- WebEngine or Grapevine integration

## Placement in the ecosystem

| Package | Role next to DNS |
|---|---|
| [Types](../types/README.md) | `Domain` is a project record (`name`, `verified`). DNS does not create one. |
| [Grapevine](../grapevine/README.md) | Cloud resources. Chapter 5 of the course pairs them as infra, not as one library. |
| [WebEngine](../webengine/README.md) | Intended future consumer. Does not import `@citrusworx/dns` today. |

Course hub: [Make A Web App With WebEngine](../webengine/make-a-web-app.md) — chapter 5, elective appendix.

## Suggested reading order

1. This README — what / why / what works
2. [Getting started](./dns-getting-started.md) — ResellerClub credentials and `availability`
3. [Examples](./dns-examples.md) — queries, mapping, and the methods that throw
4. Back to the course hub if you are on the web-app path

## Sibling docs

- [Grapevine](../grapevine/README.md)
- [Types](../types/README.md)
- [WebEngine](../webengine/README.md)

## Source of truth

- Package: `libraries/dns/package.json`
- Exports: `libraries/dns/src/index.ts`
- Façade: `libraries/dns/src/core/dns.ts`
- Contracts: `libraries/dns/src/core/provider.ts`
- Working adapter: `libraries/dns/src/providers/resellerclub/resellerclub.ts`
