import { CCompiler, listApiOperations, } from "@citrusworx/nectarine";
import { generateRoutes, } from "@citrusworx/seltzer";
export const NECTARINE_READ_METHODS = ["GET"];
export const NECTARINE_WRITE_METHODS = [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
];
const PATH_PARAM = /:([A-Za-z_][A-Za-z0-9_]*)/g;
const PLACEHOLDER_VALUE = /^\$\d+(::[A-Za-z_][A-Za-z0-9_]*)?$/;
const compiler = new CCompiler();
const pathCompileCache = new Map();
const documentCompileCache = new WeakMap();
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
export function isWriteOperation(operation) {
    return NECTARINE_WRITE_METHODS.includes(operation.method);
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
function rowCountFromQueryResult(result) {
    if (isRecord(result) && typeof result.rowCount === "number") {
        return result.rowCount;
    }
    return undefined;
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
function toCamel(value) {
    return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function toSnake(value) {
    return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function columnKeys(column) {
    const keys = [column, toCamel(column), toSnake(column)];
    return [...new Set(keys)];
}
function lookupBind(column, params, body) {
    for (const key of columnKeys(column)) {
        const raw = params[key];
        if (typeof raw === "string" && raw.trim()) {
            return raw.trim();
        }
    }
    if (body) {
        for (const key of columnKeys(column)) {
            if (Object.prototype.hasOwnProperty.call(body, key) &&
                body[key] !== undefined) {
                return body[key];
            }
        }
    }
    return null;
}
function stringList(value) {
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
    const parts = value.filter((item) => typeof item === "string" && item !== "*");
    return parts.length > 0 ? parts : undefined;
}
function isPlaceholderValue(value) {
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
function methodAliases(method) {
    if (method === "read" || method === "get") {
        return method === "read" ? ["read", "get"] : ["get", "read"];
    }
    return [method];
}
export function namedQuerySpec(queries, resource, method, name) {
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
function insertColumns(spec) {
    const nested = isRecord(spec.insert) ? spec.insert : undefined;
    return (stringList(spec.fields) ??
        stringList(spec.columns) ??
        (nested ? stringList(nested.columns) : undefined));
}
function insertValues(spec) {
    if (Array.isArray(spec.values)) {
        return spec.values;
    }
    const nested = isRecord(spec.insert) ? spec.insert : undefined;
    return nested && Array.isArray(nested.values) ? nested.values : undefined;
}
function updateSetColumns(spec) {
    return stringList(spec.set) ?? stringList(spec.fields);
}
/**
 * Bind values for create/update/delete: YAML field order, then path params
 * for update WHERE (compiler remaps `$1` after SET). Column names match
 * request body or path params (`order_id` / `orderId`). Missing values are
 * `null` — hosts that generate ids (waitlist join) pass `execute`.
 */
export function writeBindValues(operation, params, body, querySpec) {
    if (operation.method === "DELETE" || operation.crud === "delete") {
        return pathBindValues(operation.path, params);
    }
    const bodyRecord = isRecord(body) ? body : undefined;
    const isUpdate = operation.method === "PUT" ||
        operation.method === "PATCH" ||
        operation.crud === "update";
    if (isUpdate) {
        const pathBinds = pathBindValues(operation.path, params);
        if (pathBinds === null) {
            return null;
        }
        const setCols = querySpec ? updateSetColumns(querySpec) : undefined;
        if (setCols?.length) {
            return [
                ...setCols.map((column) => lookupBind(column, {}, bodyRecord)),
                ...pathBinds,
            ];
        }
        const fromBody = operation.body
            ? Object.keys(operation.body).map((key) => lookupBind(key, {}, bodyRecord))
            : [];
        return [...fromBody, ...pathBinds];
    }
    const columns = querySpec ? insertColumns(querySpec) : undefined;
    const values = querySpec ? insertValues(querySpec) : undefined;
    if (columns?.length) {
        if (Array.isArray(values) && values.length === columns.length) {
            const binds = [];
            for (let index = 0; index < columns.length; index += 1) {
                if (isPlaceholderValue(values[index])) {
                    binds.push(lookupBind(columns[index], params, bodyRecord));
                }
            }
            return binds;
        }
        return columns.map((column) => lookupBind(column, params, bodyRecord));
    }
    const fromBody = operation.body
        ? Object.keys(operation.body).map((key) => lookupBind(key, params, bodyRecord))
        : [];
    const pathBinds = pathBindValues(operation.path, params);
    if (pathBinds === null) {
        return null;
    }
    return [...fromBody, ...pathBinds];
}
function compilerMethod(operation) {
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
function mutationResult(result) {
    const rows = rowsFromQueryResult(result).map((row) => normalizeRow(row));
    if (rows.length === 1) {
        return rows[0];
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
export function listResourceOperations(nectarine, resourceName) {
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
/** Flatten `*API.yml` for one resource (same as {@link listResourceOperations}). */
export function listResourceReadOperations(nectarine, resourceName) {
    return listResourceOperations(nectarine, resourceName);
}
export function listResourceWriteOperations(nectarine, resourceName) {
    return listResourceOperations(nectarine, resourceName).filter(isWriteOperation);
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
    const coordKey = `${resource}::${method}::${name}`;
    if (typeof source === "string") {
        const cacheKey = `${source}::${coordKey}`;
        const cached = pathCompileCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const parsed = compiler.parse_config(source);
        if (!isQueryDocument(parsed)) {
            throw new Error(`Nectarine queries for "${resource}" must be an object`);
        }
        const sql = compiler.buildQuery(compiler.clean_parse(parsed, resource, method), name);
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
    const sql = compiler.buildQuery(compiler.clean_parse(source, resource, method), name);
    docCache.set(coordKey, sql);
    return sql;
}
/**
 * Execute via CCompiler + the resource `*Queries.yml` + `operation.query`.
 *
 * Reads: bind path params in path order. No database → collections `[]`,
 * unique lookups `null` (404).
 *
 * Writes: bind YAML columns from body / path (`order_id` ↔ `orderId`).
 * No database or zero affected rows → `null` (404). JSONB catalog mapping
 * and waitlist join (generated id, allowlist, duplicates) stay in host
 * `execute` callbacks.
 */
export function createCompiledNectarineExecute(options) {
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
        let binds;
        if (write) {
            const spec = namedQuerySpec(resolveResourceQueries(options.config, resource), resource, method, query);
            binds = writeBindValues(operation, params, body, spec);
        }
        else {
            binds = pathBindValues(operation.path, params);
        }
        if (binds === null) {
            return write || isSingularRead(operation.name) ? null : [];
        }
        const sql = compileResourceQuery(resolveResourceQueries(options.config, resource), resource, method, query);
        const result = await options.query(sql, binds);
        if (write) {
            return mutationResult(result);
        }
        const rows = rowsFromQueryResult(result).map((row) => normalizeRow(row));
        if (isSingularRead(operation.name)) {
            return rows[0] ?? null;
        }
        return rows;
    };
}
function queryFromSource(source, override) {
    if (override) {
        return override;
    }
    const adapter = source.adapter;
    if (adapter && typeof adapter.query === "function") {
        return (sql, params) => adapter.query(sql, params);
    }
    return source.query;
}
function withSourceDefaults(source, options) {
    return {
        ...options,
        query: queryFromSource(source, options.query),
        connected: options.connected ??
            (source.connected !== undefined
                ? () => source.connected === true
                : undefined),
    };
}
function selectOperations(nectarine, resources) {
    return resources.flatMap((resourceName) => listResourceOperations(nectarine, resourceName));
}
function operationAllowed(operation, options) {
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
 * adapter `query(sql, params)`. Pass `execute` to specialize (Blackwater
 * product JSONB / waitlist join).
 */
export function createNectarineRoutes(nectarine, options) {
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
        filter: (operation) => operationAllowed(operation, options),
    });
}
/**
 * GET reads from `*API.yml`. `include` can add a non-GET op such as waitlist
 * `joinWaitlist`; those typically need a custom `execute`.
 */
export function createNectarineReadRoutes(nectarine, options) {
    return createNectarineRoutes(nectarine, {
        ...options,
        methods: options.methods ?? NECTARINE_READ_METHODS,
    });
}
/**
 * POST/PUT/PATCH/DELETE as defined in YAML. Default execute is compiled
 * named queries. Exclude JSONB / join specials, or pass `execute`.
 */
export function createNectarineWriteRoutes(nectarine, options) {
    return createNectarineRoutes(nectarine, {
        ...options,
        methods: options.methods ?? NECTARINE_WRITE_METHODS,
    });
}
/**
 * Same as {@link createNectarineRoutes}, filling `query` / `connected`
 * from a kernel handle when the caller omits them.
 */
export function createNectarineHandleRoutes(source, options) {
    return createNectarineRoutes(source.config, withSourceDefaults(source, options));
}
export function createNectarineHandleReadRoutes(source, options) {
    return createNectarineReadRoutes(source.config, withSourceDefaults(source, options));
}
export function createNectarineHandleWriteRoutes(source, options) {
    return createNectarineWriteRoutes(source.config, withSourceDefaults(source, options));
}
/** Thin wrapper for one resource (GET by default). */
export function createResourceReadRoutes(nectarine, resourceName, execute, options = {}) {
    return createNectarineReadRoutes(nectarine, {
        ...options,
        resources: [resourceName],
        execute,
    });
}
/** Thin wrapper for one resource (POST/PUT/PATCH/DELETE by default). */
export function createResourceWriteRoutes(nectarine, resourceName, execute, options = {}) {
    return createNectarineWriteRoutes(nectarine, {
        ...options,
        resources: [resourceName],
        execute,
    });
}
//# sourceMappingURL=nectarine-routes.js.map