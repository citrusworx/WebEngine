# `cleanPayload(obj)`

A recursive utility that strips empty, null, and undefined values from a payload before Grapevine sends it to the DigitalOcean API (`libraries/grapevine/src/providers/digitalocean/utilities.ts`).

---

## Signature

```typescript
function cleanPayload(obj: Record<string, any>): Record<string, any>
```

---

## Behavior

`cleanPayload` recursively walks an object and removes:

| Value | Example | Removed? |
|---|---|---|
| `null` | `vpc_uuid: null` | ✅ |
| `undefined` | `user_data: undefined` | ✅ |
| Empty string | `user_data: ""` | ✅ |
| Empty array | `ssh_keys: []` | ✅ |
| Empty object | `backup_policy: {}` | ✅ |
| Nested empty values | `backup_policy: { name: "" }` | ✅ (becomes `{}`, then removed) |

Valid values — including `false`, `0`, and populated arrays — are preserved.

---

## Usage

```typescript
import { cleanPayload } from "@citrusworx/grapevine";

const raw = {
  name: "my-droplet",
  region: "nyc3",
  user_data: "",
  vpc_uuid: "",
  ssh_keys: [],
  backup_policy: {
    name: ""
  },
  monitoring: true,
  ipv6: false
};

const clean = cleanPayload(raw);

// Result:
// {
//   name: "my-droplet",
//   region: "nyc3",
//   monitoring: true,
//   ipv6: false
// }
```

---

## Notes

- `false` and `0` are intentionally **not** stripped — these are valid configuration values
- This function is used internally by `deployByBlueprint` before the droplet POST
- It is also exported for callers who build their own payloads
- `applyGrapeConfig` builds `create*` arguments itself; it does not run `cleanPayload` on the whole grape document
- There is no second cloud provider to “integrate” yet — see [Status](../grapevine-status.md)