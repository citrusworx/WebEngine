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
 * Destroy does not delete objects. `deleteSpaceObject` removes one key.
 */
export declare function deleteSpace(name: string, region: string, options?: SpaceCallOptions): Promise<void>;
export interface SpaceObject {
    key: string;
    size?: number;
}
export interface PutSpaceObjectInput {
    bucket: string;
    region: string;
    key: string;
    body: Uint8Array;
    contentType?: string;
    acl?: SpaceAcl;
}
/** Reject empty keys and `..` so a sync cannot escape the intended prefix. */
export declare function normalizeObjectKey(key: string): string;
export declare function parseListObjects(xml: string): {
    objects: SpaceObject[];
    truncated: boolean;
    continuationToken?: string;
};
/** PUT object bytes. Content-Type defaults from the key extension. */
export declare function putSpaceObject(input: PutSpaceObjectInput, options?: SpaceCallOptions): Promise<void>;
export interface ListSpaceObjectsOptions extends SpaceCallOptions {
    prefix?: string;
}
/** GET `?list-type=2`, following continuation tokens. Stops after 1000 pages. */
export declare function listSpaceObjects(bucket: string, region: string, options?: ListSpaceObjectsOptions): Promise<SpaceObject[]>;
export declare function deleteSpaceObject(bucket: string, region: string, key: string, options?: SpaceCallOptions): Promise<void>;
