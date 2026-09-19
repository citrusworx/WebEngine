import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadGrapeConfig } from "./load.js";
import { planGrapeConfig } from "./plan.js";

const packsDir = path.resolve(fileURLToPath(import.meta.url), "../../../examples/blueprints");

describe("kiwipress blueprint packs", () => {
    it.each([
        {
            id: "kiwipress-compose",
            droplet: "kiwipress-01",
            databases: 0,
            composeHint: "mariadb"
        },
        {
            id: "kiwipress-managed",
            droplet: "kiwipress-01",
            databases: 2,
            composeHint: "MYSQL_CLIENT_FLAGS"
        }
    ])("validates and plans $id without a DigitalOcean token", async ({ id, droplet, databases, composeHint }) => {
        const source = path.join(packsDir, id, "grape.config.yaml");
        const config = await loadGrapeConfig(source);
        expect(config.provider).toBe("digitalocean");

        const plan = planGrapeConfig(config);
        expect(plan.warnings.filter((warning) => warning.startsWith("stack assets"))).toEqual([]);
        expect(plan.counts.droplets).toBe(1);
        expect(plan.counts.databases).toBe(databases);
        expect(plan.counts.stacks).toBe(1);
        expect(plan.resources.some((resource) => resource.kind === "droplet" && resource.name === droplet)).toBe(true);
        expect(plan.resources.some((resource) => resource.kind === "stack" && resource.detail.droplet === droplet)).toBe(
            true
        );
        expect(plan.resources.filter((resource) => resource.kind === "stack_step").map((resource) => resource.name)).toEqual([
            "install-docker",
            "write-compose",
            "write-env",
            "compose-up",
            "health-wait"
        ]);

        const stack = plan.resources.find((resource) => resource.kind === "stack");
        expect(stack?.detail.compose).toContain("docker-compose.yml");
        expect(stack?.detail.env_keys).toContain("WP_URL");
        expect(stack?.detail.env_keys).not.toMatch(/dop_v1|REPLACE_ME/);

        const composeFile = path.join(packsDir, id, "stack", "docker-compose.yml");
        const { readFileSync } = await import("node:fs");
        const compose = readFileSync(composeFile, "utf8");
        expect(compose).toContain(composeHint);
        expect(compose).not.toMatch(/blackwater/i);
    });
});
