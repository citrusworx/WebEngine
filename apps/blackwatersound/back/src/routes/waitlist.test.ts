import { mkdtemp, readFile, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig, type NectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer, type ExecuteArgs } from "@citrusworx/seltzer";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertWaitlistEntry } from "../db/postgres.js";
import type { AppLocals, BlackwaterContext } from "../types/context.js";
import { createRoutes } from "./index.js";
import { createWaitlistRoutes, executeWaitlist } from "./waitlist.js";

const configPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../nectarine.config.yaml",
);

const servers: http.Server[] = [];
const previousRuntimeDir = process.env.RUNTIME_DATA_DIR;
let runtimeDir: string | undefined;

beforeEach(async () => {
  runtimeDir = await mkdtemp(path.join(os.tmpdir(), "blackwater-waitlist-"));
  process.env.RUNTIME_DATA_DIR = runtimeDir;
});

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );

  if (previousRuntimeDir === undefined) {
    delete process.env.RUNTIME_DATA_DIR;
  } else {
    process.env.RUNTIME_DATA_DIR = previousRuntimeDir;
  }

  if (runtimeDir) {
    await rm(runtimeDir, { recursive: true, force: true });
    runtimeDir = undefined;
  }
});

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

async function listen(app: Seltzer, nectarine: NectarineConfig) {
  const server = app.listen(0, {
    locals: locals(nectarine),
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

function post(url: string, body: unknown) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("waitlist named db helpers", () => {
  it("refuses named writes without an adapter", async () => {
    await expect(
      insertWaitlistEntry({
        id: "wl_1",
        name: "Ada",
        email: "ada@example.com",
        createdAt: new Date().toISOString(),
      }),
    ).rejects.toThrow("Database is not configured");
  });
});

describe("createWaitlistRoutes", () => {
  it("registers GET reads and POST joinWaitlist from waitlistAPI.yml via createNectarineRoutes", () => {
    const routes = createWaitlistRoutes(loadConfig());

    expect(routes.map((route) => `${route.method} ${route.path}`)).toEqual([
      "GET /api/waitlist/count",
      "GET /api/waitlist",
      "POST /api/waitlist",
      "GET /api/waitlist/:email",
    ]);
    expect(routes.find((route) => route.method === "POST")?.contract).toEqual({
      resource: "waitlist",
      name: "joinWaitlist",
      body: {
        name: "string",
        email: "string.required",
        source_app: "string",
        interest: "string",
      },
    });
    expect(routes.every((route) => route.method === "GET")).toBe(false);
  });
});

describe("executeWaitlist joinWaitlist", () => {
  function joinArgs(nectarine: NectarineConfig, body: unknown): ExecuteArgs<BlackwaterContext> {
    return {
      resource: "waitlist",
      query: "joinWaitlist",
      params: {},
      body,
      ctx: { locals: locals(nectarine) } as BlackwaterContext,
      operation: {
        resource: "waitlist",
        crud: "create",
        name: "joinWaitlist",
        method: "POST",
        path: "/api/waitlist",
        query: "joinWaitlist",
      },
    };
  }

  it("inserts, reports duplicate email, and rejects source_app outside the allowlist", async () => {
    const nectarine = loadConfig();
    const created = await executeWaitlist(
      joinArgs(nectarine, {
        name: "Ada",
        email: "Ada@Example.com",
        source_app: "WWW",
        interest: "gear",
      }),
    );
    expect(created).toEqual({ ok: true });

    const duplicate = await executeWaitlist(joinArgs(nectarine, { email: "ada@example.com" }));
    expect(duplicate).toEqual({ ok: true, duplicate: true });

    const invalid = await executeWaitlist(
      joinArgs(nectarine, { email: "other@example.com", source_app: "mobile" }),
    );
    expect(invalid).toMatchObject({ status: 400, body: { error: "source_app is invalid" } });
  });
});

describe("POST /api/waitlist", () => {
  async function start() {
    const nectarine = loadConfig();
    const app = Seltzer.init();
    for (const route of createRoutes(nectarine)) {
      app.route(route);
    }
    return listen(app, nectarine);
  }

  it("uses validate for a missing required email and does not insert", async () => {
    const base = await start();
    const missing = await post(`${base}/api/waitlist`, { name: "Ada" });
    const blank = await post(`${base}/api/waitlist`, { email: "   " });

    expect(missing).toEqual({ status: 400, json: { error: "Missing required field: email" } });
    expect(blank).toEqual({ status: 400, json: { error: "Missing required field: email" } });
    await expect(request(`${base}/api/waitlist`)).resolves.toEqual({ status: 200, json: [] });
    await expect(request(`${base}/api/waitlist/count`)).resolves.toEqual({
      status: 200,
      json: { count: 0 },
    });
  });

  it("appends to the file store, lists the entry, and reports duplicate email", async () => {
    const base = await start();
    const created = await post(`${base}/api/waitlist`, {
      name: "Ada",
      email: "Ada@Example.com",
      source_app: "www",
      interest: "gear",
    });

    expect(created.status).toBe(200);
    expect(created.json).toEqual({ ok: true });

    const stored = JSON.parse(await readFile(path.join(runtimeDir!, "waitlist.json"), "utf8")) as unknown[];
    expect(stored).toEqual([
      expect.objectContaining({
        name: "Ada",
        email: "ada@example.com",
        sourceApp: "www",
        interest: "gear",
      }),
    ]);
    expect((stored[0] as { id: string }).id).toMatch(/^wl_/);

    const listed = await request(`${base}/api/waitlist`);
    expect(listed.status).toBe(200);
    expect(listed.json).toEqual([
      expect.objectContaining({
        name: "Ada",
        email: "ada@example.com",
        sourceApp: "www",
        interest: "gear",
      }),
    ]);

    await expect(request(`${base}/api/waitlist/count`)).resolves.toEqual({
      status: 200,
      json: { count: 1 },
    });

    const byEmail = await request(`${base}/api/waitlist/${encodeURIComponent("ada@example.com")}`);
    expect(byEmail.status).toBe(200);
    expect(byEmail.json).toMatchObject({ email: "ada@example.com", name: "Ada" });

    const duplicate = await post(`${base}/api/waitlist`, { email: "ada@example.com" });
    expect(duplicate).toEqual({ status: 200, json: { ok: true, duplicate: true } });

    const after = await request(`${base}/api/waitlist`);
    expect(after.status).toBe(200);
    expect(Array.isArray(after.json) ? after.json : []).toHaveLength(1);
  });

  it("rejects source_app values outside the schema allowlist", async () => {
    const base = await start();
    const invalid = await post(`${base}/api/waitlist`, {
      email: "ada@example.com",
      source_app: "mobile",
    });
    const omitted = await post(`${base}/api/waitlist`, { email: "ada@example.com" });

    expect(invalid).toEqual({ status: 400, json: { error: "source_app is invalid" } });
    expect(omitted).toEqual({ status: 200, json: { ok: true } });
  });
});
