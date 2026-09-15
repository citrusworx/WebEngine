import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig, type NectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it } from "vitest";
import { SEED_PRODUCTS, asProductRecord, type ProductRecord } from "../data/seed-products.js";
import {
  deleteProductFromDb,
  insertProductPayload,
  updateProductPayload,
} from "../db/postgres.js";
import type { AppLocals } from "../types/context.js";
import { createRoutes } from "./index.js";
import { createProductReadRoutes, createProductRoutes } from "./products.js";

const configPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../nectarine.config.yaml",
);

const servers: http.Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

function loadConfig(): NectarineConfig {
  return loadNectarineConfig(configPath);
}

function locals(nectarine: NectarineConfig, products: ProductRecord[] = []): AppLocals {
  return {
    products,
    waitlist: [],
    postsClient: null,
    pagesClient: null,
    wpUrl: null,
    nectarine,
  };
}

async function listen(app: Seltzer, nectarine: NectarineConfig, products: ProductRecord[] = []) {
  const server = app.listen(0, {
    locals: locals(nectarine, products),
    onListening: () => undefined,
  });
  servers.push(server);

  if (!server.listening) {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", () => resolve());
      server.once("error", reject);
    });
  }

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function request(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(url, init);
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : undefined };
}

function json(method: string, url: string, body?: unknown) {
  return request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

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

describe("asProductRecord", () => {
  it("accepts catalog documents and rejects non-objects", () => {
    expect(asProductRecord(SAMPLE)).toEqual(SAMPLE);
    expect(asProductRecord({ id: "x", name: "Y", extra: true })).toMatchObject({ extra: true });
    expect(asProductRecord(null)).toBeNull();
    expect(asProductRecord([{ id: "x", name: "Y" }])).toBeNull();
    expect(asProductRecord({ id: "x" })).toBeNull();
    expect(asProductRecord({ name: "Y" })).toBeNull();
  });
});

describe("product JSONB db helpers", () => {
  it("refuses named writes without an adapter", async () => {
    await expect(insertProductPayload(SAMPLE)).rejects.toThrow("Database is not configured");
    await expect(updateProductPayload(SAMPLE.id, SAMPLE)).rejects.toThrow("Database is not configured");
    await expect(deleteProductFromDb(SAMPLE.id)).rejects.toThrow("Database is not configured");
  });
});

describe("createProductRoutes", () => {
  it("registers JSONB catalog reads and writes from productAPI.yml", () => {
    const routes = createProductRoutes(loadConfig());
    expect(routes.map((route) => `${route.method} ${route.path}`)).toEqual(
      expect.arrayContaining([
        "GET /api/products",
        "GET /api/products/catalog/:catalog",
        "GET /api/products/:id",
        "GET /api/products/slug/:slug",
        "POST /api/products",
        "PUT /api/products/:id",
        "DELETE /api/products/:id",
      ]),
    );

    const create = routes.find((route) => route.method === "POST" && route.path === "/api/products");
    expect(create?.contract).toEqual({
      resource: "product",
      name: "newProduct",
      body: {
        id: "string.required",
        name: "string.required",
      },
    });
    expect(createProductReadRoutes(loadConfig()).every((route) => route.method === "GET")).toBe(true);
  });
});

describe("product JSONB writes", () => {
  async function start(products: ProductRecord[] = []) {
    const nectarine = loadConfig();
    const app = Seltzer.init();
    for (const route of createRoutes(nectarine)) {
      app.route(route);
    }
    return listen(app, nectarine, products);
  }

  it("uses validate for a missing required id or name and does not insert", async () => {
    const base = await start();
    const missingId = await json("POST", `${base}/api/products`, { name: "Fuzz" });
    const missingName = await json("POST", `${base}/api/products`, { id: "fuzz" });

    expect(missingId).toEqual({ status: 400, json: { error: "Missing required field: id" } });
    expect(missingName).toEqual({ status: 400, json: { error: "Missing required field: name" } });
    await expect(request(`${base}/api/products`)).resolves.toEqual({ status: 200, json: [] });
  });

  it("creates a catalog document, lists it, and rejects a duplicate id", async () => {
    const base = await start();
    const stored = { ...SAMPLE, extra: { nested: true } };
    const created = await json("POST", `${base}/api/products`, stored);

    expect(created.status).toBe(200);
    expect(created.json).toEqual(stored);

    await expect(request(`${base}/api/products`)).resolves.toEqual({ status: 200, json: [stored] });
    await expect(request(`${base}/api/products/${SAMPLE.id}`)).resolves.toEqual({
      status: 200,
      json: stored,
    });
    await expect(request(`${base}/api/products/catalog/gear`)).resolves.toEqual({
      status: 200,
      json: [stored],
    });

    const duplicate = await json("POST", `${base}/api/products`, SAMPLE);
    expect(duplicate).toEqual({ status: 409, json: { error: "Product already exists" } });
  });

  it("merges PUT into the JSONB document without flattening extra keys", async () => {
    const seed = { ...SEED_PRODUCTS[0], extra: "keep-me" } as ProductRecord & { extra: string };
    const base = await start([seed]);

    const updated = await json("PUT", `${base}/api/products/${seed.id}`, {
      id: "attacker-id",
      price: "$1",
      notes: "document-store field",
    });

    expect(updated.status).toBe(200);
    expect(updated.json).toMatchObject({
      id: seed.id,
      name: seed.name,
      sub: seed.sub,
      price: "$1",
      extra: "keep-me",
      notes: "document-store field",
    });
    expect((updated.json as { id: string }).id).toBe(seed.id);

    const fetched = await request(`${base}/api/products/${seed.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.json).toEqual(updated.json);
  });

  it("deletes a catalog document and 404s a second delete", async () => {
    const seed = SEED_PRODUCTS[0];
    const base = await start([seed]);

    const deleted = await json("DELETE", `${base}/api/products/${seed.id}`);
    expect(deleted).toEqual({ status: 200, json: { ok: true, id: seed.id } });

    await expect(request(`${base}/api/products/${seed.id}`)).resolves.toEqual({
      status: 404,
      json: { error: "Product not found" },
    });
    await expect(json("DELETE", `${base}/api/products/${seed.id}`)).resolves.toEqual({
      status: 404,
      json: { error: "Product not found" },
    });
    await expect(json("PUT", `${base}/api/products/${seed.id}`, { price: "$1" })).resolves.toEqual({
      status: 404,
      json: { error: "Product not found" },
    });
  });
});
