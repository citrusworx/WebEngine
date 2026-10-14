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
export declare function encodePgJsonBinds(sql: string, params: readonly unknown[]): unknown[];
