# Nectarine + MongoDB

How the Mongo helpers actually work in `libraries/nectarine/src/adapters/mg/mgz.ts`. Early helpers around a module-level `MongoClient`. There is no aggregation DSL, no schema enforcement, and no `find` wrapper.

Related:

- [Schema Guide](./nectarine-schema-guide.md) — `db/mg/schema.yaml` is unread
- [Anti-patterns](./nectarine-anti-patterns.md) — helpers that close the shared client
- [Status](./nectarine-status.md)

## Status

**Early / partial.** Inserts and `Mngz(callback)` work. `loadMongoConfig` is a stub. Collection helpers disconnect the shared client when they finish.

The public names are `Mngz` / `mngzClient`, not `mgz`.

## Env

```bash
export MG_USER=root
export MG_HOST=localhost
export MG_PASS=secret
export MG_DB=myapp
export MG_PORT=27017
```

URI compiled in source at **module load**:

```text
mongodb://$MG_USER:$MG_PASS@$MG_HOST:$MG_PORT/$MG_DB?authSource=admin
```

There is no `MONGO_URI` override. Auth source is hardcoded to `admin`. The client is constructed when `mgz.ts` is imported, so env must be set **before** import in practice.

Install `mongodb` in the app:

```bash
yarn add mongodb
```

## Callback style (better for a server)

```ts
import { Mngz } from "@citrusworx/nectarine";

await Mngz(async (client) => {
  const db = client.db(process.env.MG_DB);
  const users = await db.collection("users").find({}).toArray();
  console.log(users);
});
```

`Mngz` connects, runs the callback, and logs errors. It does **not** rethrow. It does **not** close the client afterward. Use the driver’s collection API for `find` / `update` / `delete` — Nectarine does not wrap those.

## Helpers that close the client

```ts
import { connectMngz, insertOne, insertMany, createCollection } from "@citrusworx/nectarine";

const client = await connectMngz();
await insertOne(client, "users", { email: "dev@citrusworx.com" });
```

`insertOne`, `insertMany`, and `createCollection` call `closeMngz`, which closes the **module** client (`mngzClient`), not necessarily the argument you passed. A subsequent operation needs to reconnect. That is fine for a script; it is a footgun in a server.

| Export | Role |
|---|---|
| `mngzClient` | `new MongoClient(uri)` at import time |
| `connectMngz()` | `connect()`, logs, returns client |
| `closeMngz(client)` | closes **`mngzClient`** |
| `Mngz(callback)` | connect, `callback(client)`, log errors, no close |
| `createCollection(client, name)` | `createCollection` on `MG_DB`, then `closeMngz` |
| `insertOne` / `insertMany` | write, log, `closeMngz` |

`createCollection`’s second argument is the **collection name**, despite the parameter being called `dbName`.

## Field notes

`libraries/nectarine/models/user/db/mg/schema.yaml` lists `user.default` and `user.profile` fields. Nothing reads it at runtime.

`loadMongoConfig()` calls `parser.yaml('sql.yml')` with a hardcoded relative path and returns nothing. Treat as unfinished.

There is no handling of `{ fn: now }` for Mongo documents.

## Practices

- Set `MG_*` before the process starts
- Do not use `insertOne` / `insertMany` / `createCollection` on a hot path
- For a server, prefer `Mngz` or a single `connectMngz` and the driver’s collection methods
- There is no Nectarine transaction helper; use the driver’s session API if you need one
- `Mngz` logs errors — check results yourself, do not assume throw
