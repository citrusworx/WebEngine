/**
 * Compiler-owned ledger table and named queries.
 *
 * Tokens are assembled by compileSchema / compileQuery — the runner never
 * concatenates SQL, and app backends never embed these statements.
 */

import { compileSchema } from "../compiler/ddl.js";
import { compileQuery } from "../compiler/sql.js";

export const LEDGER_TABLE = "nectarine_schema_migrations";

export const LEDGER_SCHEMA = {
    NectarineSchemaMigration: {
        table: LEDGER_TABLE,
        fields: {
            version: "string PRIMARY KEY",
            checksum: "string NOT NULL",
            applied_at: "timestamp NOT NULL DEFAULT NOW()",
        },
    },
} as const;

export function ledgerCreateTableSql(vendor: string = "postgres"): string {
    return compileSchema(LEDGER_SCHEMA, vendor);
}

export const ledgerListSql = compileQuery(
    {
        select: ["version", "checksum"],
        from: LEDGER_TABLE,
        orderBy: [{ column: "version", direction: "ASC" }],
    },
    "get",
);

export const ledgerInsertSql = compileQuery(
    {
        insert: {
            into: LEDGER_TABLE,
            columns: ["version", "checksum"],
            values: ["$1", "$2"],
        },
    },
    "create",
);

export const columnExistsSql = compileQuery(
    {
        select: ["column_name"],
        from: "information_schema.columns",
        where: {
            and: [
                { column: "table_schema", operator: "eq", value: "$1" },
                { column: "table_name", operator: "eq", value: "$2" },
                { column: "column_name", operator: "eq", value: "$3" },
            ],
        },
    },
    "get",
);
