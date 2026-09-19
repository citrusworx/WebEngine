import type { RequestContext, ResponseData, Seltzer } from "@citrusworx/seltzer";
import { KiwiPress } from "../cms/KiwiPress.js";
import type { CmsCollection } from "../cms/types.js";
import type { WordPressPayload } from "../types/api.js";
import { authorizeKiwiPressGateway, type KiwiPressGatewayOptions } from "./auth.js";

function json(status: number, body: unknown): ResponseData {
    return { status, body };
}

function errorMessage(error: unknown, fallback = "KiwiPress request failed."): string {
    return error instanceof Error ? error.message : fallback;
}

function queryId(ctx: RequestContext): string {
    return ctx.query.id ?? "";
}

function payload(ctx: RequestContext): WordPressPayload {
    return (ctx.body && typeof ctx.body === "object" && !Array.isArray(ctx.body)
        ? ctx.body
        : {}) as WordPressPayload;
}

function guard(
    options: KiwiPressGatewayOptions,
    handler: (ctx: RequestContext) => Promise<ResponseData>
) {
    return async (ctx: RequestContext): Promise<ResponseData> => {
        if (!authorizeKiwiPressGateway(ctx.req, options)) {
            return json(401, { error: "Unauthorized" });
        }

        try {
            return await handler(ctx);
        } catch (error) {
            return json(500, { error: errorMessage(error) });
        }
    };
}

async function loadWordpressCollection(kiwi: KiwiPress, kind: "posts" | "pages") {
    return kiwi.wordpress.posts.listAll(kind, { status: "any", context: "edit" });
}

async function updateWordpressItem(
    kiwi: KiwiPress,
    kind: "posts" | "pages",
    id: string,
    body: WordPressPayload
) {
    return kind === "posts"
        ? kiwi.wordpress.posts.update(id, body)
        : kiwi.wordpress.pages.update(id, body);
}

async function deleteWordpressItem(kiwi: KiwiPress, kind: "posts" | "pages", id: string) {
    return kind === "posts"
        ? kiwi.wordpress.posts.delete(id)
        : kiwi.wordpress.pages.delete(id);
}

function registerCollectionRoutes(
    app: Seltzer,
    kiwi: KiwiPress,
    kind: "posts" | "pages",
    options: KiwiPressGatewayOptions
) {
    app.route({
        method: "GET",
        path: `/__kiwipress/content/${kind}`,
        handler: guard(options, async () => {
            if (kiwi.mode === "nectarine") {
                return json(200, await kiwi.native[kind].getAll());
            }

            return json(200, await loadWordpressCollection(kiwi, kind));
        })
    });

    app.route({
        method: "POST",
        path: `/__kiwipress/content/${kind}`,
        handler: guard(options, async (ctx) => {
            const body = payload(ctx);

            if (kiwi.mode === "nectarine") {
                const created = await kiwi.native[kind].create(body);
                await kiwi.persist();
                return json(200, created);
            }

            return json(
                200,
                kind === "posts"
                    ? await kiwi.wordpress.posts.create(body)
                    : await kiwi.wordpress.pages.create(body)
            );
        })
    });

    app.route({
        method: "PATCH",
        path: `/__kiwipress/content/${kind}`,
        handler: guard(options, async (ctx) => {
            const id = queryId(ctx);
            if (!id) {
                return json(400, { error: "id query parameter is required." });
            }

            const body = payload(ctx);

            if (kiwi.mode === "nectarine") {
                const updated = await kiwi.native[kind].update(id, body);
                await kiwi.persist();
                return json(200, updated);
            }

            return json(200, await updateWordpressItem(kiwi, kind, id, body));
        })
    });

    app.route({
        method: "DELETE",
        path: `/__kiwipress/content/${kind}`,
        handler: guard(options, async (ctx) => {
            const id = queryId(ctx);
            if (!id) {
                return json(400, { error: "id query parameter is required." });
            }

            if (kiwi.mode === "nectarine") {
                const deleted = await kiwi.native[kind].delete(id);
                await kiwi.persist();
                return json(200, { deleted });
            }

            return json(200, await deleteWordpressItem(kiwi, kind, id));
        })
    });
}

export function registerKiwiPressGateway(
    app: Seltzer,
    kiwi: KiwiPress,
    options: KiwiPressGatewayOptions = {}
): Seltzer {
    app.route({
        method: "GET",
        path: "/__kiwipress/health",
        handler: (): ResponseData => json(200, { ok: true })
    });

    app.route({
        method: "GET",
        path: "/__kiwipress/cms",
        handler: guard(options, async () => {
            await kiwi.ready();
            return json(200, {
                mode: kiwi.mode,
                entry: "wordpress",
                destination: "nectarine",
                standalone: true,
                persistence: kiwi.store.persistenceKind,
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
        })
    });

    app.route({
        method: "POST",
        path: "/__kiwipress/cms",
        handler: guard(options, async (ctx) => {
            const body = payload(ctx);
            if (body.mode === "nectarine") {
                kiwi.promote();
            } else if (body.mode === "wordpress") {
                kiwi.useWordPress();
            } else {
                return json(400, { error: "mode must be wordpress or nectarine." });
            }

            return json(200, { mode: kiwi.mode });
        })
    });

    app.route({
        method: "POST",
        path: "/__kiwipress/transfer",
        handler: guard(options, async (ctx) => {
            if (!kiwi.sync) {
                return json(400, { error: "Transfer requires a WordPress URL." });
            }

            const body = payload(ctx);
            const collections = Array.isArray(body.collections)
                ? body.collections as CmsCollection[]
                : undefined;
            const result = await kiwi.sync.transfer(collections);
            kiwi.promote();
            await kiwi.persist();
            return json(200, result);
        })
    });

    registerCollectionRoutes(app, kiwi, "posts", options);
    registerCollectionRoutes(app, kiwi, "pages", options);

    return app;
}
