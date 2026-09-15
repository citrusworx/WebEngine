import { CCompiler, listApiOperations, } from "@citrusworx/nectarine";
import { generateRoutes, } from "@citrusworx/seltzer";
const PATH_PARAM = /:([A-Za-z_][A-Za-z0-9_]*)/g;
const compiler = new CCompiler();
const compileCache = new Map();
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isQueryDocument(value) {
    return isRecord(value);
}
function matchesExclude(operation, exclude) {
    if (!exclude) {
        return false;
    }
    if (typeof exclude === "function") {
        return exclude(operation);
    }
    return exclude.some((entry) => entry.resource === operation.resource &&
        entry.name === operation.name);
}
function isGetRead(operation) {
    return (operation.method === "GET" &&
        (operation.crud === "read" || operation.crud === "get"));
}
function adapterConnected(connected, query) {
    if (typeof connected === "function") {
        return connected();
    }
    if (typeof connected === "boolean") {
        return connected;
    }
    return typeof query === "function";
}
function rowsFromQueryResult(result) {
    if (Array.isArray(result)) {
        return result.filter(isRecord);
    }
    if (isRecord(result) && Array.isArray(result.rows)) {
        return result.rows.filter(isRecord);
    }
    return [];
}
function normalizeRow(row) {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
        out[key] = value instanceof Date ? value.toISOString() : value;
    }
    return out;
}
/** Unique lookups return one row (404 on miss). Collection reads return `[]`. */
export function isSingularRead(name) {
    return /((^by|By)(Id|Slug|Email))$/.test(name);
}
export function pathBindValues(path, params) {
    const names = [...path.matchAll(PATH_PARAM)].map((match) => match[1]);
    const values = [];
    for (const name of names) {
        const value = params[name]?.trim();
        if (!value) {
            return null;
        }
        values.push(value);
    }
    return values;
}
/**
 * Flatten operations from one or more `*API.yml` documents (`listApiOperations`).
 *
 * Sibling keys in the same file (e.g. `order_item` inside `orderAPI.yml`)
 * resolve through the loaded parent resource. Callers filter to GET reads
 * unless they `include`.
 */
export function listResourceReadOperations(nectarine, resourceName) {
    if (nectarine.resources.has(resourceName)) {
        return listApiOperations(resourceName, nectarine.getResource(resourceName).api);
    }
    for (const loaded of nectarine.resources.values()) {
        const operations = listApiOperations(resourceName, loaded.api);
        if (operations.length > 0) {
            return operations;
        }
    }
    return [];
}
export function resolveResourceQueries(nectarine, resourceName) {
    if (nectarine.resources.has(resourceName)) {
        return nectarine.getResource(resourceName).queries;
    }
    for (const loaded of nectarine.resources.values()) {
        if (isRecord(loaded.queries) && resourceName in loaded.queries) {
            return loaded.queries;
        }
    }
    throw new Error(`Nectarine Queries.yml not loaded for resource "${resourceName}"`);
}
/**
 * Compile a named query from a `*Queries.yml` file path or an already-loaded
 * document (`NectarineConfig.getResource(...).queries`).
 *
 * YAML tokens → CCompiler → SQL. Hosts must not embed SQL in TypeScript.
 */
export function compileResourceQuery(source, resource, method, name) {
    const cacheKey = typeof source === "string"
        ? `${source}::${resource}::${method}::${name}`
        : `loaded::${resource}::${method}::${name}`;
    const cached = compileCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    const parsed = typeof source === "string" ? compiler.parse_config(source) : source;
    if (!isQueryDocument(parsed)) {
        throw new Error(`Nectarine queries for "${resource}" must be an object`);
    }
    const sql = compiler.buildQuery(compiler.clean_parse(parsed, resource, method), name);
    compileCache.set(cacheKey, sql);
    return sql;
}
/**
 * Execute a GET using CCompiler + the resource `*Queries.yml` + `operation.query`.
 *
 * Connected adapter: bind path params in path order (`$1`, `$2`, …).
 * No database: collections return `[]`, unique lookups return `null` (404).
 * Seed fallback and JSONB catalog mapping stay in host execute callbacks.
 */
export function createCompiledNectarineExecute(options) {
    return async ({ resource, query, params, operation }) => {
        if (!query) {
            return isSingularRead(operation.name) ? null : [];
        }
        const binds = pathBindValues(operation.path, params);
        if (binds === null) {
            return isSingularRead(operation.name) ? null : [];
        }
        if (!adapterConnected(options.connected, options.query)) {
            return isSingularRead(operation.name) ? null : [];
        }
        if (typeof options.query !== "function") {
            return isSingularRead(operation.name) ? null : [];
        }
        const sql = compileResourceQuery(resolveResourceQueries(options.config, resource), resource, "read", query);
        const result = await options.query(sql, binds);
        const rows = rowsFromQueryResult(result).map((row) => normalizeRow(row));
        if (isSingularRead(operation.name)) {
            return rows[0] ?? null;
        }
        return rows;
    };
}
function selectOperations(nectarine, resources) {
    return resources.flatMap((resourceName) => listResourceReadOperations(nectarine, resourceName));
}
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
export function createNectarineReadRoutes(nectarine, options) {
    const operations = selectOperations(nectarine, options.resources);
    const execute = options.execute ??
        createCompiledNectarineExecute({
            config: nectarine,
            query: options.query,
            connected: options.connected,
        });
    return generateRoutes(operations, {
        execute,
        notFound: options.notFound,
        filter: (operation) => (isGetRead(operation) || Boolean(options.include?.(operation))) &&
            !matchesExclude(operation, options.exclude),
    });
}
/**
 * Same as {@link createNectarineReadRoutes}, filling `query` / `connected`
 * from a kernel handle when the caller omits them.
 */
export function createNectarineHandleReadRoutes(source, options) {
    return createNectarineReadRoutes(source.config, {
        ...options,
        query: options.query ?? source.query,
        connected: options.connected ??
            (source.connected !== undefined
                ? () => source.connected === true
                : undefined),
    });
}
/** Thin wrapper for one resource. */
export function createResourceReadRoutes(nectarine, resourceName, execute, options = {}) {
    return createNectarineReadRoutes(nectarine, {
        ...options,
        resources: [resourceName],
        execute,
    });
}
//# sourceMappingURL=nectarine-routes.js.map