import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api.js";

async function sendWordPressRequest(ctx: Endpoint, init?: RequestInit): Promise<Response> {
    const headers = {
        ...(ctx.options?.headers ?? {}),
        ...(init?.headers ?? {})
    };

    const requestInit: RequestInit = {
        ...init,
        headers
    };

    const allowSelfSigned =
        typeof ctx.options === "object" &&
        ctx.options !== null &&
        "allowSelfSigned" in ctx.options &&
        Boolean((ctx.options as Record<string, unknown>).allowSelfSigned);

    if (allowSelfSigned && ctx.endpoint.startsWith("https://")) {
        const { Agent } = await import("undici");
        return fetch(ctx.endpoint, {
            ...requestInit,
            dispatcher: new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            })
        } as unknown as RequestInit);
    }

    return fetch(ctx.endpoint, requestInit);
}

export async function requestWordPress(ctx: Endpoint, init?: RequestInit) {
    const response = await sendWordPressRequest(ctx, init);

    if (!response.ok) {
        throw new Error(`WordPress request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export type WordPressPage = {
    data: unknown;
    total: number;
    totalPages: number;
};

export async function requestWordPressPage(ctx: Endpoint, init?: RequestInit): Promise<WordPressPage> {
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

export function createAliasedQueryRouteFromKeys(
    config: ApiDefinition,
    collection: string,
    queryKeys: readonly string[]
): Route<Endpoint> {
    return {
        method: config.method,
        path: config.endpoint,
        handler: async (ctx: Endpoint) => {
            const values = ctx.path.split("/").slice(-queryKeys.length);
            const query = queryKeys
                .map((key, index) => {
                    const value = decodeURIComponent(values[index] ?? "");
                    return `${key}=${encodeURIComponent(value)}`;
                })
                .join("&");

            return requestWordPress({
                ...ctx,
                endpoint: buildCollectionQueryEndpoint(ctx, collection, query)
            });
        }
    };
}
