import { type ApiOperation, type NectarineConfig } from "@citrusworx/nectarine";
import { type ExecuteArgs, type RequestContext, type ResponseData, type Route } from "@citrusworx/seltzer";
export type NectarineQueryFn = (sql: string, params?: readonly unknown[]) => Promise<unknown>;
export type RouteExclude = ((operation: ApiOperation) => boolean) | ReadonlyArray<{
    resource: string;
    name: string;
}>;
export type ReadRouteExclude = RouteExclude;
export declare const NECTARINE_READ_METHODS: readonly ["GET"];
export declare const NECTARINE_WRITE_METHODS: readonly ["POST", "PUT", "PATCH", "DELETE"];
export type CreateNectarineRoutesOptions<TContext extends RequestContext = RequestContext> = {
    resources: readonly string[];
    /**
     * Host data access. When omitted, compiles `operation.query` from
     * `*Queries.yml` and runs {@link query} (adapter `query`).
     */
    execute?: (args: ExecuteArgs<TContext>) => unknown | Promise<unknown>;
    /** Adapter `query(sql, params)`. Used by the default compiled execute. */
    query?: NectarineQueryFn;
    /**
     * When false, compiled reads skip the adapter (collections `[]`, unique
     * lookups `null` → 404). Writes without a database also return `null`
     * (404). Defaults to “query function is present”.
     */
    connected?: boolean | (() => boolean);
    exclude?: RouteExclude;
    /**
     * Extra ops beyond `methods`. Prefer {@link createNectarineRoutes} with
     * a host `execute` for specialized resources (waitlist join).
     */
    include?: (operation: ApiOperation) => boolean;
    /**
     * HTTP methods to generate. Omit for every op on `resources`.
     * {@link createNectarineReadRoutes} defaults to GET;
     * {@link createNectarineWriteRoutes} defaults to POST/PUT/PATCH/DELETE.
     */
    methods?: readonly ApiOperation["method"][];
    notFound?: (args: ExecuteArgs<TContext>) => ResponseData;
};
export type CreateNectarineReadRoutesOptions<TContext extends RequestContext = RequestContext> = CreateNectarineRoutesOptions<TContext>;
export type CreateNectarineWriteRoutesOptions<TContext extends RequestContext = RequestContext> = CreateNectarineRoutesOptions<TContext>;
/**
 * Config + optional adapter surface used to fill compiled-execute defaults.
 * Matches the nectarine kernel handle fields hosts already have.
 */
export type NectarineRouteSource = {
    config: NectarineConfig;
    query?: NectarineQueryFn;
    connected?: boolean;
    /** When set, compiled execute calls `adapter.query` as a method (`this` stays the adapter). */
    adapter?: {
        query?: NectarineQueryFn;
    } | null;
};
export declare function isWriteOperation(operation: ApiOperation): boolean;
/** Unique lookups return one row (404 on miss). Collection reads return `[]`. */
export declare function isSingularRead(name: string): boolean;
export declare function pathBindValues(path: string, params: Record<string, string>): string[] | null;
export declare function namedQuerySpec(queries: Record<string, unknown>, resource: string, method: string, name: string): Record<string, unknown> | undefined;
/**
 * Serialize a JSONB document bind (`$N::jsonb` / `{ value: $N, cast: jsonb }`).
 * Objects and arrays become JSON text; strings pass through.
 */
export declare function bindJsonbDocument(value: unknown): string;
/**
 * Bind values for create/update/delete: YAML field order, then path params
 * for update WHERE (compiler remaps `$1` after SET unless `values:` is
 * explicit). Column names match request body or path params
 * (`order_id` / `orderId`). `{ fn: now }` / `{ const }` are not binds.
 * A jsonb-cast column missing from the body uses the whole JSON body
 * (document-store create/update). Missing scalars stay `null` — hosts
 * that generate ids (waitlist join) still pass `execute`.
 */
export declare function writeBindValues(operation: ApiOperation, params: Record<string, string>, body: unknown, querySpec?: Record<string, unknown>): unknown[] | null;
/**
 * Flatten operations from one or more `*API.yml` documents (`listApiOperations`).
 *
 * Sibling keys in the same file (e.g. `order_item` inside `orderAPI.yml`)
 * resolve through the loaded parent resource. Callers filter to GET reads
 * unless they `include` or use {@link createNectarineWriteRoutes}.
 */
export declare function listResourceOperations(nectarine: NectarineConfig, resourceName: string): ApiOperation[];
/** Flatten `*API.yml` for one resource (same as {@link listResourceOperations}). */
export declare function listResourceReadOperations(nectarine: NectarineConfig, resourceName: string): ApiOperation[];
export declare function listResourceWriteOperations(nectarine: NectarineConfig, resourceName: string): ApiOperation[];
export declare function resolveResourceQueries(nectarine: NectarineConfig, resourceName: string): Record<string, unknown>;
/**
 * Compile a named query from a `*Queries.yml` file path or an already-loaded
 * document (`NectarineConfig.getResource(...).queries`).
 *
 * YAML tokens → CCompiler → SQL. Hosts must not embed SQL in TypeScript.
 */
export declare function compileResourceQuery(source: string | Record<string, unknown>, resource: string, method: string, name: string): string;
export type CompiledNectarineExecuteOptions = {
    config: NectarineConfig;
    query?: NectarineQueryFn;
    connected?: boolean | (() => boolean);
};
/**
 * Execute via CCompiler + the resource `*Queries.yml` + `operation.query`.
 *
 * Reads: bind path params in path order. No database → collections `[]`,
 * unique lookups `null` (404).
 *
 * Writes: bind YAML columns from body / path (`order_id` ↔ `orderId`).
 * Explicit `values:` skip `{ fn: now }` / `{ const }`. A jsonb-cast column
 * missing from the body binds the whole JSON body (document store).
 * No database or zero affected rows → `null` (404). Host `execute` stays
 * for merge-on-PUT, generated ids, allowlists, and file-store fallbacks.
 */
export declare function createCompiledNectarineExecute<TContext extends RequestContext = RequestContext>(options: CompiledNectarineExecuteOptions): (args: ExecuteArgs<TContext>) => Promise<Record<string, unknown> | Record<string, unknown>[] | null>;
/**
 * Map loaded `*API.yml` operations onto Seltzer `Route`s via `generateRoutes`.
 *
 * `methods` filters HTTP verbs. Omit it to take every op on `resources`
 * (reads + writes). Hosts opt in after kernel bootstrap (HTTP listen stays
 * in Seltzer — the kernel does not register routes itself):
 *
 * ```ts
 * const nectarine = ctx.getModuleHandle<NectarineModuleHandle>("nectarine");
 * for (const route of nectarine.createWriteRoutes({ resources: ["course"] })) {
 *   app.route(route);
 * }
 * ```
 *
 * Default `execute` compiles `operation.query` from `*Queries.yml` and runs
 * adapter `query(sql, params)`. Pass `execute` to specialize (waitlist join
 * generated id / allowlist, or a host that merges JSONB on PUT). JSONB
 * document inserts/replaces described in YAML do not need a host adapter.
 */
export declare function createNectarineRoutes<TContext extends RequestContext = RequestContext>(nectarine: NectarineConfig, options: CreateNectarineRoutesOptions<TContext>): Route<TContext>[];
/**
 * GET reads from `*API.yml`. `include` can add a non-GET op (e.g. a host
 * that only wants GET + one extra write). Specialized resources such as
 * Blackwater waitlist `joinWaitlist` prefer {@link createNectarineRoutes}
 * with a host `execute` instead.
 */
export declare function createNectarineReadRoutes<TContext extends RequestContext = RequestContext>(nectarine: NectarineConfig, options: CreateNectarineReadRoutesOptions<TContext>): Route<TContext>[];
/**
 * POST/PUT/PATCH/DELETE as defined in YAML. Default execute is compiled
 * named queries. YAML jsonb-cast + `{ fn: now }` writes bind here.
 * Exclude join specials (generated id), or pass `execute`.
 */
export declare function createNectarineWriteRoutes<TContext extends RequestContext = RequestContext>(nectarine: NectarineConfig, options: CreateNectarineWriteRoutesOptions<TContext>): Route<TContext>[];
/**
 * Same as {@link createNectarineRoutes}, filling `query` / `connected`
 * from a kernel handle when the caller omits them.
 */
export declare function createNectarineHandleRoutes<TContext extends RequestContext = RequestContext>(source: NectarineRouteSource, options: CreateNectarineRoutesOptions<TContext>): Route<TContext>[];
export declare function createNectarineHandleReadRoutes<TContext extends RequestContext = RequestContext>(source: NectarineRouteSource, options: CreateNectarineReadRoutesOptions<TContext>): Route<TContext>[];
export declare function createNectarineHandleWriteRoutes<TContext extends RequestContext = RequestContext>(source: NectarineRouteSource, options: CreateNectarineWriteRoutesOptions<TContext>): Route<TContext>[];
/** Thin wrapper for one resource (GET by default). */
export declare function createResourceReadRoutes<TContext extends RequestContext = RequestContext>(nectarine: NectarineConfig, resourceName: string, execute: CreateNectarineReadRoutesOptions<TContext>["execute"], options?: Omit<CreateNectarineReadRoutesOptions<TContext>, "resources" | "execute">): Route<TContext>[];
/** Thin wrapper for one resource (POST/PUT/PATCH/DELETE by default). */
export declare function createResourceWriteRoutes<TContext extends RequestContext = RequestContext>(nectarine: NectarineConfig, resourceName: string, execute: CreateNectarineWriteRoutesOptions<TContext>["execute"], options?: Omit<CreateNectarineWriteRoutesOptions<TContext>, "resources" | "execute">): Route<TContext>[];
