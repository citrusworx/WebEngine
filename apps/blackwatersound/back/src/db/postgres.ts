import pg from "pg";
import type { DatabaseCredentials } from "@citrusworx/nectarine/config";
import type { ProductRecord } from "../data/seed-products.js";
import type { WaitlistEntry } from "../types/context.js";

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

export async function migrate() {
  const db = getPool();
  if (!db) {
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);
  `);
}

export async function loadProductsFromDb(): Promise<ProductRecord[]> {
  const db = getPool();
  if (!db) {
    return [];
  }

  const result = await db.query<{ payload: ProductRecord }>(
    "SELECT payload FROM products ORDER BY created_at ASC",
  );

  return result.rows.map((row) => row.payload);
}

export async function seedProductsIfEmpty(products: ProductRecord[]) {
  const db = getPool();
  if (!db || products.length === 0) {
    return;
  }

  const count = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
  if (Number(count.rows[0]?.count ?? 0) > 0) {
    return;
  }

  for (const product of products) {
    await db.query(
      "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING",
      [product.id, JSON.stringify(product)],
    );
  }
}

export async function loadWaitlistFromDb(): Promise<WaitlistEntry[]> {
  const db = getPool();
  if (!db) {
    return [];
  }

  const result = await db.query<WaitlistEntry>(
    'SELECT id, name, email, created_at AS "createdAt" FROM waitlist ORDER BY created_at ASC',
  );

  return result.rows;
}

export async function insertWaitlistEntry(entry: WaitlistEntry) {
  const db = getPool();
  if (!db) {
    throw new Error("Database is not configured");
  }

  await db.query(
    "INSERT INTO waitlist (id, name, email, created_at) VALUES ($1, $2, $3, $4)",
    [entry.id, entry.name, entry.email, entry.createdAt],
  );
}

export async function waitlistEmailExists(email: string) {
  const db = getPool();
  if (!db) {
    return false;
  }

  const result = await db.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM waitlist WHERE email = $1) AS exists",
    [email],
  );

  return Boolean(result.rows[0]?.exists);
}
