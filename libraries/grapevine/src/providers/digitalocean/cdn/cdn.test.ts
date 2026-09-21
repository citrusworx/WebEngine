import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    cdnEndpointIsLive,
    createCdnEndpoint,
    deleteCdnEndpoint,
    listCdnEndpoints,
    resolveCdnOrigin,
    updateCdnEndpoint,
    waitForCdnEndpoint
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

        mockedRequest.mockResolvedValueOnce({ endpoint: { ...endpoint, ttl: 60 } });
        await updateCdnEndpoint("cdn-1", { ttl: 60 });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "PUT",
            url: "/cdn/endpoints/cdn-1",
            data: { ttl: 60 }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteCdnEndpoint("cdn-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/cdn/endpoints/cdn-1"
        });
    });

    it("treats a hostname as live and polls until one is assigned", async () => {
        expect(cdnEndpointIsLive({ id: "cdn-1", origin: "origin.example", endpoint: "edge.example" })).toBe(true);
        expect(cdnEndpointIsLive({ id: "cdn-1", origin: "origin.example", endpoint: "" })).toBe(false);
        expect(
            cdnEndpointIsLive({
                id: "cdn-1",
                origin: "origin.example",
                endpoint: "edge.example",
                status: "pending"
            })
        ).toBe(false);

        mockedRequest
            .mockResolvedValueOnce({ endpoint: { id: "cdn-1", origin: "origin.example", endpoint: "" } })
            .mockResolvedValueOnce({
                endpoint: {
                    id: "cdn-1",
                    origin: "origin.example",
                    endpoint: "origin.example.cdn.digitaloceanspaces.com"
                }
            });
        const sleeps: number[] = [];
        const ready = await waitForCdnEndpoint("cdn-1", {
            intervalMs: 5,
            sleep: async (ms) => {
                sleeps.push(ms);
            }
        });
        expect(ready.endpoint).toBe("origin.example.cdn.digitaloceanspaces.com");
        expect(sleeps).toEqual([5]);
    });

    it("fails the CDN poll on a bounded timeout", async () => {
        mockedRequest.mockResolvedValue({
            endpoint: { id: "cdn-1", origin: "origin.example", endpoint: "", status: "pending" }
        });
        await expect(
            waitForCdnEndpoint("cdn-1", { timeoutMs: 0, intervalMs: 5, sleep: async () => undefined })
        ).rejects.toThrow(/Timed out waiting for DigitalOcean CDN endpoint cdn-1/);
    });
});
