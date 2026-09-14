/**
 * SQL identifier quoting.
 *
 * Unquoted Postgres identifiers fold to lowercase (`originalPrice` →
 * `originalprice`). YAML field names keep their casing: mixed-case names are
 * emitted quoted (`"originalPrice"`). All-lowercase names stay unquoted
 * (folding is a no-op). MySQL uses backticks for mixed-case names.
 */

export const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export type IdentVendor = "postgres" | "mysql";

export function isSqlIdentifier(name: string): boolean {
    return IDENTIFIER.test(name);
}

export function isSqlIdentifierPath(name: string): boolean {
    const parts = name.split(".");
    return parts.length > 0 && parts.every((part) => isSqlIdentifier(part));
}

/**
 * Preserve YAML casing in emitted SQL. Lowercase identifiers are left
 * unquoted; any uppercase letter is quoted.
 */
export function quoteIdent(name: string, vendor: IdentVendor = "postgres"): string {
    if (name === "*") {
        return "*";
    }
    if (name === name.toLowerCase()) {
        return name;
    }
    if (vendor === "mysql") {
        return `\`${name.replace(/`/g, "``")}\``;
    }
    return `"${name.replace(/"/g, '""')}"`;
}

export function quoteIdentPath(name: string, vendor: IdentVendor = "postgres"): string {
    return name.split(".").map((part) => quoteIdent(part, vendor)).join(".");
}
