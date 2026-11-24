import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "@citrusworx/seltzer";
import { KiwiPress } from "../cms/KiwiPress.js";
import { NectarineStore } from "../cms/store.js";
import type { KiwiPressGatewayOptions } from "./auth.js";
import { registerKiwiPressGateway } from "./register.js";

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    server.close((error) => (error ? reject(error) : resolve()));
                })
        )
    );
});

async function listen(app: Seltzer) {
    const server = app.listen(0, {
        onListening: () => undefined
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

async function request(url: string, init: RequestInit = {}) {
    const response = await fetch(url, init);
    const text = await response.text();
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status: response.status, json };
}

function nativeApp(options: KiwiPressGatewayOptions = { allowLoopbackWithoutToken: true }) {
    const kiwi = KiwiPress.connect({
        mode: "nectarine",
        store: new NectarineStore()
    });
    const app = Seltzer.init();
    registerKiwiPressGateway(app, kiwi, options);
    return { app, kiwi };
}

describe("KiwiPress gateway authorization", () => {
    it("requires the configured token on every guarded route, including for loopback clients", async () => {
        const token = "gateway-test-token";
        const { app } = nativeApp({ token });
        const gateway = `${await listen(app)}/__kiwipress`;
        const guardedRoutes = [
            ["GET", "cms"], ["POST", "cms"], ["POST", "transfer"],
            ["GET", "types"], ["POST", "types"],
            ["GET", "types/recipe"], ["PATCH", "types/recipe"], ["DELETE", "types/recipe"],
            ["GET", "content/posts"], ["POST", "content/posts"],
            ["PATCH", "content/posts?id=1"], ["DELETE", "content/posts?id=1"]
        ];

        await expect(request(`${gateway}/health`)).resolves.toEqual({ status: 200, json: { ok: true } });
        for (const [method, path] of guardedRoutes) {
            const response = await request(`${gateway}/${path}`, { method });
            expect(response, `${method} ${path}`).toEqual({ status: 401, json: { error: "Unauthorized" } });
        }

        const invalid = await request(`${gateway}/cms`, { headers: { Authorization: "Bearer gateway-test-fake!" } });
        expect(invalid).toEqual({ status: 401, json: { error: "Unauthorized" } });
        for (const headers of [
            new Headers({ Authorization: `Bearer ${token}` }),
            new Headers({ "X-KiwiPress-Token": token })
        ]) {
            const response = await request(`${gateway}/cms`, { headers });
            expect(response).toMatchObject({ status: 200, json: { mode: "nectarine" } });
        }
    });

    it("denies loopback requests when tokenless access is disabled", async () => {
        const { app } = nativeApp({ allowLoopbackWithoutToken: false });
        const gateway = `${await listen(app)}/__kiwipress`;

        await expect(request(`${gateway}/cms`)).resolves.toEqual({ status: 401, json: { error: "Unauthorized" } });
        await expect(request(`${gateway}/health`)).resolves.toEqual({ status: 200, json: { ok: true } });
    });
});

describe("KiwiPress gateway request validation", () => {
    it("rejects invalid body shapes without creating or updating native content", async () => {
        const { app, kiwi } = nativeApp();
        const gateway = `${await listen(app)}/__kiwipress`;
        const headers = { "Content-Type": "application/json" };
        const seed = await kiwi.native.posts.create({ id: "seed", title: "Original" });
        kiwi.store.registerType({ slug: "recipe" });

        for (const [method, path, body] of [
            ["POST", "content/posts", "[]"],
            ["POST", "content/posts", "null"],
            ["POST", "content/posts", undefined],
            ["PATCH", "content/posts?id=seed", '"invalid"'],
            ["POST", "types", "true"],
            ["PATCH", "types/recipe", "[]"],
            ["POST", "cms", "null"],
            ["POST", "transfer", "[]"]
        ] as const) {
            const response = await request(`${gateway}/${path}`, { method, headers, body });
            expect(response, `${method} ${path}`).toEqual({
                status: 400, json: { error: "Request body must be a JSON object." }
            });
        }
        await expect(request(`${gateway}/content/posts`, {
            method: "POST", headers, body: "{broken"
        })).resolves.toEqual({ status: 400, json: { error: "Invalid JSON body" } });
        await expect(kiwi.native.posts.getAll()).resolves.toEqual([seed]);
        expect(kiwi.store.listTypes().map(({ slug }) => slug)).toEqual(["recipe"]);

        const explicitEmpty = await request(`${gateway}/content/posts`, { method: "POST", headers, body: "{}" });
        expect(explicitEmpty).toMatchObject({ status: 200, json: { title: "Untitled" } });
    });

    it("rejects blank IDs, unsupported transfer options, and modes without a WordPress URL", async () => {
        const { app, kiwi } = nativeApp();
        const gateway = `${await listen(app)}/__kiwipress`;
        const headers = { "Content-Type": "application/json" };

        await expect(request(`${gateway}/content/posts?id=%20`, { method: "DELETE" })).resolves.toEqual({
            status: 400, json: { error: "id query parameter is required." }
        });
        await expect(request(`${gateway}/transfer`, {
            method: "POST", headers, body: JSON.stringify({ cpts: ["books"] })
        })).resolves.toEqual({ status: 400, json: { error: "Transfer body only supports the collections field." } });
        await expect(request(`${gateway}/transfer`, { method: "POST" })).resolves.toEqual({
            status: 400, json: { error: "Transfer requires a WordPress URL." }
        });
        await expect(request(`${gateway}/cms`, {
            method: "POST", headers, body: JSON.stringify({ mode: "wordpress" })
        })).resolves.toEqual({ status: 400, json: { error: "WordPress mode requires a WordPress URL." } });
        expect(kiwi.mode).toBe("nectarine");
    });
});

describe("KiwiPress gateway types and CPT collections", () => {
    it("addresses individual content writes by query ID and keeps GET at the collection path", async () => {
        const { app, kiwi } = nativeApp();
        const post = await kiwi.native.posts.create({ id: "draft / #1", title: "Original" });
        const collection = `${await listen(app)}/__kiwipress/content/posts`;
        const itemPath = `${collection}/${encodeURIComponent(post.id)}`;
        const itemQuery = `${collection}?${new URLSearchParams({ id: post.id })}`;
        const patch = {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Updated" })
        };

        expect((await request(itemPath)).status).toBe(404);
        expect((await request(itemPath, patch)).status).toBe(404);
        expect((await request(itemPath, { method: "DELETE" })).status).toBe(404);
        await expect(request(itemQuery, patch)).resolves.toMatchObject({
            status: 200, json: { id: post.id, title: "Updated" }
        });
        await expect(request(collection)).resolves.toMatchObject({
            status: 200, json: [expect.objectContaining({ id: post.id, title: "Updated" })]
        });
        await expect(request(itemQuery, { method: "DELETE" })).resolves.toEqual({
            status: 200, json: { deleted: true }
        });
        await expect(request(itemQuery, { method: "DELETE" })).resolves.toEqual({
            status: 200, json: { deleted: false }
        });
    });

    it("returns JSON errors for missing native records and failed saves", async () => {
        const { app, kiwi } = nativeApp();
        kiwi.store.usePersistence({
            load: async () => null,
            async save() {
                throw new Error("Snapshot save failed");
            }
        });
        const posts = `${await listen(app)}/__kiwipress/content/posts`;
        const headers = { "Content-Type": "application/json" };

        await expect(request(`${posts}?id=missing`, {
            method: "PATCH", headers, body: JSON.stringify({ title: "Updated" })
        })).resolves.toEqual({ status: 404, json: { error: "Nectarine posts missing was not found." } });

        await expect(request(posts, {
            method: "POST", headers, body: JSON.stringify({ id: "kept", title: "Kept in memory" })
        })).resolves.toEqual({ status: 500, json: { error: "Snapshot save failed" } });
        await expect(kiwi.native.posts.getById("kept")).resolves.toMatchObject({ title: "Kept in memory" });
    });

    it("creates, reads, updates, and deletes a custom type", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        const created = await request(`${base}/__kiwipress/types`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "recipe", label: "Recipes", singular: "Recipe" })
        });
        expect(created.status).toBe(201);
        expect(created.json).toMatchObject({ slug: "recipe", label: "Recipes" });

        const listed = await request(`${base}/__kiwipress/types`);
        expect(listed.status).toBe(200);
        expect(listed.json).toMatchObject({
            types: [expect.objectContaining({ slug: "recipe" })]
        });

        const patched = await request(`${base}/__kiwipress/types/recipe`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: "Kitchen recipes" })
        });
        expect(patched.status).toBe(200);
        expect(patched.json).toMatchObject({ slug: "recipe", label: "Kitchen recipes" });

        const one = await request(`${base}/__kiwipress/types/recipe`);
        expect(one.json).toMatchObject({ label: "Kitchen recipes" });

        const deleted = await request(`${base}/__kiwipress/types/recipe`, { method: "DELETE" });
        expect(deleted.status).toBe(200);
        expect(deleted.json).toEqual({ deleted: true });

        const missing = await request(`${base}/__kiwipress/types/recipe`);
        expect(missing.status).toBe(404);
    });

    it("rejects reserved type slugs", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        const reserved = await request(`${base}/__kiwipress/types`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "posts" })
        });
        expect(reserved.status).toBe(400);
    });

    it("creates, edits, and deletes items on a registered CPT", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        await request(`${base}/__kiwipress/types`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "recipe" })
        });

        const created = await request(`${base}/__kiwipress/content/recipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Pie",
                slug: "pie",
                status: "published",
                content: "<p>Bake.</p>"
            })
        });
        expect(created.status).toBe(200);
        const id = (created.json as { id: string }).id;
        expect(created.json).toMatchObject({ collection: "recipe", title: "Pie" });

        const listed = await request(`${base}/__kiwipress/content/recipe`);
        expect(listed.status).toBe(200);
        expect(listed.json).toEqual([expect.objectContaining({ id, slug: "pie" })]);

        const updated = await request(`${base}/__kiwipress/content/recipe?id=${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Apple pie" })
        });
        expect(updated.status).toBe(200);
        expect(updated.json).toMatchObject({ title: "Apple pie" });

        const deleted = await request(`${base}/__kiwipress/content/recipe?id=${id}`, {
            method: "DELETE"
        });
        expect(deleted.status).toBe(200);
        expect(deleted.json).toEqual({ deleted: true });
    });

    it("keeps posts collection CRUD and blocks transfer of CPT slugs", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        const post = await request(`${base}/__kiwipress/content/posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Hello", status: "draft" })
        });
        expect(post.status).toBe(200);
        expect(post.json).toMatchObject({ collection: "posts", title: "Hello" });

        const transfer = await request(`${base}/__kiwipress/transfer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collections: ["posts", "recipe"] })
        });
        expect(transfer.status).toBe(400);
        expect(String((transfer.json as { error?: string }).error)).toMatch(/WordPress collections/);

        const unknown = await request(`${base}/__kiwipress/content/recipe`);
        expect(unknown.status).toBe(404);
    });
});
