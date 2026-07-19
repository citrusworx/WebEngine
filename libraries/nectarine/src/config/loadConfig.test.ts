import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadNectarineConfig } from "./loadConfig.js";

const fixtureConfig = path.resolve(
    import.meta.dirname,
    "__fixtures__/nectarine.config.yaml",
);

describe("loadNectarineConfig", () => {
    it("loads YAML config and resource triads", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: {},
            loadResources: true,
        });

        expect(config.version).toBe("0.1");
        expect(config.app).toBe("nectarine-fixture");
        expect(config.getVendor()).toBe("postgres");
        expect(config.transportServer).toBe("seltzer");
        expect(config.seedFallback).toBe(true);

        const product = config.getResource("product");
        expect(product.schema).toHaveProperty("Product");
        expect(product.api).toHaveProperty("product");
        expect(config.getAppBySubdomain("gear")?.resources).toContain("product");
    });

    it("resolves vendor credentials from env key names in YAML", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: {
                PG_USER: "bw",
                PG_PASS: "secret",
                PG_HOST: "localhost",
                PG_PORT: "5432",
                PG_DB: "blackwater",
            },
        });

        expect(config.getEnvKeys()).toEqual({
            user: "PG_USER",
            password: "PG_PASS",
            host: "PG_HOST",
            port: "PG_PORT",
            database: "PG_DB",
        });

        expect(config.resolveCredentials()).toEqual({
            user: "bw",
            password: "secret",
            host: "localhost",
            port: 5432,
            database: "blackwater",
        });
        expect(config.isDatabaseConfigured()).toBe(true);
    });

    it("returns null credentials when vendor env is incomplete", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: { PG_USER: "bw" },
        });

        expect(config.resolveCredentials()).toBeNull();
        expect(config.isDatabaseConfigured()).toBe(false);
    });
});
