import { createPgAdapter, type PgSql } from "@citrusworx/nectarine/adapters/pg";
import type { DatabaseCredentials } from "@citrusworx/nectarine/config";
import type { QueryResultRow } from "pg";
import type { ProductRecord } from "../data/seed-products.js";
import type { WaitlistEntry } from "../types/context.js";
import { namedDdl, type NamedDdl } from "./named-ddl.js";
import { bindJsonbDocument, namedQuery, type NamedQuery } from "./named-queries.js";

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

/** Execute compiler-owned schema DDL. Equivalent to `adapter.query(sql)`. */
async function runNamedDdl(name: NamedDdl) {
  const db = getAdapter();
  if (!db) {
    return;
  }

  await db.query(namedDdl(name));
}

/** Execute a compiler-owned named query. Equivalent to `adapter.query(sql, params)`. */
async function runNamed<T extends QueryResultRow>(
  name: NamedQuery,
  params: readonly unknown[] = [],
) {
  const db = getAdapter();
  if (!db) {
    return null;
  }

  return db.query<T>(namedQuery(name), params);
}

export async function migrate() {
  await runNamedDdl("bootstrap");
}

function asProductRecord(payload: unknown): ProductRecord | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const row = payload as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string") {
    return null;
  }

  return payload as ProductRecord;
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
  const result = await runNamed<WaitlistRow>("entryByEmail", [email]);
  return Boolean(result && result.rows.length > 0);
}
