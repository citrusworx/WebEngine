import { type ApiOperation, type NectarineConfig } from "@citrusworx/nectarine";
import { type ExecuteArgs, type RequestContext, type ResponseData, type Route } from "@citrusworx/seltzer";
export type NectarineQueryFn = (sql: string, params?: readonly unknown[]) => Promise<unknown>;
export type ReadRouteExclude = ((operation: ApiOperation) => boolean) | ReadonlyArray<{
    resource: string;
    name: string;
}>;
export type CreateNectarineReadRoutesOptions<TContext extends RequestContext = RequestContext> = {
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
     * lookups `null` → 404). Defaults to “query function is present”.
     */
    connected?: boolean | (() => boolean);
    exclude?: ReadRouteExclude;
    /** Extra ops beyond GET reads (waitlist `joinWaitlist` POST). */
    include?: (operation: ApiOperation) => boolean;
    notFound?: (args: ExecuteArgs<TContext>) => ResponseData;
};
/**
 * Config + optional adapter surface used to fill compiled-execute defaults.
 * Matches the nectarine kernel handle fields hosts already have.
 */
export type NectarineRouteSource = {
    config: NectarineConfig;
    query?: NectarineQueryFn;
    connected?: boolean;
};
/** Unique lookups return one row (404 on miss). Collection reads return `[]`. */
export declare function isSingularRead(name: string): boolean;
export declare function pathBindValues(path: string, params: Record<string, string>): string[] | null;
/**
 * Flatten operations from one or more `*API.yml` documents (`listApiOperations`).
 *
 * Sibling keys in the same file (e.g. `order_item` inside `orderAPI.yml`)
 * resolve through the loaded parent resource. Callers filter to GET reads
 * unless they `include`.
 */
export declare function listResourceReadOperations(nectarine: NectarineConfig, resourceName: string): ApiOperation[];
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
 * Execute a GET using CCompiler + the resource `*Queries.yml` + `operation.query`.
 *
 * Connected adapter: bind path params in path order (`$1`, `$2`, …).
 * No database: collections return `[]`, unique lookups return `null` (404).
 * Seed fallback and JSONB catalog mapping stay in host execute callbacks.
 */
export declare function createCompiledNectarineExecute<TContext extends RequestContext = RequestContext>(options: CompiledNectarineExecuteOptions): (args: ExecuteArgs<TContext>) => Promise<Record<string, unknown> | Record<string, unknown>[] | null>;
/**
 * Map loaded `*API.yml` operations onto Seltzer `Route`s via `generateRoutes`.
 *
 * Hosts opt in after kernel bootstrap (HTTP listen stays in Seltzer — the
 * kernel does not register routes itself):
 *
 * ```ts
 * const nectarine = ctx.getModuleHandle<NectarineModuleHandle>("nectarine");
 * for (const route of nectarine.createReadRoutes({ resources: ["course"] })) {
 *   app.route(route);
 * }
 * ```
 *
 * Or call this helper with a `NectarineConfig` (no kernel required). Default
 * `execute` compiles `operation.query` from `*Queries.yml` and runs adapter
 * `query(sql, params)`. Pass `execute` to specialize (Blackwater product JSONB
 * / waitlist join). `include` can add a non-GET op such as waitlist
 * `joinWaitlist`; those typically need a custom `execute`.
 */
export declare function createNectarineReadRoutes<TContext extends RequestContext = RequestContext>(nectarine: NectarineConfig, options: CreateNectarineReadRoutesOptions<TContext>): Route<TContext>[];
/**
 * Same as {@link createNectarineReadRoutes}, filling `query` / `connected`
 * from a kernel handle when the caller omits them.
 */
export declare function createNectarineHandleReadRoutes<TContext extends RequestContext = RequestContext>(source: NectarineRouteSource, options: CreateNectarineReadRoutesOptions<TContext>): Route<TContext>[];
/** Thin wrapper for one resource. */
export declare function createResourceReadRoutes<TContext extends RequestContext = RequestContext>(nectarine: NectarineConfig, resourceName: string, execute: CreateNectarineReadRoutesOptions<TContext>["execute"], options?: Omit<CreateNectarineReadRoutesOptions<TContext>, "resources" | "execute">): Route<TContext>[];
