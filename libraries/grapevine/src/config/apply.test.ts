import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sshpk from "sshpk";
import { applyGrapeConfig, normalizeResources } from "./apply.js";
import { validateGrapeConfig } from "./schema.js";
import { persistGeneratedPrivateKey, readExistingPrivateKeyPublic } from "./ssh-private-key.js";

vi.mock("../providers/digitalocean/client.js", () => ({
    getDoToken: vi.fn(() => "fake-token")
}));

vi.mock("../providers/digitalocean/tags/tags.js", () => ({
    createTag: vi.fn(async (name: string) => ({ name })),
    listAllTags: vi.fn(async () => []),
    tagResource: vi.fn()
}));

vi.mock("../providers/digitalocean/ssh/ssh.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../providers/digitalocean/ssh/ssh.js")>();
    return {
        ...actual,
        createSSHKey: vi.fn(),
        listSSHKeys: vi.fn(async () => []),
        uploadSSHKey: vi.fn(async (key: { name: string }) => ({
            id: 7,
            name: key.name,
            fingerprint: "fp",
            public_key: "ssh-rsa AAAA"
        }))
    };
});

vi.mock("../providers/digitalocean/vpc/vpc.js", () => ({
    createVPC: vi.fn(async (vpc: { name: string }) => ({
        id: "vpc-1",
        name: vpc.name,
        description: "",
        region: "nyc1",
        ip_range: "10.0.0.0/16",
        default: false,
        urn: "do:vpc:vpc-1",
        created_at: ""
    })),
    listAllVPCs: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/droplet/droplet.js", () => ({
    createDroplet: vi.fn(async (spec: { name: string }) => ({
        id: 99,
        name: spec.name,
        memory: 1024,
        status: "new",
        image: {},
        size: {}
    })),
    listAllDroplets: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/firewall/firewall.js", () => ({
    createFireWall: vi.fn(async (fw: { name: string }) => ({
        id: "fw-1",
        name: fw.name,
        status: "succeeded",
        inbound_rules: [],
        outbound_rules: []
    })),
    listAllFirewalls: vi.fn(async () => []),
    updateFirewall: vi.fn(async (id: string, fw: { name: string }) => ({
        id,
        name: fw.name,
        status: "succeeded",
        inbound_rules: [],
        outbound_rules: []
    }))
}));

vi.mock("../providers/digitalocean/networking/domains.js", () => ({
    createDomain: vi.fn(async (domain: { name: string }) => domain),
    createDomainRecord: vi.fn(async () => ({ id: 1 })),
    listAllDomains: vi.fn(async () => []),
    listAllDomainRecords: vi.fn(async () => [])
}));

vi.mock("../providers/digitalocean/networking/load-balancer.js", () => ({
    createLoadBalancer: vi.fn()
}));

vi.mock("../providers/digitalocean/monitoring/monitoring.js", () => ({
    createAlertPolicy: vi.fn()
}));

vi.mock("../providers/digitalocean/apps/apps.js", () => ({
    createApp: vi.fn()
}));

vi.mock("../providers/digitalocean/databases/databases.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../providers/digitalocean/databases/databases.js")>();
    return {
        ...actual,
        listDatabases: vi.fn(async () => []),
        getDatabase: vi.fn(),
        createDatabase: vi.fn(async (spec: { name: string; engine: string }) => ({
            id: "db-1",
            name: spec.name,
            engine: spec.engine,
            status: "online",
            connection: {
                host: "db.example",
                port: 25060,
                user: "doadmin",
                password: "secret",
                database: "defaultdb",
                uri: "mysql://doadmin:secret@db.example:25060/defaultdb"
            },
            private_connection: {
                host: "private.db.example",
                port: 25060,
                user: "doadmin",
                password: "secret",
                database: "defaultdb",
                uri: "mysql://doadmin:secret@private.db.example:25060/defaultdb"
            }
        })),
        waitForDatabase: vi.fn(async (id: string) => ({
            id,
            name: "ready",
            engine: "mysql",
            status: "online"
        }))
    };
});

function generatedKeyPair(name: string) {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });
    return {
        name,
        publicKey: sshpk.parseKey(publicKey, "pem").toString("ssh"),
        keys: { publicKey, privateKey },
        fingerprint: "SHA256:test"
    };
}

describe("apply grape config", () => {
    const tempDirs: string[] = [];

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DO_TOKEN = "fake-token";
    });

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("normalizes convenience networking and firewall sections", () => {
        const config = validateGrapeConfig({
            provider: "digitalocean",
            region: "nyc1",
            networking: { vpc: true, domain: "example.com" },
            firewall: {
                inbound: [{ protocol: "tcp", ports: "80", sources: ["0.0.0.0/0"] }],
                outbound: [{ protocol: "tcp", ports: "all", destinations: ["0.0.0.0/0"] }]
            }
        });

        const resources = normalizeResources(config);
        expect(resources.vpcs?.[0]?.name).toBe("digitalocean-vpc");
        expect(resources.domains?.[0]?.name).toBe("example.com");
        expect(resources.firewalls?.[0]?.name).toBe("digitalocean-firewall");
    });

    it("creates declared resources in dependency order", async () => {
        const { createTag } = await import("../providers/digitalocean/tags/tags.js");
        const { createVPC } = await import("../providers/digitalocean/vpc/vpc.js");
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const { createFireWall } = await import("../providers/digitalocean/firewall/firewall.js");
        const { createDomain, createDomainRecord } = await import("../providers/digitalocean/networking/domains.js");

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc1",
                resources: {
                    tags: ["prod"],
                    ssh_keys: [{ name: "laptop", public_key: "ssh-ed25519 AAAA" }],
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
                            droplets: ["web-01"],
                            inbound: [{ protocol: "tcp", ports: "443", sources: ["0.0.0.0/0"] }]
                        }
                    ],
                    domains: [
                        {
                            name: "example.com",
                            records: [{ type: "A", name: "@", data: "203.0.113.10" }]
                        }
                    ]
                }
            })
        );

        expect(createTag).toHaveBeenCalledWith("prod");
        expect(createVPC).toHaveBeenCalled();
        expect(createDroplet).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "web-01",
                region: "nyc1",
                vpc_uuid: "vpc-1",
                ssh_keys: [7]
            })
        );
        expect(createFireWall).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "web",
                droplet_ids: [99],
                inbound_rules: [
                    { protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } }
                ]
            })
        );
        expect(createDomain).toHaveBeenCalledWith({ name: "example.com", ip_address: undefined });
        expect(createDomainRecord).toHaveBeenCalled();
        expect(result.droplets[0]?.id).toBe(99);
        expect(result.warnings).toEqual([]);
    });

    it("normalizes convenience firewall ports before calling DigitalOcean", async () => {
        const { createFireWall } = await import("../providers/digitalocean/firewall/firewall.js");

        await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc1",
                resources: {
                    firewalls: [
                        {
                            name: "web",
                            inbound: [
                                { protocol: "tcp", ports: "22", sources: ["203.0.113.10/32"] },
                                { protocol: "tcp", ports: "80,443", sources: ["0.0.0.0/0"] },
                                { protocol: "tcp", ports: "8000-9000", sources: ["10.0.0.0/8"] },
                                { protocol: "icmp", ports: "all", sources: ["0.0.0.0/0"] }
                            ],
                            outbound: [
                                { protocol: "tcp", ports: "all", destinations: ["0.0.0.0/0"] },
                                { protocol: "udp", ports: "*", destinations: ["0.0.0.0/0"] },
                                { protocol: "icmp", destinations: ["0.0.0.0/0"] }
                            ]
                        }
                    ]
                }
            })
        );

        expect(createFireWall).toHaveBeenCalledWith({
            name: "web",
            droplet_ids: [],
            tags: undefined,
            inbound_rules: [
                { protocol: "tcp", ports: "22", sources: { addresses: ["203.0.113.10/32"] } },
                { protocol: "tcp", ports: "80", sources: { addresses: ["0.0.0.0/0"] } },
                { protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } },
                { protocol: "tcp", ports: "8000-9000", sources: { addresses: ["10.0.0.0/8"] } },
                { protocol: "icmp", sources: { addresses: ["0.0.0.0/0"] } }
            ],
            outbound_rules: [
                { protocol: "tcp", ports: "1-65535", destinations: { addresses: ["0.0.0.0/0"] } },
                { protocol: "udp", ports: "1-65535", destinations: { addresses: ["0.0.0.0/0"] } },
                { protocol: "icmp", destinations: { addresses: ["0.0.0.0/0"] } }
            ]
        });
    });

    it("applies a classic DropletBlueprint document", async () => {
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        await applyGrapeConfig(
            validateGrapeConfig({
                grapevine: "1.0",
                provider: "digitalocean",
                blueprint: {
                    name: "create-single-droplet",
                    droplet: {
                        name: "from-blueprint",
                        region: "nyc3",
                        size: "s-1vcpu-1gb",
                        image: "ubuntu-24-04-x64"
                    }
                }
            })
        );
        expect(createDroplet).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "from-blueprint",
                region: "nyc3"
            })
        );
    });

    it("writes a generated private key, reports the path, and omits key material from apply output", async () => {
        const { createSSHKey, uploadSSHKey } = await import("../providers/digitalocean/ssh/ssh.js");
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const dir = mkdtempSync(path.join(tmpdir(), "grape-apply-ssh-"));
        tempDirs.push(dir);
        const keyPath = path.join(dir, "id_grapevine");
        const generated = generatedKeyPair("grapevine");
        vi.mocked(createSSHKey).mockReturnValue(generated);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc1",
                resources: {
                    ssh_keys: [{ name: "grapevine", generate: true, private_key_path: keyPath }],
                    droplets: [
                        {
                            name: "web-01",
                            size: "s-1vcpu-1gb",
                            image: "ubuntu-24-04-x64"
                        }
                    ]
                }
            })
        );

        expect(uploadSSHKey).toHaveBeenCalledWith({
            name: "grapevine",
            public_key: generated.publicKey
        });
        expect(createDroplet).toHaveBeenCalledWith(
            expect.objectContaining({
                ssh_keys: [7]
            })
        );
        expect(result.ssh_keys[0]?.private_key_path).toBe(keyPath);
        expect(result.private_key_paths).toEqual([keyPath]);
        expect(result.warnings).toEqual([`Generated SSH private key for "grapevine" saved to ${keyPath}`]);
        expect(statSync(keyPath).mode & 0o777).toBe(0o600);
        expect(readFileSync(keyPath, "utf8")).toMatch(/^-----BEGIN OPENSSH PRIVATE KEY-----/);

        const serialized = JSON.stringify(result);
        expect(serialized).toContain(keyPath);
        expect(serialized).not.toContain(generated.keys.privateKey);
        expect(serialized).not.toContain("BEGIN PRIVATE KEY");
        expect(serialized).not.toContain("BEGIN OPENSSH PRIVATE KEY");
        expect(serialized).not.toMatch(/-----BEGIN[A-Z ]*PRIVATE/);
    });

    it("defaults generated private keys to .grape/ssh/<name> under cwd", async () => {
        const { createSSHKey } = await import("../providers/digitalocean/ssh/ssh.js");
        const dir = mkdtempSync(path.join(tmpdir(), "grape-apply-default-ssh-"));
        tempDirs.push(dir);
        const generated = generatedKeyPair("grapevine");
        vi.mocked(createSSHKey).mockReturnValue(generated);
        const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(dir);

        try {
            const result = await applyGrapeConfig(
                validateGrapeConfig({
                    provider: "digitalocean",
                    region: "nyc1",
                    resources: {
                        ssh_keys: [{ name: "grapevine", generate: true }]
                    }
                })
            );
            const expected = path.join(dir, ".grape", "ssh", "grapevine");
            expect(result.private_key_paths).toEqual([expected]);
            expect(statSync(expected).mode & 0o777).toBe(0o600);
        } finally {
            cwdSpy.mockRestore();
        }
    });

    it("does not write a private key when uploading an existing public_key", async () => {
        const { createSSHKey } = await import("../providers/digitalocean/ssh/ssh.js");
        const dir = mkdtempSync(path.join(tmpdir(), "grape-apply-existing-ssh-"));
        tempDirs.push(dir);
        const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(dir);

        try {
            const result = await applyGrapeConfig(
                validateGrapeConfig({
                    provider: "digitalocean",
                    region: "nyc1",
                    resources: {
                        ssh_keys: [{ name: "laptop", public_key: "ssh-ed25519 AAAA" }]
                    }
                })
            );
            expect(createSSHKey).not.toHaveBeenCalled();
            expect(result.private_key_paths).toEqual([]);
            expect(result.ssh_keys[0]?.private_key_path).toBeUndefined();
            expect(result.warnings).toEqual([]);
        } finally {
            cwdSpy.mockRestore();
        }
    });

    it("creates managed databases and injects stack user_data without leaking secrets in the result", async () => {
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        const { createDatabase } = await import("../providers/digitalocean/databases/databases.js");

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc1",
                resources: {
                    vpcs: [{ name: "kiwipress", ip_range: "10.80.0.0/16" }],
                    databases: [
                        {
                            name: "kiwipress-mysql",
                            engine: "mysql",
                            size: "db-s-1vcpu-1gb",
                            vpc: "kiwipress",
                            connection_env: {
                                host: "WORDPRESS_DB_HOST",
                                user: "WORDPRESS_DB_USER",
                                password: "WORDPRESS_DB_PASSWORD",
                                database: "WORDPRESS_DB_NAME"
                            }
                        }
                    ],
                    droplets: [
                        {
                            name: "kp-01",
                            size: "s-2vcpu-4gb",
                            image: "ubuntu-24-04-x64",
                            vpc: "kiwipress"
                        }
                    ]
                },
                stack: {
                    name: "kiwipress",
                    droplet: "kp-01",
                    compose: { inline: "services:\n  wordpress:\n    image: wordpress:6.7-php8.2-apache\n" },
                    env: { keys: { WP_URL: "http://wp.example.test" } },
                    health: { url: "http://127.0.0.1/" }
                }
            })
        );

        expect(createDatabase).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "kiwipress-mysql",
                engine: "mysql",
                region: "nyc1",
                private_network_uuid: "vpc-1"
            })
        );
        expect(createDroplet).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "kp-01",
                user_data: expect.stringContaining("#cloud-config")
            })
        );
        const userData = vi.mocked(createDroplet).mock.calls[0]?.[0] as { user_data?: string };
        expect(userData.user_data).toContain("#cloud-config");
        expect(userData.user_data).toContain("write_files");
        expect(userData.user_data).toContain("encoding: b64");
        expect(userData.user_data).toContain("/opt/kiwipress/scripts/bootstrap.sh");

        expect(result.databases[0]).toMatchObject({
            id: "db-1",
            name: "kiwipress-mysql",
            engine: "mysql",
            status: "online",
            host: "private.db.example"
        });
        expect(result.stacks[0]).toMatchObject({
            name: "kiwipress",
            droplet: "kp-01",
            user_data_generated: true
        });
        expect(result.stacks[0]?.steps).toContain("compose-up");

        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain("secret");
        expect(serialized).not.toContain("WORDPRESS_DB_PASSWORD=");
        expect(serialized).not.toMatch(/doadmin:secret/);
    });

    it("reuses an existing generated private key file instead of failing", async () => {
        const { createSSHKey, uploadSSHKey } = await import("../providers/digitalocean/ssh/ssh.js");
        const dir = mkdtempSync(path.join(tmpdir(), "grape-apply-reuse-ssh-"));
        tempDirs.push(dir);
        const keyPath = path.join(dir, "kiwipress");
        const generated = generatedKeyPair("kiwipress");
        persistGeneratedPrivateKey(keyPath, generated.keys.privateKey);
        const before = readFileSync(keyPath, "utf8");
        const publicKey = readExistingPrivateKeyPublic(keyPath);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    ssh_keys: [{ name: "kiwipress", generate: true, private_key_path: keyPath }]
                }
            })
        );

        expect(createSSHKey).not.toHaveBeenCalled();
        expect(uploadSSHKey).toHaveBeenCalledWith({
            name: "kiwipress",
            public_key: publicKey
        });
        expect(readFileSync(keyPath, "utf8")).toBe(before);
        expect(result.private_key_paths).toEqual([]);
        expect(result.ssh_keys[0]?.private_key_path).toBe(keyPath);
        expect(result.warnings).toEqual([`Reusing existing private key at ${keyPath}`]);
    });

    it("adopts a unique account SSH key by name and skips upload", async () => {
        const { uploadSSHKey, listSSHKeys } = await import("../providers/digitalocean/ssh/ssh.js");
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        vi.mocked(listSSHKeys).mockResolvedValueOnce([
            {
                id: 42,
                name: "kiwipress",
                fingerprint: "aa:bb",
                public_key: "ssh-ed25519 AAAA"
            }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    ssh_keys: [{ name: "kiwipress", public_key: "ssh-ed25519 AAAA" }],
                    droplets: [
                        {
                            name: "kiwipress-01",
                            size: "s-1vcpu-1gb",
                            image: "ubuntu-24-04-x64"
                        }
                    ]
                }
            })
        );

        expect(uploadSSHKey).not.toHaveBeenCalled();
        expect(createDroplet).toHaveBeenCalledWith(expect.objectContaining({ ssh_keys: [42] }));
        expect(result.ssh_keys[0]?.id).toBe(42);
        expect(result.warnings).toEqual(['Adopting existing SSH key "kiwipress" (id 42)']);
    });

    it("prefers fingerprint when a reused local key matches an account key", async () => {
        const { uploadSSHKey, listSSHKeys } = await import("../providers/digitalocean/ssh/ssh.js");
        const dir = mkdtempSync(path.join(tmpdir(), "grape-apply-fp-ssh-"));
        tempDirs.push(dir);
        const keyPath = path.join(dir, "kiwipress");
        const generated = generatedKeyPair("kiwipress");
        persistGeneratedPrivateKey(keyPath, generated.keys.privateKey);
        const publicKey = readExistingPrivateKeyPublic(keyPath);
        if (!publicKey) {
            throw new Error("expected derived public key");
        }
        vi.mocked(listSSHKeys).mockResolvedValueOnce([
            {
                id: 11,
                name: "kiwipress",
                fingerprint: "00:11",
                public_key: "ssh-ed25519 OTHER"
            },
            {
                id: 22,
                name: "leftover",
                fingerprint: "ff:ee",
                public_key: publicKey
            }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    ssh_keys: [{ name: "kiwipress", generate: true, private_key_path: keyPath }]
                }
            })
        );

        expect(uploadSSHKey).not.toHaveBeenCalled();
        expect(result.ssh_keys[0]?.id).toBe(22);
        expect(result.warnings).toEqual([
            `Reusing existing private key at ${keyPath}`,
            'Adopting existing SSH key "leftover" (id 22)'
        ]);
    });

    it("skips an ambiguous SSH key name instead of uploading another", async () => {
        const { listSSHKeys, uploadSSHKey } = await import("../providers/digitalocean/ssh/ssh.js");
        vi.mocked(listSSHKeys).mockResolvedValueOnce([
            { id: 11, name: "kiwipress", fingerprint: "aa", public_key: "ssh-ed25519 A" },
            { id: 22, name: "kiwipress", fingerprint: "bb", public_key: "ssh-ed25519 B" }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    ssh_keys: [{ name: "kiwipress", public_key: "ssh-ed25519 AAAA" }]
                }
            })
        );

        expect(uploadSSHKey).not.toHaveBeenCalled();
        expect(result.ssh_keys).toEqual([]);
        expect(result.receipt).toEqual([
            expect.objectContaining({ kind: "ssh_key", name: "kiwipress", action: "skipped", note: "ambiguous" })
        ]);
        expect(result.warnings[0]).toMatch(/ambiguous, 2 live matches \(ids: 11, 22\)/);
    });

    it("adopts a unique VPC in the target region and skips create", async () => {
        const { createVPC, listAllVPCs } = await import("../providers/digitalocean/vpc/vpc.js");
        const { createDroplet } = await import("../providers/digitalocean/droplet/droplet.js");
        vi.mocked(listAllVPCs).mockResolvedValueOnce([
            {
                id: "vpc-live",
                name: "kiwipress",
                description: "",
                region: "nyc3",
                ip_range: "10.80.0.0/16",
                default: false,
                urn: "do:vpc:vpc-live",
                created_at: ""
            }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    vpcs: [{ name: "kiwipress", ip_range: "10.80.0.0/16" }],
                    droplets: [
                        {
                            name: "kiwipress-01",
                            size: "s-1vcpu-1gb",
                            image: "ubuntu-24-04-x64",
                            vpc: "kiwipress"
                        }
                    ]
                }
            })
        );

        expect(createVPC).not.toHaveBeenCalled();
        expect(createDroplet).toHaveBeenCalledWith(expect.objectContaining({ vpc_uuid: "vpc-live" }));
        expect(result.vpcs[0]?.id).toBe("vpc-live");
        expect(result.warnings).toEqual(['Adopting existing VPC "kiwipress" (id vpc-live)']);
    });

    it("skips a VPC that exists only in another region", async () => {
        const { listAllVPCs, createVPC } = await import("../providers/digitalocean/vpc/vpc.js");
        vi.mocked(listAllVPCs).mockResolvedValueOnce([
            {
                id: "vpc-sfo",
                name: "kiwipress",
                description: "",
                region: "sfo3",
                ip_range: "10.80.0.0/16",
                default: false,
                urn: "do:vpc:vpc-sfo",
                created_at: ""
            }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    vpcs: [{ name: "kiwipress", ip_range: "10.80.0.0/16" }]
                }
            })
        );

        expect(createVPC).not.toHaveBeenCalled();
        expect(result.vpcs).toEqual([]);
        expect(result.receipt[0]).toMatchObject({ kind: "vpc", name: "kiwipress", action: "skipped" });
        expect(result.warnings[0]).toMatch(/exists in region "sfo3"/);
    });

    it("skips when multiple VPCs share the blueprint name", async () => {
        const { listAllVPCs, createVPC } = await import("../providers/digitalocean/vpc/vpc.js");
        vi.mocked(listAllVPCs).mockResolvedValueOnce([
            {
                id: "vpc-a",
                name: "kiwipress",
                description: "",
                region: "nyc3",
                ip_range: "10.80.0.0/16",
                default: false,
                urn: "do:vpc:vpc-a",
                created_at: ""
            },
            {
                id: "vpc-b",
                name: "kiwipress",
                description: "",
                region: "nyc3",
                ip_range: "10.81.0.0/16",
                default: false,
                urn: "do:vpc:vpc-b",
                created_at: ""
            }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    vpcs: [{ name: "kiwipress", ip_range: "10.80.0.0/16" }]
                }
            })
        );

        expect(createVPC).not.toHaveBeenCalled();
        expect(result.vpcs).toEqual([]);
        expect(result.receipt[0]).toMatchObject({ kind: "vpc", action: "skipped", note: "ambiguous" });
        expect(result.warnings[0]).toMatch(/ambiguous, 2 live matches \(ids: vpc-a, vpc-b\)/);
    });

    it("adopts a unique droplet and firewall and skips create", async () => {
        const { createDroplet, listAllDroplets } = await import("../providers/digitalocean/droplet/droplet.js");
        const { createFireWall, listAllFirewalls } = await import("../providers/digitalocean/firewall/firewall.js");
        vi.mocked(listAllDroplets).mockResolvedValueOnce([
            {
                id: 321,
                name: "kiwipress-01",
                memory: 1024,
                status: "active",
                image: {},
                size: {}
            }
        ]);
        vi.mocked(listAllFirewalls).mockResolvedValueOnce([
            {
                id: "fw-live",
                name: "kiwipress",
                status: "succeeded",
                inbound_rules: [{ protocol: "tcp", ports: "22", sources: { addresses: ["0.0.0.0/0"] } }],
                outbound_rules: [],
                droplet_ids: [321]
            }
        ]);

        const result = await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    droplets: [
                        {
                            name: "kiwipress-01",
                            size: "s-1vcpu-1gb",
                            image: "ubuntu-24-04-x64"
                        }
                    ],
                    firewalls: [
                        {
                            name: "kiwipress",
                            droplets: ["kiwipress-01"],
                            inbound: [{ protocol: "tcp", ports: "22", sources: ["0.0.0.0/0"] }]
                        }
                    ]
                }
            })
        );

        expect(createDroplet).not.toHaveBeenCalled();
        expect(createFireWall).not.toHaveBeenCalled();
        expect(result.droplets[0]?.id).toBe(321);
        expect(result.firewalls[0]).toEqual({ id: "fw-live", name: "kiwipress" });
        expect(result.warnings).toEqual([
            'Adopting existing droplet "kiwipress-01" (id 321); skipping create',
            'Adopting existing firewall "kiwipress" (id fw-live); skipping create'
        ]);
    });

    it("attaches a newly created firewall to an adopted droplet", async () => {
        const { createDroplet, listAllDroplets } = await import("../providers/digitalocean/droplet/droplet.js");
        const { createFireWall } = await import("../providers/digitalocean/firewall/firewall.js");
        vi.mocked(listAllDroplets).mockResolvedValueOnce([
            {
                id: 321,
                name: "kiwipress-01",
                memory: 1024,
                status: "active",
                image: {},
                size: {}
            }
        ]);

        await applyGrapeConfig(
            validateGrapeConfig({
                provider: "digitalocean",
                region: "nyc3",
                resources: {
                    droplets: [
                        {
                            name: "kiwipress-01",
                            size: "s-1vcpu-1gb",
                            image: "ubuntu-24-04-x64"
                        }
                    ],
                    firewalls: [
                        {
                            name: "kiwipress",
                            droplets: ["kiwipress-01"],
                            inbound: [{ protocol: "tcp", ports: "22", sources: ["0.0.0.0/32"] }]
                        }
                    ]
                }
            })
        );

        expect(createDroplet).not.toHaveBeenCalled();
        expect(createFireWall).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "kiwipress",
                droplet_ids: [321]
            })
        );
    });
});
