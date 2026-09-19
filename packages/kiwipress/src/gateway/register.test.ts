import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "@citrusworx/seltzer";
import { KiwiPress } from "../cms/KiwiPress.js";
import { NectarineStore } from "../cms/store.js";
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

function nativeApp() {
    const kiwi = KiwiPress.connect({
        mode: "nectarine",
        store: new NectarineStore()
    });
    const app = Seltzer.init();
    registerKiwiPressGateway(app, kiwi, { allowLoopbackWithoutToken: true });
    return { app, kiwi };
}

describe("KiwiPress gateway types and CPT collections", () => {
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
