# DNS Examples

These examples match `libraries/dns/src/`. They do not invent a register flow.

## Availability for several TLDs

```ts
import { DNS, ResellerClub } from "@citrusworx/dns";
import type { AvailabilityQuery } from "@citrusworx/dns";

const dns = new DNS(new ResellerClub(123456, "your-api-key"));

const query: AvailabilityQuery = {
  name: "kiwipress",
  tlds: ["com", "dev", "app"]
};

const results = await dns.availability(query);

for (const { domain, status, raw } of results) {
  if (status === "available") {
    console.log(`${domain} is free`);
  } else if (status === "taken") {
    console.log(`${domain} is taken (${raw})`);
  } else {
    console.log(`${domain} unmapped vendor status: ${raw ?? "(missing)"}`);
  }
}
```

ResellerClub is queried once. The adapter maps each requested TLD back onto the payload key `"${name}.${tld}"`.

## Guard empty queries

```ts
await dns.availability({ name: "", tlds: ["com"] }); // []
await dns.availability({ name: "acme", tlds: [] }); // []
```

Both short-circuit in `ResellerClub.search` before `fetch`.

## A fake registrar for tests

`DNS` depends only on `RegistrarProvider`. You can stub `search` without hitting ResellerClub.

```ts
import { DNS } from "@citrusworx/dns";
import type {
  AvailabilityQuery,
  AvailabilityResult,
  RegisterDomainInput,
  RegistrarProvider
} from "@citrusworx/dns";

class MemoryRegistrar implements RegistrarProvider {
  readonly name = "resellerclub" as const;

  async search(query: AvailabilityQuery): Promise<AvailabilityResult[]> {
    return query.tlds.map((tld) => ({
      domain: `${query.name}.${tld}`,
      status: tld === "com" ? "taken" : "available"
    }));
  }

  register(_input: RegisterDomainInput): Promise<unknown> {
    throw new Error("not implemented");
  }
  renew(_input: unknown): Promise<unknown> {
    throw new Error("not implemented");
  }
  transfer(_input: unknown): Promise<unknown> {
    throw new Error("not implemented");
  }
  restore(_input: unknown): Promise<unknown> {
    throw new Error("not implemented");
  }
}

const dns = new DNS(new MemoryRegistrar());
const rows = await dns.availability({ name: "demo", tlds: ["com", "dev"] });
// demo.com taken, demo.dev available
```

`name` on the provider must be a `Registrar`: `'resellerclub' | 'godaddy' | 'namecheap' | 'cloudflare'`. The stub still reports `resellerclub` because that is the only value that matches a real adapter. The union is wider than the implementation.

## Methods that throw

```ts
const rc = new ResellerClub(123456, "your-api-key");

await rc.register({
  domain: "example.com",
  years: 1,
  nameservers: ["ns1.example.net"],
  contacts: { registrant: -1, admin: -1, tech: -1, billing: -1 },
  autoRenew: true
});
// Error: ResellerClub.register not implemented

await rc.renew({});     // Error: ResellerClub.renew not implemented
await rc.transfer({});  // Error: ResellerClub.transfer not implemented
await rc.restore({});   // Error: ResellerClub.restore not implemented
```

`ContactRef` is `number | -1`. `-1` is in the type as a sentinel; nothing in the adapter sends it.

## Hosting interface (unimplemented)

`DnsHostProvider` is exported so a future DigitalOcean/AWS/Cloudflare DNS-host adapter has a place to land:

```ts
import type { DnsHostProvider } from "@citrusworx/dns";

// No exported class implements this.
const host: DnsHostProvider = {
  name: "digitalocean",
  getNameservers: async () => {
    throw new Error("no host adapter");
  },
  setNameservers: async () => {
    throw new Error("no host adapter");
  },
  updateRecords: async () => {
    throw new Error("no host adapter");
  }
};
```

Do not ship application code against `DnsHostProvider` yet. Grapevine is the cloud path; this type is a reservation.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `[]` with no network | Empty `name` or empty `tlds` |
| `ResellerClub availability check failed (4xx/5xx)` | Bad credentials, ResellerClub outage, or rejected query |
| Every row `unknown` | Payload keys did not match `"${name}.${tld}"`, or vendor status was not `available` / `regthroughus` / `regthroughothers` |
| `register` throws | Expected. Only `search` is implemented. |

## Source of truth

- Façade: `libraries/dns/src/core/dns.ts`
- Availability types: `libraries/dns/src/core/availability.ts`
- ResellerClub: `libraries/dns/src/providers/resellerclub/resellerclub.ts`
