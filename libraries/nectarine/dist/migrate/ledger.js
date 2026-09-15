"use strict";
/**
 * Compiler-owned ledger table and named queries.
 *
 * Tokens are assembled by compileSchema / compileQuery — the runner never
 * concatenates SQL, and app backends never embed these statements.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.columnExistsSql = exports.ledgerInsertSql = exports.ledgerListSql = exports.LEDGER_SCHEMA = exports.LEDGER_TABLE = void 0;
exports.ledgerCreateTableSql = ledgerCreateTableSql;
const ddl_js_1 = require("../compiler/ddl.js");
const sql_js_1 = require("../compiler/sql.js");
exports.LEDGER_TABLE = "nectarine_schema_migrations";
exports.LEDGER_SCHEMA = {
    NectarineSchemaMigration: {
        table: exports.LEDGER_TABLE,
        fields: {
            version: "string PRIMARY KEY",
            checksum: "string NOT NULL",
            applied_at: "timestamp NOT NULL DEFAULT NOW()",
        },
    },
};
function ledgerCreateTableSql(vendor = "postgres") {
    return (0, ddl_js_1.compileSchema)(exports.LEDGER_SCHEMA, vendor);
}
exports.ledgerListSql = (0, sql_js_1.compileQuery)({
    select: ["version", "checksum"],
    from: exports.LEDGER_TABLE,
    orderBy: [{ column: "version", direction: "ASC" }],
}, "get");
exports.ledgerInsertSql = (0, sql_js_1.compileQuery)({
    insert: {
        into: exports.LEDGER_TABLE,
        columns: ["version", "checksum"],
        values: ["$1", "$2"],
    },
}, "create");
exports.columnExistsSql = (0, sql_js_1.compileQuery)({
    select: ["column_name"],
    from: "information_schema.columns",
    where: {
        and: [
            { column: "table_schema", operator: "eq", value: "$1" },
            { column: "table_name", operator: "eq", value: "$2" },
            { column: "column_name", operator: "eq", value: "$3" },
        ],
    },
}, "get");
//# sourceMappingURL=ledger.js.map