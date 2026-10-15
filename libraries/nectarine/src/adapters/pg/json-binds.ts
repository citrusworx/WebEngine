/**
 * Encode `$N::json` / `$N::jsonb` binds before they reach `pg`.
 *
 * node-postgres sends a JavaScript array as a Postgres array. A JSONB column
 * then rejects `["peaches"]` (or stores the wrong type). Objects are already
 * JSON-encoded by the driver, but arrays are not. Stringify both here so a
 * schema `json` / `jsonb` column — marked in SQL by the compiler cast — can
 * take a plain object or array. Strings, numbers, booleans, null, Date, and
 * Buffer stay as given, so a caller that already passed `JSON.stringify`
 * output is not encoded twice.
 */

const PLACEHOLDER_AT = /^\$([1-9]\d*)(?:::([A-Za-z_][A-Za-z0-9_]*))?/;

export function encodePgJsonBinds(sql: string, params: readonly unknown[]): unknown[] {
    const jsonIndexes = jsonBindIndexes(sql);
    if (jsonIndexes.size === 0) {
        return params as unknown[];
    }

    return params.map((value, index) =>
        jsonIndexes.has(index + 1) ? encodeJsonValue(value) : value,
    );
}

function jsonBindIndexes(sql: string): Set<number> {
    const indexes = new Set<number>();
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

        if (ch === "$") {
            const match = sql.slice(i).match(PLACEHOLDER_AT);
            if (match && match[1] !== undefined && match[0] !== undefined) {
                const cast = match[2]?.toLowerCase();
                if (cast === "json" || cast === "jsonb") {
                    indexes.add(Number(match[1]));
                }
                i += match[0].length;
                continue;
            }
        }

        i += 1;
    }

    return indexes;
}

function encodeJsonValue(value: unknown): unknown {
    if (!isJsonBindObject(value)) {
        return value;
    }

    try {
        const encoded = JSON.stringify(value);
        if (typeof encoded !== "string") {
            throw new Error("value is not JSON-serializable");
        }
        return encoded;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Postgres adapter cannot encode JSON bind: ${message}`);
    }
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
