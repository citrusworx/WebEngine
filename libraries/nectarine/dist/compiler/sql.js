"use strict";
/**
 * Shared YAML-query → SQL compiler.
 *
 * Canonical shape (Postgres-first MVP): `models/user/db/pg/user.yml`
 *   resource → get|create|update|delete → QueryName → clause object
 *
 * Alternate layouts (blog `queries:` map, product `type: SELECT` fixtures)
 * are not compiled here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCompileError = exports.CRUD_METHODS = exports.OP_TOKENS = void 0;
exports.isRecord = isRecord;
exports.isCrudMethod = isCrudMethod;
exports.isCleanedQueries = isCleanedQueries;
exports.compileValue = compileValue;
exports.compileQuery = compileQuery;
exports.OP_TOKENS = {
    eq: "=",
    gt: ">",
    lt: "<",
    lte: "<=",
    gte: ">=",
    neq: "!=",
};
exports.CRUD_METHODS = ["get", "create", "update", "delete"];
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PLACEHOLDER = /^\$[1-9]\d*$/;
const NOW_LITERAL = /^now\(\)$/i;
class QueryCompileError extends Error {
    constructor(message) {
        super(message);
        this.name = "QueryCompileError";
    }
}
exports.QueryCompileError = QueryCompileError;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isCrudMethod(value) {
    return typeof value === "string" && exports.CRUD_METHODS.includes(value);
}
function isCleanedQueries(value) {
    return (isRecord(value) &&
        typeof value.type === "string" &&
        isCrudMethod(value.method) &&
        isRecord(value.queries));
}
function assertIdentifier(name, label) {
    const parts = name.split(".");
    if (parts.length === 0 || parts.some((part) => !IDENTIFIER.test(part))) {
        throw new QueryCompileError(`Invalid ${label}: ${name}`);
    }
}
function compileFunction(fn) {
    if (typeof fn !== "string") {
        throw new QueryCompileError("SQL function name must be a string");
    }
    if (fn.toLowerCase() !== "now") {
        throw new QueryCompileError(`Unknown SQL function: ${fn}`);
    }
    return "NOW()";
}
function compileValue(value) {
    if (isRecord(value) && "fn" in value) {
        return compileFunction(value.fn);
    }
    if (typeof value === "string") {
        if (PLACEHOLDER.test(value)) {
            return value;
        }
        if (NOW_LITERAL.test(value)) {
            return "NOW()";
        }
        throw new QueryCompileError(`Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder or { fn: now }`);
    }
    throw new QueryCompileError(`Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder or { fn: now }`);
}
function normalizeColumns(columns, label, allowStar) {
    if (typeof columns === "string") {
        const trimmed = columns.trim();
        if (trimmed === "*") {
            if (!allowStar) {
                throw new QueryCompileError(`${label} cannot include *`);
            }
            return ["*"];
        }
        assertIdentifier(trimmed, label);
        return [trimmed];
    }
    if (!Array.isArray(columns) || columns.length === 0) {
        throw new QueryCompileError(`${label} must be a non-empty string or array`);
    }
    return columns.map((column, index) => {
        if (typeof column !== "string") {
            throw new QueryCompileError(`${label}[${index}] must be a string`);
        }
        if (column === "*") {
            if (!allowStar) {
                throw new QueryCompileError(`${label} cannot include *`);
            }
            return "*";
        }
        assertIdentifier(column, label);
        return column;
    });
}
function compileWhere(where) {
    if (!isRecord(where)) {
        throw new QueryCompileError("where must be an object");
    }
    const { column, operator, value } = where;
    if (typeof column !== "string") {
        throw new QueryCompileError("where.column is required");
    }
    assertIdentifier(column, "column");
    if (typeof operator !== "string") {
        throw new QueryCompileError("where.operator is required");
    }
    if (!(operator in exports.OP_TOKENS)) {
        throw new QueryCompileError(`Unknown operator: ${operator}`);
    }
    if (value === undefined) {
        throw new QueryCompileError("where.value is required");
    }
    const sqlOp = exports.OP_TOKENS[operator];
    return `${column} ${sqlOp} ${compileValue(value)}`;
}
function compileSelect(query) {
    if (typeof query.from !== "string") {
        throw new QueryCompileError("SELECT requires from");
    }
    assertIdentifier(query.from, "table");
    const fields = normalizeColumns(query.select, "select", true).join(", ");
    let sql = `SELECT ${fields} FROM ${query.from}`;
    if (query.where !== undefined) {
        sql += ` WHERE ${compileWhere(query.where)}`;
    }
    return sql;
}
function compileInsert(query) {
    if (!isRecord(query.insert)) {
        throw new QueryCompileError("INSERT requires an insert object");
    }
    const { into, columns, values } = query.insert;
    if (typeof into !== "string") {
        throw new QueryCompileError("INSERT requires insert.into");
    }
    assertIdentifier(into, "table");
    const cols = normalizeColumns(columns, "columns", false);
    if (!Array.isArray(values) || values.length === 0) {
        throw new QueryCompileError("INSERT requires insert.values");
    }
    if (cols.length !== values.length) {
        throw new QueryCompileError("INSERT columns and values must have the same length");
    }
    const compiled = values.map((value) => compileValue(value));
    return `INSERT INTO ${into} (${cols.join(", ")}) VALUES (${compiled.join(", ")})`;
}
function compileUpdate(query) {
    if (typeof query.table !== "string") {
        throw new QueryCompileError("UPDATE requires table");
    }
    assertIdentifier(query.table, "table");
    const cols = normalizeColumns(query.set, "set", false);
    const values = query.values;
    if (!Array.isArray(values) || values.length === 0) {
        throw new QueryCompileError("UPDATE requires values");
    }
    if (cols.length !== values.length) {
        throw new QueryCompileError("UPDATE set and values must have the same length");
    }
    if (query.where === undefined) {
        throw new QueryCompileError("UPDATE requires a where clause");
    }
    const assignments = cols.map((column, index) => `${column} = ${compileValue(values[index])}`);
    return `UPDATE ${query.table} SET ${assignments.join(", ")} WHERE ${compileWhere(query.where)}`;
}
function compileDelete(query) {
    if (typeof query.from !== "string") {
        throw new QueryCompileError("DELETE requires from");
    }
    assertIdentifier(query.from, "table");
    if (query.where === undefined) {
        throw new QueryCompileError("DELETE requires a where clause");
    }
    return `DELETE FROM ${query.from} WHERE ${compileWhere(query.where)}`;
}
function inferQueryKind(query) {
    const hasInsert = "insert" in query;
    const hasSelect = "select" in query;
    const hasSet = "set" in query;
    const markers = [hasInsert, hasSelect, hasSet].filter(Boolean).length;
    if (markers > 1) {
        throw new QueryCompileError("Ambiguous query shape; pass a CRUD method (get|create|update|delete)");
    }
    if (hasInsert) {
        return "create";
    }
    if (hasSelect) {
        return "get";
    }
    if (hasSet) {
        return "update";
    }
    throw new QueryCompileError("Unsupported or ambiguous query shape; pass a CRUD method (get|create|update|delete)");
}
function compileByMethod(query, method) {
    switch (method) {
        case "get":
            if (!("select" in query)) {
                throw new QueryCompileError("GET query requires select");
            }
            return compileSelect(query);
        case "create":
            if (!("insert" in query)) {
                throw new QueryCompileError("CREATE query requires insert");
            }
            return compileInsert(query);
        case "update":
            if (!("set" in query)) {
                throw new QueryCompileError("UPDATE query requires set");
            }
            return compileUpdate(query);
        case "delete":
            if ("select" in query || "insert" in query || "set" in query) {
                throw new QueryCompileError("DELETE query has conflicting keys");
            }
            return compileDelete(query);
    }
}
/**
 * Compile a single query object (the value under `resource.method.QueryName`)
 * into a parameterized SQL string.
 *
 * Pass `method` from `clean_parse` / `buildQuery` so DELETE is not inferred
 * from a bare `from` clause (a malformed GET missing `select`).
 * Without `method`, only unambiguous `select` / `insert` / `set` shapes compile.
 */
function compileQuery(query, method) {
    if (!isRecord(query)) {
        throw new QueryCompileError("Query must be an object");
    }
    const kind = method ?? inferQueryKind(query);
    return compileByMethod(query, kind);
}
//# sourceMappingURL=sql.js.map