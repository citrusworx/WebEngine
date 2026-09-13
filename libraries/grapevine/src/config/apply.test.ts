import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyGrapeConfig, normalizeResources } from "./apply.js";
import { validateGrapeConfig } from "./schema.js";

vi.mock("../providers/digitalocean/client.js", () => ({
    getDoToken: vi.fn(() => "fake-token")
}));

vi.mock("../providers/digitalocean/tags/tags.js", () => ({
    createTag: vi.fn(async (name: string) => ({ name })),
    tagResource: vi.fn()
}));

vi.mock("../providers/digitalocean/ssh/ssh.js", () => ({
    createSSHKey: vi.fn(),
    uploadSSHKey: vi.fn(async (key: { name: string }) => ({
        id: 7,
        name: key.name,
        fingerprint: "fp",
        public_key: "ssh-rsa AAAA"
    }))
}));

vi.mock("../providers/digitalocean/vpc/vpc.js", () => ({
    createVPC: vi.fn(async (vpc: { name: string }) => ({
        id: "vpc-1",
        name: vpc.name,
        description: "",
        region: "nyc1",
        ip_range: "10.0.0.0/16",
        default: false,
        urn: "do:vpc:vpc-1",
        created_at: ""
    }))
}));

vi.mock("../providers/digitalocean/droplet/droplet.js", () => ({
    createDroplet: vi.fn(async (spec: { name: string }) => ({
        id: 99,
        name: spec.name,
        memory: 1024,
        status: "new",
        image: {},
        size: {}
    }))
}));

vi.mock("../providers/digitalocean/firewall/firewall.js", () => ({
    createFireWall: vi.fn(async (fw: { name: string }) => ({
        id: "fw-1",
        name: fw.name,
        status: "succeeded",
        inbound_rules: [],
        outbound_rules: []
    }))
}));

vi.mock("../providers/digitalocean/networking/domains.js", () => ({
    createDomain: vi.fn(async (domain: { name: string }) => domain),
    createDomainRecord: vi.fn()
}));

vi.mock("../providers/digitalocean/networking/load-balancer.js", () => ({
    createLoadBalancer: vi.fn()
}));

vi.mock("../providers/digitalocean/monitoring/monitoring.js", () => ({
    createAlertPolicy: vi.fn()
}));

vi.mock("../providers/digitalocean/apps/apps.js", () => ({
    createApp: vi.fn()
}));

describe("apply grape config", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DO_TOKEN = "fake-token";
    });

    it("normalizes convenience networking and firewall sections", () => {
        const config = validateGrapeConfig({
            provider: "digitalocean",
            region: "nyc1",
            networking: { vpc: true, domain: "example.com" },
            firewall: {
                inbound: [{ protocol: "tcp", ports: "80", sources: ["0.0.0.0/0"] }],
                outbound: [{ protocol: "tcp", ports: "all", destinations: ["0.0.0.0/0"] }]
            }
        });

        const resources = normalizeResources(config);
        expect(resources.vpcs?.[0]?.name).toBe("digitalocean-vpc");
        expect(resources.domains?.[0]?.name).toBe("example.com");
        expect(resources.firewalls?.[0]?.name).toBe("digitalocean-firewall");
    });

    it("creates declared resources in dependency order", async () => {
        const { createTag } = await import("../providers/digitalocean/tags/tags.js");
        const { createVPC } = await import("../providers/digitalocean/vpc/vpc.js");
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const { createFireWall } = await import("../providers/digitalocean/firewall/firewall.js");
        const { createDomain, createDomainRecord } = await import("../providers/digitalocean/networking/domains.js");

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc1",
                resources: {
                    tags: ["prod"],
                    ssh_keys: [{ name: "laptop", public_key: "ssh-ed25519 AAAA" }],
                    vpcs: [{ name: "main", ip_range: "10.10.0.0/16" }],
                    droplets: [
                        {
                            name: "web-01",
                            size: "s-1vcpu-1gb",
                            image: "ubuntu-24-04-x64",
                            vpc: "main"
                        }
                    ],
                    firewalls: [
                        {
                            name: "web",
                            droplets: ["web-01"],
                            inbound: [{ protocol: "tcp", ports: "443", sources: ["0.0.0.0/0"] }]
                        }
                    ],
                    domains: [
                        {
                            name: "example.com",
                            records: [{ type: "A", name: "@", data: "203.0.113.10" }]
                        }
                    ]
                }
            })
        );

        expect(createTag).toHaveBeenCalledWith("prod");
        expect(createVPC).toHaveBeenCalled();
        expect(createDroplet).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "web-01",
                region: "nyc1",
                vpc_uuid: "vpc-1",
                ssh_keys: [7]
            })
        );
        expect(createFireWall).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "web",
                droplet_ids: [99],
                inbound_rules: [
                    { protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } }
                ]
            })
        );
        expect(createDomain).toHaveBeenCalledWith({ name: "example.com", ip_address: undefined });
        expect(createDomainRecord).toHaveBeenCalled();
        expect(result.droplets[0]?.id).toBe(99);
        expect(result.warnings).toEqual([]);
    });

    it("applies a classic DropletBlueprint document", async () => {
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        await applyGrapeConfig(
            validateGrapeConfig({
                grapevine: "1.0",
                provider: "digitalocean",
                blueprint: {
                    name: "create-single-droplet",
                    droplet: {
                        name: "from-blueprint",
                        region: "nyc3",
                        size: "s-1vcpu-1gb",
                        image: "ubuntu-24-04-x64"
                    }
                }
            })
        );
        expect(createDroplet).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "from-blueprint",
                region: "nyc3"
            })
        );
    });
});
