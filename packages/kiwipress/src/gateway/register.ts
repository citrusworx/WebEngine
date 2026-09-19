import type { IncomingMessage } from "node:http";
import { Seltzer, type RequestContext, type ResponseData } from "@citrusworx/seltzer";
import { KiwiPress } from "../cms/KiwiPress.js";
import { CMS_COLLECTIONS, type CmsCollection } from "../cms/types.js";
import { isCmsCollection } from "../cms/persistence.js";
import { isCustomTypeSlug, isEditableGatewayCollection } from "../cms/type-registry.js";
import type { WordPressPayload } from "../types/api.js";
import { authorizeKiwiPressGateway, type KiwiPressGatewayOptions } from "./auth.js";

function json(status: number, body: unknown): ResponseData {
    return { status, body };
}

function asObject(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

function errorMessage(error: unknown, fallback = "KiwiPress request failed."): string {
    return error instanceof Error ? error.message : fallback;
}

function failureStatus(error: unknown): number {
    const message = errorMessage(error);
    if (message.includes("was not found")) {
        return 404;
    }

    if (
        message.includes("already exists") ||
        message.includes("cannot be changed") ||
        message.includes("must be") ||
        message.includes("Invalid") ||
        message.includes("limited to WordPress") ||
        message.includes("Unknown KiwiPress") ||
        message.includes("Unknown collection")
    ) {
        return 400;
    }

    return 500;
}

function queryId(ctx: RequestContext): string {
    return typeof ctx.query.id === "string" ? ctx.query.id : "";
}

function routeKind(ctx: RequestContext): string {
    return typeof ctx.params.kind === "string" ? ctx.params.kind : "";
}

function routeSlug(ctx: RequestContext): string {
    return typeof ctx.params.slug === "string" ? ctx.params.slug : "";
}

function guard(
    options: KiwiPressGatewayOptions,
    handler: (ctx: RequestContext) => Promise<ResponseData> | ResponseData
) {
    return async (ctx: RequestContext): Promise<ResponseData> => {
        if (!authorizeKiwiPressGateway(ctx.req as IncomingMessage, options)) {
            return json(401, { error: "Unauthorized" });
        }

        try {
            return await handler(ctx);
        } catch (error) {
            return json(failureStatus(error), { error: errorMessage(error) });
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
    payload: WordPressPayload
) {
    return kind === "posts"
        ? kiwi.wordpress.posts.update(id, payload)
        : kiwi.wordpress.pages.update(id, payload);
}

async function deleteWordpressItem(kiwi: KiwiPress, kind: "posts" | "pages", id: string) {
    return kind === "posts"
        ? kiwi.wordpress.posts.delete(id)
        : kiwi.wordpress.pages.delete(id);
}

function nativeCounts(kiwi: KiwiPress): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const collection of CMS_COLLECTIONS) {
        counts[collection] = kiwi.store.list(collection).length;
    }

    for (const definition of kiwi.store.listTypes()) {
        counts[definition.slug] = kiwi.store.list(definition.slug).length;
    }

    return counts;
}

function transferCollections(value: unknown): CmsCollection[] | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (!Array.isArray(value)) {
        throw new Error("collections must be an array of WordPress collection slugs.");
    }

    const invalid = value.filter((entry) => typeof entry !== "string" || !isCmsCollection(entry));
    if (invalid.length > 0) {
        throw new Error(
            `Transfer is limited to WordPress collections (${CMS_COLLECTIONS.join(", ")}). Unknown: ${invalid.join(", ")}.`
        );
    }

    return value as CmsCollection[];
}

async function requireEditableCollection(kiwi: KiwiPress, kind: string): Promise<ResponseData | null> {
    await kiwi.ready();

    if (!kind) {
        return json(400, { error: "Collection slug is required." });
    }

    if (!isEditableGatewayCollection(kind)) {
        return json(404, { error: `Collection "${kind}" is not editable through the gateway.` });
    }

    if (isCustomTypeSlug(kind) && !kiwi.store.getType(kind)) {
        return json(404, { error: `Custom type "${kind}" was not found.` });
    }

    return null;
}

function registerCollectionRoutes(app: Seltzer, kiwi: KiwiPress, options: KiwiPressGatewayOptions) {
    app.route({
        method: "GET",
        path: "/__kiwipress/content/:kind",
        handler: guard(options, async (ctx) => {
            const kind = routeKind(ctx);
            const rejected = await requireEditableCollection(kiwi, kind);
            if (rejected) {
                return rejected;
            }

            if (kiwi.mode === "nectarine" || isCustomTypeSlug(kind)) {
                return json(200, await kiwi.native.collection(kind).getAll());
            }

            return json(200, await loadWordpressCollection(kiwi, kind as "posts" | "pages"));
        })
    });

    app.route({
        method: "POST",
        path: "/__kiwipress/content/:kind",
        handler: guard(options, async (ctx) => {
            const kind = routeKind(ctx);
            const rejected = await requireEditableCollection(kiwi, kind);
            if (rejected) {
                return rejected;
            }

            const payload = asObject(ctx.body) as WordPressPayload;

            if (kiwi.mode === "nectarine" || isCustomTypeSlug(kind)) {
                const created = await kiwi.native.collection(kind).create(payload);
                await kiwi.persist();
                return json(200, created);
            }

            return json(
                200,
                kind === "posts"
                    ? await kiwi.wordpress.posts.create(payload)
                    : await kiwi.wordpress.pages.create(payload)
            );
        })
    });

    app.route({
        method: "PATCH",
        path: "/__kiwipress/content/:kind",
        handler: guard(options, async (ctx) => {
            const kind = routeKind(ctx);
            const rejected = await requireEditableCollection(kiwi, kind);
            if (rejected) {
                return rejected;
            }

            const id = queryId(ctx);
            if (!id) {
                return json(400, { error: "id query parameter is required." });
            }

            const payload = asObject(ctx.body) as WordPressPayload;

            if (kiwi.mode === "nectarine" || isCustomTypeSlug(kind)) {
                const updated = await kiwi.native.collection(kind).update(id, payload);
                await kiwi.persist();
                return json(200, updated);
            }

            return json(200, await updateWordpressItem(kiwi, kind as "posts" | "pages", id, payload));
        })
    });

    app.route({
        method: "DELETE",
        path: "/__kiwipress/content/:kind",
        handler: guard(options, async (ctx) => {
            const kind = routeKind(ctx);
            const rejected = await requireEditableCollection(kiwi, kind);
            if (rejected) {
                return rejected;
            }

            const id = queryId(ctx);
            if (!id) {
                return json(400, { error: "id query parameter is required." });
            }

            if (kiwi.mode === "nectarine" || isCustomTypeSlug(kind)) {
                const deleted = await kiwi.native.collection(kind).delete(id);
                await kiwi.persist();
                return json(200, { deleted });
            }

            return json(200, await deleteWordpressItem(kiwi, kind as "posts" | "pages", id));
        })
    });
}

function registerTypeRoutes(app: Seltzer, kiwi: KiwiPress, options: KiwiPressGatewayOptions) {
    app.route({
        method: "GET",
        path: "/__kiwipress/types",
        handler: guard(options, async () => {
            await kiwi.ready();
            return json(200, { types: kiwi.store.listTypes() });
        })
    });

    app.route({
        method: "POST",
        path: "/__kiwipress/types",
        handler: guard(options, async (ctx) => {
            await kiwi.ready();
            const created = kiwi.store.registerType(asObject(ctx.body));
            await kiwi.persist();
            return json(201, created);
        })
    });

    app.route({
        method: "GET",
        path: "/__kiwipress/types/:slug",
        handler: guard(options, async (ctx) => {
            await kiwi.ready();
            const slug = routeSlug(ctx);
            const definition = kiwi.store.getType(slug);
            if (!definition) {
                return json(404, { error: `Custom type "${slug}" was not found.` });
            }

            return json(200, definition);
        })
    });

    app.route({
        method: "PATCH",
        path: "/__kiwipress/types/:slug",
        handler: guard(options, async (ctx) => {
            await kiwi.ready();
            const slug = routeSlug(ctx);
            if (!kiwi.store.getType(slug)) {
                return json(404, { error: `Custom type "${slug}" was not found.` });
            }

            const updated = kiwi.store.updateType(slug, asObject(ctx.body));
            await kiwi.persist();
            return json(200, updated);
        })
    });

    app.route({
        method: "DELETE",
        path: "/__kiwipress/types/:slug",
        handler: guard(options, async (ctx) => {
            await kiwi.ready();
            const slug = routeSlug(ctx);
            const deleted = kiwi.store.removeType(slug);
            if (!deleted) {
                return json(404, { error: `Custom type "${slug}" was not found.` });
            }

            await kiwi.persist();
            return json(200, { deleted: true });
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
        handler: () => json(200, { ok: true })
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
                native: nativeCounts(kiwi),
                types: kiwi.store.listTypes()
            });
        })
    });

    app.route({
        method: "POST",
        path: "/__kiwipress/cms",
        handler: guard(options, async (ctx) => {
            const body = asObject(ctx.body);
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
            const body = asObject(ctx.body);
            const collections = transferCollections(body.collections);

            if (!kiwi.sync) {
                return json(400, { error: "Transfer requires a WordPress URL." });
            }

            const result = await kiwi.sync.transfer(collections);
            kiwi.promote();
            await kiwi.persist();
            return json(200, result);
        })
    });

    registerTypeRoutes(app, kiwi, options);
    registerCollectionRoutes(app, kiwi, options);

    return app;
}
