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
        expect(parsed.resources.droplets?.[0]?.name).toBe("web-01");
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

    it("rejects droplets missing required fields", () => {
        const result = safeValidateGrapeConfig({
            provider: "digitalocean",
            resources: {
                droplets: [{ name: "broken" }]
            }
        });
        expect(result.success).toBe(false);
    });
});
