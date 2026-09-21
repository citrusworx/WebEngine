import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
import { spaceOriginHostname } from "../spaces/spaces.js";

/** DigitalOcean allows only these CDN edge TTLs. */
export const CDN_TTL_VALUES = [60, 600, 3600, 86400, 604800] as const;
export type CdnTtl = (typeof CDN_TTL_VALUES)[number];

export interface CdnEndpoint {
    id: string;
    origin: string;
    endpoint: string;
    ttl?: number;
    certificate_id?: string;
    custom_domain?: string;
    created_at?: string;
}

export interface CdnBlueprint {
    origin: string;
    ttl?: CdnTtl | number;
    certificate_id?: string;
    custom_domain?: string;
}

export interface CdnOriginInput {
    origin?: string;
    space?: string;
    region?: string;
    spaceRegion?: string;
    fallbackRegion?: string;
}

export function resolveCdnOrigin(input: CdnOriginInput): string {
    if (input.origin?.trim()) {
        return input.origin.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    }
    const region = input.region ?? input.spaceRegion ?? input.fallbackRegion;
    if (!input.space || !region) {
        throw new Error("CDN endpoint requires origin, or a space name plus a region");
    }
    return spaceOriginHostname(input.space, region);
}

export async function listCdnEndpoints(): Promise<CdnEndpoint[]> {
    const response = await doRequest<{ endpoints?: CdnEndpoint[] }>({
        method: "GET",
        url: "/cdn/endpoints"
    });
    return response.endpoints ?? [];
}

export async function getCdnEndpoint(id: string): Promise<CdnEndpoint> {
    const response = await doRequest<{ endpoint: CdnEndpoint }>({
        method: "GET",
        url: `/cdn/endpoints/${encodeURIComponent(id)}`
    });
    return response.endpoint;
}

/**
 * PUT `/cdn/endpoints/:id` with only the fields passed in.
 * Apply uses this for TTL. It does not send `custom_domain` or `certificate_id` on adopt.
 */
export async function updateCdnEndpoint(
    id: string,
    patch: { ttl?: CdnTtl | number }
): Promise<CdnEndpoint> {
    const response = await doRequest<{ endpoint: CdnEndpoint }>({
        method: "PUT",
        url: `/cdn/endpoints/${encodeURIComponent(id)}`,
        data: cleanPayload({ ttl: patch.ttl })
    });
    return response.endpoint;
}

export async function createCdnEndpoint(blueprint: CdnBlueprint): Promise<CdnEndpoint> {
    const response = await doRequest<{ endpoint: CdnEndpoint }>({
        method: "POST",
        url: "/cdn/endpoints",
        data: cleanPayload({
            origin: blueprint.origin,
            ttl: blueprint.ttl,
            certificate_id: blueprint.certificate_id,
            custom_domain: blueprint.custom_domain
        })
    });
    return response.endpoint;
}

export async function deleteCdnEndpoint(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/cdn/endpoints/${encodeURIComponent(id)}`
    });
}
