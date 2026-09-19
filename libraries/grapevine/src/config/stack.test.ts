import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    generateDefaultBootstrap,
    generateStackUserData,
    isStackShaped,
    mergeUserData,
    resolveStack
} from "./stack.js";
import { validateGrapeConfig } from "./schema.js";

describe("stack resolution", () => {
    it("detects a stack-shaped services section", () => {
        expect(
            isStackShaped({
                droplet: "kp-01",
                compose: { file: "./docker-compose.yml" }
            })
        ).toBe(true);
        expect(isStackShaped({ web: { image: "nginx" } })).toBe(false);
    });

    it("resolves inline compose and generates cloud-init user_data", () => {
        const stack = resolveStack(
            {
                name: "kiwipress",
                droplet: "kp-01",
                compose: { inline: "services:\n  web:\n    image: nginx\n" },
                env: { keys: { WP_URL: "http://wp.example.test", EMPTY: "" } },
                health: { url: "http://127.0.0.1/", wait_seconds: 30 }
            },
            { baseDir: process.cwd() }
        );

        expect(stack.composeDests).toEqual(["/opt/kiwipress/docker-compose.yml"]);
        expect(stack.envKeys.WP_URL).toBe("http://wp.example.test");
        expect(stack.steps).toEqual([
            "install-docker",
            "write-compose",
            "write-env",
            "compose-up",
            "health-wait"
        ]);

        const userData = generateStackUserData(stack);
        expect(userData.startsWith("#cloud-config\n")).toBe(true);
        expect(userData).toContain("package_update: true");
        expect(userData).toContain("/opt/kiwipress/docker-compose.yml");
        expect(userData).toContain("/opt/kiwipress/scripts/bootstrap.sh");
        expect(userData).toContain("encoding: b64");

        const bootstrap = generateDefaultBootstrap(stack);
        expect(bootstrap).toContain("get.docker.com");
        expect(bootstrap).toContain("docker compose");
        expect(bootstrap).toContain("http://127.0.0.1/");
    });

    it("reads compose and env files relative to baseDir and overlays env", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "grape-stack-"));
        writeFileSync(path.join(dir, "docker-compose.yml"), "services:\n  db:\n    image: postgres:15\n", "utf8");
        writeFileSync(path.join(dir, ".env.example"), "WP_URL=http://old.example\nMINIO_ROOT_USER=minio\n", "utf8");

        const stack = resolveStack(
            {
                droplet: "kp-01",
                compose: { file: "./docker-compose.yml" },
                env: { file: "./.env.example", keys: { WP_URL: "http://wp.example.test" } }
            },
            { baseDir: dir, envOverlay: { WORDPRESS_DB_HOST: "private.db.example:25060" } }
        );

        expect(stack.files.find((file) => file.dest.endsWith("docker-compose.yml"))?.content).toContain("postgres:15");
        expect(stack.envKeys).toMatchObject({
            WP_URL: "http://wp.example.test",
            MINIO_ROOT_USER: "minio",
            WORDPRESS_DB_HOST: "private.db.example:25060"
        });
    });

    it("merges existing droplet user_data as cloud-init multipart", () => {
        const merged = mergeUserData("#!/bin/bash\necho pre\n", "#cloud-config\npackages: [curl]\n");
        expect(merged).toContain("multipart/mixed");
        expect(merged).toContain("text/x-shellscript");
        expect(merged).toContain("text/cloud-config");
        expect(merged).toContain("echo pre");
    });

    it("accepts stack-shaped services as an applied stack in the schema", () => {
        const parsed = validateGrapeConfig({
            provider: "digitalocean",
            services: {
                droplet: "kp-01",
                compose: { inline: "services: {}\n" }
            }
        });
        expect(isStackShaped(parsed.services)).toBe(true);
    });
});
