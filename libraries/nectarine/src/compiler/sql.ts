/**
 * Shared YAML-query → SQL compiler.
 *
 * Canonical phonics shape (Postgres-first): `models/user/db/pg/user.yml`
 *   resource → get|create|update|delete → QueryName → clause object
 *
 * Blackwater `type: SELECT` YAML is normalized onto this shape first
 * (`normalizeQuery`). Blog `queries:` maps are not compiled here.
 */

import { isRecord, QueryCompileError } from "./errors.js";
import { parseOrderByFragment, parseWhereFragment, whereNodeToYaml } from "./fragments.js";
import { isSqlIdentifierPath, quoteIdentPath } from "./identifiers.js";
import { inferMethodFromType, normalizeQuery } from "./normalize.js";
import {
    BIND_CASTS,
    normalizePlaceholder,
    PLACEHOLDER,
    TYPED_PLACEHOLDER,
} from "./placeholders.js";

export { isRecord, QueryCompileError } from "./errors.js";

export const OP_TOKENS = {
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
} as const;

export const CRUD_METHODS = ["get", "create", "update", "delete"] as const;

export type OperatorToken = keyof typeof OP_TOKENS;
export type optokens = typeof OP_TOKENS;
export type CrudMethod = (typeof CRUD_METHODS)[number];

export type CleanedQueries = {
    type: string;
    method: CrudMethod;
    queries: Record<string, unknown>;
};

const NOW_LITERAL = /^now\(\)$/i;
const ALLOWED_CASTS = new Set<string>(BIND_CASTS);

export function isCrudMethod(value: unknown): value is CrudMethod {
    return typeof value === "string" && (CRUD_METHODS as readonly string[]).includes(value);
}

export function isCleanedQueries(value: unknown): value is CleanedQueries {
    return (
        isRecord(value) &&
        typeof value.type === "string" &&
        isCrudMethod(value.method) &&
        isRecord(value.queries)
    );
}

function assertIdentifier(name: string, label: string): void {
    if (!isSqlIdentifierPath(name)) {
        throw new QueryCompileError(`Invalid ${label}: ${name}`);
    }
}

function ident(name: string): string {
    return quoteIdentPath(name);
}

function compileFunction(fn: unknown): string {
    if (typeof fn !== "string") {
        throw new QueryCompileError("SQL function name must be a string");
    }
    if (fn.toLowerCase() !== "now") {
        throw new QueryCompileError(`Unknown SQL function: ${fn}`);
    }
    return "NOW()";
}

function compileConst(value: unknown): string {
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
    throw new QueryCompileError(
        `Unsupported constant ${JSON.stringify(value)}; use a boolean, number, string, or null`,
    );
}

function compileTypedValue(value: Record<string, unknown>): string {
    const cast = value.cast;
    if (typeof cast !== "string" || !ALLOWED_CASTS.has(cast.toLowerCase())) {
        throw new QueryCompileError(
            `Unsupported cast ${JSON.stringify(cast)}; allowed: ${[...ALLOWED_CASTS].join(", ")}`,
        );
    }

    const inner = value.value !== undefined ? value.value : value.placeholder;
    if (inner === undefined) {
        throw new QueryCompileError("cast requires value (a $N placeholder)");
    }

    return `${compileValue(inner)}::${cast.toLowerCase()}`;
}

export function compileValue(value: unknown): string {
    if (isRecord(value) && "cast" in value) {
        return compileTypedValue(value);
    }
    if (isRecord(value) && "fn" in value) {
        return compileFunction(value.fn);
    }
    if (isRecord(value) && "const" in value) {
        return compileConst(value.const);
    }

    if (typeof value === "string") {
        if (PLACEHOLDER.test(value) || TYPED_PLACEHOLDER.test(value)) {
            return normalizePlaceholder(value);
        }
        if (NOW_LITERAL.test(value)) {
            return "NOW()";
        }
        throw new QueryCompileError(
            `Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder, $1::jsonb, or { fn: now }`,
        );
    }

    throw new QueryCompileError(
        `Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder, $1::jsonb, or { fn: now }`,
    );
}

function normalizeColumns(columns: unknown, label: string, allowStar: boolean): string[] {
    if (typeof columns === "string") {
        const trimmed = columns.trim();
        if (trimmed === "*") {
            if (!allowStar) {
                throw new QueryCompileError(`${label} cannot include *`);
            }
            return ["*"];
        }
        assertIdentifier(trimmed, label);
        return [ident(trimmed)];
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
        return ident(column);
    });
}

function compileInList(value: unknown): string {
    if (isRecord(value) && "list" in value) {
        if (!Array.isArray(value.list) || value.list.length === 0) {
            throw new QueryCompileError("IN list cannot be empty");
        }
        return value.list.map((item) => compileValue(item)).join(", ");
    }
    if (isRecord(value) && "const" in value && Array.isArray(value.const)) {
        if (value.const.length === 0) {
            throw new QueryCompileError("IN list cannot be empty");
        }
        return value.const.map((item) => compileConst(item)).join(", ");
    }
    if (Array.isArray(value) && value.length > 0) {
        return value.map((item) => compileValue(item)).join(", ");
    }
    throw new QueryCompileError("IN / NOT IN requires a non-empty list");
}

function compilePredicate(where: Record<string, unknown>): string {
    const { column, operator, value } = where;

    if (typeof column !== "string") {
        throw new QueryCompileError("where.column is required");
    }
    assertIdentifier(column, "column");

    if (typeof operator !== "string") {
        throw new QueryCompileError("where.operator is required");
    }
    if (!(operator in OP_TOKENS)) {
        throw new QueryCompileError(`Unknown operator: ${operator}`);
    }

    const sqlOp = OP_TOKENS[operator as OperatorToken];

    if (operator === "is_null" || operator === "is_not_null") {
        if (value !== undefined) {
            throw new QueryCompileError(`${operator} does not take a value`);
        }
        return `${ident(column)} ${sqlOp}`;
    }

    if (value === undefined) {
        throw new QueryCompileError("where.value is required");
    }

    if (operator === "in" || operator === "not_in") {
        return `${ident(column)} ${sqlOp} (${compileInList(value)})`;
    }

    return `${ident(column)} ${sqlOp} ${compileValue(value)}`;
}

function compileWhere(where: unknown, parent?: "and" | "or"): string {
    if (typeof where === "string") {
        return compileWhere(whereNodeToYaml(parseWhereFragment(where)), parent);
    }

    if (Array.isArray(where)) {
        if (where.length === 0) {
            throw new QueryCompileError("where list cannot be empty");
        }
        const sql = where.map((item) => compileWhere(item, "and")).join(" AND ");
        return parent === "or" ? `(${sql})` : sql;
    }

    if (!isRecord(where)) {
        throw new QueryCompileError("where must be an object");
    }

    if ("and" in where) {
        if (!Array.isArray(where.and) || where.and.length === 0) {
            throw new QueryCompileError("where.and must be a non-empty array");
        }
        const sql = where.and.map((item) => compileWhere(item, "and")).join(" AND ");
        return parent === "or" ? `(${sql})` : sql;
    }

    if ("or" in where) {
        if (!Array.isArray(where.or) || where.or.length === 0) {
            throw new QueryCompileError("where.or must be a non-empty array");
        }
        const sql = where.or.map((item) => compileWhere(item, "or")).join(" OR ");
        return parent === "and" ? `(${sql})` : sql;
    }

    return compilePredicate(where);
}

function compileOrderBy(orderBy: unknown): string {
    const terms = typeof orderBy === "string" ? parseOrderByFragment(orderBy) : orderBy;

    if (!Array.isArray(terms) || terms.length === 0) {
        throw new QueryCompileError("orderBy must be a non-empty list");
    }

    return terms
        .map((term, index) => {
            if (typeof term === "string") {
                assertIdentifier(term, "orderBy");
                return ident(term);
            }
            if (!isRecord(term) || typeof term.column !== "string") {
                throw new QueryCompileError(`orderBy[${index}] requires column`);
            }
            assertIdentifier(term.column, "orderBy");
            if (term.direction === undefined) {
                return ident(term.column);
            }
            if (term.direction !== "ASC" && term.direction !== "DESC") {
                throw new QueryCompileError(`Invalid orderBy direction: ${String(term.direction)}`);
            }
            return `${ident(term.column)} ${term.direction}`;
        })
        .join(", ");
}

function compileSelect(query: Record<string, unknown>): string {
    if (typeof query.from !== "string") {
        throw new QueryCompileError("SELECT requires from");
    }
    assertIdentifier(query.from, "table");

    const fields = normalizeColumns(query.select, "select", true).join(", ");
    let sql = `SELECT ${fields} FROM ${ident(query.from)}`;

    if (query.where !== undefined) {
        sql += ` WHERE ${compileWhere(query.where)}`;
    }
    if (query.orderBy !== undefined) {
        sql += ` ORDER BY ${compileOrderBy(query.orderBy)}`;
    }

    return sql;
}

function compileInsert(query: Record<string, unknown>): string {
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
    let sql = `INSERT INTO ${ident(into)} (${cols.join(", ")}) VALUES (${compiled.join(", ")})`;

    const returning = query.returning ?? query.insert.returning;
    if (returning !== undefined) {
        sql += ` RETURNING ${normalizeColumns(returning, "returning", true).join(", ")}`;
    }

    return sql;
}

function compileUpdate(query: Record<string, unknown>): string {
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

    const assignments = cols.map(
        (column, index) => `${column} = ${compileValue(values[index])}`,
    );

    return `UPDATE ${ident(query.table)} SET ${assignments.join(", ")} WHERE ${compileWhere(query.where)}`;
}

function compileDelete(query: Record<string, unknown>): string {
    if (typeof query.from !== "string") {
        throw new QueryCompileError("DELETE requires from");
    }
    assertIdentifier(query.from, "table");

    if (query.where === undefined) {
        throw new QueryCompileError("DELETE requires a where clause");
    }

    return `DELETE FROM ${ident(query.from)} WHERE ${compileWhere(query.where)}`;
}

function inferQueryKind(query: Record<string, unknown>): CrudMethod {
    const hasInsert = "insert" in query;
    const hasSelect = "select" in query;
    const hasSet = "set" in query;
    const markers = [hasInsert, hasSelect, hasSet].filter(Boolean).length;

    if (markers > 1) {
        throw new QueryCompileError(
            "Ambiguous query shape; pass a CRUD method (get|create|update|delete)",
        );
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

    throw new QueryCompileError(
        "Unsupported or ambiguous query shape; pass a CRUD method (get|create|update|delete)",
    );
}

function compileByMethod(query: Record<string, unknown>, method: CrudMethod): string {
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
 * Without `method`, `type: SELECT|INSERT|UPDATE|DELETE` or an unambiguous
 * `select` / `insert` / `set` shape is enough.
 *
 * Blackwater `type: SELECT` objects are normalized onto the canonical
 * phonics shape before assembly.
 */
export function compileQuery(query: unknown, method?: CrudMethod): string {
    if (!isRecord(query)) {
        throw new QueryCompileError("Query must be an object");
    }

    const resolvedMethod = method ?? inferMethodFromType(query);
    const normalized = normalizeQuery(query, resolvedMethod);
    const kind = resolvedMethod ?? inferQueryKind(normalized);
    return compileByMethod(normalized, kind);
}
