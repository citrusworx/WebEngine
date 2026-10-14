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
      const next = state.responses.shift() ?? { rows: [], rowCount: 0 };
      return { rows: next.rows, rowCount: next.rowCount ?? next.rows.length };
    },
  }),
}));

const creds = {
  user: "mia",
  password: "secret",
  host: "localhost",
  port: 5432,
  database: "miamakes",
};

describe("recipe JSONB binds", () => {
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

  it("inserts with the compiled create statement and stringified JSONB lists", async () => {
    const { insertRecipe } = await import("./postgres.js");
    state.responses = [
      {
        rows: [
          {
            id: "rec_peach",
            slug: "peach-cobbler",
            name: "Peach Cobbler",
            author: "Mia",
            description: "",
            nutrition: "",
            prep_minutes: 20,
            cook_minutes: 45,
            ingredients: ["peaches"],
            steps: ["Bake"],
            photo_url: null,
            author_id: null,
            cookbook_id: null,
            category: "entrees",
            before_you_begin: "",
            created_at: "2026-10-14T00:00:00.000Z",
            updated_at: "2026-10-14T00:00:00.000Z",
          },
        ],
        rowCount: 1,
      },
    ];

    const recipe = await insertRecipe("rec_peach", {
      slug: "peach-cobbler",
      name: "Peach Cobbler",
      author: "Mia",
      description: "",
      nutrition: "",
      prep_minutes: 20,
      cook_minutes: 45,
      ingredients: ["peaches"],
      steps: ["Bake"],
      photo_url: null,
      author_id: null,
      cookbook_id: null,
      category: "entrees",
      before_you_begin: "",
    });

    expect(recipe.ingredients).toEqual(["peaches"]);
    expect(state.queries).toEqual([
      {
        sql: namedSql.createRecipe,
        params: [
          "rec_peach",
          "peach-cobbler",
          "Peach Cobbler",
          "Mia",
          "",
          "",
          20,
          45,
          '["peaches"]',
          '["Bake"]',
          null,
          null,
          null,
          "entrees",
          "",
        ],
      },
    ]);
    expect(namedSql.createRecipe).toContain("$9::jsonb");
    expect(namedSql.createRecipe).toContain("$10::jsonb");
  });

  it("skips seed when countRecipes is non-zero", async () => {
    const { seedRecipesIfEmpty } = await import("./postgres.js");
    state.responses = [{ rows: [{ count: "3" }] }];

    await seedRecipesIfEmpty([
      {
        id: "rec_x",
        slug: "x",
        name: "X",
        author: "Mia",
        description: "",
        nutrition: "",
        prep_minutes: 0,
        cook_minutes: 0,
        ingredients: [],
        steps: [],
        photo_url: null,
        author_id: null,
        cookbook_id: null,
        category: "entrees",
        before_you_begin: "",
        created_at: "2026-10-01T00:00:00.000Z",
        updated_at: "2026-10-01T00:00:00.000Z",
      },
    ]);

    expect(state.queries).toEqual([{ sql: namedSql.countRecipes, params: [] }]);
  });
});
