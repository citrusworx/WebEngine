import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyGrapeConfig } from "./apply.js";
import { loadGrapeConfig } from "./load.js";
import { planGrapeConfig } from "./plan.js";
import { validateGrapeConfig } from "./schema.js";

vi.mock("../providers/digitalocean/client.js", () => ({
    getDoToken: vi.fn(() => "fake-token")
}));

vi.mock("../providers/digitalocean/spaces/spaces.js", () => ({
    listSpaces: vi.fn(async () => []),
    createSpace: vi.fn(async (spec: { name: string; region: string; acl?: string }) => ({
        name: spec.name,
        region: spec.region,
        origin: `${spec.name}.${spec.region}.digitaloceanspaces.com`,
        acl: spec.acl ?? "private"
    })),
    spaceOriginHostname: (name: string, region: string) => `${name}.${region}.digitaloceanspaces.com`
}));

vi.mock("../providers/digitalocean/certificates/certificates.js", () => ({
    listCertificates: vi.fn(async () => []),
    createCertificate: vi.fn(async (spec: { name: string; type: string }) => ({
        id: "cert-1",
        name: spec.name,
        type: spec.type,
        state: "pending"
    })),
    waitForCertificate: vi.fn(async (id: string) => ({
        id,
        name: "juice-static",
        type: "lets_encrypt",
        state: "verified"
    }))
}));

vi.mock("../providers/digitalocean/cdn/cdn.js", async () => {
    const actual = await vi.importActual<typeof import("../providers/digitalocean/cdn/cdn.js")>(
        "../providers/digitalocean/cdn/cdn.js"
    );
    return {
        ...actual,
        listCdnEndpoints: vi.fn(async () => []),
        createCdnEndpoint: vi.fn(async (spec: { origin: string; custom_domain?: string }) => ({
            id: "cdn-1",
            origin: spec.origin,
            endpoint: "replace-space-name.nyc3.cdn.digitaloceanspaces.com",
            custom_domain: spec.custom_domain,
            ttl: 3600,
            certificate_id: "cert-1"
        }))
    };
});

const staticSite = {
    provider: "digitalocean" as const,
    region: "nyc3",
    resources: {
        spaces: [{ name: "replace-space-name", region: "nyc3", acl: "public-read" as const }],
        certificates: [
            { name: "juice-static", type: "lets_encrypt" as const, dns_names: ["static.example.com"] }
        ],
        cdn: [
            {
                space: "replace-space-name",
                region: "nyc3",
                ttl: 3600 as const,
                custom_domain: "static.example.com",
                certificate: "juice-static"
            }
        ]
    }
};

describe("static site blueprint", () => {
    it("validates and plans 05-static-site-spaces without a token", async () => {
        const source = path.resolve(
            fileURLToPath(import.meta.url),
            "../../../examples/blueprints/05-static-site-spaces.yaml"
        );
        const config = await loadGrapeConfig(source);
        const plan = planGrapeConfig(config);
        expect(plan.counts).toMatchObject({ spaces: 1, certificates: 1, cdn: 1, domains: 1 });
        expect(plan.resources.find((resource) => resource.kind === "cdn")?.detail).toMatchObject({
            origin: "replace-space-name.nyc3.digitaloceanspaces.com",
            certificate: "juice-static",
            ttl: "3600"
        });
        expect(plan.warnings).toEqual([]);
    });
});

describe("apply spaces, certificates, and cdn", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DO_TOKEN = "fake-token";
        process.env.DO_SPACES_ACCESS_KEY_ID = "spaces-key";
        process.env.DO_SPACES_SECRET_ACCESS_KEY = "spaces-secret";
    });

    it("creates a Space, waits for the referenced certificate, then creates the CDN endpoint", async () => {
        const { createSpace } = await import("../providers/digitalocean/spaces/spaces.js");
        const { createCertificate, waitForCertificate } = await import(
            "../providers/digitalocean/certificates/certificates.js"
        );
        const { createCdnEndpoint } = await import("../providers/digitalocean/cdn/cdn.js");

        const result = await applyGrapeConfig(validateGrapeConfig(staticSite));

        expect(createSpace).toHaveBeenCalledWith(
            { name: "replace-space-name", region: "nyc3", acl: "public-read" },
            expect.objectContaining({ accessKeyEnv: undefined, secretKeyEnv: undefined })
        );
        expect(createCertificate).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "juice-static",
                type: "lets_encrypt",
                dns_names: ["static.example.com"]
            })
        );
        expect(waitForCertificate).toHaveBeenCalledWith("cert-1");
        expect(createCdnEndpoint).toHaveBeenCalledWith({
            origin: "replace-space-name.nyc3.digitaloceanspaces.com",
            ttl: 3600,
            certificate_id: "cert-1",
            custom_domain: "static.example.com"
        });
        expect(result.spaces[0]?.origin).toBe("replace-space-name.nyc3.digitaloceanspaces.com");
        expect(result.certificates[0]?.state).toBe("verified");
        expect(result.cdn[0]?.id).toBe("cdn-1");
        expect(JSON.stringify(result)).not.toMatch(/spaces-secret|BEGIN/);
    });

    it("adopts a uniquely named Space and CDN endpoint instead of creating them again", async () => {
        const { listSpaces, createSpace } = await import("../providers/digitalocean/spaces/spaces.js");
        const { listCdnEndpoints, createCdnEndpoint } = await import("../providers/digitalocean/cdn/cdn.js");
        vi.mocked(listSpaces).mockResolvedValueOnce([{ name: "replace-space-name" }]);
        vi.mocked(listCdnEndpoints).mockResolvedValueOnce([
            {
                id: "cdn-live",
                origin: "replace-space-name.nyc3.digitaloceanspaces.com",
                endpoint: "replace-space-name.nyc3.cdn.digitaloceanspaces.com"
            }
        ]);

        const result = await applyGrapeConfig(validateGrapeConfig(staticSite));
        expect(createSpace).not.toHaveBeenCalled();
        expect(createCdnEndpoint).not.toHaveBeenCalled();
        expect(result.spaces[0]?.name).toBe("replace-space-name");
        expect(result.cdn[0]?.id).toBe("cdn-live");
        expect(result.warnings.some((warning) => warning.includes("Adopting existing Space"))).toBe(true);
        expect(result.warnings.some((warning) => warning.includes("Adopting existing CDN"))).toBe(true);
    });

    it("does not wait for a certificate that no CDN endpoint references", async () => {
        const { waitForCertificate } = await import("../providers/digitalocean/certificates/certificates.js");
        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    certificates: [
                        { name: "juice-static", type: "lets_encrypt", dns_names: ["static.example.com"] }
                    ]
                }
            })
        );
        expect(waitForCertificate).not.toHaveBeenCalled();
        expect(result.certificates[0]?.state).toBe("pending");
        expect(result.warnings.some((warning) => warning.includes("pending"))).toBe(true);
    });
});
