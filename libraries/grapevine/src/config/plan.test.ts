import { describe, expect, it, vi } from "vitest";
import { annotatePlan, LOCAL_PLAN_NOTE, planGrapeConfig, resolveGrapePlan } from "./plan.js";
import { validateGrapeConfig } from "./schema.js";
import type { LiveInventory } from "./live.js";

vi.mock("./live.js", async () => {
    const actual = await vi.importActual<typeof import("./live.js")>("./live.js");
    return {
        ...actual,
        tokenIsSet: vi.fn(() => false),
        fetchLiveInventory: vi.fn()
    };
});

describe("planGrapeConfig", () => {
    it("builds a local resource graph without needing a token", () => {
        const plan = planGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc1",
                resources: {
                    tags: ["grapevine"],
                    ssh_keys: [{ name: "grapevine", generate: true }],
                    vpcs: [{ name: "grapevine", ip_range: "10.120.0.0/16" }],
                    droplets: [
                        {
                            name: "grapevine-web-01",
                            size: "s-1vcpu-1gb",
                            image: "ubuntu-24-04-x64",
                            vpc: "grapevine",
                            tags: ["grapevine"]
                        }
                    ],
                    firewalls: [{ name: "grapevine-web", droplets: ["grapevine-web-01"] }]
                }
            })
        );

        expect(plan.dry_run).toBe(true);
        expect(plan.counts.droplets).toBe(1);
        expect(plan.counts.vpcs).toBe(1);
        expect(plan.resources.map((resource) => `${resource.kind}:${resource.name}`)).toEqual([
            "tag:grapevine",
            "ssh_key:grapevine",
            "vpc:grapevine",
            "droplet:grapevine-web-01",
            "firewall:grapevine-web"
        ]);
        expect(plan.resources.find((resource) => resource.kind === "droplet")?.detail).toMatchObject({
            region: "nyc1",
            size: "s-1vcpu-1gb",
            vpc: "grapevine"
        });
        expect(plan.resources.find((resource) => resource.kind === "ssh_key")?.detail.generate).toBe("true");
    });

    it("folds convenience networking/firewall sections into the plan", () => {
        const plan = planGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                networking: { vpc: true, domain: "example.com" },
                firewall: {
                    inbound: [{ protocol: "tcp", ports: "80", sources: ["0.0.0.0/0"] }]
                }
            })
        );

        expect(plan.resources.some((resource) => resource.kind === "vpc" && resource.name === "digitalocean-vpc")).toBe(
            true
        );
        expect(plan.resources.some((resource) => resource.kind === "domain" && resource.name === "example.com")).toBe(
            true
        );
        expect(
            plan.resources.some((resource) => resource.kind === "firewall" && resource.name === "digitalocean-firewall")
        ).toBe(true);
    });

    it("plans a static site and warns on deprecated networking flags", () => {
        const plan = planGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                networking: { ssl: true, cdn: true },
                resources: {
                    spaces: [{ name: "replace-space-name", acl: "public-read" }],
                    certificates: [{ name: "juice-static", dns_names: ["static.example.com"] }],
                    cdn: [
                        {
                            space: "replace-space-name",
                            custom_domain: "static.example.com",
                            certificate: "juice-static",
                            ttl: 3600
                        }
                    ]
                }
            })
        );
        expect(plan.counts.spaces).toBe(1);
        expect(plan.counts.certificates).toBe(1);
        expect(plan.counts.cdn).toBe(1);
        expect(plan.resources.map((resource) => `${resource.kind}:${resource.name}`)).toEqual([
            "space:replace-space-name",
            "certificate:juice-static",
            "cdn:static.example.com"
        ]);
        expect(plan.resources.find((resource) => resource.kind === "cdn")?.detail.origin).toBe(
            "replace-space-name.nyc3.digitaloceanspaces.com"
        );
        expect(plan.warnings).toEqual([
            "networking.ssl is deprecated and is not applied. Declare resources.certificates instead.",
            "networking.cdn is deprecated and is not applied. Declare resources.cdn for a Spaces CDN endpoint instead."
        ]);
    });

    it("warns that loose services are not applied", () => {
        const plan = planGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                services: { web: { image: "nginx" } }
            })
        );
        expect(plan.warnings[0]).toMatch(/services is accepted/);
    });

    it("lists databases and stack bootstrap steps without a token", () => {
        const plan = planGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc1",
                resources: {
                    droplets: [
                        {
                            name: "kp-01",
                            size: "s-2vcpu-4gb",
                            image: "ubuntu-24-04-x64"
                        }
                    ],
                    databases: [
                        {
                            name: "kiwipress-mysql",
                            engine: "mysql",
                            size: "db-s-1vcpu-1gb"
                        }
                    ]
                },
                stack: {
                    name: "kiwipress",
                    droplet: "kp-01",
                    compose: { inline: "services:\n  web:\n    image: nginx\n" },
                    env: { keys: { WP_URL: "http://wp.example.test" } },
                    health: { url: "http://127.0.0.1/" }
                }
            })
        );

        expect(plan.counts.databases).toBe(1);
        expect(plan.counts.stacks).toBe(1);
        expect(plan.resources.map((resource) => `${resource.kind}:${resource.name}`)).toEqual([
            "database:kiwipress-mysql",
            "droplet:kp-01",
            "stack:kiwipress",
            "stack_step:install-docker",
            "stack_step:write-compose",
            "stack_step:write-env",
            "stack_step:compose-up",
            "stack_step:health-wait"
        ]);
        expect(plan.resources.find((resource) => resource.kind === "stack")?.detail).toMatchObject({
            droplet: "kp-01",
            health: "http://127.0.0.1/"
        });
        expect(plan.warnings).toEqual([]);
        expect(plan.lookup).toBe("local");
    });

    it("stays local-only and says so when no token is set", async () => {
        const { tokenIsSet, fetchLiveInventory } = await import("./live.js");
        vi.mocked(tokenIsSet).mockReturnValue(false);
        const plan = await resolveGrapePlan(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: { droplets: [{ name: "web", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64" }] }
            })
        );
        expect(plan.lookup).toBe("local");
        expect(plan.warnings).toContain(LOCAL_PLAN_NOTE);
        expect(plan.resources[0]?.detail.action).toBeUndefined();
        expect(fetchLiveInventory).not.toHaveBeenCalled();
    });

    it("marks create versus adopt from a live inventory without mutating", () => {
        const plan = planGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    droplets: [
                        { name: "web", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64" },
                        { name: "new-web", size: "s-1vcpu-1gb", image: "ubuntu-24-04-x64" }
                    ],
                    spaces: [{ name: "juice-static" }],
                    cdn: [{ space: "juice-static", ttl: 3600 }]
                }
            })
        );
        const inventory = {
            droplets: [{ id: 1, name: "web", memory: 1024, status: "active", image: {}, size: {} }],
            vpcs: [],
            firewalls: [],
            domains: [],
            load_balancers: [],
            ssh_keys: [],
            apps: [],
            alert_policies: [],
            tags: [],
            databases: [],
            spaces: [{ name: "juice-static" }],
            cdn: [
                {
                    id: "cdn-1",
                    origin: "juice-static.nyc3.digitaloceanspaces.com",
                    endpoint: "juice-static.nyc3.cdn.digitaloceanspaces.com"
                }
            ],
            certificates: [],
            spaces_listed: true
        } satisfies LiveInventory;
        const live = annotatePlan(plan, inventory);
        expect(live.lookup).toBe("live");
        expect(live.resources.find((resource) => resource.name === "web")?.detail.action).toBe("adopt");
        expect(live.resources.find((resource) => resource.name === "new-web")?.detail.action).toBe("create");
        expect(live.resources.find((resource) => resource.kind === "space")?.detail.action).toBe("adopt");
        expect(live.resources.find((resource) => resource.kind === "cdn")?.detail.action).toBe("adopt");
    });
});
