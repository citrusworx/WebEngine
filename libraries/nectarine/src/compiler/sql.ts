/**
 * Shared YAML-query → SQL compiler.
 *
 * Canonical shape (Postgres-first MVP): `models/user/db/pg/user.yml`
 *   resource → get|create|update|delete → QueryName → clause object
 *
 * Alternate layouts (blog `queries:` map, product `type: SELECT` fixtures)
 * are not compiled here.
 */

export const OP_TOKENS = {
    eq: "=",
    gt: ">",
    lt: "<",
    lte: "<=",
    gte: ">=",
    neq: "!=",
} as const;

export type OperatorToken = keyof typeof OP_TOKENS;
export type optokens = typeof OP_TOKENS;

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PLACEHOLDER = /^\$[1-9]\d*$/;
const NOW_LITERAL = /^now\(\)$/i;

export class QueryCompileError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QueryCompileError";
    }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertIdentifier(name: string, label: string): void {
    const parts = name.split(".");
    if (parts.length === 0 || parts.some((part) => !IDENTIFIER.test(part))) {
        throw new QueryCompileError(`Invalid ${label}: ${name}`);
    }
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

export function compileValue(value: unknown): string {
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
        throw new QueryCompileError(
            `Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder or { fn: now }`,
        );
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    if (typeof value === "boolean") {
        return value ? "TRUE" : "FALSE";
    }

    throw new QueryCompileError(
        `Unsupported value ${JSON.stringify(value)}; use a $1-style placeholder or { fn: now }`,
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

function compileWhere(where: unknown): string {
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
    if (!(operator in OP_TOKENS)) {
        throw new QueryCompileError(`Unknown operator: ${operator}`);
    }

    if (value === undefined) {
        throw new QueryCompileError("where.value is required");
    }

    const sqlOp = OP_TOKENS[operator as OperatorToken];
    return `${column} ${sqlOp} ${compileValue(value)}`;
}

function compileSelect(query: Record<string, unknown>): string {
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
    return `INSERT INTO ${into} (${cols.join(", ")}) VALUES (${compiled.join(", ")})`;
}

function compileUpdate(query: Record<string, unknown>): string {
    if (typeof query.table !== "string") {
        throw new QueryCompileError("UPDATE requires table");
    }
    assertIdentifier(query.table, "table");

    const cols = normalizeColumns(query.set, "set", false);

    if (!Array.isArray(query.values) || query.values.length === 0) {
        throw new QueryCompileError("UPDATE requires values");
    }
    if (cols.length !== query.values.length) {
        throw new QueryCompileError("UPDATE set and values must have the same length");
    }
    if (query.where === undefined) {
        throw new QueryCompileError("UPDATE requires a where clause");
    }

    const assignments = cols.map(
        (column, index) => `${column} = ${compileValue(query.values[index])}`,
    );

    return `UPDATE ${query.table} SET ${assignments.join(", ")} WHERE ${compileWhere(query.where)}`;
}

function compileDelete(query: Record<string, unknown>): string {
    if (typeof query.from !== "string") {
        throw new QueryCompileError("DELETE requires from");
    }
    assertIdentifier(query.from, "table");

    if (query.where === undefined) {
        throw new QueryCompileError("DELETE requires a where clause");
    }

    return `DELETE FROM ${query.from} WHERE ${compileWhere(query.where)}`;
}

/**
 * Compile a single query object (the value under `resource.method.QueryName`)
 * into a parameterized SQL string.
 */
export function compileQuery(query: unknown): string {
    if (!isRecord(query)) {
        throw new QueryCompileError("Query must be an object");
    }

    if ("insert" in query) {
        return compileInsert(query);
    }
    if ("select" in query) {
        return compileSelect(query);
    }
    if ("set" in query) {
        return compileUpdate(query);
    }
    if ("from" in query) {
        return compileDelete(query);
    }

    throw new QueryCompileError("Unsupported query shape");
}
