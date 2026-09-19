import { emptySnapshot } from "./persistence.js";
import { asTypeDefinition, isCollectionSlug, PERSISTED_TYPES_COLLECTION } from "./type-registry.js";
const DEFAULT_TABLE = "kiwipress_content";
function tableName(value = DEFAULT_TABLE) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
        throw new Error(`KiwiPress Postgres table name is invalid: ${value}`);
    }
    return value;
}
function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    const record = value;
    if (typeof record.id !== "string" || !isCollectionSlug(record.collection)) {
        return null;
    }
    return record;
}
function rowRecord(row) {
    const object = row && typeof row === "object" ? row : null;
    if (!object) {
        return null;
    }
    const raw = object.record;
    if (typeof raw === "string") {
        try {
            return asRecord(JSON.parse(raw));
        }
        catch {
            return null;
        }
    }
    return asRecord(raw);
}
function rowType(row) {
    const object = row && typeof row === "object" ? row : null;
    if (!object) {
        return null;
    }
    const raw = object.record;
    if (typeof raw === "string") {
        try {
            return asTypeDefinition(JSON.parse(raw));
        }
        catch {
            return null;
        }
    }
    return asTypeDefinition(raw);
}
async function runQuery(executor, sql, params) {
    const result = await executor.query(sql, params);
    if (result === undefined) {
        throw new Error(`KiwiPress Postgres query failed: ${sql.trim().split(/\s+/)[0] ?? "query"}`);
    }
    return result;
}
async function createNectarinePgExecutor(database) {
    const { PgSql } = await import("@citrusworx/nectarine/adapters/pg");
    const user = process.env.PG_USER?.trim();
    const password = process.env.PG_PASS?.trim() || process.env.PG_PASSWORD?.trim();
    const host = process.env.PG_HOST?.trim();
    const port = Number(process.env.PG_PORT ?? 5432);
    if (!user || !password || !host || !Number.isFinite(port)) {
        throw new Error("KiwiPress Postgres persistence could not connect. Set PG_USER, PG_PASS, PG_HOST, PG_PORT, and pass a database name.");
    }
    const pg = new PgSql({
        user,
        password,
        host,
        port,
        database
    });
    await pg.connect();
    return {
        query(sql, params) {
            return pg.query(sql, params);
        }
    };
}
function collectionEntries(snapshot) {
    return Object.entries(snapshot).filter((entry) => Array.isArray(entry[1]));
}
export function createPostgresPersistence(options = {}) {
    const table = tableName(options.table);
    let executorPromise;
    async function executor() {
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
    async function ensureSchema(sql) {
        await runQuery(sql, `CREATE TABLE IF NOT EXISTS ${table} (
                collection TEXT NOT NULL,
                id TEXT NOT NULL,
                record JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (collection, id)
            )`);
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
            const types = [];
            for (const row of rows) {
                const object = row && typeof row === "object" ? row : null;
                if (object?.collection === PERSISTED_TYPES_COLLECTION) {
                    const definition = rowType(row);
                    if (definition) {
                        types.push(definition);
                    }
                    continue;
                }
                const record = rowRecord(row);
                if (record) {
                    if (!snapshot[record.collection]) {
                        snapshot[record.collection] = [];
                    }
                    snapshot[record.collection].push(record);
                }
            }
            return { collections: snapshot, types };
        },
        async save(document) {
            const sql = await executor();
            await ensureSchema(sql);
            await runQuery(sql, `DELETE FROM ${table}`);
            for (const [collection, records] of collectionEntries(document.collections)) {
                if (collection === PERSISTED_TYPES_COLLECTION) {
                    continue;
                }
                for (const record of records) {
                    await runQuery(sql, `INSERT INTO ${table} (collection, id, record, updated_at) VALUES ($1, $2, $3::jsonb, NOW())`, [collection, record.id, JSON.stringify(record)]);
                }
            }
            for (const definition of document.types) {
                await runQuery(sql, `INSERT INTO ${table} (collection, id, record, updated_at) VALUES ($1, $2, $3::jsonb, NOW())`, [PERSISTED_TYPES_COLLECTION, definition.slug, JSON.stringify(definition)]);
            }
        }
    };
}
//# sourceMappingURL=postgres-persistence.js.map