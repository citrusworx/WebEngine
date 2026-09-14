"use strict";
/**
 * Shared YAML-query → SQL compiler.
 *
 * Canonical phonics shape (Postgres-first): `models/user/db/pg/user.yml`
 *   resource → get|create|update|delete → QueryName → clause object
 *
 * Blackwater `type: SELECT` YAML is normalized onto this shape first
 * (`normalizeQuery`). Blog `queries:` maps are not compiled here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRUD_METHODS = exports.OP_TOKENS = exports.QueryCompileError = exports.isRecord = void 0;
exports.isCrudMethod = isCrudMethod;
exports.isCleanedQueries = isCleanedQueries;
exports.compileValue = compileValue;
exports.compileQuery = compileQuery;
const errors_js_1 = require("./errors.js");
const fragments_js_1 = require("./fragments.js");
const normalize_js_1 = require("./normalize.js");
const placeholders_js_1 = require("./placeholders.js");
var errors_js_2 = require("./errors.js");
Object.defineProperty(exports, "isRecord", { enumerable: true, get: function () { return errors_js_2.isRecord; } });
Object.defineProperty(exports, "QueryCompileError", { enumerable: true, get: function () { return errors_js_2.QueryCompileError; } });
exports.OP_TOKENS = {
    eq: "=",
    gt: ">",
    lt: "<",
    lte: "<=",
    gte: ">=",
    neq: "!=",
    in: "IN",
    not_in: "NOT IN",
    is_null: "IS NULL",
    is_not_null: "IS NOT NULL",
};
exports.CRUD_METHODS = ["get", "create", "update", "delete"];
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const NOW_LITERAL = /^now\(\)$/i;
const ALLOWED_CASTS = new Set(placeholders_js_1.BIND_CASTS);
function isCrudMethod(value) {
    return typeof value === "string" && exports.CRUD_METHODS.includes(value);
}
function isCleanedQueries(value) {
    return ((0, errors_js_1.isRecord)(value) &&
        typeof value.type === "string" &&
        isCrudMethod(value.method) &&
        (0, errors_js_1.isRecord)(value.queries));
}
function assertIdentifier(name, label) {
    const parts = name.split(".");
    if (parts.length === 0 || parts.some((part) => !IDENTIFIER.test(part))) {
        throw new errors_js_1.QueryCompileError(`Invalid ${label}: ${name}`);
    }
}
function compileFunction(fn) {
    if (typeof fn !== "string") {
        throw new errors_js_1.QueryCompileError("SQL function name must be a string");
    }
    if (fn.toLowerCase() !== "now") {
        throw new errors_js_1.QueryCompileError(`Unknown SQL function: ${fn}`);
    }
    return "NOW()";
}
function compileConst(value) {
    if (value === null) {
        return "NULL";
    }
    if (typeof value === "boolean") {
        return value ? "TRUE" : "FALSE";
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === "string") {
        return `'${value.replace(/'/g, "''")}'`;
    }
    throw new errors_js_1.QueryCompileError(`Unsupported constant ${JSON.stringify(value)}; use a boolean, number, string, or null`);
}
function compileTypedValue(value) {
    const cast = value.cast;
    if (typeof cast !== "string" || !ALLOWED_CASTS.has(cast.toLowerCase())) {
        throw new errors_js_1.QueryCompileError(`Unsupported cast ${JSON.stringify(cast)}; allowed: ${[...ALLOWED_CASTS].join(", ")}`);
    }
    const inner = value.value !== undefined ? value.value : value.placeholder;
    if (inner === undefined) {
        throw new errors_js_1.QueryCompileError("cast requires value (a $N placeholder)");
    }
    return `${compileValue(inner)}::${cast.toLowerCase()}`;
}
function compileValue(value) {
    if ((0, errors_js_1.isRecord)(value) && "cast" in value) {
        return compileTypedValue(value);
    }
    if ((0, errors_js_1.isRecord)(value) && "fn" in value) {
        return compileFunction(value.fn);
    }
    if ((0, errors_js_1.isRecord)(value) && "const" in value) {
        return compileConst(value.const);
    }
    if (typeof value === "string") {
        if (placeholders_js_1.PLACEHOLDER.test(value) || placeholders_js_1.TYPED_PLACEHOLDER.test(value)) {
            return (0, placeholders_js_1.normalizePlaceholder)(value);
        }
        if (NOW_LITERAL.test(value)) {
            return "NOW()";
        }
        throw new errors_js_1.QueryCompileError(`Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder, $1::jsonb, or { fn: now }`);
    }
    throw new errors_js_1.QueryCompileError(`Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder, $1::jsonb, or { fn: now }`);
}
function normalizeColumns(columns, label, allowStar) {
    if (typeof columns === "string") {
        const trimmed = columns.trim();
        if (trimmed === "*") {
            if (!allowStar) {
                throw new errors_js_1.QueryCompileError(`${label} cannot include *`);
            }
            return ["*"];
        }
        assertIdentifier(trimmed, label);
        return [trimmed];
    }
    if (!Array.isArray(columns) || columns.length === 0) {
        throw new errors_js_1.QueryCompileError(`${label} must be a non-empty string or array`);
    }
    return columns.map((column, index) => {
        if (typeof column !== "string") {
            throw new errors_js_1.QueryCompileError(`${label}[${index}] must be a string`);
        }
        if (column === "*") {
            if (!allowStar) {
                throw new errors_js_1.QueryCompileError(`${label} cannot include *`);
            }
            return "*";
        }
        assertIdentifier(column, label);
        return column;
    });
}
function compileInList(value) {
    if ((0, errors_js_1.isRecord)(value) && "list" in value) {
        if (!Array.isArray(value.list) || value.list.length === 0) {
            throw new errors_js_1.QueryCompileError("IN list cannot be empty");
        }
        return value.list.map((item) => compileValue(item)).join(", ");
    }
    if ((0, errors_js_1.isRecord)(value) && "const" in value && Array.isArray(value.const)) {
        if (value.const.length === 0) {
            throw new errors_js_1.QueryCompileError("IN list cannot be empty");
        }
        return value.const.map((item) => compileConst(item)).join(", ");
    }
    if (Array.isArray(value) && value.length > 0) {
        return value.map((item) => compileValue(item)).join(", ");
    }
    throw new errors_js_1.QueryCompileError("IN / NOT IN requires a non-empty list");
}
function compilePredicate(where) {
    const { column, operator, value } = where;
    if (typeof column !== "string") {
        throw new errors_js_1.QueryCompileError("where.column is required");
    }
    assertIdentifier(column, "column");
    if (typeof operator !== "string") {
        throw new errors_js_1.QueryCompileError("where.operator is required");
    }
    if (!(operator in exports.OP_TOKENS)) {
        throw new errors_js_1.QueryCompileError(`Unknown operator: ${operator}`);
    }
    const sqlOp = exports.OP_TOKENS[operator];
    if (operator === "is_null" || operator === "is_not_null") {
        if (value !== undefined) {
            throw new errors_js_1.QueryCompileError(`${operator} does not take a value`);
        }
        return `${column} ${sqlOp}`;
    }
    if (value === undefined) {
        throw new errors_js_1.QueryCompileError("where.value is required");
    }
    if (operator === "in" || operator === "not_in") {
        return `${column} ${sqlOp} (${compileInList(value)})`;
    }
    return `${column} ${sqlOp} ${compileValue(value)}`;
}
function compileWhere(where, parent) {
    if (typeof where === "string") {
        return compileWhere((0, fragments_js_1.whereNodeToYaml)((0, fragments_js_1.parseWhereFragment)(where)), parent);
    }
    if (Array.isArray(where)) {
        if (where.length === 0) {
            throw new errors_js_1.QueryCompileError("where list cannot be empty");
        }
        const sql = where.map((item) => compileWhere(item, "and")).join(" AND ");
        return parent === "or" ? `(${sql})` : sql;
    }
    if (!(0, errors_js_1.isRecord)(where)) {
        throw new errors_js_1.QueryCompileError("where must be an object");
    }
    if ("and" in where) {
        if (!Array.isArray(where.and) || where.and.length === 0) {
            throw new errors_js_1.QueryCompileError("where.and must be a non-empty array");
        }
        const sql = where.and.map((item) => compileWhere(item, "and")).join(" AND ");
        return parent === "or" ? `(${sql})` : sql;
    }
    if ("or" in where) {
        if (!Array.isArray(where.or) || where.or.length === 0) {
            throw new errors_js_1.QueryCompileError("where.or must be a non-empty array");
        }
        const sql = where.or.map((item) => compileWhere(item, "or")).join(" OR ");
        return parent === "and" ? `(${sql})` : sql;
    }
    return compilePredicate(where);
}
function compileOrderBy(orderBy) {
    const terms = typeof orderBy === "string" ? (0, fragments_js_1.parseOrderByFragment)(orderBy) : orderBy;
    if (!Array.isArray(terms) || terms.length === 0) {
        throw new errors_js_1.QueryCompileError("orderBy must be a non-empty list");
    }
    return terms
        .map((term, index) => {
        if (typeof term === "string") {
            assertIdentifier(term, "orderBy");
            return term;
        }
        if (!(0, errors_js_1.isRecord)(term) || typeof term.column !== "string") {
            throw new errors_js_1.QueryCompileError(`orderBy[${index}] requires column`);
        }
        assertIdentifier(term.column, "orderBy");
        if (term.direction === undefined) {
            return term.column;
        }
        if (term.direction !== "ASC" && term.direction !== "DESC") {
            throw new errors_js_1.QueryCompileError(`Invalid orderBy direction: ${String(term.direction)}`);
        }
        return `${term.column} ${term.direction}`;
    })
        .join(", ");
}
function compileSelect(query) {
    if (typeof query.from !== "string") {
        throw new errors_js_1.QueryCompileError("SELECT requires from");
    }
    assertIdentifier(query.from, "table");
    const fields = normalizeColumns(query.select, "select", true).join(", ");
    let sql = `SELECT ${fields} FROM ${query.from}`;
    if (query.where !== undefined) {
        sql += ` WHERE ${compileWhere(query.where)}`;
    }
    if (query.orderBy !== undefined) {
        sql += ` ORDER BY ${compileOrderBy(query.orderBy)}`;
    }
    return sql;
}
function compileInsert(query) {
    if (!(0, errors_js_1.isRecord)(query.insert)) {
        throw new errors_js_1.QueryCompileError("INSERT requires an insert object");
    }
    const { into, columns, values } = query.insert;
    if (typeof into !== "string") {
        throw new errors_js_1.QueryCompileError("INSERT requires insert.into");
    }
    assertIdentifier(into, "table");
    const cols = normalizeColumns(columns, "columns", false);
    if (!Array.isArray(values) || values.length === 0) {
        throw new errors_js_1.QueryCompileError("INSERT requires insert.values");
    }
    if (cols.length !== values.length) {
        throw new errors_js_1.QueryCompileError("INSERT columns and values must have the same length");
    }
    const compiled = values.map((value) => compileValue(value));
    let sql = `INSERT INTO ${into} (${cols.join(", ")}) VALUES (${compiled.join(", ")})`;
    const returning = query.returning ?? query.insert.returning;
    if (returning !== undefined) {
        sql += ` RETURNING ${normalizeColumns(returning, "returning", true).join(", ")}`;
    }
    return sql;
}
function compileUpdate(query) {
    if (typeof query.table !== "string") {
        throw new errors_js_1.QueryCompileError("UPDATE requires table");
    }
    assertIdentifier(query.table, "table");
    const cols = normalizeColumns(query.set, "set", false);
    const values = query.values;
    if (!Array.isArray(values) || values.length === 0) {
        throw new errors_js_1.QueryCompileError("UPDATE requires values");
    }
    if (cols.length !== values.length) {
        throw new errors_js_1.QueryCompileError("UPDATE set and values must have the same length");
    }
    if (query.where === undefined) {
        throw new errors_js_1.QueryCompileError("UPDATE requires a where clause");
    }
    const assignments = cols.map((column, index) => `${column} = ${compileValue(values[index])}`);
    return `UPDATE ${query.table} SET ${assignments.join(", ")} WHERE ${compileWhere(query.where)}`;
}
function compileDelete(query) {
    if (typeof query.from !== "string") {
        throw new errors_js_1.QueryCompileError("DELETE requires from");
    }
    assertIdentifier(query.from, "table");
    if (query.where === undefined) {
        throw new errors_js_1.QueryCompileError("DELETE requires a where clause");
    }
    return `DELETE FROM ${query.from} WHERE ${compileWhere(query.where)}`;
}
function inferQueryKind(query) {
    const hasInsert = "insert" in query;
    const hasSelect = "select" in query;
    const hasSet = "set" in query;
    const markers = [hasInsert, hasSelect, hasSet].filter(Boolean).length;
    if (markers > 1) {
        throw new errors_js_1.QueryCompileError("Ambiguous query shape; pass a CRUD method (get|create|update|delete)");
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
    throw new errors_js_1.QueryCompileError("Unsupported or ambiguous query shape; pass a CRUD method (get|create|update|delete)");
}
function compileByMethod(query, method) {
    switch (method) {
        case "get":
            if (!("select" in query)) {
                throw new errors_js_1.QueryCompileError("GET query requires select");
            }
            return compileSelect(query);
        case "create":
            if (!("insert" in query)) {
                throw new errors_js_1.QueryCompileError("CREATE query requires insert");
            }
            return compileInsert(query);
        case "update":
            if (!("set" in query)) {
                throw new errors_js_1.QueryCompileError("UPDATE query requires set");
            }
            return compileUpdate(query);
        case "delete":
            if ("select" in query || "insert" in query || "set" in query) {
                throw new errors_js_1.QueryCompileError("DELETE query has conflicting keys");
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
 * Without `method`, `type: SELECT|INSERT|UPDATE|DELETE` or an unambiguous
 * `select` / `insert` / `set` shape is enough.
 *
 * Blackwater `type: SELECT` objects are normalized onto the canonical
 * phonics shape before assembly.
 */
function compileQuery(query, method) {
    if (!(0, errors_js_1.isRecord)(query)) {
        throw new errors_js_1.QueryCompileError("Query must be an object");
    }
    const resolvedMethod = method ?? (0, normalize_js_1.inferMethodFromType)(query);
    const normalized = (0, normalize_js_1.normalizeQuery)(query, resolvedMethod);
    const kind = resolvedMethod ?? inferQueryKind(normalized);
    return compileByMethod(normalized, kind);
}
//# sourceMappingURL=sql.js.map