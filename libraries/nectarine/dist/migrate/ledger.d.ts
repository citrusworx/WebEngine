/**
 * Compiler-owned ledger table and named queries.
 *
 * Tokens are assembled by compileSchema / compileQuery — the runner never
 * concatenates SQL, and app backends never embed these statements.
 */
export declare const LEDGER_TABLE = "nectarine_schema_migrations";
export declare const LEDGER_SCHEMA: {
    readonly NectarineSchemaMigration: {
        readonly table: "nectarine_schema_migrations";
        readonly fields: {
            readonly version: "string PRIMARY KEY";
            readonly checksum: "string NOT NULL";
            readonly applied_at: "timestamp NOT NULL DEFAULT NOW()";
        };
    };
};
export declare function ledgerCreateTableSql(vendor?: string): string;
export declare const ledgerListSql: string;
export declare const ledgerInsertSql: string;
export declare const columnExistsSql: string;
