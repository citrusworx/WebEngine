import { CMS_COLLECTIONS } from "../cms/types.js";
import { isCmsCollection } from "../cms/persistence.js";
import { isCustomTypeSlug, isEditableGatewayCollection } from "../cms/type-registry.js";
import { authorizeKiwiPressGateway } from "./auth.js";
function json(status, body) {
    return { status, body };
}
function asObject(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
function errorMessage(error, fallback = "KiwiPress request failed.") {
    return error instanceof Error ? error.message : fallback;
}
function failureStatus(error) {
    const message = errorMessage(error);
    if (message.includes("was not found")) {
        return 404;
    }
    if (message.includes("already exists") ||
        message.includes("cannot be changed") ||
        message.includes("must be") ||
        message.includes("Invalid") ||
        message.includes("limited to WordPress") ||
        message.includes("Unknown KiwiPress") ||
        message.includes("Unknown collection")) {
        return 400;
    }
    return 500;
}
function queryId(ctx) {
    return typeof ctx.query.id === "string" ? ctx.query.id : "";
}
function routeKind(ctx) {
    return typeof ctx.params.kind === "string" ? ctx.params.kind : "";
}
function routeSlug(ctx) {
    return typeof ctx.params.slug === "string" ? ctx.params.slug : "";
}
function guard(options, handler) {
    return async (ctx) => {
        if (!authorizeKiwiPressGateway(ctx.req, options)) {
            return json(401, { error: "Unauthorized" });
        }
        try {
            return await handler(ctx);
        }
        catch (error) {
            return json(failureStatus(error), { error: errorMessage(error) });
        }
    };
}
async function loadWordpressCollection(kiwi, kind) {
    return kiwi.wordpress.posts.listAll(kind, { status: "any", context: "edit" });
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
function nativeCounts(kiwi) {
    const counts = {};
    for (const collection of CMS_COLLECTIONS) {
        counts[collection] = kiwi.store.list(collection).length;
    }
    for (const definition of kiwi.store.listTypes()) {
        counts[definition.slug] = kiwi.store.list(definition.slug).length;
    }
    return counts;
}
function transferCollections(value) {
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error("collections must be an array of WordPress collection slugs.");
    }
    const invalid = value.filter((entry) => typeof entry !== "string" || !isCmsCollection(entry));
    if (invalid.length > 0) {
        throw new Error(`Transfer is limited to WordPress collections (${CMS_COLLECTIONS.join(", ")}). Unknown: ${invalid.join(", ")}.`);
    }
    return value;
}
async function requireEditableCollection(kiwi, kind) {
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
function registerCollectionRoutes(app, kiwi, options) {
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
            return json(200, await loadWordpressCollection(kiwi, kind));
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
            const payload = asObject(ctx.body);
            if (kiwi.mode === "nectarine" || isCustomTypeSlug(kind)) {
                const created = await kiwi.native.collection(kind).create(payload);
                await kiwi.persist();
                return json(200, created);
            }
            return json(200, kind === "posts"
                ? await kiwi.wordpress.posts.create(payload)
                : await kiwi.wordpress.pages.create(payload));
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
            const payload = asObject(ctx.body);
            if (kiwi.mode === "nectarine" || isCustomTypeSlug(kind)) {
                const updated = await kiwi.native.collection(kind).update(id, payload);
                await kiwi.persist();
                return json(200, updated);
            }
            return json(200, await updateWordpressItem(kiwi, kind, id, payload));
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
            return json(200, await deleteWordpressItem(kiwi, kind, id));
        })
    });
}
function registerTypeRoutes(app, kiwi, options) {
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
export function registerKiwiPressGateway(app, kiwi, options = {}) {
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
            }
            else if (body.mode === "wordpress") {
                kiwi.useWordPress();
            }
            else {
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
//# sourceMappingURL=register.js.map