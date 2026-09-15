/**
 * SQL identifier quoting.
 *
 * Unquoted Postgres identifiers fold to lowercase (`originalPrice` →
 * `originalprice`). YAML field names keep their casing: mixed-case names are
 * emitted quoted (`"originalPrice"`). All-lowercase names stay unquoted
 * (folding is a no-op). MySQL uses backticks for mixed-case names.
 */
export declare const IDENTIFIER: RegExp;
export type IdentVendor = "postgres" | "mysql";
export declare function isSqlIdentifier(name: string): boolean;
export declare function isSqlIdentifierPath(name: string): boolean;
/**
 * Preserve YAML casing in emitted SQL. Lowercase identifiers are left
 * unquoted; any uppercase letter is quoted.
 */
export declare function quoteIdent(name: string, vendor?: IdentVendor): string;
export declare function quoteIdentPath(name: string, vendor?: IdentVendor): string;
