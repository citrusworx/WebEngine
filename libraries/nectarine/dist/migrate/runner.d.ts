/**
 * Apply schema bootstrap + versioned migrations through an adapter `query()`.
 *
 * Order (greenfield and existing volumes):
 * 1. Ledger table (`nectarine_schema_migrations`)
 * 2. `CREATE TABLE IF NOT EXISTS` from current `*Schema.yml`
 * 3. Pending versioned migrations (rename / drop / type change) with skip-if-already-there
 * 4. Additive `ADD COLUMN IF NOT EXISTS` (Postgres) for genuinely new columns
 * 5. `CREATE INDEX` from current schema (after rename, so existing volumes do
 *    not index a column that still has the old name)
 *
 * Each pending migration’s ops + ledger insert run in one transaction
 * (Postgres `BEGIN`/`COMMIT` on a pinned connection via `withTransaction`).
 * MySQL DDL implicit-commits, so a later op cannot undo an earlier ALTER.
 *
 * Not Flyway: no down migrations, no raw SQL scripts, no silent schema-diff.
 */
import { type DdlVendor } from "../compiler/ddl.js";
import { MigrationCompileError, type CompiledMigration, type CompiledMigrationOp } from "../compiler/migration.js";
export declare class MigrationRunError extends Error {
    constructor(message: string);
}
export type MigrationQuery = (sql: string, params?: readonly unknown[]) => Promise<unknown>;
export type MigrationExecutor = {
    query: MigrationQuery;
    /**
     * Run `work` on one connection. Required for real Postgres atomicity when
     * `query()` is a pool (`pg.Pool.query` would otherwise BEGIN on one client
     * and ALTER on another). The Postgres adapter implements this.
     */
    withTransaction?: <T>(work: (query: MigrationQuery) => Promise<T>) => Promise<T>;
};
export type ProtectedColumn = {
    table: string;
    column: string;
};
export type ApplyMigrationsOptions = {
    execute: MigrationExecutor;
    vendor?: DdlVendor | string;
    /** Current `*Schema.yml` documents (parsed objects or paths). */
    schemas?: unknown[];
    /** Versioned migration documents (parsed objects, paths, or directory-loaded). */
    migrations?: unknown[];
    /**
     * Catalog / schema used for information_schema lookups.
     * Postgres default `public`. MySQL callers should pass the database name.
     */
    tableSchema?: string;
    /** Columns the runner will refuse to rename, drop, or retype. */
    protectedColumns?: readonly ProtectedColumn[];
};
export type MigrationRunResult = {
    applied: string[];
    skipped: string[];
};
/**
 * Apply pending compiled migrations, then record versions in the ledger.
 */
export declare function applyMigrations(options: ApplyMigrationsOptions): Promise<MigrationRunResult>;
export { MigrationCompileError };
export type { CompiledMigration, CompiledMigrationOp };
