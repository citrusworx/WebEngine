"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteMysqlPlaceholders = rewriteMysqlPlaceholders;
const placeholders_js_1 = require("../../compiler/placeholders.js");
const BIND_CAST_SET = new Set(placeholders_js_1.BIND_CASTS);
/**
 * `$1` or `$1::jsonb` (and the other allowlisted bind casts) at the current
 * offset. Group 1 is the 1-based index; group 2 is an optional `::cast`.
 */
const PLACEHOLDER_AT = /^\$([1-9]\d*)(?:::([A-Za-z_][A-Za-z0-9_]*))?/;
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
 * SQL that already uses `?` and has no `$N` binds is returned unchanged.
 */
function rewriteMysqlPlaceholders(sql, params = []) {
    let i = 0;
    let sawNumbered = false;
    let sawPositional = false;
    let out = "";
    const bound = [];
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
        if (ch === "?") {
            sawPositional = true;
            out += ch;
            i += 1;
            continue;
        }
        if (ch === "$") {
            const slice = sql.slice(i);
            const match = slice.match(PLACEHOLDER_AT);
            if (!match || match[1] === undefined) {
                out += ch;
                i += 1;
                continue;
            }
            const index = Number(match[1]);
            const cast = match[2]?.toLowerCase();
            if (cast !== undefined && !BIND_CAST_SET.has(cast)) {
                throw new Error(`MySQL adapter cannot rewrite unsupported bind cast $${index}::${cast}`);
            }
            if (!Number.isInteger(index) || index < 1 || index > params.length) {
                throw new Error(`MySQL adapter cannot bind $${index}; received ${params.length} parameter(s)`);
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
        return { sql, params: [...params] };
    }
    return { sql: out, params: bound };
}
function mysqlBindSql(cast) {
    if (cast === "jsonb" || cast === "json") {
        return "CAST(? AS JSON)";
    }
    return "?";
}
function mysqlBindValue(value, cast) {
    if ((cast === "jsonb" || cast === "json") && isJsonBindObject(value)) {
        return JSON.stringify(value);
    }
    return value;
}
function isJsonBindObject(value) {
    return (typeof value === "object" &&
        value !== null &&
        !(value instanceof Date) &&
        !Buffer.isBuffer(value));
}
function skipQuoted(sql, start, quote) {
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
function skipLineComment(sql, start) {
    const newline = sql.indexOf("\n", start);
    return newline === -1 ? sql.length : newline + 1;
}
function skipBlockComment(sql, start) {
    const end = sql.indexOf("*/", start + 2);
    return end === -1 ? sql.length : end + 2;
}
//# sourceMappingURL=placeholders.js.map