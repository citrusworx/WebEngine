import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api.ts";

export async function requestWordPress(ctx: Endpoint, init?: RequestInit) {
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

    let response: Response;

    if (allowSelfSigned && ctx.endpoint.startsWith("https://")) {
        const { Agent } = await import("undici");
        response = await fetch(ctx.endpoint, {
            ...requestInit,
            dispatcher: new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            })
        } as unknown as RequestInit);
    } else {
        response = await fetch(ctx.endpoint, requestInit);
    }

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
