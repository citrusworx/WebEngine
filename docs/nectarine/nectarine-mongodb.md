# Nectarine + MongoDB

Early helpers around a module-level `MongoClient`. There is no aggregation DSL and no schema enforcement.

## Status

**Early / partial.** Inserts and `Mngz(callback)` work. `loadMongoConfig` is a stub. Collection helpers disconnect the shared client when they finish.

## Env

```bash
export MG_USER=root
export MG_HOST=localhost
export MG_PASS=secret
export MG_DB=myapp
export MG_PORT=27017
```

URI compiled in source:

```text
mongodb://$MG_USER:$MG_PASS@$MG_HOST:$MG_PORT/$MG_DB?authSource=admin
```

There is no `MONGO_URI` override. The client is constructed when `mgz.ts` is imported, so env must be set **before** import in practice.

## Callback style

```ts
import { Mngz } from "@citrusworx/nectarine";

await Mngz(async (client) => {
  const db = client.db(process.env.MG_DB);
  const users = await db.collection("users").find({}).toArray();
  console.log(users);
});
```

`Mngz` connects, runs the callback, and logs errors. It does **not** close the client afterward.

## Helpers that close the client

```ts
import { connectMngz, insertOne, insertMany, createCollection } from "@citrusworx/nectarine";

const client = await connectMngz();
await insertOne(client, "users", { email: "dev@citrusworx.com" });
```

`insertOne`, `insertMany`, and `createCollection` call `closeMngz`, which closes the **module** client. A subsequent `Mngz` will need to reconnect. That is fine for a script; it is a footgun in a server.

For a server, prefer `Mngz` / `connectMngz` and use `collection.insertOne` yourself without the helper.

## Field notes

`libraries/nectarine/models/user/db/mg/schema.yaml` lists `user.default` and `user.profile` fields. Nothing reads it at runtime.

## Practices

- Set `MG_*` before the process starts
- Do not use `insertOne` helper on a hot path
- There is no Nectarine transaction helper; use the driver’s session API if you need one
- Auth source is hardcoded to `admin` in the URI
