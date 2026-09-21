import { beforeEach, describe, expect, it, vi } from "vitest";
import { destroyGrapeResources, planDestroy } from "./destroy.js";
import type { LiveInventory } from "./live.js";
import { validateGrapeConfig } from "./schema.js";

vi.mock("../providers/digitalocean/apps/apps.js", () => ({
    deleteApp: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/droplet/droplet.js", () => ({
    deleteDroplet: vi.fn(async () => ({ message: "deleted" }))
}));
vi.mock("../providers/digitalocean/firewall/firewall.js", () => ({
    deleteFirewall: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/monitoring/monitoring.js", () => ({
    deleteAlertPolicy: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/networking/domains.js", () => ({
    deleteDomain: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/networking/load-balancer.js", () => ({
    deleteLoadBalancer: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/ssh/ssh.js", () => ({
    deleteSSHKey: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/tags/tags.js", () => ({
    deleteTag: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/vpc/vpc.js", () => ({
    deleteVPC: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/databases/databases.js", () => ({
    deleteDatabase: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/cdn/cdn.js", () => ({
    deleteCdnEndpoint: vi.fn(async () => undefined),
    resolveCdnOrigin: (input: {
        origin?: string;
        space?: string;
        region?: string;
        spaceRegion?: string;
        fallbackRegion?: string;
    }) => {
        if (input.origin?.trim()) {
            return input.origin.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        }
        const region = input.region ?? input.spaceRegion ?? input.fallbackRegion;
        if (!input.space || !region) {
            throw new Error("CDN endpoint requires origin, or a space name plus a region");
        }
        return `${input.space}.${region}.digitaloceanspaces.com`;
    }
}));
vi.mock("../providers/digitalocean/certificates/certificates.js", () => ({
    deleteCertificate: vi.fn(async () => undefined)
}));
vi.mock("../providers/digitalocean/spaces/spaces.js", () => ({
    deleteSpace: vi.fn(async () => undefined)
}));

function inventory(partial: Partial<LiveInventory> = {}): LiveInventory {
    return {
        droplets: [],
        vpcs: [],
        firewalls: [],
        domains: [],
        load_balancers: [],
        ssh_keys: [],
        apps: [],
        alert_policies: [],
        tags: [],
        databases: [],
        spaces: [],
        cdn: [],
        certificates: [],
        spaces_listed: true,
        ...partial
    };
}

describe("planDestroy", () => {
    it("matches unique config names and skips default VPCs", () => {
        const plan = planDestroy(
            inventory({
                droplets: [
                    {
                        id: 11,
                        name: "web-01",
                        memory: 1024,
                        status: "active",
                        image: {},
                        size: {},
                        tags: ["prod"]
                    }
                ],
                vpcs: [
                    {
                        id: "vpc-1",
                        name: "main",
                        description: "",
                        region: "nyc1",
                        ip_range: "10.0.0.0/16",
                        default: false,
                        urn: "do:vpc:vpc-1",
                        created_at: ""
                    },
                    {
                        id: "vpc-default",
                        name: "default-nyc1",
                        description: "",
                        region: "nyc1",
                        ip_range: "10.116.0.0/20",
                        default: true,
                        urn: "do:vpc:default",
                        created_at: ""
                    }
                ],
                firewalls: [
                    {
                        id: "fw-1",
                        name: "web",
                        status: "succeeded",
                        inbound_rules: [],
                        outbound_rules: [],
                        droplet_ids: [11]
                    }
                ],
                tags: [{ name: "prod" }]
            }),
            {
                config: validateGrapeConfig({
                    provider: "digitalocean",
                    region: "nyc1",
                    resources: {
                        tags: ["prod"],
                        vpcs: [{ name: "main" }, { name: "default-nyc1" }],
                        droplets: [
                            {
                                name: "web-01",
                                size: "s-1vcpu-1gb",
                                image: "ubuntu-24-04-x64"
                            }
                        ],
                        firewalls: [{ name: "web" }]
                    }
                })
            }
        );

        expect(plan.targets.map((target) => `${target.kind}:${target.name}`)).toEqual([
            "firewall:web",
            "droplet:web-01",
            "vpc:main",
            "tag:prod"
        ]);
        expect(plan.skipped.some((item) => item.kind === "vpc" && item.reason?.includes("default VPC"))).toBe(true);
    });

    it("skips ambiguous duplicate names instead of deleting", () => {
        const plan = planDestroy(
            inventory({
                droplets: [
                    { id: 1, name: "web", memory: 1024, status: "active", image: {}, size: {} },
                    { id: 2, name: "web", memory: 1024, status: "active", image: {}, size: {} }
                ]
            }),
            {
                config: validateGrapeConfig({
                    provider: "digitalocean",
                    resources: {
                        droplets: [{ name: "web", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64" }]
                    }
                })
            }
        );

        expect(plan.targets).toEqual([]);
        expect(plan.skipped[0]).toMatchObject({
            kind: "droplet",
            name: "web",
            reason: expect.stringContaining("ambiguous")
        });
    });

    it("for --tag, deletes tagged droplets and clearly attached firewalls only", () => {
        const plan = planDestroy(
            inventory({
                droplets: [
                    {
                        id: 10,
                        name: "tagged",
                        memory: 1024,
                        status: "active",
                        image: {},
                        size: {},
                        tags: ["grapevine-smoke"]
                    },
                    {
                        id: 20,
                        name: "other",
                        memory: 1024,
                        status: "active",
                        image: {},
                        size: {},
                        tags: ["unrelated"]
                    }
                ],
                firewalls: [
                    {
                        id: "fw-clear",
                        name: "only-tagged",
                        status: "succeeded",
                        inbound_rules: [],
                        outbound_rules: [],
                        droplet_ids: [10]
                    },
                    {
                        id: "fw-mixed",
                        name: "mixed",
                        status: "succeeded",
                        inbound_rules: [],
                        outbound_rules: [],
                        droplet_ids: [10, 20]
                    },
                    {
                        id: "fw-tag",
                        name: "tag-firewall",
                        status: "succeeded",
                        inbound_rules: [],
                        outbound_rules: [],
                        tags: ["grapevine-smoke"]
                    }
                ],
                tags: [{ name: "grapevine-smoke" }]
            }),
            { tag: "grapevine-smoke" }
        );

        expect(plan.targets.map((target) => `${target.kind}:${target.name}`)).toEqual([
            "firewall:only-tagged",
            "firewall:tag-firewall",
            "droplet:tagged",
            "tag:grapevine-smoke"
        ]);
        expect(plan.skipped.some((item) => item.name === "mixed")).toBe(true);
        expect(plan.targets.some((item) => item.name === "other")).toBe(false);
    });
});

describe("destroyGrapeResources", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not call delete helpers on dry-run", async () => {
        const { deleteDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const result = await destroyGrapeResources({
            dryRun: true,
            inventory: inventory({
                droplets: [{ id: 9, name: "web-01", memory: 1024, status: "active", image: {}, size: {} }]
            }),
            config: validateGrapeConfig({
                provider: "digitalocean",
                resources: {
                    droplets: [{ name: "web-01", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64" }]
                }
            })
        });

        expect(result.dry_run).toBe(true);
        expect(result.deleted).toHaveLength(1);
        expect(deleteDroplet).not.toHaveBeenCalled();
    });

    it("deletes in reverse dependency order", async () => {
        const { deleteDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const { deleteFirewall } = await import("../providers/digitalocean/firewall/firewall.js");
        const { deleteVPC } = await import("../providers/digitalocean/vpc/vpc.js");
        const { deleteTag } = await import("../providers/digitalocean/tags/tags.js");

        const order: string[] = [];
        vi.mocked(deleteFirewall).mockImplementation(async () => {
            order.push("firewall");
        });
        vi.mocked(deleteDroplet).mockImplementation(async () => {
            order.push("droplet");
            return { message: "ok" };
        });
        vi.mocked(deleteVPC).mockImplementation(async () => {
            order.push("vpc");
        });
        vi.mocked(deleteTag).mockImplementation(async () => {
            order.push("tag");
        });

        await destroyGrapeResources({
            inventory: inventory({
                droplets: [{ id: 1, name: "web-01", memory: 1024, status: "active", image: {}, size: {} }],
                firewalls: [
                    {
                        id: "fw-1",
                        name: "web",
                        status: "succeeded",
                        inbound_rules: [],
                        outbound_rules: []
                    }
                ],
                vpcs: [
                    {
                        id: "vpc-1",
                        name: "main",
                        description: "",
                        region: "nyc1",
                        ip_range: "10.0.0.0/16",
                        default: false,
                        urn: "",
                        created_at: ""
                    }
                ],
                tags: [{ name: "prod" }]
            }),
            config: validateGrapeConfig({
                provider: "digitalocean",
                resources: {
                    tags: ["prod"],
                    vpcs: [{ name: "main" }],
                    droplets: [{ name: "web-01", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64" }],
                    firewalls: [{ name: "web" }]
                }
            })
        });

        expect(order).toEqual(["firewall", "droplet", "vpc", "tag"]);
    });

    it("deletes CDN, then the certificate, then the Space", async () => {
        const { deleteCdnEndpoint } = await import("../providers/digitalocean/cdn/cdn.js");
        const { deleteCertificate } = await import("../providers/digitalocean/certificates/certificates.js");
        const { deleteSpace } = await import("../providers/digitalocean/spaces/spaces.js");
        const order: string[] = [];
        vi.mocked(deleteCdnEndpoint).mockImplementation(async () => {
            order.push("cdn");
        });
        vi.mocked(deleteCertificate).mockImplementation(async () => {
            order.push("certificate");
        });
        vi.mocked(deleteSpace).mockImplementation(async () => {
            order.push("space");
        });

        const result = await destroyGrapeResources({
            inventory: inventory({
                cdn: [
                    {
                        id: "cdn-1",
                        origin: "replace-space-name.nyc3.digitaloceanspaces.com",
                        endpoint: "replace-space-name.nyc3.cdn.digitaloceanspaces.com",
                        custom_domain: "static.example.com"
                    }
                ],
                certificates: [
                    { id: "cert-1", name: "juice-static", type: "lets_encrypt", state: "verified" }
                ],
                spaces: [{ name: "replace-space-name" }]
            }),
            config: validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    spaces: [{ name: "replace-space-name", region: "nyc3", acl: "public-read" }],
                    certificates: [
                        { name: "juice-static", type: "lets_encrypt", dns_names: ["static.example.com"] }
                    ],
                    cdn: [
                        {
                            space: "replace-space-name",
                            region: "nyc3",
                            custom_domain: "static.example.com",
                            certificate: "juice-static"
                        }
                    ]
                }
            })
        });

        expect(order).toEqual(["cdn", "certificate", "space"]);
        expect(result.deleted.map((target) => target.kind)).toEqual(["cdn", "certificate", "space"]);
        expect(result.failed).toEqual([]);
    });

    it("skips Spaces when credentials were not available to list them", () => {
        const plan = planDestroy(
            inventory({ spaces_listed: false, spaces: [{ name: "replace-space-name" }] }),
            {
                config: validateGrapeConfig({
                    provider: "digitalocean",
                    region: "nyc3",
                    resources: {
                        spaces: [{ name: "replace-space-name", region: "nyc3" }]
                    }
                })
            }
        );
        expect(plan.targets).toEqual([]);
        expect(plan.skipped[0]?.reason).toMatch(/Spaces credentials are not set/);
    });

    it("skips a VPC whose region does not match the config", () => {
        const plan = planDestroy(
            inventory({
                vpcs: [
                    {
                        id: "vpc-sfo",
                        name: "main",
                        description: "",
                        region: "sfo3",
                        ip_range: "10.0.0.0/16",
                        default: false,
                        urn: "do:vpc:vpc-sfo",
                        created_at: ""
                    }
                ]
            }),
            {
                config: validateGrapeConfig({
                    provider: "digitalocean",
                    region: "nyc3",
                    resources: { vpcs: [{ name: "main" }] }
                })
            }
        );
        expect(plan.targets).toEqual([]);
        expect(plan.skipped[0]).toMatchObject({
            kind: "vpc",
            name: "main",
            reason: expect.stringContaining('region "sfo3"')
        });
    });

    it("skips an ambiguous CDN origin", () => {
        const plan = planDestroy(
            inventory({
                cdn: [
                    {
                        id: "cdn-1",
                        origin: "assets.nyc3.digitaloceanspaces.com",
                        endpoint: "a.nyc3.cdn.digitaloceanspaces.com"
                    },
                    {
                        id: "cdn-2",
                        origin: "assets.nyc3.digitaloceanspaces.com",
                        endpoint: "b.nyc3.cdn.digitaloceanspaces.com"
                    }
                ]
            }),
            {
                config: validateGrapeConfig({
                    provider: "digitalocean",
                    region: "nyc3",
                    resources: {
                        cdn: [{ origin: "assets.nyc3.digitaloceanspaces.com" }]
                    }
                })
            }
        );
        expect(plan.targets).toEqual([]);
        expect(plan.skipped[0]?.reason).toMatch(/ambiguous/);
    });
});
