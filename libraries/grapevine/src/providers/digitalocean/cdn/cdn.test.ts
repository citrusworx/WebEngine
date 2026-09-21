import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    createCdnEndpoint,
    deleteCdnEndpoint,
    listCdnEndpoints,
    resolveCdnOrigin
} from "./cdn.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("digitalocean cdn", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("resolves a Space origin and strips a URL prefix", () => {
        expect(resolveCdnOrigin({ space: "juice-static", region: "nyc3" })).toBe(
            "juice-static.nyc3.digitaloceanspaces.com"
        );
        expect(resolveCdnOrigin({ origin: "https://assets.nyc3.digitaloceanspaces.com/index.html" })).toBe(
            "assets.nyc3.digitaloceanspaces.com"
        );
        expect(() => resolveCdnOrigin({ space: "juice-static" })).toThrow(/region/);
    });

    it("lists and creates CDN endpoints on /v2/cdn/endpoints", async () => {
        const endpoint = {
            id: "cdn-1",
            origin: "juice-static.nyc3.digitaloceanspaces.com",
            endpoint: "juice-static.nyc3.cdn.digitaloceanspaces.com",
            ttl: 3600,
            certificate_id: "cert-1",
            custom_domain: "static.example.com"
        };
        mockedRequest.mockResolvedValueOnce({ endpoints: [endpoint] });
        await expect(listCdnEndpoints()).resolves.toEqual([endpoint]);

        mockedRequest.mockResolvedValueOnce({ endpoint });
        await createCdnEndpoint({
            origin: endpoint.origin,
            ttl: 3600,
            certificate_id: "cert-1",
            custom_domain: "static.example.com"
        });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/cdn/endpoints",
            data: {
                origin: "juice-static.nyc3.digitaloceanspaces.com",
                ttl: 3600,
                certificate_id: "cert-1",
                custom_domain: "static.example.com"
            }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteCdnEndpoint("cdn-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/cdn/endpoints/cdn-1"
        });
    });
});
