# DNS

`@citrusworx/dns` is the CitrusWorx domain and DNS abstraction layer.

## Current status

The package is implemented as an early provider framework, not yet a broad multi-vendor platform.

What exists today:

- a published package surface at `@citrusworx/dns`
- core DNS and registrar/provider interfaces
- shared availability result and TLD/provider types
- a concrete `ResellerClub` adapter exported from the package
- scaffolded provider directories for `namecheap` and `opensrs`

What is still early:

- non-ResellerClub providers are not part of the exported public surface yet
- there is not yet a large docs set under `/docs/dns`
- the package currently focuses on core abstractions and one working adapter

## Public API

```ts
import { DNS, ResellerClub } from "@citrusworx/dns";
```

The package also exports provider and availability types for workspace consumers.

## Source of truth

- Package: `libraries/dns/package.json`
- Exports: `libraries/dns/src/index.ts`
- Provider contracts: `libraries/dns/src/core/provider.ts`
- Working adapter: `libraries/dns/src/providers/resellerclub/resellerclub.ts`
