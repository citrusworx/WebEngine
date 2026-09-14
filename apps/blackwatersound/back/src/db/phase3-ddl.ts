/**
 * Temporary bootstrap DDL for the live JSONB-era tables.
 *
 * PHASE 3 TODO: emit CREATE TABLE / indexes from *Schema.yml and retire this
 * module. Docker `init.sql` must stay in lockstep until then.
 *
 * DML does not belong here. App helpers call named compiled queries only.
 */
export const phase3Ddl = {
  bootstrapLiveTables: `
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
  `,
} as const;

export type Phase3DdlName = keyof typeof phase3Ddl;
