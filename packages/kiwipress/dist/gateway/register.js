async function readJson(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) {
        return {};
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function queryId(req) {
    const host = req.headers?.host ?? "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    return url.searchParams.get("id") ?? "";
}
function sendError(ctx, error, fallback = "KiwiPress request failed.") {
    const message = error instanceof Error ? error.message : fallback;
    ctx.json({ error: message }, 500);
}
async function loadWordpressCollection(kiwi, kind) {
    return kind === "posts" ? kiwi.wordpress.posts.getAll() : kiwi.wordpress.pages.getAll();
}
async function updateWordpressItem(kiwi, kind, id, payload) {
    return kind === "posts"
        ? kiwi.wordpress.posts.update(id, payload)
        : kiwi.wordpress.pages.update(id, payload);
}
async function deleteWordpressItem(kiwi, kind, id) {
    return kind === "posts"
        ? kiwi.wordpress.posts.delete(id)
        : kiwi.wordpress.pages.delete(id);
}
function registerCollectionRoutes(app, kiwi, kind) {
    app.route({
        method: "GET",
        path: `/__kiwipress/content/${kind}`,
        handler: (ctx) => {
            void (async () => {
                try {
                    if (kiwi.mode === "nectarine") {
                        ctx.json(await kiwi.native[kind].getAll());
                        return;
                    }
                    ctx.json(await loadWordpressCollection(kiwi, kind));
                }
                catch (error) {
                    sendError(ctx, error);
                }
            })();
        }
    });
    app.route({
        method: "POST",
        path: `/__kiwipress/content/${kind}`,
        handler: (ctx) => {
            void (async () => {
                try {
                    const payload = (await readJson(ctx.req));
                    if (kiwi.mode === "nectarine") {
                        ctx.json(await kiwi.native[kind].create(payload));
                        return;
                    }
                    ctx.json(kind === "posts"
                        ? await kiwi.wordpress.posts.create(payload)
                        : await kiwi.wordpress.pages.create(payload));
                }
                catch (error) {
                    sendError(ctx, error);
                }
            })();
        }
    });
    app.route({
        method: "PATCH",
        path: `/__kiwipress/content/${kind}`,
        handler: (ctx) => {
            void (async () => {
                try {
                    const id = queryId(ctx.req);
                    if (!id) {
                        ctx.json({ error: "id query parameter is required." }, 400);
                        return;
                    }
                    const payload = (await readJson(ctx.req));
                    if (kiwi.mode === "nectarine") {
                        ctx.json(await kiwi.native[kind].update(id, payload));
                        return;
                    }
                    ctx.json(await updateWordpressItem(kiwi, kind, id, payload));
                }
                catch (error) {
                    sendError(ctx, error);
                }
            })();
        }
    });
    app.route({
        method: "DELETE",
        path: `/__kiwipress/content/${kind}`,
        handler: (ctx) => {
            void (async () => {
                try {
                    const id = queryId(ctx.req);
                    if (!id) {
                        ctx.json({ error: "id query parameter is required." }, 400);
                        return;
                    }
                    if (kiwi.mode === "nectarine") {
                        ctx.json({ deleted: await kiwi.native[kind].delete(id) });
                        return;
                    }
                    ctx.json(await deleteWordpressItem(kiwi, kind, id));
                }
                catch (error) {
                    sendError(ctx, error);
                }
            })();
        }
    });
}
export function registerKiwiPressGateway(app, kiwi) {
    app.route({
        method: "GET",
        path: "/__kiwipress/health",
        handler: (ctx) => {
            ctx.json({
                ok: true,
                mode: kiwi.mode,
                auth: kiwi.auth.strategy()
            });
        }
    });
    app.route({
        method: "GET",
        path: "/__kiwipress/cms",
        handler: (ctx) => {
            ctx.json({
                mode: kiwi.mode,
                entry: "wordpress",
                destination: "nectarine",
                auth: kiwi.auth.strategy(),
                native: {
                    posts: kiwi.store.list("posts").length,
                    pages: kiwi.store.list("pages").length,
                    users: kiwi.store.list("users").length,
                    categories: kiwi.store.list("categories").length,
                    tags: kiwi.store.list("tags").length,
                    comments: kiwi.store.list("comments").length
                }
            });
        }
    });
    app.route({
        method: "POST",
        path: "/__kiwipress/cms",
        handler: (ctx) => {
            void (async () => {
                try {
                    const body = (await readJson(ctx.req));
                    if (body.mode === "nectarine") {
                        kiwi.promote();
                    }
                    else if (body.mode === "wordpress") {
                        kiwi.useWordPress();
                    }
                    else {
                        ctx.json({ error: "mode must be wordpress or nectarine." }, 400);
                        return;
                    }
                    ctx.json({ mode: kiwi.mode });
                }
                catch (error) {
                    sendError(ctx, error);
                }
            })();
        }
    });
    app.route({
        method: "POST",
        path: "/__kiwipress/transfer",
        handler: (ctx) => {
            void (async () => {
                try {
                    if (!kiwi.sync) {
                        ctx.json({ error: "Transfer requires a WordPress URL." }, 400);
                        return;
                    }
                    const body = (await readJson(ctx.req));
                    const result = await kiwi.sync.transfer(body.collections);
                    kiwi.promote();
                    ctx.json(result);
                }
                catch (error) {
                    sendError(ctx, error);
                }
            })();
        }
    });
    registerCollectionRoutes(app, kiwi, "posts");
    registerCollectionRoutes(app, kiwi, "pages");
    return app;
}
//# sourceMappingURL=register.js.map