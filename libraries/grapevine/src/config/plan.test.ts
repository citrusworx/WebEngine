import { describe, expect, it } from "vitest";
import { planGrapeConfig } from "./plan.js";
import { validateGrapeConfig } from "./schema.js";

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

    it("warns that services are not applied", () => {
        const plan = planGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                services: { web: { image: "nginx" } }
            })
        );
        expect(plan.warnings[0]).toMatch(/services is accepted/);
    });
});
