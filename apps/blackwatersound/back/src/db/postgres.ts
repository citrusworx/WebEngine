import pg from "pg";
import type { DatabaseCredentials } from "@citrusworx/nectarine/config";
import type { ProductRecord } from "../data/seed-products.js";
import type { WaitlistEntry } from "../types/context.js";
import { bindJsonbDocument, namedQuery, type NamedQuery } from "./named-queries.js";
import { phase3Ddl, type Phase3DdlName } from "./phase3-ddl.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

/** Configure pool from Nectarine-resolved vendor credentials (`PG_*` etc.). */
export function configurePool(creds: DatabaseCredentials | null) {
  if (!creds) {
    pool = null;
    return null;
  }

  if (!pool) {
    pool = new Pool({
      user: creds.user,
      password: creds.password,
      host: creds.host,
      port: creds.port,
      database: creds.database,
    });
  }

  return pool;
}

export function getPool() {
  return pool;
}

/** Phase 3: replace with schema-YAML DDL. Single path for remaining bootstrap SQL. */
async function runNamedDdl(name: Phase3DdlName) {
  const db = getPool();
  if (!db) {
    return;
  }

  await db.query(phase3Ddl[name]);
}

/** Execute a compiler-owned named query. Equivalent to `adapter.query(sql, params)`. */
async function runNamed<T extends pg.QueryResultRow>(
  name: NamedQuery,
  params: readonly unknown[] = [],
) {
  const db = getPool();
  if (!db) {
    return null;
  }

  return db.query<T>(namedQuery(name), params as unknown[]);
}

export async function migrate() {
  await runNamedDdl("bootstrapLiveTables");
}

export async function loadProductsFromDb(): Promise<ProductRecord[]> {
  const result = await runNamed<{ payload: ProductRecord }>("allPayloads");
  if (!result) {
    return [];
  }

  return result.rows.map((row) => row.payload);
}

export async function seedProductsIfEmpty(products: ProductRecord[]) {
  if (!getPool() || products.length === 0) {
    return;
  }

  const existing = await loadProductsFromDb();
  if (existing.length > 0) {
    return;
  }

  for (const product of products) {
    const found = await runNamed<{ payload: ProductRecord }>("payloadById", [product.id]);
    if (found && found.rows.length > 0) {
      continue;
    }

    await runNamed("seedPayload", [product.id, bindJsonbDocument(product)]);
  }
}

type WaitlistRow = {
  id: string;
  name: string;
  email: string;
  created_at: Date | string;
};

function toWaitlistEntry(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export async function loadWaitlistFromDb(): Promise<WaitlistEntry[]> {
  const result = await runNamed<WaitlistRow>("allEntries");
  if (!result) {
    return [];
  }

  return result.rows.map(toWaitlistEntry);
}

export async function insertWaitlistEntry(entry: WaitlistEntry) {
  const result = await runNamed("insertEntry", [
    entry.id,
    entry.name,
    entry.email,
    entry.createdAt,
  ]);

  if (!result) {
    throw new Error("Database is not configured");
  }
}

export async function waitlistEmailExists(email: string) {
  const result = await runNamed<WaitlistRow>("entryByEmail", [email]);
  return Boolean(result && result.rows.length > 0);
}
