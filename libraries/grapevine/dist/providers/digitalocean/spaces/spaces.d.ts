import { type SpacesCredentialEnv, type SpacesCredentials } from "./client.js";
export { getSpacesCredentials, spacesCredentialsAreSet } from "./client.js";
export type SpaceAcl = "private" | "public-read";
export interface SpaceBucket {
    name: string;
    creation_date?: string;
}
export interface SpaceResource extends SpaceBucket {
    region: string;
    origin: string;
    acl?: SpaceAcl;
}
export interface SpaceBlueprint {
    name: string;
    region: string;
    acl?: SpaceAcl;
}
export interface SpaceCallOptions extends SpacesCredentialEnv {
    credentials?: SpacesCredentials;
}
/** `{name}.{region}.digitaloceanspaces.com` — the CDN `origin` hostname. */
export declare function spaceOriginHostname(name: string, region: string): string;
export declare function parseListBuckets(xml: string): SpaceBucket[];
/**
 * GET / on `{region}.digitaloceanspaces.com`.
 * DigitalOcean documents this as listing every bucket in the account.
 * Requires a Spaces key with All (Buckets and Objects) permissions.
 */
export declare function listSpaces(region?: string, options?: SpaceCallOptions): Promise<SpaceBucket[]>;
/** PUT / on `{bucket}.{region}.digitaloceanspaces.com` with optional `x-amz-acl`. */
export declare function createSpace(blueprint: SpaceBlueprint, options?: SpaceCallOptions): Promise<SpaceResource>;
/**
 * DELETE / on the bucket host. The bucket must already be empty.
 * Grapevine does not delete objects.
 */
export declare function deleteSpace(name: string, region: string, options?: SpaceCallOptions): Promise<void>;
