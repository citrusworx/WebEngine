import {
    DEFAULT_SPACES_LIST_REGION,
    spacesRequest,
    xmlTag,
    type SpacesCredentialEnv,
    type SpacesCredentials
} from "./client.js";
import { contentTypeForKey } from "./content-type.js";

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
export function spaceOriginHostname(name: string, region: string): string {
    return `${name}.${region}.digitaloceanspaces.com`;
}

export function parseListBuckets(xml: string): SpaceBucket[] {
    const blocks = xml.match(/<Bucket>[\s\S]*?<\/Bucket>/g) ?? [];
    const buckets: SpaceBucket[] = [];
    for (const block of blocks) {
        const name = xmlTag(block, "Name");
        if (!name) {
            continue;
        }
        buckets.push({ name, creation_date: xmlTag(block, "CreationDate") });
    }
    return buckets;
}

/**
 * GET / on `{region}.digitaloceanspaces.com`.
 * DigitalOcean documents this as listing every bucket in the account.
 * Requires a Spaces key with All (Buckets and Objects) permissions.
 */
export async function listSpaces(
    region = process.env.DO_SPACES_REGION?.trim() || DEFAULT_SPACES_LIST_REGION,
    options: SpaceCallOptions = {}
): Promise<SpaceBucket[]> {
    const response = await spacesRequest({
        method: "GET",
        region,
        credentials: options.credentials,
        accessKeyEnv: options.accessKeyEnv,
        secretKeyEnv: options.secretKeyEnv
    });
    return parseListBuckets(response.body);
}

/** PUT / on `{bucket}.{region}.digitaloceanspaces.com` with optional `x-amz-acl`. */
export async function createSpace(blueprint: SpaceBlueprint, options: SpaceCallOptions = {}): Promise<SpaceResource> {
    const acl = blueprint.acl ?? "private";
    await spacesRequest({
        method: "PUT",
        region: blueprint.region,
        bucket: blueprint.name,
        headers: { "x-amz-acl": acl },
        credentials: options.credentials,
        accessKeyEnv: options.accessKeyEnv,
        secretKeyEnv: options.secretKeyEnv
    });
    return {
        name: blueprint.name,
        region: blueprint.region,
        origin: spaceOriginHostname(blueprint.name, blueprint.region),
        acl
    };
}

/**
 * DELETE / on the bucket host. The bucket must already be empty.
 * Destroy does not delete objects. `deleteSpaceObject` removes one key.
 */
export async function deleteSpace(name: string, region: string, options: SpaceCallOptions = {}): Promise<void> {
    await spacesRequest({
        method: "DELETE",
        region,
        bucket: name,
        credentials: options.credentials,
        accessKeyEnv: options.accessKeyEnv,
        secretKeyEnv: options.secretKeyEnv
    });
}

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

function decodeXml(value: string): string {
    return value
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&apos;", "'");
}

/** Reject empty keys and `..` so a sync cannot escape the intended prefix. */
export function normalizeObjectKey(key: string): string {
    const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
    const parts = normalized.split("/");
    if (!normalized || parts.some((part) => part === "" || part === "." || part === "..")) {
        throw new Error(`Invalid Space object key "${key}"`);
    }
    return normalized;
}

export function parseListObjects(xml: string): {
    objects: SpaceObject[];
    truncated: boolean;
    continuationToken?: string;
} {
    const blocks = xml.match(/<Contents>[\s\S]*?<\/Contents>/g) ?? [];
    const objects: SpaceObject[] = [];
    for (const block of blocks) {
        const raw = xmlTag(block, "Key");
        if (!raw) {
            continue;
        }
        const size = xmlTag(block, "Size");
        objects.push({
            key: decodeXml(raw),
            size: size !== undefined && size !== "" ? Number(size) : undefined
        });
    }
    const token = xmlTag(xml, "NextContinuationToken");
    return {
        objects,
        truncated: xmlTag(xml, "IsTruncated") === "true",
        continuationToken: token ? decodeXml(token) : undefined
    };
}

/** PUT object bytes. Content-Type defaults from the key extension. */
export async function putSpaceObject(input: PutSpaceObjectInput, options: SpaceCallOptions = {}): Promise<void> {
    const key = normalizeObjectKey(input.key);
    const headers: Record<string, string> = {
        "content-type": input.contentType ?? contentTypeForKey(key)
    };
    if (input.acl) {
        headers["x-amz-acl"] = input.acl;
    }
    await spacesRequest({
        method: "PUT",
        region: input.region,
        bucket: input.bucket,
        key,
        headers,
        body: input.body,
        credentials: options.credentials,
        accessKeyEnv: options.accessKeyEnv,
        secretKeyEnv: options.secretKeyEnv
    });
}

export interface ListSpaceObjectsOptions extends SpaceCallOptions {
    prefix?: string;
}

const MAX_LIST_PAGES = 1000;

/** GET `?list-type=2`, following continuation tokens. Stops after 1000 pages. */
export async function listSpaceObjects(
    bucket: string,
    region: string,
    options: ListSpaceObjectsOptions = {}
): Promise<SpaceObject[]> {
    const objects: SpaceObject[] = [];
    let token: string | undefined;
    for (let page = 0; page < MAX_LIST_PAGES; page += 1) {
        const response = await spacesRequest({
            method: "GET",
            region,
            bucket,
            query: {
                "list-type": "2",
                prefix: options.prefix,
                "continuation-token": token
            },
            credentials: options.credentials,
            accessKeyEnv: options.accessKeyEnv,
            secretKeyEnv: options.secretKeyEnv
        });
        const parsed = parseListObjects(response.body);
        objects.push(...parsed.objects);
        if (!parsed.truncated || !parsed.continuationToken) {
            return objects;
        }
        token = parsed.continuationToken;
    }
    throw new Error(`Timed out listing objects in Space "${bucket}" after ${MAX_LIST_PAGES} pages`);
}

export async function deleteSpaceObject(
    bucket: string,
    region: string,
    key: string,
    options: SpaceCallOptions = {}
): Promise<void> {
    await spacesRequest({
        method: "DELETE",
        region,
        bucket,
        key: normalizeObjectKey(key),
        credentials: options.credentials,
        accessKeyEnv: options.accessKeyEnv,
        secretKeyEnv: options.secretKeyEnv
    });
}
