/** DigitalOcean allows only these CDN edge TTLs. */
export declare const CDN_TTL_VALUES: readonly [60, 600, 3600, 86400, 604800];
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
export declare function resolveCdnOrigin(input: CdnOriginInput): string;
export declare function listCdnEndpoints(): Promise<CdnEndpoint[]>;
export declare function getCdnEndpoint(id: string): Promise<CdnEndpoint>;
export declare function createCdnEndpoint(blueprint: CdnBlueprint): Promise<CdnEndpoint>;
export declare function deleteCdnEndpoint(id: string): Promise<void>;
