import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig, type NectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it } from "vitest";
import { SEED_LESSON, SEED_POST } from "../data/seed-content.js";
import { SEED_PRODUCTS } from "../data/seed-products.js";
import { compileResourceQuery } from "../db/named-queries.js";
import type { AppLocals } from "../types/context.js";
import { createRoutes, GENERATED_READ_RESOURCES } from "./index.js";
import {
  createNectarineReadRoutes,
  executeCompiledRead,
  isSingularRead,
  listResourceReadOperations,
  pathBindValues,
  resolveResourceQueries,
} from "./nectarine-reads.js";

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

function locals(nectarine: NectarineConfig, overrides: Partial<AppLocals> = {}): AppLocals {
  return {
    products: [],
    waitlist: [],
    postsClient: null,
    pagesClient: null,
    wpUrl: null,
    nectarine,
    ...overrides,
  };
}

async function listen(app: Seltzer, nectarine: NectarineConfig, extra: Partial<AppLocals> = {}) {
  const server = app.listen(0, {
    locals: locals(nectarine, extra),
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

async function request(url: string): Promise<{ status: number; json: unknown }> {
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : undefined };
}

describe("isSingularRead / pathBindValues", () => {
  it("treats unique lookups as singular and collections as lists", () => {
    expect(isSingularRead("byId")).toBe(true);
    expect(isSingularRead("bySlug")).toBe(true);
    expect(isSingularRead("byEmail")).toBe(true);
    expect(isSingularRead("productById")).toBe(true);
    expect(isSingularRead("entryByEmail")).toBe(true);
    expect(isSingularRead("byClient")).toBe(false);
    expect(isSingularRead("byCourse")).toBe(false);
    expect(isSingularRead("allPublished")).toBe(false);
    expect(isSingularRead("upcomingByLine")).toBe(false);
    expect(isSingularRead("byCatalog")).toBe(false);
  });

  it("binds path params in path order", () => {
    expect(pathBindValues("/api/courses/:courseId/lessons/:slug", { courseId: "fuzz", slug: "bias" })).toEqual([
      "fuzz",
      "bias",
    ]);
    expect(pathBindValues("/api/courses/:id", { id: "  " })).toBeNull();
    expect(pathBindValues("/api/courses", {})).toEqual([]);
  });
});

describe("createNectarineReadRoutes", () => {
  it("registers GET reads for the remaining Nectarine resources from API.yml", () => {
    const nectarine = loadConfig();
    const routes = createNectarineReadRoutes(nectarine, {
      resources: GENERATED_READ_RESOURCES,
      execute: executeCompiledRead,
      exclude: [{ resource: "lesson", name: "byId" }],
    });

    const keys = routes.map((route) => `${route.method} ${route.path}`);
    expect(keys).toEqual(expect.arrayContaining([
      "GET /api/courses",
      "GET /api/courses/line/:line",
      "GET /api/courses/:id",
      "GET /api/courses/slug/:slug",
      "GET /api/coaches",
      "GET /api/coaches/:id",
      "GET /api/coaches/slug/:slug",
      "GET /api/clients/:clientId/enrollments",
      "GET /api/courses/:courseId/enrollments",
      "GET /api/enrollments/:id",
      "GET /api/clients/:clientId/bookings",
      "GET /api/coaches/:coachId/bookings",
      "GET /api/bookings/:id",
      "GET /api/bookings/line/:line",
      "GET /api/clients",
      "GET /api/clients/:id",
      "GET /api/clients/email/:email",
      "GET /api/clients/:clientId/orders",
      "GET /api/orders/:id",
      "GET /api/orders/catalog/:catalog",
      "GET /api/orders/:orderId/items",
      "GET /api/clients/:clientId/sessions",
      "GET /api/sessions/:id",
      "GET /api/sessions/status/:status",
      "GET /api/clients/:clientId/mix-reviews",
      "GET /api/sessions/:sessionId/mix-reviews",
      "GET /api/mix-reviews/:id",
      "GET /api/courses/:courseId/lessons",
      "GET /api/courses/:courseId/lessons/:slug",
    ]));
    expect(keys).not.toContain("GET /api/lessons/:id");
    expect(keys.some((key) => key.startsWith("POST ") || key.startsWith("PUT ") || key.startsWith("PATCH "))).toBe(
      false,
    );
  });

  it("compiles every generated read query from Queries.yml", () => {
    const nectarine = loadConfig();

    for (const resource of GENERATED_READ_RESOURCES) {
      const operations = listResourceReadOperations(nectarine, resource).filter(
        (operation) =>
          operation.method === "GET" &&
          !(resource === "lesson" && operation.name === "byId"),
      );

      expect(operations.length, resource).toBeGreaterThan(0);

      for (const operation of operations) {
        expect(operation.query, `${resource}.${operation.name}`).toBeTruthy();
        const sql = compileResourceQuery(
          resolveResourceQueries(nectarine, resource),
          resource,
          "read",
          operation.query as string,
        );
        expect(sql, `${resource}.${operation.name}`).toMatch(/^SELECT /);
      }
    }
  });

  it("ranks static prefixes ahead of :id", () => {
    const nectarine = loadConfig();
    const routes = createNectarineReadRoutes(nectarine, {
      resources: ["course", "client", "order"],
      execute: executeCompiledRead,
    });
    const coursePaths = routes.filter((route) => route.path.startsWith("/api/courses")).map((route) => route.path);
    const slugIndex = coursePaths.indexOf("/api/courses/slug/:slug");
    const lineIndex = coursePaths.indexOf("/api/courses/line/:line");
    const idIndex = coursePaths.indexOf("/api/courses/:id");

    expect(slugIndex).toBeGreaterThan(-1);
    expect(lineIndex).toBeGreaterThan(-1);
    expect(idIndex).toBeGreaterThan(-1);
    expect(slugIndex).toBeLessThan(idIndex);
    expect(lineIndex).toBeLessThan(idIndex);

    const clientPaths = routes.filter((route) => route.path.startsWith("/api/clients")).map((route) => route.path);
    expect(clientPaths.indexOf("/api/clients/email/:email")).toBeLessThan(clientPaths.indexOf("/api/clients/:id"));

    const orderPaths = routes.filter((route) => route.path.startsWith("/api/orders")).map((route) => route.path);
    expect(orderPaths.indexOf("/api/orders/catalog/:catalog")).toBeLessThan(orderPaths.indexOf("/api/orders/:id"));
  });
});

describe("createRoutes", () => {
  it("keeps hand-written health, waitlist POST, KiwiPress post, and lesson-by-id", () => {
    const nectarine = loadConfig();
    const routes = createRoutes(nectarine);
    const keys = routes.map((route) => `${route.method} ${route.path}`);

    expect(keys.filter((key) => key === "GET /api/lessons/:id")).toHaveLength(1);
    expect(keys).toEqual(expect.arrayContaining([
      "GET /api/health",
      "POST /api/waitlist",
      "GET /api/posts/:slug",
      "GET /api/lessons/:id",
      "GET /api/products",
      "GET /api/waitlist",
      "GET /api/courses",
    ]));

    const lessonById = routes.find((route) => route.method === "GET" && route.path === "/api/lessons/:id");
    expect(lessonById?.contract).toBeUndefined();
  });

  it("serves empty collections and 404 unique misses without a database", async () => {
    const nectarine = loadConfig();
    const app = Seltzer.init();
    for (const route of createRoutes(nectarine)) {
      app.route(route);
    }

    const base = await listen(app, nectarine);

    await expect(request(`${base}/api/courses`)).resolves.toEqual({ status: 200, json: [] });
    await expect(request(`${base}/api/coaches`)).resolves.toEqual({ status: 200, json: [] });
    await expect(request(`${base}/api/clients`)).resolves.toEqual({ status: 200, json: [] });
    await expect(request(`${base}/api/courses/line/gear`)).resolves.toEqual({ status: 200, json: [] });
    await expect(request(`${base}/api/courses/missing`)).resolves.toEqual({
      status: 404,
      json: { error: "Not found" },
    });
    await expect(request(`${base}/api/courses/slug/missing`)).resolves.toEqual({
      status: 404,
      json: { error: "Not found" },
    });
    await expect(request(`${base}/api/courses/fuzz/lessons`)).resolves.toEqual({ status: 200, json: [] });
    await expect(request(`${base}/api/courses/fuzz/lessons/bias`)).resolves.toEqual({
      status: 404,
      json: { error: "Not found" },
    });
  });

  it("does not steal the hand lesson-by-id or product seed fallback", async () => {
    const nectarine = loadConfig();
    const app = Seltzer.init();
    for (const route of createRoutes(nectarine)) {
      app.route(route);
    }

    const products = SEED_PRODUCTS.slice(0, 1);
    const base = await listen(app, nectarine, { products });

    const lesson = await request(`${base}/api/lessons/${SEED_LESSON.id}`);
    expect(lesson.status).toBe(200);
    expect(lesson.json).toMatchObject({ id: SEED_LESSON.id, title: SEED_LESSON.title });

    const post = await request(`${base}/api/posts/${SEED_POST.slug}`);
    expect(post.status).toBe(200);
    expect(post.json).toMatchObject({ slug: SEED_POST.slug, title: SEED_POST.title });

    await expect(request(`${base}/api/products`)).resolves.toEqual({ status: 200, json: products });
    await expect(request(`${base}/api/products/${products[0].id}`)).resolves.toEqual({
      status: 200,
      json: products[0],
    });
    await expect(request(`${base}/api/health`)).resolves.toMatchObject({
      status: 200,
      json: { ok: true, service: "blackwater-sound-back" },
    });
  });
});
