async function sendWordPressRequest(ctx, init) {
    const headers = {
        ...(ctx.options?.headers ?? {}),
        ...(init?.headers ?? {})
    };
    const requestInit = {
        ...init,
        headers
    };
    const allowSelfSigned = typeof ctx.options === "object" &&
        ctx.options !== null &&
        "allowSelfSigned" in ctx.options &&
        Boolean(ctx.options.allowSelfSigned);
    if (allowSelfSigned && ctx.endpoint.startsWith("https://")) {
        const { Agent } = await import("undici");
        return fetch(ctx.endpoint, {
            ...requestInit,
            dispatcher: new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            })
        });
    }
    return fetch(ctx.endpoint, requestInit);
}
export async function requestWordPress(ctx, init) {
    const response = await sendWordPressRequest(ctx, init);
    if (!response.ok) {
        throw new Error(`WordPress request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}
export async function requestWordPressPage(ctx, init) {
    const response = await sendWordPressRequest(ctx, init);
    if (!response.ok) {
        throw new Error(`WordPress request failed: ${response.status} ${response.statusText}`);
    }
    const total = Number(response.headers?.get?.("X-WP-Total") ?? "0") || 0;
    const totalPages = Math.max(1, Number(response.headers?.get?.("X-WP-TotalPages") ?? "1") || 1);
    return {
        data: await response.json(),
        total,
        totalPages
    };
}
export function createWordPressRoute(config, init) {
    return {
        method: config.method,
        path: config.endpoint,
        handler: async (ctx) => requestWordPress(ctx, init)
    };
}
export function getLastParam(ctx) {
    return decodeURIComponent(ctx.path.split("/").pop() ?? "");
}
export function buildCollectionQueryEndpoint(ctx, collection, query) {
    const baseUrl = ctx.options?.baseUrl ?? "";
    return `${baseUrl}/${collection}?${query}`;
}
export function createAliasedQueryRoute(config, collection, queryKey) {
    return {
        method: config.method,
        path: config.endpoint,
        handler: async (ctx) => {
            const value = getLastParam(ctx);
            return requestWordPress({
                ...ctx,
                endpoint: buildCollectionQueryEndpoint(ctx, collection, `${queryKey}=${encodeURIComponent(value)}`)
            });
        }
    };
}
//# sourceMappingURL=route-utils.js.map