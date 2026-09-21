import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
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
    spaceOriginHostname: (name: string, region: string) => `${name}.${region}.digitaloceanspaces.com`,
    putSpaceObject: vi.fn(async () => undefined),
    listSpaceObjects: vi.fn(async () => []),
    deleteSpaceObject: vi.fn(async () => undefined),
    normalizeObjectKey: (key: string) => key.replace(/^\/+/, "")
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
        updateCdnEndpoint: vi.fn(async (id: string, patch: { ttl?: number }) => ({
            id,
            origin: "replace-space-name.nyc3.digitaloceanspaces.com",
            endpoint: "replace-space-name.nyc3.cdn.digitaloceanspaces.com",
            ttl: patch.ttl
        })),
        createCdnEndpoint: vi.fn(async (spec: { origin: string; custom_domain?: string }) => ({
            id: "cdn-1",
            origin: spec.origin,
            endpoint: "replace-space-name.nyc3.cdn.digitaloceanspaces.com",
            custom_domain: spec.custom_domain,
            ttl: 3600,
            certificate_id: "cert-1"
        })),
        waitForCdnEndpoint: vi.fn(async (id: string) => ({
            id,
            origin: "replace-space-name.nyc3.digitaloceanspaces.com",
            endpoint: "replace-space-name.nyc3.cdn.digitaloceanspaces.com"
        }))
    };
});

vi.mock("node:child_process", () => ({
    spawn: vi.fn()
}));

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
        expect(plan.counts).toMatchObject({ spaces: 1, certificates: 1, cdn: 1, domains: 1, static_sites: 0 });
        const juice = path.resolve(
            fileURLToPath(import.meta.url),
            "../../../examples/blueprints/06-juice-static.yaml"
        );
        const juicePlan = planGrapeConfig(await loadGrapeConfig(juice));
        expect(juicePlan.counts.static_sites).toBe(1);
        expect(juicePlan.resources.find((resource) => resource.kind === "static_site")?.detail).toMatchObject({
            space: "juice-showcase",
            dist: "apps/juice/dist",
            build: "yarn workspace @citrusworx/juiceapp build",
            cwd: "monorepo root"
        });
        expect(juicePlan.warnings).toEqual([]);
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
        expect(waitForCertificate).toHaveBeenCalledWith(
            "cert-1",
            expect.objectContaining({ timeoutMs: 5 * 60 * 1000 })
        );
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
        const { listCdnEndpoints, createCdnEndpoint, updateCdnEndpoint } = await import(
            "../providers/digitalocean/cdn/cdn.js"
        );
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
        expect(updateCdnEndpoint).toHaveBeenCalledWith("cdn-live", { ttl: 3600 });
        expect(result.spaces[0]?.name).toBe("replace-space-name");
        expect(result.cdn[0]?.id).toBe("cdn-live");
        expect(result.warnings.some((warning) => warning.includes("Adopting existing Space"))).toBe(true);
        expect(result.warnings.some((warning) => warning.includes("Adopting existing CDN"))).toBe(true);
    });

    it("waits for a certificate even when no CDN endpoint references it", async () => {
        const { waitForCertificate } = await import("../providers/digitalocean/certificates/certificates.js");
        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    certificates: [
                        {
                            name: "juice-static",
                            type: "lets_encrypt",
                            dns_names: ["static.example.com"],
                            wait_seconds: 30
                        }
                    ]
                }
            })
        );
        expect(waitForCertificate).toHaveBeenCalledWith("cert-1", { timeoutMs: 30_000 });
        expect(result.certificates[0]?.state).toBe("verified");
    });

    it("skips the certificate poll when wait is false, then still waits if CDN create needs the id", async () => {
        const { createCertificate, waitForCertificate } = await import(
            "../providers/digitalocean/certificates/certificates.js"
        );
        vi.mocked(createCertificate).mockResolvedValueOnce({
            id: "cert-1",
            name: "juice-static",
            type: "lets_encrypt",
            state: "pending"
        });
        vi.mocked(waitForCertificate).mockResolvedValueOnce({
            id: "cert-1",
            name: "juice-static",
            type: "lets_encrypt",
            state: "verified"
        });

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                ...staticSite,
                resources: {
                    ...staticSite.resources,
                    certificates: [
                        {
                            name: "juice-static",
                            type: "lets_encrypt",
                            dns_names: ["static.example.com"],
                            wait: false
                        }
                    ]
                }
            })
        );
        expect(waitForCertificate).toHaveBeenCalledTimes(1);
        expect(waitForCertificate).toHaveBeenCalledWith("cert-1", expect.objectContaining({ timeoutMs: 5 * 60 * 1000 }));
        expect(result.warnings.some((warning) => warning.includes("wait is false"))).toBe(true);
        expect(result.certificates[0]?.state).toBe("verified");
        expect(result.cdn[0]?.id).toBe("cdn-1");
    });

    it("polls a CDN endpoint that has no hostname yet", async () => {
        const { createCdnEndpoint, waitForCdnEndpoint } = await import("../providers/digitalocean/cdn/cdn.js");
        vi.mocked(createCdnEndpoint).mockResolvedValueOnce({
            id: "cdn-1",
            origin: "replace-space-name.nyc3.digitaloceanspaces.com",
            endpoint: "",
            ttl: 3600
        });

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    cdn: [{ space: "replace-space-name", region: "nyc3", ttl: 3600, wait_seconds: 15 }]
                }
            })
        );
        expect(waitForCdnEndpoint).toHaveBeenCalledWith("cdn-1", { timeoutMs: 15_000 });
        expect(result.cdn[0]?.endpoint).toBe("replace-space-name.nyc3.cdn.digitaloceanspaces.com");
    });

    it("does not poll a CDN endpoint that already has a hostname", async () => {
        const { waitForCdnEndpoint } = await import("../providers/digitalocean/cdn/cdn.js");
        await applyGrapeConfig(validateGrapeConfig(staticSite));
        expect(waitForCdnEndpoint).not.toHaveBeenCalled();
    });

    it("builds from cwd and uploads dist after the Space exists", async () => {
        const { spawn } = await import("node:child_process");
        const { putSpaceObject } = await import("../providers/digitalocean/spaces/spaces.js");
        const root = await mkdtemp(path.join(tmpdir(), "grape-juice-"));
        const dist = path.join(root, "apps", "juice", "dist");
        await mkdir(path.join(dist, "assets"), { recursive: true });
        await writeFile(path.join(dist, "index.html"), "<html></html>");
        await writeFile(path.join(dist, "assets", "app.js"), "console.log(1)");

        vi.mocked(spawn).mockImplementation(() => {
            const child = {
                on(event: string, callback: (code?: number | null) => void) {
                    if (event === "close") {
                        queueMicrotask(() => callback(0));
                    }
                    return child;
                }
            };
            return child as never;
        });

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                ...staticSite,
                resources: {
                    ...staticSite.resources,
                    static_sites: [
                        {
                            name: "juice",
                            workspace: "@citrusworx/juiceapp",
                            build: "yarn workspace @citrusworx/juiceapp build",
                            dist: "apps/juice/dist",
                            space: "replace-space-name",
                            cwd: root
                        }
                    ]
                }
            })
        );

        expect(spawn).toHaveBeenCalledWith(
            "yarn workspace @citrusworx/juiceapp build",
            expect.objectContaining({ cwd: root, shell: true })
        );
        expect(putSpaceObject).toHaveBeenCalledWith(
            expect.objectContaining({
                bucket: "replace-space-name",
                region: "nyc3",
                key: "index.html",
                contentType: "text/html; charset=utf-8",
                acl: "public-read"
            }),
            expect.any(Object)
        );
        expect(putSpaceObject).toHaveBeenCalledWith(
            expect.objectContaining({
                key: "assets/app.js",
                contentType: "text/javascript; charset=utf-8"
            }),
            expect.any(Object)
        );
        expect(result.static_sites[0]).toMatchObject({ name: "juice", uploaded: 2, deleted: 0, space: "replace-space-name" });
        expect(result.receipt.some((item) => item.kind === "static_site" && item.action === "updated")).toBe(true);
        expect(JSON.stringify(result)).not.toMatch(/spaces-secret/);
    });
});
