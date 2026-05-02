import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api";

export async function requestWordPress(ctx: Endpoint, init?: RequestInit) {
    const headers = {
        ...(ctx.options?.headers ?? {}),
        ...(init?.headers ?? {})
    };

    const response = await fetch(ctx.endpoint, {
        ...init,
        headers
    });

    if (!response.ok) {
        throw new Error(`WordPress request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export function createWordPressRoute(config: ApiDefinition, init?: RequestInit): Route<Endpoint> {
    return {
        method: config.method,
        path: config.endpoint,
        handler: async (ctx: Endpoint) => requestWordPress(ctx, init)
    };
}

export function getLastParam(ctx: Endpoint): string {
    return decodeURIComponent(ctx.path.split("/").pop() ?? "");
}

export function buildCollectionQueryEndpoint(
    ctx: Endpoint,
    collection: string,
    query: string
): string {
    const baseUrl = ctx.options?.baseUrl ?? "";
    return `${baseUrl}/${collection}?${query}`;
}

export function createAliasedQueryRoute(
    config: ApiDefinition,
    collection: string,
    queryKey: string
): Route<Endpoint> {
    return {
        method: config.method,
        path: config.endpoint,
        handler: async (ctx: Endpoint) => {
            const value = getLastParam(ctx);

            return requestWordPress({
                ...ctx,
                endpoint: buildCollectionQueryEndpoint(
                    ctx,
                    collection,
                    `${queryKey}=${encodeURIComponent(value)}`
                )
            });
        }
    };
}
