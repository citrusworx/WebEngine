import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCli } from "./cli.js";
import type { LiveInventory } from "../config/live.js";

vi.mock("../config/apply.js", async () => {
    const actual = await vi.importActual<typeof import("../config/apply.js")>("../config/apply.js");
    return {
        ...actual,
        applyGrapeConfig: vi.fn(async () => ({
            tags: ["grapevine"],
            ssh_keys: [
                {
                    id: 7,
                    name: "grapevine",
                    fingerprint: "fp",
                    public_key: "ssh-ed25519 AAAA",
                    private_key_path: "/tmp/.grape/ssh/grapevine"
                }
            ],
            vpcs: [
                {
                    id: "vpc-1",
                    name: "grapevine",
                    description: "",
                    region: "nyc1",
                    ip_range: "10.120.0.0/16",
                    default: false,
                    urn: "do:vpc:vpc-1",
                    created_at: ""
                }
            ],
            droplets: [
                {
                    id: 99,
                    name: "grapevine-web-01",
                    memory: 1024,
                    status: "new",
                    image: {},
                    size: {}
                }
            ],
            firewalls: [],
            domains: [],
            load_balancers: [],
            alert_policies: [],
            apps: [],
            private_key_paths: ["/tmp/.grape/ssh/grapevine"],
            warnings: ['Generated SSH private key for "grapevine" saved to /tmp/.grape/ssh/grapevine']
        }))
    };
});

const liveInventory: LiveInventory = {
    droplets: [
        {
            id: 99,
            name: "grapevine-web-01",
            memory: 1024,
            status: "active",
            image: {},
            size: {},
            region: { slug: "nyc1" },
            tags: ["grapevine"],
            networks: {
                v4: [
                    { ip_address: "203.0.113.10", type: "public" },
                    { ip_address: "10.120.0.5", type: "private" }
                ]
            }
        }
    ],
    vpcs: [
        {
            id: "vpc-1",
            name: "grapevine",
            description: "",
            region: "nyc1",
            ip_range: "10.120.0.0/16",
            default: false,
            urn: "do:vpc:vpc-1",
            created_at: ""
        }
    ],
    firewalls: [
        {
            id: "fw-1",
            name: "grapevine-web",
            status: "succeeded",
            inbound_rules: [],
            outbound_rules: [],
            droplet_ids: [99],
            tags: ["grapevine"]
        }
    ],
    domains: [{ name: "example.com" }],
    load_balancers: [],
    ssh_keys: [{ id: 7, name: "grapevine", fingerprint: "fp", public_key: "ssh-ed25519 AAAA" }],
    apps: [],
    alert_policies: [],
    tags: [{ name: "grapevine" }]
};

vi.mock("../config/live.js", async () => {
    const actual = await vi.importActual<typeof import("../config/live.js")>("../config/live.js");
    return {
        ...actual,
        tokenIsSet: vi.fn(() => true),
        fetchLiveInventory: vi.fn(async () => liveInventory)
    };
});

vi.mock("../providers/digitalocean/droplet/droplet.js", async () => {
    const actual = await vi.importActual<typeof import("../providers/digitalocean/droplet/droplet.js")>(
        "../providers/digitalocean/droplet/droplet.js"
    );
    return { ...actual, deleteDroplet: vi.fn(async () => ({ message: "ok" })) };
});
vi.mock("../providers/digitalocean/firewall/firewall.js", async () => {
    const actual = await vi.importActual<typeof import("../providers/digitalocean/firewall/firewall.js")>(
        "../providers/digitalocean/firewall/firewall.js"
    );
    return { ...actual, deleteFirewall: vi.fn(async () => undefined) };
});
vi.mock("../providers/digitalocean/vpc/vpc.js", async () => {
    const actual = await vi.importActual<typeof import("../providers/digitalocean/vpc/vpc.js")>(
        "../providers/digitalocean/vpc/vpc.js"
    );
    return { ...actual, deleteVPC: vi.fn(async () => undefined) };
});
vi.mock("../providers/digitalocean/ssh/ssh.js", async () => {
    const actual = await vi.importActual<typeof import("../providers/digitalocean/ssh/ssh.js")>(
        "../providers/digitalocean/ssh/ssh.js"
    );
    return { ...actual, deleteSSHKey: vi.fn(async () => undefined) };
});
vi.mock("../providers/digitalocean/tags/tags.js", async () => {
    const actual = await vi.importActual<typeof import("../providers/digitalocean/tags/tags.js")>(
        "../providers/digitalocean/tags/tags.js"
    );
    return { ...actual, deleteTag: vi.fn(async () => undefined) };
});

async function writeConfig(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "grape-cli-"));
    const file = path.join(dir, "grape.config.yaml");
    await writeFile(
        file,
        `
provider: digitalocean
region: nyc1
resources:
  tags:
    - grapevine
  droplets:
    - name: grapevine-web-01
      size: s-1vcpu-1gb
      image: ubuntu-24-04-x64
`.trim(),
        "utf8"
    );
    return file;
}

describe("grape CLI", () => {
    const logs: string[] = [];
    const errs: string[] = [];
    const write = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
        logs.push(String(chunk));
        return true;
    });
    const writeErr = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
        errs.push(String(chunk));
        return true;
    });

    beforeEach(() => {
        Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
        process.env.DO_TOKEN = "fake-token";
    });

    afterEach(() => {
        logs.length = 0;
        errs.length = 0;
        write.mockClear();
        writeErr.mockClear();
    });

    it("prints top-level help", async () => {
        const code = await runCli(["help"]);
        expect(code).toBe(0);
        const text = logs.join("");
        expect(text).toContain("validate");
        expect(text).toContain("plan");
        expect(text).toContain("apply");
        expect(text).toContain("destroy");
        expect(text).toContain("status");
        expect(text).toContain("init");
    });

    it("prints per-command help", async () => {
        const code = await runCli(["destroy", "--help"]);
        expect(code).toBe(0);
        expect(logs.join("")).toMatch(/--yes/);
        expect(logs.join("")).toMatch(/--tag/);
        expect(logs.join("")).toMatch(/v1 destroy/i);
    });

    it("validates a local YAML config without calling DigitalOcean", async () => {
        const file = await writeConfig();
        const code = await runCli(["validate", "-c", file]);
        expect(code).toBe(0);
        const text = logs.join("");
        expect(text).toContain("Valid grape config");
        expect(text).toContain("grapevine-web-01");
        expect(text).toContain("digitalocean");
    });

    it("emits JSON from validate --json", async () => {
        const file = await writeConfig();
        const code = await runCli(["validate", "-c", file, "--json"]);
        expect(code).toBe(0);
        const parsed = JSON.parse(logs.join(""));
        expect(parsed.valid).toBe(true);
        expect(parsed.counts.droplets).toBe(1);
        expect(parsed.counts.tags).toBe(1);
    });

    it("rejects invalid configs with a non-zero exit", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "grape-"));
        const file = path.join(dir, "bad.yaml");
        await writeFile(file, "provider: aws\n", "utf8");
        const code = await runCli(["validate", "-c", file]);
        expect(code).toBe(1);
        expect(errs.join("")).toMatch(/Invalid grape config|Invalid option|Invalid input/i);
    });

    it("plans a config without mutating", async () => {
        const file = await writeConfig();
        const code = await runCli(["plan", "-c", file]);
        expect(code).toBe(0);
        const text = logs.join("");
        expect(text).toMatch(/dry-run/i);
        expect(text).toContain("grapevine-web-01");
        expect(text).toContain("DROPLET");
    });

    it("treats apply --dry-run as plan", async () => {
        const { applyGrapeConfig } = await import("../config/apply.js");
        const file = await writeConfig();
        const code = await runCli(["apply", "--dry-run", "-c", file]);
        expect(code).toBe(0);
        expect(applyGrapeConfig).not.toHaveBeenCalled();
        expect(logs.join("")).toMatch(/dry-run/i);
    });

    it("applies and prints private_key_paths clearly", async () => {
        const file = await writeConfig();
        const code = await runCli(["apply", "-c", file]);
        expect(code).toBe(0);
        const text = logs.join("");
        expect(text).toContain("Applied grape config");
        expect(text).toContain("Private keys written");
        expect(text).toContain("/tmp/.grape/ssh/grapevine");
        expect(text).toContain("ssh -i /tmp/.grape/ssh/grapevine");
    });

    it("apply --json prints structured apply output including private_key_paths", async () => {
        const file = await writeConfig();
        const code = await runCli(["apply", "-c", file, "--json"]);
        expect(code).toBe(0);
        const parsed = JSON.parse(logs.join(""));
        expect(parsed.private_key_paths).toEqual(["/tmp/.grape/ssh/grapevine"]);
        expect(parsed.droplets[0].name).toBe("grapevine-web-01");
    });

    it("requires --yes for destroy when stdin is not a TTY", async () => {
        const file = await writeConfig();
        const { deleteDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const code = await runCli(["destroy", "-c", file]);
        expect(code).toBe(1);
        expect(errs.join("")).toMatch(/--yes/);
        expect(deleteDroplet).not.toHaveBeenCalled();
    });

    it("destroys matching resources with --yes", async () => {
        const file = await writeConfig();
        const { deleteDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const { deleteTag } = await import("../providers/digitalocean/tags/tags.js");
        const code = await runCli(["destroy", "-c", file, "--yes"]);
        expect(code).toBe(0);
        expect(deleteDroplet).toHaveBeenCalledWith(99);
        expect(deleteTag).toHaveBeenCalledWith("grapevine");
        expect(logs.join("")).toContain("grapevine-web-01");
    });

    it("destroy --dry-run does not delete", async () => {
        const file = await writeConfig();
        const { deleteDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        vi.mocked(deleteDroplet).mockClear();
        const code = await runCli(["destroy", "-c", file, "--dry-run"]);
        expect(code).toBe(0);
        expect(deleteDroplet).not.toHaveBeenCalled();
        expect(logs.join("")).toMatch(/dry-run/i);
    });

    it("shows a rich live status table", async () => {
        const code = await runCli(["status"]);
        expect(code).toBe(0);
        const text = logs.join("");
        expect(text).toContain("grapevine-web-01");
        expect(text).toContain("203.0.113.10");
        expect(text).toContain("10.120.0.5");
        expect(text).toContain("grapevine-web");
        expect(text).toContain("example.com");
    });

    it("status -c includes config overlap", async () => {
        const file = await writeConfig();
        const code = await runCli(["status", "-c", file, "--json"]);
        expect(code).toBe(0);
        const parsed = JSON.parse(logs.join(""));
        expect(parsed.config.counts.droplets).toBe(1);
        expect(parsed.overlap.some((row: { name: string; state: string }) => row.name === "grapevine-web-01" && row.state === "present")).toBe(
            true
        );
    });

    it("lists blueprints with init --list", async () => {
        const code = await runCli(["init", "--list"]);
        expect(code).toBe(0);
        const text = logs.join("");
        expect(text).toContain("01-vpc-and-tag");
        expect(text).toContain("04-full-web-stack");
    });

    it("inits a blueprint into cwd", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "grape-init-cli-"));
        const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(dir);
        try {
            const code = await runCli(["init", "01"]);
            expect(code).toBe(0);
            expect(logs.join("")).toContain("01-vpc-and-tag");
            const { readFile } = await import("node:fs/promises");
            const written = await readFile(path.join(dir, "grape.config.yaml"), "utf8");
            expect(written).toContain("provider: digitalocean");
        } finally {
            cwdSpy.mockRestore();
        }
    });

    it("exits non-zero when apply is missing --config", async () => {
        const code = await runCli(["apply"]);
        expect(code).toBe(1);
        expect(errs.join("")).toMatch(/--config/);
    });
});
