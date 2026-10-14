import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig, type NectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";
import { afterEach, describe, expect, it } from "vitest";
import { cloneSeedRecipes } from "../data/seed-recipes.js";
import type { AppLocals } from "../types/context.js";
import { createRoutes } from "./index.js";

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

async function listen(nectarine: NectarineConfig, locals: AppLocals) {
  const app = Seltzer.init();
  for (const route of createRoutes(nectarine)) {
    app.route(route);
  }

  const server = app.listen(0, {
    locals,
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

async function request(url: string, init?: RequestInit): Promise<{ status: number; json: unknown }> {
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

describe("recipe routes", () => {
  it("registers list, slug, id, create, update, and delete from recipeAPI.yml", () => {
    const routes = createRoutes(loadConfig());
    expect(routes.map((route) => `${route.method} ${route.path}`)).toEqual(
      expect.arrayContaining([
        "GET /api/health",
        "GET /api/recipes",
        "GET /api/recipes/slug/:slug",
        "GET /api/recipes/:id",
        "GET /api/recipes/category/:category",
        "POST /api/recipes",
        "PUT /api/recipes/:id",
        "DELETE /api/recipes/:id",
      ]),
    );

    const create = routes.find((route) => route.method === "POST" && route.path === "/api/recipes");
    expect(create?.contract?.body).toMatchObject({ name: "string.required" });
  });

  it("serves seed recipes and creates, updates, and deletes in the memory store", async () => {
    const nectarine = loadConfig();
    const locals: AppLocals = { recipes: cloneSeedRecipes(), nectarine };
    const base = await listen(nectarine, locals);

    const list = await request(`${base}/api/recipes`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.json)).toBe(true);
    const slugs = (list.json as { slug: string; category: string }[]).map((recipe) => recipe.slug);
    expect(slugs[0]).toBe("herbed-bread-and-dip");
    expect(new Set((list.json as { category: string }[]).map((recipe) => recipe.category))).toEqual(
      new Set(["salads", "entrees", "appetizers"]),
    );

    const detail = await request(`${base}/api/recipes/slug/garden-tomato-soup`);
    expect(detail.status).toBe(200);
    expect(detail.json).toMatchObject({
      name: "Garden Tomato Soup",
      category: "appetizers",
      before_you_begin: expect.stringContaining("Set the bowls"),
      ingredients: expect.arrayContaining(["2 pounds ripe tomatoes, chopped"]),
    });

    const missingName = await json("POST", `${base}/api/recipes`, { author: "Mia" });
    expect(missingName.status).toBe(400);

    const badList = await json("POST", `${base}/api/recipes`, {
      name: "Bare soup",
      ingredients: "tomatoes",
    });
    expect(badList.status).toBe(400);

    const created = await json("POST", `${base}/api/recipes`, {
      name: "Peach Cobbler",
      author: "Mia",
      description: "Warm from the oven.",
      nutrition: "A Sunday treat.",
      prep_minutes: 20,
      cook_minutes: 45,
      ingredients: ["peaches", "biscuit dough"],
      steps: ["Slice the peaches.", "Bake until bubbling."],
    });
    expect(created.status).toBe(200);
    expect(created.json).toMatchObject({
      slug: "peach-cobbler",
      name: "Peach Cobbler",
      ingredients: ["peaches", "biscuit dough"],
      steps: ["Slice the peaches.", "Bake until bubbling."],
      photo_url: null,
      category: "entrees",
      before_you_begin: "",
    });

    const createdId = (created.json as { id: string }).id;
    const again = await json("POST", `${base}/api/recipes`, { name: "Peach Cobbler" });
    expect(again.json).toMatchObject({ slug: "peach-cobbler-2" });

    const byId = await request(`${base}/api/recipes/${createdId}`);
    expect(byId.status).toBe(200);
    expect(byId.json).toMatchObject({ id: createdId, slug: "peach-cobbler" });

    const updated = await json("PUT", `${base}/api/recipes/${createdId}`, {
      name: "Peach Cobbler",
      author: "Mia",
      description: "Even warmer.",
      prep_minutes: 25,
      cook_minutes: 40,
      ingredients: ["peaches", "biscuit dough", "pinch of nutmeg"],
      steps: ["Slice the peaches.", "Bake until bubbling."],
      photo_url: "later/cobbler.jpg",
    });
    expect(updated.status).toBe(200);
    expect(updated.json).toMatchObject({
      id: createdId,
      description: "Even warmer.",
      prep_minutes: 25,
      photo_url: "later/cobbler.jpg",
    });

    const kept = await json("PUT", `${base}/api/recipes/${createdId}`, {
      name: "Peach Cobbler",
      description: "Photo stays put.",
    });
    expect(kept.json).toMatchObject({
      photo_url: "later/cobbler.jpg",
      description: "Photo stays put.",
      category: "entrees",
      before_you_begin: "",
    });

    const salad = await json("POST", `${base}/api/recipes`, {
      name: "Desk Salad",
      category: "salads",
      before_you_begin: "Dry the greens.",
    });
    expect(salad.json).toMatchObject({ category: "salads", before_you_begin: "Dry the greens." });

    const shelf = await request(`${base}/api/recipes/category/salads`);
    expect(shelf.status).toBe(200);
    expect(shelf.json).toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: "desk-salad", category: "salads" })]),
    );

    const removed = await request(`${base}/api/recipes/${createdId}`, { method: "DELETE" });
    expect(removed.status).toBe(200);
    expect(removed.json).toEqual({ ok: true, id: createdId });

    const gone = await request(`${base}/api/recipes/slug/peach-cobbler`);
    expect(gone.status).toBe(404);

    const stillSeeded = await request(`${base}/api/recipes/slug/sunday-cinnamon-rolls`);
    expect(stillSeeded.status).toBe(200);
  });
});
