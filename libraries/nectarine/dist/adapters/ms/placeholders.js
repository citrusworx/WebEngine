"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteMysqlPlaceholders = rewriteMysqlPlaceholders;
exports.rewriteMysqlJsonbOperators = rewriteMysqlJsonbOperators;
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
 * JSONB operators the compiler emits (`@>`, `?`, `->>`) are rewritten first
 * so the Postgres `?` key check is not mistaken for a MySQL placeholder:
 * - `payload->>'catalog'` → `JSON_UNQUOTE(JSON_EXTRACT(payload, '$.catalog'))`
 * - `payload @> $1::jsonb` → `JSON_CONTAINS(payload, CAST(? AS JSON))`
 * - `payload ? $1` → `JSON_CONTAINS_PATH(payload, 'one', CONCAT('$.', ?))`
 *
 * SQL that already uses `?` and has no `$N` binds is returned unchanged.
 */
function rewriteMysqlPlaceholders(sql, params = []) {
    const rewritten = rewriteMysqlJsonbOperators(sql);
    let i = 0;
    let sawNumbered = false;
    let sawPositional = false;
    let out = "";
    const bound = [];
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
        return { sql: rewritten, params: [...params] };
    }
    return { sql: out, params: bound };
}
/**
 * Rewrite compiler JSONB operators to MySQL JSON functions so Postgres `?`
 * is not treated as a positional placeholder.
 */
function rewriteMysqlJsonbOperators(sql) {
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
function hasJsonbOperator(sql) {
    return sql.includes("->>") || sql.includes("->'") || sql.includes(" @> ") || / \? \$/.test(sql);
}
function isIdentBoundary(sql, index) {
    if (index > 0) {
        const prev = sql[index - 1];
        if (prev !== undefined && /[A-Za-z0-9_]/.test(prev)) {
            return false;
        }
    }
    const ch = sql[index];
    return ch === '"' || (ch !== undefined && /[A-Za-z_]/.test(ch));
}
function rewriteJsonbOperand(sql, start) {
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
    }
    if (sql[afterOperand] === "?") {
        const afterOp = skipSpaces(sql, afterOperand + 1);
        const placeholder = readPlaceholderToken(sql, afterOp);
        if (placeholder) {
            return {
                sql: `JSON_CONTAINS_PATH(${operand}, 'one', CONCAT('$.', ${placeholder.token}))`,
                end: placeholder.end,
            };
        }
        const key = readSqlString(sql, afterOp);
        if (key) {
            const path = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key.value)
                ? `$.${key.value}`
                : `$."${key.value.replace(/"/g, '\\"')}"`;
            return {
                sql: `JSON_CONTAINS_PATH(${operand}, 'one', '${path}')`,
                end: key.end,
            };
        }
    }
    if (arrows) {
        return { sql: operand, end };
    }
    return undefined;
}
function readIdentPath(sql, start) {
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
function readIdent(sql, start) {
    if (sql[start] === '"') {
        return { ident: sql.slice(start, skipQuoted(sql, start, '"')), end: skipQuoted(sql, start, '"') };
    }
    const match = sql.slice(start).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (!match) {
        return undefined;
    }
    return { ident: match[0], end: start + match[0].length };
}
function readJsonArrows(sql, start) {
    let i = start;
    const keys = [];
    let asText = false;
    while (i < sql.length) {
        let quoteAt;
        if (sql.startsWith("->>'", i)) {
            quoteAt = i + 3;
            asText = true;
        }
        else if (sql.startsWith("->'", i)) {
            quoteAt = i + 2;
            asText = false;
        }
        else {
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
function readSqlString(sql, start) {
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
function mysqlJsonExtract(ident, keys, asText) {
    const path = keys
        .map((key) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : `"${key.replace(/"/g, '\\"')}"`))
        .join(".");
    const extract = `JSON_EXTRACT(${ident}, '$.${path}')`;
    return asText ? `JSON_UNQUOTE(${extract})` : extract;
}
function skipSpaces(sql, start) {
    let i = start;
    while (sql[i] === " " || sql[i] === "\t" || sql[i] === "\n") {
        i += 1;
    }
    return i;
}
function readPlaceholderToken(sql, start) {
    const match = sql.slice(start).match(/^\$[1-9]\d*(?:::(?:jsonb|json|text))?/i);
    if (!match) {
        return undefined;
    }
    return { token: match[0], end: start + match[0].length };
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