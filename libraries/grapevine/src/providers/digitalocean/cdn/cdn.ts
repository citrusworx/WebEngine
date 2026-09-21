import { doRequest } from "../client.js";
import { pollUntil } from "../wait.js";
import { cleanPayload } from "../utilities.js";
import { spaceOriginHostname } from "../spaces/spaces.js";

/** DigitalOcean allows only these CDN edge TTLs. */
export const CDN_TTL_VALUES = [60, 600, 3600, 86400, 604800] as const;
export type CdnTtl = (typeof CDN_TTL_VALUES)[number];

export interface CdnEndpoint {
    id: string;
    origin: string;
    /** CDN hostname (`*.cdn.digitaloceanspaces.com`). Empty until DigitalOcean assigns it. */
    endpoint?: string;
    ttl?: number;
    certificate_id?: string;
    custom_domain?: string;
    created_at?: string;
    /**
     * Not part of the documented v2 CDN object. If a response includes it,
     * `active` / `online` count as live and `error` / `failed` fail the wait.
     */
    status?: string;
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

export interface WaitForCdnEndpointOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}

/** Default CDN hostname poll: 5 minutes, every 5 seconds. */
export const DEFAULT_CDN_WAIT_MS = 5 * 60 * 1000;
export const DEFAULT_CDN_POLL_MS = 5_000;

/**
 * A CDN endpoint is usable once DigitalOcean has assigned the `endpoint` hostname.
 * The public v2 object has no status field; a non-empty hostname is the ready signal.
 * If `status` is present, only `active` or `online` (with a hostname) counts as live.
 */
export function cdnEndpointIsLive(endpoint: CdnEndpoint): boolean {
    const hostname = endpoint.endpoint?.trim();
    if (!hostname) {
        return false;
    }
    const status = endpoint.status?.trim().toLowerCase();
    if (!status) {
        return true;
    }
    return status === "active" || status === "online";
}

function cdnTerminalError(endpoint: CdnEndpoint): string | undefined {
    const status = endpoint.status?.trim().toLowerCase();
    if (status === "error" || status === "failed") {
        return `DigitalOcean CDN endpoint ${endpoint.id} entered status "${endpoint.status}"`;
    }
    return undefined;
}

/**
 * Poll GET /cdn/endpoints/:id until the endpoint hostname is present
 * (and status, when returned, is active). Bounded; never loops forever.
 */
export async function waitForCdnEndpoint(
    id: string,
    options: WaitForCdnEndpointOptions = {}
): Promise<CdnEndpoint> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_CDN_WAIT_MS;
    const intervalMs = options.intervalMs ?? DEFAULT_CDN_POLL_MS;
    return pollUntil({
        timeoutMs,
        intervalMs,
        sleep: options.sleep,
        read: () => getCdnEndpoint(id),
        done: cdnEndpointIsLive,
        failure: cdnTerminalError,
        timeoutError: (current) =>
            `Timed out waiting for DigitalOcean CDN endpoint ${id} to become usable (last endpoint: ${current.endpoint?.trim() || "missing"}${current.status ? `, status ${current.status}` : ""})`
    });
}
