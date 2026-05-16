export async function requestWordPress(ctx, init) {
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
    let response;
    if (allowSelfSigned && ctx.endpoint.startsWith("https://")) {
        const { Agent } = await import("undici");
        response = await fetch(ctx.endpoint, {
            ...requestInit,
            dispatcher: new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            })
        });
    }
    else {
        response = await fetch(ctx.endpoint, requestInit);
    }
    if (!response.ok) {
        throw new Error(`WordPress request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
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