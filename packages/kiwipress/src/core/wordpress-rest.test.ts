import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "vitest";
import { KiwiPress } from "../cms/KiwiPress.js";
import { createFilePersistence } from "../cms/file-persistence.js";
import { Posts } from "../posts/posts.js";

it("sends WordPress REST requests over HTTP and rejects non-success responses", async () => {
    const post = { id: 7, title: { rendered: "Draft" } };
    const namespace = "/wordpress/wp-json/wp/v2/posts";
    const seen: unknown[] = [];
    const server = createServer(async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        seen.push({
            method: req.method,
            url: req.url,
            authorization: req.headers.authorization,
            apiKey: req.headers["x-api-key"],
            body: Buffer.concat(chunks).toString("utf8")
        });

        res.setHeader("Content-Type", "application/json");
        if (req.url === `${namespace}/404`) {
            res.statusCode = 404;
            res.end(JSON.stringify({ code: "rest_post_invalid_id" }));
        } else if (req.method === "GET" && req.url?.includes("?slug=")) {
            res.end(JSON.stringify([post]));
        } else if (req.method === "DELETE") {
            res.end(JSON.stringify({ deleted: true }));
        } else {
            res.statusCode = req.method === "POST" ? 201 : 200;
            res.end(JSON.stringify(post));
        }
    });

    server.listen(0, "127.0.0.1");
    try {
        await once(server, "listening");
        const address = server.address();
        assert(address && typeof address !== "string");
        const posts = new Posts({
            url: `http://127.0.0.1:${address.port}/wordpress/`,
            apiBase: "/wp-json/wp/v2/",
            username: "fixture-user",
            appPassword: "fixture-password",
            token: "fixture-bearer",
            apiKey: "fixture-key",
            headers: { authorization: "Bearer custom-token", "x-api-key": "custom-key" }
        });

        assert.deepEqual(await posts.getBySlug("notes + updates"), [post]);
        assert.deepEqual(await posts.create({ title: "Draft" }), post);
        assert.deepEqual(await posts.update(7, { status: "publish" }), post);
        assert.deepEqual(await posts.delete(7), { deleted: true });
        await assert.rejects(async () => posts.getById(404), /^Error: WordPress request failed: 404 Not Found$/);

        const auth = {
            authorization: `Basic ${Buffer.from("fixture-user:fixture-password").toString("base64")}`,
            apiKey: "fixture-key"
        };
        assert.deepEqual(seen, [
            { method: "GET", url: `${namespace}?slug=notes%20%2B%20updates`, ...auth, body: "" },
            { method: "POST", url: namespace, ...auth, body: '{"title":"Draft"}' },
            { method: "PUT", url: `${namespace}/7`, ...auth, body: '{"status":"publish"}' },
            { method: "DELETE", url: `${namespace}/7`, ...auth, body: "" },
            { method: "GET", url: `${namespace}/404`, ...auth, body: "" }
        ]);
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});

it("keeps transfer explicit and preserves the saved snapshot on a collection read failure", async () => {
    const directory = await mkdtemp(join(tmpdir(), "kiwipress-transfer-"));
    const file = join(directory, "cms.json");
    let failPages = true;
    const seen: Array<{ method?: string; collection: string }> = [];
    const fixtures = {
        posts: [{ id: 7, slug: "imported", title: { rendered: "Imported post" }, status: "publish" }],
        pages: [{ id: 8, slug: "about", title: { rendered: "About" }, status: "draft" }],
        users: []
    };
    const server = createServer((req, res) => {
        const path = new URL(req.url ?? "/", "http://localhost").pathname;
        const collection = path.split("/").at(-1) as keyof typeof fixtures;
        seen.push({ method: req.method, collection });
        res.setHeader("Content-Type", "application/json");
        if (collection === "pages" && failPages) {
            res.statusCode = 403;
            res.end(JSON.stringify({ code: "rest_forbidden" }));
        } else {
            res.end(JSON.stringify(fixtures[collection]));
        }
    });

    server.listen(0, "127.0.0.1");
    try {
        await once(server, "listening");
        const address = server.address();
        assert(address && typeof address !== "string");

        const connectNative = () => KiwiPress.connect({ mode: "nectarine", persistence: createFilePersistence(file) });
        const original = connectNative();
        await original.native.posts.create({ id: "7", title: "Before import" });
        const originalSnapshot = await readFile(file, "utf8");

        const kiwi = KiwiPress.connect({
            url: `http://127.0.0.1:${address.port}`,
            apiBase: "wp-json/wp/v2",
            persistence: createFilePersistence(file)
        });
        await kiwi.ready();
        assert.deepEqual(seen, []);
        assert.equal((await kiwi.native.posts.getById(7))?.title, "Before import");
        assert(kiwi.sync);

        await assert.rejects(
            kiwi.sync.transfer(["posts", "pages", "users"]),
            /WPSync failed to read WordPress pages: WordPress request failed: 403 Forbidden/
        );
        assert.deepEqual(seen, [{ method: "GET", collection: "posts" }, { method: "GET", collection: "pages" }]);
        assert.equal((await kiwi.native.posts.getById(7))?.title, "Imported post");
        assert.equal(await readFile(file, "utf8"), originalSnapshot);

        failPages = false;
        const result = await kiwi.sync.transfer(["posts", "pages"]);
        assert.equal(result.mode, "nectarine");
        assert.equal(result.counts.posts, 1);
        assert.equal(result.counts.pages, 1);
        assert.equal(kiwi.mode, "wordpress");
        const reopened = connectNative();
        assert.equal((await reopened.native.posts.getById(7))?.status, "published");
        assert.equal((await reopened.native.pages.getById(8))?.title, "About");
        assert.equal(kiwi.promote().mode, "nectarine");
        assert.deepEqual(seen.slice(2), [{ method: "GET", collection: "posts" }, { method: "GET", collection: "pages" }]);
    } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
        await rm(directory, { recursive: true, force: true });
    }
});
