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
    const server = app.listen(0, { onListening: () => undefined });
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
    return { kiwi, app: registerKiwiPressGateway(Seltzer.init(), kiwi) };
}

describe("registerKiwiPressGateway", () => {
    it("serves health without auth", async () => {
        const { app } = nativeApp();
        const base = await listen(app);
        const res = await request(`${base}/__kiwipress/health`);
        expect(res.status).toBe(200);
        expect(res.json).toEqual({ ok: true });
    });

    it("lists, creates, updates, and deletes native posts", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        const empty = await request(`${base}/__kiwipress/content/posts`);
        expect(empty.status).toBe(200);
        expect(empty.json).toEqual([]);

        const created = await request(`${base}/__kiwipress/content/posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Hello",
                slug: "hello",
                status: "publish",
                content: "<p>Hi</p>"
            })
        });
        expect(created.status).toBe(200);
        const createdBody = created.json as { id: string; title: string; status: string };
        expect(createdBody.title).toBe("Hello");
        expect(createdBody.status).toBe("published");

        const listed = await request(`${base}/__kiwipress/content/posts`);
        expect(listed.status).toBe(200);
        expect(listed.json).toHaveLength(1);

        const updated = await request(`${base}/__kiwipress/content/posts?id=${createdBody.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Hello edited", status: "draft" })
        });
        expect(updated.status).toBe(200);
        expect(updated.json).toMatchObject({ title: "Hello edited", status: "draft" });

        const deleted = await request(`${base}/__kiwipress/content/posts?id=${createdBody.id}`, {
            method: "DELETE"
        });
        expect(deleted.status).toBe(200);
        expect(deleted.json).toEqual({ deleted: true });

        const after = await request(`${base}/__kiwipress/content/posts`);
        expect(after.json).toEqual([]);
    });

    it("lists, creates, updates, and deletes native pages", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        const created = await request(`${base}/__kiwipress/content/pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "About",
                slug: "about",
                status: "draft",
                content: "<p>About us</p>"
            })
        });
        expect(created.status).toBe(200);
        const createdBody = created.json as { id: string; slug: string };
        expect(createdBody.slug).toBe("about");

        const updated = await request(`${base}/__kiwipress/content/pages?id=${createdBody.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "publish" })
        });
        expect(updated.status).toBe(200);
        expect(updated.json).toMatchObject({ status: "published" });

        const deleted = await request(`${base}/__kiwipress/content/pages?id=${createdBody.id}`, {
            method: "DELETE"
        });
        expect(deleted.status).toBe(200);
        expect(deleted.json).toEqual({ deleted: true });
    });

    it("requires id on PATCH and DELETE", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        const patch = await request(`${base}/__kiwipress/content/posts`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Nope" })
        });
        expect(patch.status).toBe(400);
        expect(patch.json).toEqual({ error: "id query parameter is required." });

        const del = await request(`${base}/__kiwipress/content/pages`, { method: "DELETE" });
        expect(del.status).toBe(400);
        expect(del.json).toEqual({ error: "id query parameter is required." });
    });

    it("reports nectarine CMS status and rejects transfer without WordPress", async () => {
        const { app } = nativeApp();
        const base = await listen(app);

        const cms = await request(`${base}/__kiwipress/cms`);
        expect(cms.status).toBe(200);
        expect(cms.json).toMatchObject({
            mode: "nectarine",
            destination: "nectarine",
            native: { posts: 0, pages: 0 }
        });

        const transfer = await request(`${base}/__kiwipress/transfer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        expect(transfer.status).toBe(400);
        expect(transfer.json).toEqual({ error: "Transfer requires a WordPress URL." });
    });
});
