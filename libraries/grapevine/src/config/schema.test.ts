import { describe, expect, it } from "vitest";
import { safeValidateGrapeConfig, validateGrapeConfig } from "./schema.js";

const validConfig = {
    version: "0.1",
    provider: "digitalocean",
    credentials: { source: "env", env: "DO_TOKEN" },
    region: "nyc1",
    resources: {
        tags: ["prod"],
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
                inbound: [{ protocol: "tcp", ports: "443", sources: ["0.0.0.0/0"] }]
            }
        ],
        domains: [
            {
                name: "example.com",
                records: [{ type: "A", name: "www", data: "203.0.113.10" }]
            }
        ]
    }
};

describe("grape config schema", () => {
    it("accepts a resource-oriented DigitalOcean config", () => {
        const parsed = validateGrapeConfig(validConfig);
        expect(parsed.provider).toBe("digitalocean");
        expect(parsed.credentials.env).toBe("DO_TOKEN");
        const droplet = parsed.resources.droplets?.[0];
        expect(droplet && "name" in droplet ? droplet.name : undefined).toBe("web-01");
    });

    it("defaults credentials to env/DO_TOKEN", () => {
        const parsed = validateGrapeConfig({
            provider: "digitalocean",
            region: "sfo3"
        });
        expect(parsed.credentials).toEqual({ source: "env", env: "DO_TOKEN" });
        expect(parsed.resources).toEqual({});
    });

    it("rejects unsupported providers", () => {
        const result = safeValidateGrapeConfig({
            provider: "aws",
            region: "us-east-1"
        });
        expect(result.success).toBe(false);
    });

    it("accepts a classic droplet blueprint document", () => {
        const parsed = validateGrapeConfig({
            grapevine: "1.0",
            blueprint: {
                name: "create-single-droplet",
                droplet: {
                    name: "web-01",
                    region: "nyc3",
                    size: "s-1vcpu-1gb",
                    image: "ubuntu-24-04-x64"
                }
            }
        });
        const droplet = parsed.resources.droplets?.[0];
        expect(droplet && "blueprint" in droplet ? droplet.blueprint.droplet.name : undefined).toBe("web-01");
    });

    it("rejects droplets missing required fields", () => {
        const result = safeValidateGrapeConfig({
            provider: "digitalocean",
            resources: {
                droplets: [{ name: "broken" }]
            }
        });
        expect(result.success).toBe(false);
    });

    it("accepts a stack with inline compose and env keys", () => {
        const parsed = validateGrapeConfig({
            provider: "digitalocean",
            resources: {
                droplets: [
                    {
                        name: "kp-01",
                        size: "s-2vcpu-4gb",
                        image: "ubuntu-24-04-x64"
                    }
                ]
            },
            stack: {
                name: "kiwipress",
                droplet: "kp-01",
                compose: { inline: "services:\n  web:\n    image: nginx\n" },
                env: { keys: { WP_URL: "http://wp.example.test" } },
                health: { url: "http://127.0.0.1/", wait_seconds: 60 }
            }
        });
        expect(parsed.stack && !Array.isArray(parsed.stack) ? parsed.stack.droplet : undefined).toBe("kp-01");
    });

    it("rejects stack.compose without a source", () => {
        const result = safeValidateGrapeConfig({
            provider: "digitalocean",
            stack: {
                droplet: "kp-01",
                compose: {}
            }
        });
        expect(result.success).toBe(false);
    });

    it("accepts resources.databases for managed DigitalOcean databases", () => {
        const parsed = validateGrapeConfig({
            provider: "digitalocean",
            region: "nyc1",
            resources: {
                databases: [
                    {
                        name: "kiwipress-mysql",
                        engine: "mysql",
                        version: "8",
                        size: "db-s-1vcpu-1gb",
                        vpc: "kiwipress",
                        connection_env: {
                            host: "WORDPRESS_DB_HOST",
                            user: "WORDPRESS_DB_USER",
                            password: "WORDPRESS_DB_PASSWORD",
                            database: "WORDPRESS_DB_NAME"
                        }
                    }
                ]
            }
        });
        expect(parsed.resources.databases?.[0]?.engine).toBe("mysql");
        expect(parsed.resources.databases?.[0]?.connection_env?.host).toBe("WORDPRESS_DB_HOST");
    });

    it("accepts convenience firewall port forms all and comma lists", () => {
        const parsed = validateGrapeConfig({
            provider: "digitalocean",
            firewall: {
                inbound: [
                    { protocol: "tcp", ports: "all", sources: ["0.0.0.0/0"] },
                    { protocol: "tcp", ports: "80,443", sources: ["0.0.0.0/0"] },
                    { protocol: "icmp", sources: ["0.0.0.0/0"] }
                ]
            }
        });
        expect(parsed.firewall?.inbound?.map((rule) => rule.ports)).toEqual(["all", "80,443", undefined]);
    });

    it("accepts ssh_keys generate with optional private_key_path", () => {
        const parsed = validateGrapeConfig({
            provider: "digitalocean",
            resources: {
                ssh_keys: [
                    { name: "grapevine", generate: true, private_key_path: ".grape/ssh/grapevine" }
                ]
            }
        });
        expect(parsed.resources.ssh_keys?.[0]).toMatchObject({
            name: "grapevine",
            generate: true,
            private_key_path: ".grape/ssh/grapevine"
        });
    });
});
