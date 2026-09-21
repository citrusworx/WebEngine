/** DigitalOcean allows only these CDN edge TTLs. */
export declare const CDN_TTL_VALUES: readonly [60, 600, 3600, 86400, 604800];
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
export declare function resolveCdnOrigin(input: CdnOriginInput): string;
export declare function listCdnEndpoints(): Promise<CdnEndpoint[]>;
export declare function getCdnEndpoint(id: string): Promise<CdnEndpoint>;
/**
 * PUT `/cdn/endpoints/:id` with only the fields passed in.
 * Apply uses this for TTL. It does not send `custom_domain` or `certificate_id` on adopt.
 */
export declare function updateCdnEndpoint(id: string, patch: {
    ttl?: CdnTtl | number;
}): Promise<CdnEndpoint>;
export declare function createCdnEndpoint(blueprint: CdnBlueprint): Promise<CdnEndpoint>;
export declare function deleteCdnEndpoint(id: string): Promise<void>;
export interface WaitForCdnEndpointOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}
/** Default CDN hostname poll: 5 minutes, every 5 seconds. */
export declare const DEFAULT_CDN_WAIT_MS: number;
export declare const DEFAULT_CDN_POLL_MS = 5000;
/**
 * A CDN endpoint is usable once DigitalOcean has assigned the `endpoint` hostname.
 * The public v2 object has no status field; a non-empty hostname is the ready signal.
 * If `status` is present, only `active` or `online` (with a hostname) counts as live.
 */
export declare function cdnEndpointIsLive(endpoint: CdnEndpoint): boolean;
/**
 * Poll GET /cdn/endpoints/:id until the endpoint hostname is present
 * (and status, when returned, is active). Bounded; never loops forever.
 */
export declare function waitForCdnEndpoint(id: string, options?: WaitForCdnEndpointOptions): Promise<CdnEndpoint>;
