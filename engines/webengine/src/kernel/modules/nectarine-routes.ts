import {
    CCompiler,
    listApiOperations,
    type ApiOperation,
    type NectarineConfig,
} from "@citrusworx/nectarine";
import {
    generateRoutes,
    type ExecuteArgs,
    type RequestContext,
    type ResponseData,
    type Route,
} from "@citrusworx/seltzer";

export type NectarineQueryFn = (
    sql: string,
    params?: readonly unknown[],
) => Promise<unknown>;

export type RouteExclude =
    | ((operation: ApiOperation) => boolean)
    | ReadonlyArray<{ resource: string; name: string }>;

export type ReadRouteExclude = RouteExclude;

export const NECTARINE_READ_METHODS = ["GET"] as const;
export const NECTARINE_WRITE_METHODS = [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
] as const;

export type CreateNectarineRoutesOptions<
    TContext extends RequestContext = RequestContext,
> = {
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

export type CreateNectarineReadRoutesOptions<
    TContext extends RequestContext = RequestContext,
> = CreateNectarineRoutesOptions<TContext>;

export type CreateNectarineWriteRoutesOptions<
    TContext extends RequestContext = RequestContext,
> = CreateNectarineRoutesOptions<TContext>;

/**
 * Config + optional adapter surface used to fill compiled-execute defaults.
 * Matches the nectarine kernel handle fields hosts already have.
 */
export type NectarineRouteSource = {
    config: NectarineConfig;
    query?: NectarineQueryFn;
    connected?: boolean;
    /** When set, compiled execute calls `adapter.query` as a method (`this` stays the adapter). */
    adapter?: { query?: NectarineQueryFn } | null;
};

const PATH_PARAM = /:([A-Za-z_][A-Za-z0-9_]*)/g;
const PLACEHOLDER_VALUE = /^\$\d+(::[A-Za-z_][A-Za-z0-9_]*)?$/;

const compiler = new CCompiler();
const pathCompileCache = new Map<string, string>();
const documentCompileCache = new WeakMap<object, Map<string, string>>();

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQueryDocument(value: unknown): value is Record<string, unknown> {
    return isRecord(value);
}

function matchesExclude(
    operation: ApiOperation,
    exclude?: RouteExclude,
): boolean {
    if (!exclude) {
        return false;
    }
    if (typeof exclude === "function") {
        return exclude(operation);
    }
    return exclude.some(
        (entry) =>
            entry.resource === operation.resource &&
            entry.name === operation.name,
    );
}

export function isWriteOperation(operation: ApiOperation): boolean {
    return (NECTARINE_WRITE_METHODS as readonly string[]).includes(
        operation.method,
    );
}

function adapterConnected(
    connected: boolean | (() => boolean) | undefined,
    query: NectarineQueryFn | undefined,
): boolean {
    if (typeof connected === "function") {
        return connected();
    }
    if (typeof connected === "boolean") {
        return connected;
    }
    return typeof query === "function";
}

function rowsFromQueryResult(result: unknown): Record<string, unknown>[] {
    if (Array.isArray(result)) {
        return result.filter(isRecord);
    }
    if (isRecord(result) && Array.isArray(result.rows)) {
        return result.rows.filter(isRecord);
    }
    return [];
}

function rowCountFromQueryResult(result: unknown): number | undefined {
    if (isRecord(result) && typeof result.rowCount === "number") {
        return result.rowCount;
    }
    return undefined;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        out[key] = value instanceof Date ? value.toISOString() : value;
    }
    return out;
}

/** Unique lookups return one row (404 on miss). Collection reads return `[]`. */
export function isSingularRead(name: string): boolean {
    return /((^by|By)(Id|Slug|Email))$/.test(name);
}

export function pathBindValues(
    path: string,
    params: Record<string, string>,
): string[] | null {
    const names = [...path.matchAll(PATH_PARAM)].map((match) => match[1]);
    const values: string[] = [];

    for (const name of names) {
        const value = params[name]?.trim();
        if (!value) {
            return null;
        }
        values.push(value);
    }

    return values;
}

function toCamel(value: string): string {
    return value.replace(/_([a-z])/g, (_, letter: string) =>
        letter.toUpperCase(),
    );
}

function toSnake(value: string): string {
    return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function columnKeys(column: string): string[] {
    const keys = [column, toCamel(column), toSnake(column)];
    return [...new Set(keys)];
}

function lookupBind(
    column: string,
    params: Record<string, string>,
    body: Record<string, unknown> | undefined,
): unknown {
    for (const key of columnKeys(column)) {
        const raw = params[key];
        if (typeof raw === "string" && raw.trim()) {
            return raw.trim();
        }
    }
    if (body) {
        for (const key of columnKeys(column)) {
            if (
                Object.prototype.hasOwnProperty.call(body, key) &&
                body[key] !== undefined
            ) {
                return body[key];
            }
        }
    }
    return null;
}

function stringList(value: unknown): string[] | undefined {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed || trimmed === "*") {
            return undefined;
        }
        const parts = trimmed
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
        return parts.length > 0 ? parts : undefined;
    }
    if (!Array.isArray(value) || value.length === 0) {
        return undefined;
    }
    const parts = value.filter(
        (item): item is string => typeof item === "string" && item !== "*",
    );
    return parts.length > 0 ? parts : undefined;
}

function isPlaceholderValue(value: unknown): boolean {
    if (typeof value === "string") {
        return PLACEHOLDER_VALUE.test(value.trim());
    }
    if (!isRecord(value)) {
        return false;
    }
    if (typeof value.placeholder === "string") {
        return true;
    }
    if (typeof value.value === "string") {
        return PLACEHOLDER_VALUE.test(value.value.trim());
    }
    return false;
}

function methodAliases(method: string): string[] {
    if (method === "read" || method === "get") {
        return method === "read" ? ["read", "get"] : ["get", "read"];
    }
    return [method];
}

export function namedQuerySpec(
    queries: Record<string, unknown>,
    resource: string,
    method: string,
    name: string,
): Record<string, unknown> | undefined {
    const resourceBlock = queries[resource];
    if (!isRecord(resourceBlock)) {
        return undefined;
    }
    for (const alias of methodAliases(method)) {
        const block = resourceBlock[alias];
        if (isRecord(block) && isRecord(block[name])) {
            return block[name];
        }
    }
    return undefined;
}

function insertColumns(spec: Record<string, unknown>): string[] | undefined {
    const nested = isRecord(spec.insert) ? spec.insert : undefined;
    return (
        stringList(spec.fields) ??
        stringList(spec.columns) ??
        (nested ? stringList(nested.columns) : undefined)
    );
}

function insertValues(spec: Record<string, unknown>): unknown[] | undefined {
    if (Array.isArray(spec.values)) {
        return spec.values;
    }
    const nested = isRecord(spec.insert) ? spec.insert : undefined;
    return nested && Array.isArray(nested.values) ? nested.values : undefined;
}

function updateSetColumns(spec: Record<string, unknown>): string[] | undefined {
    return stringList(spec.set) ?? stringList(spec.fields);
}

function updateValues(spec: Record<string, unknown>): unknown[] | undefined {
    return Array.isArray(spec.values) ? spec.values : undefined;
}

function isFunctionOrConstValue(value: unknown): boolean {
    if (typeof value === "string" && /^now\(\)$/i.test(value.trim())) {
        return true;
    }
    return isRecord(value) && (typeof value.fn === "string" || "const" in value);
}

function isJsonbCast(value: unknown): boolean {
    if (typeof value === "string") {
        return /::(?:jsonb|json)$/i.test(value.trim());
    }
    if (!isRecord(value) || typeof value.cast !== "string") {
        return false;
    }
    return /^(jsonb|json)$/i.test(value.cast.trim());
}

/**
 * Serialize a JSONB document bind (`$N::jsonb` / `{ value: $N, cast: jsonb }`).
 * Objects and arrays become JSON text; strings pass through.
 */
export function bindJsonbDocument(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }
    if (value === null || typeof value !== "object") {
        throw new Error("JSONB bind value must be a JSON object or array");
    }
    try {
        return JSON.stringify(value);
    } catch {
        throw new Error("JSONB bind value is not JSON-serializable");
    }
}

function lookupWriteBind(
    column: string,
    params: Record<string, string>,
    body: Record<string, unknown> | undefined,
    valueSpec?: unknown,
): unknown {
    const found = lookupBind(column, params, body);
    if (isJsonbCast(valueSpec)) {
        if (found !== null && found !== undefined) {
            return bindJsonbDocument(found);
        }
        if (isRecord(body)) {
            return bindJsonbDocument(body);
        }
        return null;
    }
    return found;
}

function bindColumnsFromValues(
    columns: readonly string[],
    values: readonly unknown[],
    params: Record<string, string>,
    body: Record<string, unknown> | undefined,
): unknown[] {
    const binds: unknown[] = [];
    for (let index = 0; index < columns.length; index += 1) {
        const value = values[index];
        if (isFunctionOrConstValue(value)) {
            continue;
        }
        if (isPlaceholderValue(value)) {
            binds.push(lookupWriteBind(columns[index], params, body, value));
        }
    }
    return binds;
}

/**
 * Bind values for create/update/delete: YAML field order, then path params
 * for update WHERE (compiler remaps `$1` after SET unless `values:` is
 * explicit). Column names match request body or path params
 * (`order_id` / `orderId`). `{ fn: now }` / `{ const }` are not binds.
 * A jsonb-cast column missing from the body uses the whole JSON body
 * (document-store create/update). Missing scalars stay `null` — hosts
 * that generate ids (waitlist join) still pass `execute`.
 */
export function writeBindValues(
    operation: ApiOperation,
    params: Record<string, string>,
    body: unknown,
    querySpec?: Record<string, unknown>,
): unknown[] | null {
    if (operation.method === "DELETE" || operation.crud === "delete") {
        return pathBindValues(operation.path, params);
    }

    const bodyRecord = isRecord(body) ? body : undefined;
    const isUpdate =
        operation.method === "PUT" ||
        operation.method === "PATCH" ||
        operation.crud === "update";

    if (isUpdate) {
        const pathBinds = pathBindValues(operation.path, params);
        if (pathBinds === null) {
            return null;
        }
        const setCols = querySpec ? updateSetColumns(querySpec) : undefined;
        const values = querySpec ? updateValues(querySpec) : undefined;
        if (setCols?.length) {
            if (Array.isArray(values) && values.length === setCols.length) {
                return [
                    ...bindColumnsFromValues(
                        setCols,
                        values,
                        {},
                        bodyRecord,
                    ),
                    ...pathBinds,
                ];
            }
            return [
                ...setCols.map((column) =>
                    lookupBind(column, {}, bodyRecord),
                ),
                ...pathBinds,
            ];
        }
        const fromBody = operation.body
            ? Object.keys(operation.body).map(
                  (key) => lookupBind(key, {}, bodyRecord),
              )
            : [];
        return [...fromBody, ...pathBinds];
    }

    const columns = querySpec ? insertColumns(querySpec) : undefined;
    const values = querySpec ? insertValues(querySpec) : undefined;
    if (columns?.length) {
        if (Array.isArray(values) && values.length === columns.length) {
            return bindColumnsFromValues(
                columns,
                values,
                params,
                bodyRecord,
            );
        }
        return columns.map((column) =>
            lookupBind(column, params, bodyRecord),
        );
    }

    const fromBody = operation.body
        ? Object.keys(operation.body).map((key) =>
              lookupBind(key, params, bodyRecord),
          )
        : [];
    const pathBinds = pathBindValues(operation.path, params);
    if (pathBinds === null) {
        return null;
    }
    return [...fromBody, ...pathBinds];
}

function compilerMethod(operation: ApiOperation): string {
    if (operation.crud) {
        return operation.crud;
    }
    switch (operation.method) {
        case "POST":
            return "create";
        case "PUT":
        case "PATCH":
            return "update";
        case "DELETE":
            return "delete";
        default:
            return "read";
    }
}

function mutationResult(result: unknown): Record<string, unknown> | Record<string, unknown>[] | null {
    const rows = rowsFromQueryResult(result).map((row) => normalizeRow(row));
    if (rows.length === 1) {
        const row = rows[0];
        const keys = Object.keys(row);
        const only = keys.length === 1 ? row[keys[0]] : undefined;
        if (isRecord(only)) {
            return normalizeRow(only);
        }
        return row;
    }
    if (rows.length > 1) {
        return rows;
    }
    const rowCount = rowCountFromQueryResult(result);
    if (typeof rowCount === "number" && rowCount > 0) {
        return { ok: true, rowCount };
    }
    return null;
}

/**
 * Flatten operations from one or more `*API.yml` documents (`listApiOperations`).
 *
 * Sibling keys in the same file (e.g. `order_item` inside `orderAPI.yml`)
 * resolve through the loaded parent resource. Callers filter to GET reads
 * unless they `include` or use {@link createNectarineWriteRoutes}.
 */
export function listResourceOperations(
    nectarine: NectarineConfig,
    resourceName: string,
): ApiOperation[] {
    if (nectarine.resources.has(resourceName)) {
        return listApiOperations(
            resourceName,
            nectarine.getResource(resourceName).api,
        );
    }

    for (const loaded of nectarine.resources.values()) {
        const operations = listApiOperations(resourceName, loaded.api);
        if (operations.length > 0) {
            return operations;
        }
    }

    return [];
}

/** Flatten `*API.yml` for one resource (same as {@link listResourceOperations}). */
export function listResourceReadOperations(
    nectarine: NectarineConfig,
    resourceName: string,
): ApiOperation[] {
    return listResourceOperations(nectarine, resourceName);
}

export function listResourceWriteOperations(
    nectarine: NectarineConfig,
    resourceName: string,
): ApiOperation[] {
    return listResourceOperations(nectarine, resourceName).filter(
        isWriteOperation,
    );
}

export function resolveResourceQueries(
    nectarine: NectarineConfig,
    resourceName: string,
): Record<string, unknown> {
    if (nectarine.resources.has(resourceName)) {
        return nectarine.getResource(resourceName).queries;
    }

    for (const loaded of nectarine.resources.values()) {
        if (isRecord(loaded.queries) && resourceName in loaded.queries) {
            return loaded.queries;
        }
    }

    throw new Error(
        `Nectarine Queries.yml not loaded for resource "${resourceName}"`,
    );
}

/**
 * Compile a named query from a `*Queries.yml` file path or an already-loaded
 * document (`NectarineConfig.getResource(...).queries`).
 *
 * YAML tokens → CCompiler → SQL. Hosts must not embed SQL in TypeScript.
 */
export function compileResourceQuery(
    source: string | Record<string, unknown>,
    resource: string,
    method: string,
    name: string,
): string {
    const coordKey = `${resource}::${method}::${name}`;

    if (typeof source === "string") {
        const cacheKey = `${source}::${coordKey}`;
        const cached = pathCompileCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const parsed = compiler.parse_config(source);
        if (!isQueryDocument(parsed)) {
            throw new Error(
                `Nectarine queries for "${resource}" must be an object`,
            );
        }
        const sql = compiler.buildQuery(
            compiler.clean_parse(parsed, resource, method),
            name,
        );
        pathCompileCache.set(cacheKey, sql);
        return sql;
    }

    if (!isQueryDocument(source)) {
        throw new Error(`Nectarine queries for "${resource}" must be an object`);
    }

    let docCache = documentCompileCache.get(source);
    if (!docCache) {
        docCache = new Map();
        documentCompileCache.set(source, docCache);
    }
    const cached = docCache.get(coordKey);
    if (cached) {
        return cached;
    }

    const sql = compiler.buildQuery(
        compiler.clean_parse(source, resource, method),
        name,
    );
    docCache.set(coordKey, sql);
    return sql;
}

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
export function createCompiledNectarineExecute<
    TContext extends RequestContext = RequestContext,
>(
    options: CompiledNectarineExecuteOptions,
): (
    args: ExecuteArgs<TContext>,
) => Promise<
    Record<string, unknown> | Record<string, unknown>[] | null
> {
    return async ({ resource, query, params, body, operation }) => {
        const write = isWriteOperation(operation);

        if (!query) {
            return write || isSingularRead(operation.name) ? null : [];
        }

        if (!adapterConnected(options.connected, options.query)) {
            return write || isSingularRead(operation.name) ? null : [];
        }

        if (typeof options.query !== "function") {
            return write || isSingularRead(operation.name) ? null : [];
        }

        const method = compilerMethod(operation);
        let binds: unknown[] | null;
        if (write) {
            const spec = namedQuerySpec(
                resolveResourceQueries(options.config, resource),
                resource,
                method,
                query,
            );
            binds = writeBindValues(operation, params, body, spec);
        } else {
            binds = pathBindValues(operation.path, params);
        }

        if (binds === null) {
            return write || isSingularRead(operation.name) ? null : [];
        }

        const sql = compileResourceQuery(
            resolveResourceQueries(options.config, resource),
            resource,
            method,
            query,
        );
        const result = await options.query(sql, binds);

        if (write) {
            return mutationResult(result);
        }

        const rows = rowsFromQueryResult(result).map((row) =>
            normalizeRow(row),
        );

        if (isSingularRead(operation.name)) {
            return rows[0] ?? null;
        }

        return rows;
    };
}

function queryFromSource(
    source: NectarineRouteSource,
    override?: NectarineQueryFn,
): NectarineQueryFn | undefined {
    if (override) {
        return override;
    }
    const adapter = source.adapter;
    if (adapter && typeof adapter.query === "function") {
        return (sql, params) => adapter.query!(sql, params);
    }
    return source.query;
}

function withSourceDefaults<TContext extends RequestContext>(
    source: NectarineRouteSource,
    options: CreateNectarineRoutesOptions<TContext>,
): CreateNectarineRoutesOptions<TContext> {
    return {
        ...options,
        query: queryFromSource(source, options.query),
        connected:
            options.connected ??
            (source.connected !== undefined
                ? () => source.connected === true
                : undefined),
    };
}

function selectOperations(
    nectarine: NectarineConfig,
    resources: readonly string[],
): ApiOperation[] {
    return resources.flatMap((resourceName) =>
        listResourceOperations(nectarine, resourceName),
    );
}

function operationAllowed(
    operation: ApiOperation,
    options: Pick<
        CreateNectarineRoutesOptions,
        "exclude" | "include" | "methods"
    >,
): boolean {
    if (matchesExclude(operation, options.exclude)) {
        return false;
    }
    if (options.include?.(operation)) {
        return true;
    }
    if (!options.methods || options.methods.length === 0) {
        return true;
    }
    return options.methods.includes(operation.method);
}

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
export function createNectarineRoutes<
    TContext extends RequestContext = RequestContext,
>(
    nectarine: NectarineConfig,
    options: CreateNectarineRoutesOptions<TContext>,
): Route<TContext>[] {
    const operations = selectOperations(nectarine, options.resources);
    const execute =
        options.execute ??
        createCompiledNectarineExecute<TContext>({
            config: nectarine,
            query: options.query,
            connected: options.connected,
        });

    return generateRoutes(operations, {
        execute,
        notFound: options.notFound,
        filter: (operation) => operationAllowed(operation, options),
    });
}

/**
 * GET reads from `*API.yml`. `include` can add a non-GET op (e.g. a host
 * that only wants GET + one extra write). Specialized resources such as
 * Blackwater waitlist `joinWaitlist` prefer {@link createNectarineRoutes}
 * with a host `execute` instead.
 */
export function createNectarineReadRoutes<
    TContext extends RequestContext = RequestContext,
>(
    nectarine: NectarineConfig,
    options: CreateNectarineReadRoutesOptions<TContext>,
): Route<TContext>[] {
    return createNectarineRoutes(nectarine, {
        ...options,
        methods: options.methods ?? NECTARINE_READ_METHODS,
    });
}

/**
 * POST/PUT/PATCH/DELETE as defined in YAML. Default execute is compiled
 * named queries. YAML jsonb-cast + `{ fn: now }` writes bind here.
 * Exclude join specials (generated id), or pass `execute`.
 */
export function createNectarineWriteRoutes<
    TContext extends RequestContext = RequestContext,
>(
    nectarine: NectarineConfig,
    options: CreateNectarineWriteRoutesOptions<TContext>,
): Route<TContext>[] {
    return createNectarineRoutes(nectarine, {
        ...options,
        methods: options.methods ?? NECTARINE_WRITE_METHODS,
    });
}

/**
 * Same as {@link createNectarineRoutes}, filling `query` / `connected`
 * from a kernel handle when the caller omits them.
 */
export function createNectarineHandleRoutes<
    TContext extends RequestContext = RequestContext,
>(
    source: NectarineRouteSource,
    options: CreateNectarineRoutesOptions<TContext>,
): Route<TContext>[] {
    return createNectarineRoutes(source.config, withSourceDefaults(source, options));
}

export function createNectarineHandleReadRoutes<
    TContext extends RequestContext = RequestContext,
>(
    source: NectarineRouteSource,
    options: CreateNectarineReadRoutesOptions<TContext>,
): Route<TContext>[] {
    return createNectarineReadRoutes(
        source.config,
        withSourceDefaults(source, options),
    );
}

export function createNectarineHandleWriteRoutes<
    TContext extends RequestContext = RequestContext,
>(
    source: NectarineRouteSource,
    options: CreateNectarineWriteRoutesOptions<TContext>,
): Route<TContext>[] {
    return createNectarineWriteRoutes(
        source.config,
        withSourceDefaults(source, options),
    );
}

/** Thin wrapper for one resource (GET by default). */
export function createResourceReadRoutes<
    TContext extends RequestContext = RequestContext,
>(
    nectarine: NectarineConfig,
    resourceName: string,
    execute: CreateNectarineReadRoutesOptions<TContext>["execute"],
    options: Omit<
        CreateNectarineReadRoutesOptions<TContext>,
        "resources" | "execute"
    > = {},
): Route<TContext>[] {
    return createNectarineReadRoutes(nectarine, {
        ...options,
        resources: [resourceName],
        execute,
    });
}

/** Thin wrapper for one resource (POST/PUT/PATCH/DELETE by default). */
export function createResourceWriteRoutes<
    TContext extends RequestContext = RequestContext,
>(
    nectarine: NectarineConfig,
    resourceName: string,
    execute: CreateNectarineWriteRoutesOptions<TContext>["execute"],
    options: Omit<
        CreateNectarineWriteRoutesOptions<TContext>,
        "resources" | "execute"
    > = {},
): Route<TContext>[] {
    return createNectarineWriteRoutes(nectarine, {
        ...options,
        resources: [resourceName],
        execute,
    });
}
