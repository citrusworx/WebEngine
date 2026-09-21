import { DEFAULT_SPACES_LIST_REGION, spacesRequest, xmlTag } from "./client.js";
export { getSpacesCredentials, spacesCredentialsAreSet } from "./client.js";
/** `{name}.{region}.digitaloceanspaces.com` — the CDN `origin` hostname. */
export function spaceOriginHostname(name, region) {
    return `${name}.${region}.digitaloceanspaces.com`;
}
export function parseListBuckets(xml) {
    const blocks = xml.match(/<Bucket>[\s\S]*?<\/Bucket>/g) ?? [];
    const buckets = [];
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
export async function listSpaces(region = process.env.DO_SPACES_REGION?.trim() || DEFAULT_SPACES_LIST_REGION, options = {}) {
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
export async function createSpace(blueprint, options = {}) {
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
 * Grapevine does not delete objects.
 */
export async function deleteSpace(name, region, options = {}) {
    await spacesRequest({
        method: "DELETE",
        region,
        bucket: name,
        credentials: options.credentials,
        accessKeyEnv: options.accessKeyEnv,
        secretKeyEnv: options.secretKeyEnv
    });
}
//# sourceMappingURL=spaces.js.map