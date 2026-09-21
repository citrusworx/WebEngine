import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
import { spaceOriginHostname } from "../spaces/spaces.js";
/** DigitalOcean allows only these CDN edge TTLs. */
export const CDN_TTL_VALUES = [60, 600, 3600, 86400, 604800];
export function resolveCdnOrigin(input) {
    if (input.origin?.trim()) {
        return input.origin.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    }
    const region = input.region ?? input.spaceRegion ?? input.fallbackRegion;
    if (!input.space || !region) {
        throw new Error("CDN endpoint requires origin, or a space name plus a region");
    }
    return spaceOriginHostname(input.space, region);
}
export async function listCdnEndpoints() {
    const response = await doRequest({
        method: "GET",
        url: "/cdn/endpoints"
    });
    return response.endpoints ?? [];
}
export async function getCdnEndpoint(id) {
    const response = await doRequest({
        method: "GET",
        url: `/cdn/endpoints/${encodeURIComponent(id)}`
    });
    return response.endpoint;
}
/**
 * PUT `/cdn/endpoints/:id` with only the fields passed in.
 * Apply uses this for TTL. It does not send `custom_domain` or `certificate_id` on adopt.
 */
export async function updateCdnEndpoint(id, patch) {
    const response = await doRequest({
        method: "PUT",
        url: `/cdn/endpoints/${encodeURIComponent(id)}`,
        data: cleanPayload({ ttl: patch.ttl })
    });
    return response.endpoint;
}
export async function createCdnEndpoint(blueprint) {
    const response = await doRequest({
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
export async function deleteCdnEndpoint(id) {
    await doRequest({
        method: "DELETE",
        url: `/cdn/endpoints/${encodeURIComponent(id)}`
    });
}
//# sourceMappingURL=cdn.js.map