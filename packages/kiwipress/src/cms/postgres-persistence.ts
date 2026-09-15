import { CMS_COLLECTIONS, type CmsSnapshot, type ContentRecord } from "./types.js";
import { emptySnapshot, isCmsCollection, type CmsPersistence } from "./persistence.js";

export type SqlQueryResult = {
    rows?: unknown[];
};

export type SqlExecutor = {
    query(sql: string, params?: unknown[]): Promise<SqlQueryResult | undefined>;
};

export type PostgresPersistenceOptions = {
    database?: string;
    table?: string;
    executor?: SqlExecutor;
};

const DEFAULT_TABLE = "kiwipress_content";

function tableName(value = DEFAULT_TABLE): string {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
        throw new Error(`KiwiPress Postgres table name is invalid: ${value}`);
    }

    return value;
}

function asRecord(value: unknown): ContentRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const record = value as ContentRecord;
    if (typeof record.id !== "string" || !isCmsCollection(record.collection)) {
        return null;
    }

    return record;
}

function rowRecord(row: unknown): ContentRecord | null {
    const object = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
    if (!object) {
        return null;
    }

    const raw = object.record;
    if (typeof raw === "string") {
        try {
            return asRecord(JSON.parse(raw));
        } catch {
            return null;
        }
    }

    return asRecord(raw);
}

async function runQuery(executor: SqlExecutor, sql: string, params?: unknown[]): Promise<SqlQueryResult> {
    const result = await executor.query(sql, params);
    if (result === undefined) {
        throw new Error(`KiwiPress Postgres query failed: ${sql.trim().split(/\s+/)[0] ?? "query"}`);
    }

    return result;
}

async function createNectarinePgExecutor(database: string): Promise<SqlExecutor> {
    const { PgSql } = await import("@citrusworx/nectarine/adapters/pg");
    const pg = new PgSql();
    pg.addDb(database);
    const client = await pg.connect(database);

    if (!client) {
        throw new Error(
            "KiwiPress Postgres persistence could not connect. Set PG_USER, PG_PASS, PG_HOST, PG_PORT, and pass a database name."
        );
    }

    return {
        query(sql, params) {
            return pg.query(client, { sql, params });
        }
    };
}

export function createPostgresPersistence(options: PostgresPersistenceOptions = {}): CmsPersistence {
    const table = tableName(options.table);
    let executorPromise: Promise<SqlExecutor> | undefined;

    async function executor(): Promise<SqlExecutor> {
        if (options.executor) {
            return options.executor;
        }

        if (!executorPromise) {
            const database = options.database?.trim();
            if (!database) {
                throw new Error("KiwiPress Postgres persistence requires options.database or an injected executor.");
            }

            executorPromise = createNectarinePgExecutor(database);
        }

        return executorPromise;
    }

    async function ensureSchema(sql: SqlExecutor) {
        await runQuery(
            sql,
            `CREATE TABLE IF NOT EXISTS ${table} (
                collection TEXT NOT NULL,
                id TEXT NOT NULL,
                record JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (collection, id)
            )`
        );
    }

    return {
        kind: "postgres",
        async load() {
            const sql = await executor();
            await ensureSchema(sql);
            const result = await runQuery(sql, `SELECT collection, id, record FROM ${table}`);
            const rows = result.rows ?? [];
            if (rows.length === 0) {
                return null;
            }

            const snapshot = emptySnapshot();
            for (const row of rows) {
                const record = rowRecord(row);
                if (record) {
                    snapshot[record.collection].push(record);
                }
            }

            return snapshot;
        },
        async save(snapshot: CmsSnapshot) {
            const sql = await executor();
            await ensureSchema(sql);
            await runQuery(sql, `DELETE FROM ${table}`);

            for (const collection of CMS_COLLECTIONS) {
                for (const record of snapshot[collection]) {
                    await runQuery(
                        sql,
                        `INSERT INTO ${table} (collection, id, record, updated_at) VALUES ($1, $2, $3::jsonb, NOW())`,
                        [collection, record.id, JSON.stringify(record)]
                    );
                }
            }
        }
    };
}
