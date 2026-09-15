import { createPgAdapter, type PgSql } from "@citrusworx/nectarine/adapters/pg";
import type { DatabaseCredentials } from "@citrusworx/nectarine/config";
import type { QueryResultRow } from "pg";
import { asProductRecord, type ProductRecord } from "../data/seed-products.js";
import type { WaitlistEntry } from "../types/context.js";
import { namedQuery, bindJsonbDocument, type NamedQuery } from "./named-queries.js";
import { applyNamedMigrations } from "./named-ddl.js";

let adapter: PgSql | null = null;

/** Configure the Nectarine Postgres adapter from resolved vendor credentials. */
export function configureDatabase(creds: DatabaseCredentials | null) {
  if (!creds) {
    adapter = null;
    return null;
  }

  if (!adapter) {
    adapter = createPgAdapter(creds);
  }

  return adapter;
}

export function getAdapter() {
  return adapter;
}

export function isDatabaseConnected() {
  return adapter?.connected === true;
}

export async function connectDatabase() {
  const db = getAdapter();
  if (!db) {
    return null;
  }

  await db.connect();
  return db;
}

/** Close the pool. Safe to call when no adapter was configured or connect failed. */
export async function closeDatabase() {
  const db = adapter;
  adapter = null;
  if (!db) {
    return;
  }

  await db.disconnect().catch(() => undefined);
}

export async function migrate() {
  const db = getAdapter();
  if (!db) {
    return;
  }

  await applyNamedMigrations(db);
}

/** Execute compiler-owned SQL. Equivalent to `adapter.query(sql, params)`. */
export async function runCompiledQuery<T extends QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
) {
  const db = getAdapter();
  if (!db) {
    return null;
  }

  return db.query<T>(sql, params);
}

/** Execute a compiler-owned named query. Equivalent to `adapter.query(sql, params)`. */
async function runNamed<T extends QueryResultRow>(
  name: NamedQuery,
  params: readonly unknown[] = [],
) {
  return runCompiledQuery<T>(namedQuery(name), params);
}

function rowsAffected(result: { rowCount?: number | null } | null): number {
  return result?.rowCount ?? 0;
}

export async function loadProductsFromDb(): Promise<ProductRecord[]> {
  const result = await runNamed<{ payload: unknown }>("allPayloads");
  if (!result) {
    return [];
  }

  return result.rows.flatMap((row) => {
    const product = asProductRecord(row.payload);
    return product ? [product] : [];
  });
}

export async function loadProductByIdFromDb(id: string): Promise<ProductRecord | null> {
  const result = await runNamed<{ payload: unknown }>("payloadById", [id]);
  if (!result || result.rows.length === 0) {
    return null;
  }

  return asProductRecord(result.rows[0]?.payload);
}

export async function seedProductsIfEmpty(products: ProductRecord[]) {
  if (!isDatabaseConnected() || products.length === 0) {
    return;
  }

  const existing = await loadProductsFromDb();
  if (existing.length > 0) {
    return;
  }

  for (const product of products) {
    const found = await runNamed<{ payload: unknown }>("payloadById", [product.id]);
    if (found && found.rows.length > 0) {
      continue;
    }

    await runNamed("seedPayload", [product.id, bindJsonbDocument(product)]);
  }
}

/** Insert a catalog document into `products.payload`. Caller checks duplicates. */
export async function insertProductPayload(product: ProductRecord): Promise<ProductRecord> {
  const result = await runNamed<{ payload: unknown }>("insertPayload", [
    product.id,
    bindJsonbDocument(product),
  ]);
  if (!result) {
    throw new Error("Database is not configured");
  }

  return asProductRecord(result.rows[0]?.payload) ?? product;
}

/**
 * Replace `products.payload` for `id`. Host merges the catalog document first;
 * this named query cannot express JSONB `||`.
 */
export async function updateProductPayload(id: string, product: ProductRecord): Promise<boolean> {
  const result = await runNamed("updatePayload", [bindJsonbDocument(product), id]);
  if (!result) {
    throw new Error("Database is not configured");
  }

  return rowsAffected(result) > 0;
}

export async function deleteProductFromDb(id: string): Promise<boolean> {
  const result = await runNamed("deleteProduct", [id]);
  if (!result) {
    throw new Error("Database is not configured");
  }

  return rowsAffected(result) > 0;
}

type WaitlistRow = {
  id: string;
  name: string;
  email: string;
  source_app: string | null;
  interest: string | null;
  created_at: Date | string;
};

function toWaitlistEntry(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    sourceApp: row.source_app ?? undefined,
    interest: row.interest ?? undefined,
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

export async function loadWaitlistByEmailFromDb(email: string): Promise<WaitlistEntry | null> {
  const result = await runNamed<WaitlistRow>("entryByEmail", [email]);
  const row = result?.rows[0];
  return row ? toWaitlistEntry(row) : null;
}

export async function insertWaitlistEntry(entry: WaitlistEntry) {
  const result = await runNamed("joinWaitlist", [
    entry.id,
    entry.name,
    entry.email,
    entry.sourceApp ?? null,
    entry.interest ?? null,
  ]);

  if (!result) {
    throw new Error("Database is not configured");
  }
}

export async function waitlistEmailExists(email: string) {
  return Boolean(await loadWaitlistByEmailFromDb(email));
}
