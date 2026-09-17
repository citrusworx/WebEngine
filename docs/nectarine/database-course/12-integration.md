# 12 — Put the database behind an application boundary

[Previous](./11-performance-json.md) · [Course](./README.md) · [Next](./13-future-design.md)

**Question:** who owns each step when a browser asks for an item? Allow 60–75 minutes.

## Keep the layers visible

```text
HTTP request
  -> Seltzer parses and matches a route
  -> host validates input and chooses a named operation
  -> Nectarine compiles its fixed definition
  -> executor binds values and runs it
  -> database returns rows or an error
  -> host chooses an HTTP response
  -> Seltzer sends it
```

Nectarine does not start an HTTP server. Seltzer does not decide the data model. The host joins them, owns authorization, and translates database outcomes into API semantics.

## Run the bridge

```sh
node docs/nectarine/database-course/lab/http-server.mjs
```

Request `http://127.0.0.1:3001/items`, `/items/10`, `/items/999`, and `/items/banana`. Expected statuses are 200, 200, 404, and 400. Use `curl -i`, or `curl.exe -i` on Windows, to inspect them.

[http-server.mjs](./lab/http-server.mjs) contains no SQL text assembly. It calls `runNamed`, which selects reviewed YAML and supplies parameters. The ID check rejects non-decimal input, unsafe JavaScript integers, and values beyond PostgreSQL's INTEGER range before querying.

The embedded database resets when this server restarts. This bridge is a working local learning application, not a durable lending service or a test of the network adapter.

## “No row” is not necessarily a driver error

The item-by-ID query returns a result with an empty `rows` array for an absent ID. The host chooses 404. A list query with no matches should normally return 200 and an empty array. The database does not know your HTTP contract.

Conversely, invalid SQL or a connection failure is not an ordinary not-found result. Mapping every caught exception to 404 hides outages and defects. Choose a deliberate error boundary and log diagnostics privately.

## Moving to the network adapter

For a real PostgreSQL server, Nectarine's config describes environment-variable **names**. `loadNectarineConfig` resolves their values; `createPgAdapterFromConfig` can build the adapter when the configuration is complete. Install the optional `pg` peer and use a connection pool across requests rather than connecting and disconnecting for every query.

The general host lifecycle is: load config, compile the named operations, connect once, accept requests, stop accepting requests, wait for active work, disconnect. Handle startup failures before reporting readiness. Do not print resolved credentials when troubleshooting missing configuration.

This deployment path is explained in [Nectarine's PostgreSQL guide](../nectarine-postgresql.md) and [configuration entrypoint](../../../libraries/nectarine/src/config/loadConfig.ts). The embedded lab deliberately does not claim to test authentication, TLS, pool contention, or server outages.

## Generated HTTP routes are another option

`listApiOperations` flattens Nectarine API descriptions. Seltzer's `generateRoutes` turns those descriptions into route objects using a host executor. The operation's named `query` key is distinct from the HTTP URL's query string.

This reduces repeated route wiring, but it does not eliminate parameter mapping, stronger validation, authorization, or result-shape decisions. Seltzer's default `.required` checks only presence. A schema declaration is not proof that every transport path validates the same rules.

For the complete generated-route explanation, continue with the [Seltzer course lesson](../../seltzer/http-course/09-generated-routes.md).

## Checkpoint

Name the owner of each decision: reject `banana` as an ID; prevent SQL structure injection; reject an orphan loan; choose 404 for no item; encode JSON; close a pool on shutdown. Which of these are verified by our embedded database tests, and which need separate application or network tests?

[Answers](./answers.md#lesson-12)
