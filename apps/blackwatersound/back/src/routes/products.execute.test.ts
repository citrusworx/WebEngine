import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig, type NectarineConfig } from "@citrusworx/nectarine/config";
import type { ExecuteArgs } from "@citrusworx/seltzer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductRecord } from "../data/seed-products.js";
import type { AppLocals, BlackwaterContext } from "../types/context.js";

const SAMPLE: ProductRecord = {
  id: "fuzzface",
  name: "Fuzz Face",
  sub: "Germanium Fuzz",
  price: "$249",
  img: "https://example.com/fuzz.jpg",
  accent: "orange",
  category: "Effects",
  tags: ["Fuzz", "Germanium"],
  blurb: "A catalog document stored in JSONB payload.",
  catalog: "gear",
};

const db = vi.hoisted(() => ({
  isDatabaseConnected: vi.fn(() => true),
  countPayloadsFromDb: vi.fn(async () => 2),
  loadProductsFromDb: vi.fn(async () => []),
  loadProductByIdFromDb: vi.fn(async () => null),
  loadProductBySlugFromDb: vi.fn(async () => null),
  loadProductsByCatalogFromDb: vi.fn(async () => []),
  loadProductsContainingFromDb: vi.fn(async () => []),
  loadProductsWithKeyFromDb: vi.fn(async () => []),
  insertProductPayload: vi.fn(),
  updateProductPayload: vi.fn(),
  deleteProductFromDb: vi.fn(),
}));

vi.mock("../db/postgres.js", () => db);

const { executeProduct } = await import("./products.js");

const configPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../nectarine.config.yaml",
);

function loadConfig(): NectarineConfig {
  return loadNectarineConfig(configPath);
}

function locals(nectarine: NectarineConfig): AppLocals {
  return {
    products: [],
    waitlist: [],
    postsClient: null,
    pagesClient: null,
    wpUrl: null,
    nectarine,
  };
}

function readArgs(
  nectarine: NectarineConfig,
  query: string,
  params: Record<string, string> = {},
  search: Record<string, string> = {},
): ExecuteArgs<BlackwaterContext> {
  return {
    resource: "product",
    query,
    params,
    body: undefined,
    ctx: {
      locals: locals(nectarine),
      query: search,
    } as BlackwaterContext,
    operation: {
      resource: "product",
      crud: "read",
      name: query,
      method: "GET",
      path: "/api/products",
      query,
    },
  };
}

describe("executeProduct named JSONB reads", () => {
  beforeEach(() => {
    db.isDatabaseConnected.mockReturnValue(true);
    db.countPayloadsFromDb.mockResolvedValue(2);
    db.loadProductBySlugFromDb.mockResolvedValue(null);
    db.loadProductByIdFromDb.mockResolvedValue(null);
    db.loadProductsByCatalogFromDb.mockResolvedValue([SAMPLE]);
    db.loadProductsContainingFromDb.mockResolvedValue([SAMPLE]);
    db.loadProductsWithKeyFromDb.mockResolvedValue([SAMPLE]);
  });

  it("uses payloadsByCatalog / payloadsBySlug / count / contains / has_key helpers", async () => {
    const nectarine = loadConfig();

    await expect(executeProduct(readArgs(nectarine, "payloadsByCatalog", { catalog: "gear" }))).resolves.toEqual([
      SAMPLE,
    ]);
    expect(db.loadProductsByCatalogFromDb).toHaveBeenCalledWith("gear");
    expect(db.loadProductsFromDb).not.toHaveBeenCalled();

    db.loadProductBySlugFromDb.mockResolvedValueOnce(SAMPLE);
    await expect(executeProduct(readArgs(nectarine, "payloadsBySlug", { slug: "fuzz-face" }))).resolves.toEqual(
      SAMPLE,
    );
    expect(db.loadProductBySlugFromDb).toHaveBeenCalledWith("fuzz-face");

    db.loadProductBySlugFromDb.mockResolvedValueOnce(null);
    db.loadProductByIdFromDb.mockResolvedValueOnce(SAMPLE);
    await expect(executeProduct(readArgs(nectarine, "payloadsBySlug", { slug: SAMPLE.id }))).resolves.toEqual(SAMPLE);
    expect(db.loadProductByIdFromDb).toHaveBeenCalledWith(SAMPLE.id);

    await expect(executeProduct(readArgs(nectarine, "countPayloads"))).resolves.toEqual({ count: 2 });
    expect(db.countPayloadsFromDb).toHaveBeenCalled();

    await expect(executeProduct(readArgs(nectarine, "payloadsWithKey", { key: "badge" }))).resolves.toEqual([SAMPLE]);
    expect(db.loadProductsWithKeyFromDb).toHaveBeenCalledWith("badge");

    await expect(
      executeProduct(readArgs(nectarine, "payloadsContaining", {}, { contains: JSON.stringify({ catalog: "gear" }) })),
    ).resolves.toEqual([SAMPLE]);
    expect(db.loadProductsContainingFromDb).toHaveBeenCalledWith({ catalog: "gear" });
  });
});
