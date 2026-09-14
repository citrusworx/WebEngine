"use strict";
/**
 * SQL identifier quoting.
 *
 * Unquoted Postgres identifiers fold to lowercase (`originalPrice` →
 * `originalprice`). YAML field names keep their casing: mixed-case names are
 * emitted quoted (`"originalPrice"`). All-lowercase names stay unquoted
 * (folding is a no-op). MySQL uses backticks for mixed-case names.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTIFIER = void 0;
exports.isSqlIdentifier = isSqlIdentifier;
exports.isSqlIdentifierPath = isSqlIdentifierPath;
exports.quoteIdent = quoteIdent;
exports.quoteIdentPath = quoteIdentPath;
exports.IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
function isSqlIdentifier(name) {
    return exports.IDENTIFIER.test(name);
}
function isSqlIdentifierPath(name) {
    const parts = name.split(".");
    return parts.length > 0 && parts.every((part) => isSqlIdentifier(part));
}
/**
 * Preserve YAML casing in emitted SQL. Lowercase identifiers are left
 * unquoted; any uppercase letter is quoted.
 */
function quoteIdent(name, vendor = "postgres") {
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
function quoteIdentPath(name, vendor = "postgres") {
    return name.split(".").map((part) => quoteIdent(part, vendor)).join(".");
}
//# sourceMappingURL=identifiers.js.map