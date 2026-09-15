import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { namedSql } from "./named-queries.js";

const state = vi.hoisted(() => ({
  queries: [] as { sql: string; params?: readonly unknown[] }[],
  responses: [] as { rows: Record<string, unknown>[]; rowCount?: number }[],
  connected: true,
}));

vi.mock("@citrusworx/nectarine/adapters/pg", () => ({
  createPgAdapter: () => ({
    get connected() {
      return state.connected;
    },
    connect: async () => undefined,
    disconnect: async () => undefined,
    query: async (sql: string, params?: readonly unknown[]) => {
      state.queries.push({ sql, params });
      const next = state.responses.shift() ?? { rows: [] };
      return { rows: next.rows, rowCount: next.rowCount ?? next.rows.length };
    },
  }),
}));

const creds = {
  user: "bw",
  password: "secret",
  host: "localhost",
  port: 5432,
  database: "blackwater",
};

const sample = {
  id: "fuzzface",
  name: "Fuzz Face",
  catalog: "gear",
  slug: "fuzz-face",
  badge: "Launch",
};

describe("named COUNT / EXISTS / JSONB host helpers", () => {
  beforeEach(async () => {
    state.queries = [];
    state.responses = [];
    state.connected = true;
    const { closeDatabase, configureDatabase } = await import("./postgres.js");
    await closeDatabase();
    configureDatabase(creds);
  });

  afterEach(async () => {
    const { closeDatabase } = await import("./postgres.js");
    await closeDatabase();
  });

  it("skips seed when countPayloads is non-zero and does not load all rows", async () => {
    const { seedProductsIfEmpty } = await import("./postgres.js");
    state.responses = [{ rows: [{ count: "4" }] }];

    await seedProductsIfEmpty([sample as never]);

    expect(state.queries).toEqual([{ sql: namedSql.countPayloads, params: [] }]);
  });

  it("seeds with payloadById + seedPayload when countPayloads is zero", async () => {
    const { seedProductsIfEmpty } = await import("./postgres.js");
    state.responses = [{ rows: [{ count: "0" }] }, { rows: [] }, { rows: [] }];

    await seedProductsIfEmpty([sample as never]);

    expect(state.queries.map((entry) => entry.sql)).toEqual([
      namedSql.countPayloads,
      namedSql.payloadById,
      namedSql.seedPayload,
    ]);
    expect(state.queries[2]?.params?.[0]).toBe(sample.id);
  });

  it("loads catalog/slug/contains/has_key via compiled JSONB names", async () => {
    const postgres = await import("./postgres.js");
    state.responses = [
      { rows: [{ payload: sample }] },
      { rows: [{ payload: sample }] },
      { rows: [{ payload: sample }] },
      { rows: [{ payload: sample }] },
    ];

    await expect(postgres.loadProductsByCatalogFromDb("gear")).resolves.toEqual([sample]);
    await expect(postgres.loadProductBySlugFromDb("fuzz-face")).resolves.toEqual(sample);
    await expect(postgres.loadProductsContainingFromDb({ catalog: "gear" })).resolves.toEqual([sample]);
    await expect(postgres.loadProductsWithKeyFromDb("badge")).resolves.toEqual([sample]);

    expect(state.queries).toEqual([
      { sql: namedSql.payloadsByCatalog, params: ["gear"] },
      { sql: namedSql.payloadsBySlug, params: ["fuzz-face"] },
      { sql: namedSql.payloadsContaining, params: [JSON.stringify({ catalog: "gear" })] },
      { sql: namedSql.payloadsWithKey, params: ["badge"] },
    ]);
  });

  it("unwraps COUNT and EXISTS scalars", async () => {
    const postgres = await import("./postgres.js");
    state.responses = [
      { rows: [{ count: "7" }] },
      { rows: [{ count: "2" }] },
      { rows: [{ exists: true }] },
      { rows: [{ exists: false }] },
    ];

    await expect(postgres.countPayloadsFromDb()).resolves.toBe(7);
    await expect(postgres.countWaitlistFromDb()).resolves.toBe(2);
    await expect(postgres.waitlistEmailExists("ada@example.com")).resolves.toBe(true);
    await expect(postgres.waitlistEmailExists("other@example.com")).resolves.toBe(false);

    expect(state.queries.map((entry) => entry.sql)).toEqual([
      namedSql.countPayloads,
      namedSql.countEntries,
      namedSql.emailExists,
      namedSql.emailExists,
    ]);
    expect(state.queries[2]?.params).toEqual(["ada@example.com"]);
  });
});
