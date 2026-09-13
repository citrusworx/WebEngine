import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseCliArgs, runCli } from "./cli.js";

vi.mock("../config/apply.js", async () => {
    const actual = await vi.importActual<typeof import("../config/apply.js")>("../config/apply.js");
    return {
        ...actual,
        applyGrapeConfig: vi.fn(async () => ({
            tags: [],
            ssh_keys: [],
            vpcs: [],
            droplets: [],
            firewalls: [],
            domains: [],
            load_balancers: [],
            alert_policies: [],
            apps: [],
            warnings: []
        }))
    };
});

describe("grape CLI", () => {
    const logs: string[] = [];
    const write = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
        logs.push(String(chunk));
        return true;
    });

    afterEach(() => {
        logs.length = 0;
        write.mockClear();
    });

    it("parses apply/validate with -c", () => {
        expect(parseCliArgs(["apply", "-c", "./grape.yaml"])).toEqual({
            command: "apply",
            config: "./grape.yaml"
        });
        expect(parseCliArgs(["validate", "--config", "https://example.com/grape.json"])).toEqual({
            command: "validate",
            config: "https://example.com/grape.json"
        });
    });

    it("validates a local YAML config without calling DigitalOcean", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "grape-"));
        const file = path.join(dir, "grape.config.yaml");
        await writeFile(
            file,
            `
provider: digitalocean
region: nyc1
resources:
  droplets:
    - name: web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
`.trim(),
            "utf8"
        );

        const code = await runCli(["validate", "-c", file]);
        expect(code).toBe(0);
        expect(logs.join("")).toContain("Valid grape config");
        expect(logs.join("")).toContain('"droplets": 1');
    });

    it("rejects invalid configs", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "grape-"));
        const file = path.join(dir, "bad.yaml");
        await writeFile(file, "provider: aws\n", "utf8");
        const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
        const code = await runCli(["validate", "-c", file]);
        expect(code).toBe(1);
        err.mockRestore();
    });

    it("prints help", async () => {
        const code = await runCli(["help"]);
        expect(code).toBe(0);
        expect(logs.join("")).toContain("grape apply");
    });
});
