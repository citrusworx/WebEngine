import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyGrapeConfig } from "./apply.js";
import { validateGrapeConfig } from "./schema.js";

vi.mock("../providers/digitalocean/client.js", () => ({
    getDoToken: vi.fn(() => "fake-token")
}));

vi.mock("../providers/digitalocean/tags/tags.js", () => ({
    createTag: vi.fn(async (name: string) => ({ name })),
    listAllTags: vi.fn(async () => []),
    tagResource: vi.fn()
}));

vi.mock("../providers/digitalocean/ssh/ssh.js", () => ({
    createSSHKey: vi.fn(),
    listSSHKeys: vi.fn(async () => []),
    uploadSSHKey: vi.fn(async (key: { name: string }) => ({
        id: 7,
        name: key.name,
        fingerprint: "fp",
        public_key: "ssh-ed25519 AAAA"
    }))
}));

vi.mock("../providers/digitalocean/vpc/vpc.js", () => ({
    createVPC: vi.fn(),
    listAllVPCs: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/droplet/droplet.js", () => ({
    createDroplet: vi.fn(),
    listAllDroplets: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/firewall/firewall.js", () => ({
    createFireWall: vi.fn(),
    listAllFirewalls: vi.fn(async () => []),
    updateFirewall: vi.fn(async (id: string, fw: { name: string; inbound_rules?: unknown[] }) => ({
        id,
        name: fw.name,
        status: "succeeded",
        inbound_rules: fw.inbound_rules ?? [],
        outbound_rules: [],
        droplet_ids: []
    }))
}));

vi.mock("../providers/digitalocean/networking/domains.js", () => ({
    createDomain: vi.fn(),
    createDomainRecord: vi.fn(),
    listAllDomains: vi.fn(async () => []),
    listAllDomainRecords: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/networking/load-balancer.js", () => ({
    createLoadBalancer: vi.fn(),
    listAllLoadBalancers: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/monitoring/monitoring.js", () => ({
    createAlertPolicy: vi.fn(),
    listAlertPolicies: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/apps/apps.js", () => ({
    createApp: vi.fn(),
    listApps: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/databases/databases.js", () => ({
    createDatabase: vi.fn(),
    listDatabases: vi.fn(async () => []),
    getDatabase: vi.fn(),
    waitForDatabase: vi.fn(),
    pickDatabaseConnection: () => undefined
}));

vi.mock("../providers/digitalocean/spaces/spaces.js", () => ({
    listSpaces: vi.fn(async () => []),
    createSpace: vi.fn(),
    spaceOriginHostname: (name: string, region: string) => `${name}.${region}.digitaloceanspaces.com`
}));

vi.mock("../providers/digitalocean/certificates/certificates.js", () => ({
    listCertificates: vi.fn(async () => []),
    createCertificate: vi.fn(),
    waitForCertificate: vi.fn()
}));

vi.mock("../providers/digitalocean/cdn/cdn.js", async () => {
    const actual = await vi.importActual<typeof import("../providers/digitalocean/cdn/cdn.js")>(
        "../providers/digitalocean/cdn/cdn.js"
    );
    return {
        ...actual,
        listCdnEndpoints: vi.fn(async () => []),
        createCdnEndpoint: vi.fn(),
        updateCdnEndpoint: vi.fn()
    };
});

const juiceConfig = validateGrapeConfig({
    provider: "digitalocean",
    region: "nyc3",
    resources: {
        tags: ["juice"],
        ssh_keys: [{ name: "juice", public_key: "ssh-ed25519 AAAA" }],
        vpcs: [{ name: "juice", region: "nyc3" }],
        droplets: [{ name: "juice-web", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64", vpc: "juice" }],
        firewalls: [
            {
                name: "juice-web",
                droplets: ["juice-web"],
                inbound: [{ protocol: "tcp", ports: "443", sources: ["0.0.0.0/0"] }]
            }
        ],
        domains: [
            {
                name: "static.example.com",
                records: [{ type: "CNAME", name: "@", data: "juice.nyc3.cdn.digitaloceanspaces.com" }]
            }
        ],
        databases: [{ name: "juice-db", engine: "pg", size: "db-s-1vcpu-1gb", wait: false }],
        load_balancers: [{ name: "juice-lb", region: "nyc3" }],
        alert_policies: [{ description: "juice cpu", type: "v1/insights/droplet/cpu", value: 80, window: "5m" }],
        apps: [{ spec: { name: "juice-app", region: "nyc3" } }],
        spaces: [{ name: "juice-static", region: "nyc3", acl: "public-read" }],
        certificates: [{ name: "juice-static", type: "lets_encrypt", dns_names: ["static.example.com"] }],
        cdn: [{ space: "juice-static", ttl: 3600, certificate: "juice-static", custom_domain: "static.example.com" }]
    }
});

describe("idempotent apply", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DO_TOKEN = "fake-token";
        process.env.DO_SPACES_ACCESS_KEY_ID = "spaces-key";
        process.env.DO_SPACES_SECRET_ACCESS_KEY = "spaces-secret";
    });

    it("does not POST create when a unique live name already exists", async () => {
        const { listAllTags, createTag } = await import("../providers/digitalocean/tags/tags.js");
        const { listSSHKeys, uploadSSHKey } = await import("../providers/digitalocean/ssh/ssh.js");
        const { listAllVPCs, createVPC } = await import("../providers/digitalocean/vpc/vpc.js");
        const { listAllDroplets, createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const { listAllFirewalls, createFireWall, updateFirewall } = await import(
            "../providers/digitalocean/firewall/firewall.js"
        );
        const { listAllDomains, listAllDomainRecords, createDomain, createDomainRecord } = await import(
            "../providers/digitalocean/networking/domains.js"
        );
        const { listDatabases, createDatabase } = await import("../providers/digitalocean/databases/databases.js");
        const { listAllLoadBalancers, createLoadBalancer } = await import(
            "../providers/digitalocean/networking/load-balancer.js"
        );
        const { listAlertPolicies, createAlertPolicy } = await import(
            "../providers/digitalocean/monitoring/monitoring.js"
        );
        const { listApps, createApp } = await import("../providers/digitalocean/apps/apps.js");
        const { listSpaces, createSpace } = await import("../providers/digitalocean/spaces/spaces.js");
        const { listCertificates, createCertificate } = await import(
            "../providers/digitalocean/certificates/certificates.js"
        );
        const { listCdnEndpoints, createCdnEndpoint, updateCdnEndpoint } = await import(
            "../providers/digitalocean/cdn/cdn.js"
        );

        vi.mocked(listAllTags).mockResolvedValue([{ name: "juice" }]);
        vi.mocked(listSSHKeys).mockResolvedValue([
            { id: 4, name: "juice", fingerprint: "aa", public_key: "ssh-ed25519 AAAA" }
        ]);
        vi.mocked(listAllVPCs).mockResolvedValue([
            {
                id: "vpc-live",
                name: "juice",
                description: "",
                region: "nyc3",
                ip_range: "10.20.0.0/16",
                default: false,
                urn: "do:vpc:vpc-live",
                created_at: ""
            }
        ]);
        vi.mocked(listAllDroplets).mockResolvedValue([
            { id: 44, name: "juice-web", memory: 1024, status: "active", image: {}, size: {} }
        ]);
        vi.mocked(listAllFirewalls).mockResolvedValue([
            {
                id: "fw-live",
                name: "juice-web",
                status: "succeeded",
                inbound_rules: [{ protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } }],
                outbound_rules: [],
                droplet_ids: [44]
            }
        ]);
        vi.mocked(listAllDomains).mockResolvedValue([{ name: "static.example.com" }]);
        vi.mocked(listAllDomainRecords).mockResolvedValue([
            { id: 9, type: "CNAME", name: "@", data: "juice.nyc3.cdn.digitaloceanspaces.com" }
        ]);
        vi.mocked(listDatabases).mockResolvedValue([
            { id: "db-live", name: "juice-db", engine: "pg", status: "online" }
        ]);
        vi.mocked(listAllLoadBalancers).mockResolvedValue([{ id: "lb-live", name: "juice-lb", region: "nyc3" }]);
        vi.mocked(listAlertPolicies).mockResolvedValue([
            {
                uuid: "alert-live",
                description: "juice cpu",
                type: "v1/insights/droplet/cpu",
                value: 70,
                window: "5m",
                enabled: true,
                alerts: { email: [] }
            }
        ]);
        vi.mocked(listApps).mockResolvedValue([{ id: "app-live", spec: { name: "juice-app" } }]);
        vi.mocked(listSpaces).mockResolvedValue([{ name: "juice-static" }]);
        vi.mocked(listCertificates).mockResolvedValue([
            { id: "cert-live", name: "juice-static", type: "lets_encrypt", state: "verified" }
        ]);
        vi.mocked(listCdnEndpoints).mockResolvedValue([
            {
                id: "cdn-live",
                origin: "juice-static.nyc3.digitaloceanspaces.com",
                endpoint: "juice-static.nyc3.cdn.digitaloceanspaces.com",
                ttl: 3600,
                certificate_id: "cert-live",
                custom_domain: "static.example.com"
            }
        ]);

        const result = await applyGrapeConfig(juiceConfig);

        expect(createTag).not.toHaveBeenCalled();
        expect(uploadSSHKey).not.toHaveBeenCalled();
        expect(createVPC).not.toHaveBeenCalled();
        expect(createDroplet).not.toHaveBeenCalled();
        expect(createFireWall).not.toHaveBeenCalled();
        expect(updateFirewall).not.toHaveBeenCalled();
        expect(createDomain).not.toHaveBeenCalled();
        expect(createDomainRecord).not.toHaveBeenCalled();
        expect(createDatabase).not.toHaveBeenCalled();
        expect(createLoadBalancer).not.toHaveBeenCalled();
        expect(createAlertPolicy).not.toHaveBeenCalled();
        expect(createApp).not.toHaveBeenCalled();
        expect(createSpace).not.toHaveBeenCalled();
        expect(createCertificate).not.toHaveBeenCalled();
        expect(createCdnEndpoint).not.toHaveBeenCalled();
        expect(updateCdnEndpoint).not.toHaveBeenCalled();
        expect(result.receipt.filter((item) => item.action === "created")).toEqual([]);
        expect(result.receipt.map((item) => `${item.kind}:${item.action}`)).toEqual([
            "tag:adopted",
            "ssh_key:adopted",
            "vpc:adopted",
            "database:adopted",
            "droplet:adopted",
            "firewall:adopted",
            "domain:adopted",
            "domain_record:adopted",
            "load_balancer:adopted",
            "alert_policy:adopted",
            "app:adopted",
            "space:adopted",
            "certificate:adopted",
            "cdn:adopted"
        ]);
        expect(result.droplets[0]?.id).toBe(44);
        expect(result.cdn[0]?.id).toBe("cdn-live");
    });

    it("updates CDN TTL and firewall rules without posting a second create", async () => {
        const { listAllDroplets } = await import("../providers/digitalocean/droplet/droplet.js");
        const { listAllFirewalls, createFireWall, updateFirewall } = await import(
            "../providers/digitalocean/firewall/firewall.js"
        );
        const { listCdnEndpoints, createCdnEndpoint, updateCdnEndpoint } = await import(
            "../providers/digitalocean/cdn/cdn.js"
        );
        const { listSpaces } = await import("../providers/digitalocean/spaces/spaces.js");
        const { listCertificates } = await import("../providers/digitalocean/certificates/certificates.js");

        vi.mocked(listAllDroplets).mockResolvedValue([
            { id: 44, name: "juice-web", memory: 1024, status: "active", image: {}, size: {} }
        ]);
        vi.mocked(listAllFirewalls).mockResolvedValue([
            {
                id: "fw-live",
                name: "juice-web",
                status: "succeeded",
                inbound_rules: [{ protocol: "tcp", ports: "80", sources: { addresses: ["0.0.0.0/0"] } }],
                outbound_rules: [],
                droplet_ids: [44]
            }
        ]);
        vi.mocked(listSpaces).mockResolvedValue([{ name: "juice-static" }]);
        vi.mocked(listCertificates).mockResolvedValue([
            { id: "cert-live", name: "juice-static", type: "lets_encrypt", state: "verified" }
        ]);
        vi.mocked(listCdnEndpoints).mockResolvedValue([
            {
                id: "cdn-live",
                origin: "juice-static.nyc3.digitaloceanspaces.com",
                endpoint: "juice-static.nyc3.cdn.digitaloceanspaces.com",
                ttl: 60
            }
        ]);
        vi.mocked(updateCdnEndpoint).mockResolvedValue({
            id: "cdn-live",
            origin: "juice-static.nyc3.digitaloceanspaces.com",
            endpoint: "juice-static.nyc3.cdn.digitaloceanspaces.com",
            ttl: 3600
        });

        const result = await applyGrapeConfig(juiceConfig);

        expect(createFireWall).not.toHaveBeenCalled();
        expect(createCdnEndpoint).not.toHaveBeenCalled();
        expect(updateFirewall).toHaveBeenCalledWith(
            "fw-live",
            expect.objectContaining({
                name: "juice-web",
                droplet_ids: [44],
                inbound_rules: [{ protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } }]
            })
        );
        expect(updateCdnEndpoint).toHaveBeenCalledWith("cdn-live", { ttl: 3600 });
        expect(updateCdnEndpoint).not.toHaveBeenCalledWith(
            "cdn-live",
            expect.objectContaining({ custom_domain: expect.anything() })
        );
        expect(result.receipt.find((item) => item.kind === "firewall")?.action).toBe("updated");
        expect(result.receipt.find((item) => item.kind === "cdn")?.action).toBe("updated");
    });

    it("skips an ambiguous droplet instead of creating another", async () => {
        const { listAllDroplets, createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        vi.mocked(listAllDroplets).mockResolvedValue([
            { id: 1, name: "juice-web", memory: 1024, status: "active", image: {}, size: {} },
            { id: 2, name: "juice-web", memory: 1024, status: "active", image: {}, size: {} }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    droplets: [{ name: "juice-web", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64" }]
                }
            })
        );

        expect(createDroplet).not.toHaveBeenCalled();
        expect(result.droplets).toEqual([]);
        expect(result.receipt[0]).toMatchObject({ kind: "droplet", action: "skipped", note: "ambiguous" });
    });
});
