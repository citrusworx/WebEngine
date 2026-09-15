import { BIND_CASTS } from "../../compiler/placeholders.js";

const BIND_CAST_SET = new Set<string>(BIND_CASTS);

/**
 * `$1` or `$1::jsonb` (and the other allowlisted bind casts) at the current
 * offset. Group 1 is the 1-based index; group 2 is an optional `::cast`.
 */
const PLACEHOLDER_AT = /^\$([1-9]\d*)(?:::([A-Za-z_][A-Za-z0-9_]*))?/;

export type MysqlRewriteResult = {
    sql: string;
    params: unknown[];
};

/**
 * Convert compiler `$1` / `$N::jsonb` binds into MySQL `?` placeholders.
 *
 * Postgres stays `$1`. This rewrite is the MySQL adapter boundary: numbered
 * binds are expanded in appearance order so reused or out-of-order `$N`
 * still bind the matching `params[N - 1]` value.
 *
 * Allowlisted casts (`jsonb`, `json`, `text`):
 * - `jsonb` / `json` → `CAST(? AS JSON)` (MySQL JSON is the closest type)
 * - `text` → `?` (strip; `CAST(? AS CHAR)` would change collation/padding)
 *
 * JSONB operators the compiler emits (`@>`, `?`, `->>`) are rewritten first
 * so the Postgres `?` key check is not mistaken for a MySQL placeholder:
 * - `payload->>'catalog'` → `JSON_UNQUOTE(JSON_EXTRACT(payload, '$.catalog'))`
 * - `payload @> $1::jsonb` → `JSON_CONTAINS(payload, CAST(? AS JSON))`
 * - `payload @> '{"a":1}'` → `JSON_CONTAINS(payload, CAST('{"a":1}' AS JSON))`
 *   (decoded then re-escaped for MySQL so `\\` is not eaten as an SQL escape)
 * - `payload ? $1` → `JSON_CONTAINS_PATH(payload, 'one', CONCAT('$.', JSON_QUOTE(?)))`
 *
 * `ON CONFLICT` is Postgres-only in this version: this rewrite throws instead
 * of emitting `ON DUPLICATE KEY UPDATE`.
 *
 * SQL that already uses `?` and has no `$N` binds is returned unchanged.
 */
export function rewriteMysqlPlaceholders(
    sql: string,
    params: readonly unknown[] = [],
): MysqlRewriteResult {
    rejectMysqlOnConflict(sql);
    const rewritten = rewriteMysqlJsonbOperators(sql);
    let i = 0;
    let sawNumbered = false;
    let sawPositional = false;
    let out = "";
    const bound: unknown[] = [];

    while (i < rewritten.length) {
        const ch = rewritten[i];
        if (ch === undefined) {
            break;
        }

        if (ch === "'" || ch === '"' || ch === "`") {
            const next = skipQuoted(rewritten, i, ch);
            out += rewritten.slice(i, next);
            i = next;
            continue;
        }

        if (ch === "-" && rewritten[i + 1] === "-") {
            const next = skipLineComment(rewritten, i);
            out += rewritten.slice(i, next);
            i = next;
            continue;
        }

        if (ch === "/" && rewritten[i + 1] === "*") {
            const next = skipBlockComment(rewritten, i);
            out += rewritten.slice(i, next);
            i = next;
            continue;
        }

        if (ch === "?") {
            sawPositional = true;
            out += ch;
            i += 1;
            continue;
        }

        if (ch === "$") {
            const slice = rewritten.slice(i);
            const match = slice.match(PLACEHOLDER_AT);
            if (!match || match[1] === undefined) {
                out += ch;
                i += 1;
                continue;
            }

            const index = Number(match[1]);
            const cast = match[2]?.toLowerCase();
            if (cast !== undefined && !BIND_CAST_SET.has(cast)) {
                throw new Error(
                    `MySQL adapter cannot rewrite unsupported bind cast $${index}::${cast}`,
                );
            }
            if (!Number.isInteger(index) || index < 1 || index > params.length) {
                throw new Error(
                    `MySQL adapter cannot bind $${index}; received ${params.length} parameter(s)`,
                );
            }

            sawNumbered = true;
            const value = mysqlBindValue(params[index - 1], cast);
            out += mysqlBindSql(cast);
            bound.push(value);
            i += match[0].length;
            continue;
        }

        out += ch;
        i += 1;
    }

    if (sawNumbered && sawPositional) {
        throw new Error("MySQL adapter cannot mix $N and ? placeholders");
    }

    if (!sawNumbered) {
        return { sql: rewritten, params: [...params] };
    }

    return { sql: out, params: bound };
}

/**
 * Postgres `ON CONFLICT` is not rewritten to `ON DUPLICATE KEY UPDATE`.
 * v1 keeps the subset Postgres-only so MySQL cannot silently change upsert
 * semantics (or ignore non-duplicate errors via `INSERT IGNORE`).
 */
export function rejectMysqlOnConflict(sql: string): void {
    let i = 0;
    while (i < sql.length) {
        const ch = sql[i];
        if (ch === undefined) {
            break;
        }

        if (ch === "'" || ch === '"' || ch === "`") {
            i = skipQuoted(sql, i, ch);
            continue;
        }

        if (ch === "-" && sql[i + 1] === "-") {
            i = skipLineComment(sql, i);
            continue;
        }

        if (ch === "/" && sql[i + 1] === "*") {
            i = skipBlockComment(sql, i);
            continue;
        }

        if (isIdentBoundary(sql, i)) {
            const match = sql.slice(i).match(/^ON\s+CONFLICT\b/i);
            if (match) {
                throw new Error(
                    "MySQL adapter does not support ON CONFLICT; that phonics is Postgres-only in this Nectarine version",
                );
            }
        }

        i += 1;
    }
}

/**
 * Rewrite compiler JSONB operators to MySQL JSON functions so Postgres `?`
 * is not treated as a positional placeholder.
 */
export function rewriteMysqlJsonbOperators(sql: string): string {
    if (!hasJsonbOperator(sql)) {
        return sql;
    }

    let i = 0;
    let out = "";

    while (i < sql.length) {
        const ch = sql[i];
        if (ch === undefined) {
            break;
        }

        if (ch === "'" || ch === '"' || ch === "`") {
            const next = skipQuoted(sql, i, ch);
            out += sql.slice(i, next);
            i = next;
            continue;
        }

        if (ch === "-" && sql[i + 1] === "-") {
            const next = skipLineComment(sql, i);
            out += sql.slice(i, next);
            i = next;
            continue;
        }

        if (ch === "/" && sql[i + 1] === "*") {
            const next = skipBlockComment(sql, i);
            out += sql.slice(i, next);
            i = next;
            continue;
        }

        if (isIdentBoundary(sql, i)) {
            const rewritten = rewriteJsonbOperand(sql, i);
            if (rewritten) {
                out += rewritten.sql;
                i = rewritten.end;
                continue;
            }
        }

        out += ch;
        i += 1;
    }

    return out;
}

function hasJsonbOperator(sql: string): boolean {
    return (
        sql.includes("->>") ||
        sql.includes("->'") ||
        sql.includes(" @> ") ||
        / \? (?:\$|')/.test(sql)
    );
}

function isIdentBoundary(sql: string, index: number): boolean {
    if (index > 0) {
        const prev = sql[index - 1];
        if (prev !== undefined && /[A-Za-z0-9_]/.test(prev)) {
            return false;
        }
    }
    const ch = sql[index];
    return ch === '"' || (ch !== undefined && /[A-Za-z_]/.test(ch));
}

function rewriteJsonbOperand(sql: string, start: number): { sql: string; end: number } | undefined {
    const ident = readIdentPath(sql, start);
    if (!ident) {
        return undefined;
    }

    const arrows = readJsonArrows(sql, ident.end);
    let end = arrows?.end ?? ident.end;
    const operand = arrows
        ? mysqlJsonExtract(ident.ident, arrows.keys, arrows.asText)
        : ident.ident;

    const afterOperand = skipSpaces(sql, end);
    if (sql.startsWith("@>", afterOperand)) {
        const afterOp = skipSpaces(sql, afterOperand + 2);
        const placeholder = readPlaceholderToken(sql, afterOp);
        if (placeholder) {
            return {
                sql: `JSON_CONTAINS(${operand}, ${placeholder.token})`,
                end: placeholder.end,
            };
        }
        const constant = readSqlString(sql, afterOp);
        if (constant) {
            return {
                sql: `JSON_CONTAINS(${operand}, CAST(${mysqlStringLiteral(constant.value)} AS JSON))`,
                end: constant.end,
            };
        }
    }

    if (sql[afterOperand] === "?") {
        const afterOp = skipSpaces(sql, afterOperand + 1);
        const placeholder = readPlaceholderToken(sql, afterOp);
        if (placeholder) {
            return {
                sql: `JSON_CONTAINS_PATH(${operand}, 'one', CONCAT('$.', JSON_QUOTE(${placeholder.token})))`,
                end: placeholder.end,
            };
        }
        const key = readSqlString(sql, afterOp);
        if (key) {
            return {
                sql: `JSON_CONTAINS_PATH(${operand}, 'one', CONCAT('$.', JSON_QUOTE(${mysqlStringLiteral(key.value)})))`,
                end: key.end,
            };
        }
    }

    if (arrows) {
        return { sql: operand, end };
    }
    return undefined;
}

function readIdentPath(sql: string, start: number): { ident: string; end: number } | undefined {
    const first = readIdent(sql, start);
    if (!first) {
        return undefined;
    }

    let ident = first.ident;
    let end = first.end;
    while (sql[end] === ".") {
        const next = readIdent(sql, end + 1);
        if (!next) {
            break;
        }
        ident += `.${next.ident}`;
        end = next.end;
    }
    return { ident, end };
}

function readIdent(sql: string, start: number): { ident: string; end: number } | undefined {
    if (sql[start] === '"') {
        return { ident: sql.slice(start, skipQuoted(sql, start, '"')), end: skipQuoted(sql, start, '"') };
    }
    const match = sql.slice(start).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (!match) {
        return undefined;
    }
    return { ident: match[0], end: start + match[0].length };
}

function readJsonArrows(
    sql: string,
    start: number,
): { keys: string[]; asText: boolean; end: number } | undefined {
    let i = start;
    const keys: string[] = [];
    let asText = false;

    while (i < sql.length) {
        let quoteAt: number | undefined;
        if (sql.startsWith("->>'", i)) {
            quoteAt = i + 3;
            asText = true;
        } else if (sql.startsWith("->'", i)) {
            quoteAt = i + 2;
            asText = false;
        } else {
            break;
        }

        const str = readSqlString(sql, quoteAt);
        if (!str) {
            break;
        }
        keys.push(str.value);
        i = str.end;
    }

    return keys.length > 0 ? { keys, asText, end: i } : undefined;
}

function readSqlString(sql: string, start: number): { value: string; end: number } | undefined {
    if (sql[start] !== "'") {
        return undefined;
    }
    let i = start + 1;
    let value = "";
    while (i < sql.length) {
        const ch = sql[i];
        if (ch === "'" && sql[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
        }
        if (ch === "'") {
            return { value, end: i + 1 };
        }
        value += ch;
        i += 1;
    }
    return undefined;
}

function mysqlJsonExtract(ident: string, keys: string[], asText: boolean): string {
    const path = keys.map((key) => mysqlJsonPathSegment(key)).join(".");
    const extract = `JSON_EXTRACT(${ident}, '$.${path}')`;
    return asText ? `JSON_UNQUOTE(${extract})` : extract;
}

/** One JSON path member. Dots/hyphens stay a single key, matching Postgres `?`. */
function mysqlJsonPathSegment(key: string): string {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        return key;
    }
    return `"${key.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function skipSpaces(sql: string, start: number): number {
    let i = start;
    while (sql[i] === " " || sql[i] === "\t" || sql[i] === "\n") {
        i += 1;
    }
    return i;
}

/** Postgres literals use `''` only. MySQL also treats `\` as an escape unless NO_BACKSLASH_ESCAPES. */
function mysqlStringLiteral(value: string): string {
    return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function readPlaceholderToken(sql: string, start: number): { token: string; end: number } | undefined {
    const match = sql.slice(start).match(/^\$[1-9]\d*(?:::(?:jsonb|json|text))?/i);
    if (!match) {
        return undefined;
    }
    return { token: match[0], end: start + match[0].length };
}

function mysqlBindSql(cast: string | undefined): string {
    if (cast === "jsonb" || cast === "json") {
        return "CAST(? AS JSON)";
    }
    return "?";
}

function mysqlBindValue(value: unknown, cast: string | undefined): unknown {
    if ((cast === "jsonb" || cast === "json") && isJsonBindObject(value)) {
        return JSON.stringify(value);
    }
    return value;
}

function isJsonBindObject(value: unknown): value is object {
    return (
        typeof value === "object" &&
        value !== null &&
        !(value instanceof Date) &&
        !Buffer.isBuffer(value)
    );
}

function skipQuoted(sql: string, start: number, quote: "'" | '"' | "`"): number {
    let i = start + 1;
    while (i < sql.length) {
        const ch = sql[i];
        if (ch === "\\") {
            i += 2;
            continue;
        }
        if (ch === quote) {
            if (sql[i + 1] === quote) {
                i += 2;
                continue;
            }
            return i + 1;
        }
        i += 1;
    }
    return sql.length;
}

function skipLineComment(sql: string, start: number): number {
    const newline = sql.indexOf("\n", start);
    return newline === -1 ? sql.length : newline + 1;
}

function skipBlockComment(sql: string, start: number): number {
    const end = sql.indexOf("*/", start + 2);
    return end === -1 ? sql.length : end + 2;
}
