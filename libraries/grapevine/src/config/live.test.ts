import { beforeEach, describe, expect, it, vi } from "vitest";
import { DigitalOceanError } from "../providers/digitalocean/client.js";
import { fetchLiveInventory } from "./live.js";

vi.mock("../providers/digitalocean/droplet/droplet.js", () => ({
    listAllDroplets: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/vpc/vpc.js", () => ({
    listAllVPCs: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/firewall/firewall.js", () => ({
    listAllFirewalls: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/networking/domains.js", () => ({
    listAllDomains: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/networking/load-balancer.js", () => ({
    listAllLoadBalancers: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/ssh/ssh.js", () => ({
    listSSHKeys: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/apps/apps.js", () => ({
    listApps: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/monitoring/monitoring.js", () => ({
    listAlertPolicies: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/tags/tags.js", () => ({
    listAllTags: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/databases/databases.js", () => ({
    listDatabases: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/cdn/cdn.js", () => ({
    listCdnEndpoints: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/certificates/certificates.js", () => ({
    listCertificates: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/spaces/spaces.js", () => ({
    listSpaces: vi.fn(async () => []),
    spacesCredentialsAreSet: vi.fn(() => false)
}));
vi.mock("../providers/digitalocean/account/account.js", () => ({
    getAccountSummary: vi.fn(async () => ({
        droplet_limit: 25,
        email: "ops@example.com",
        uuid: "acct-1",
        email_verified: true,
        status: "active",
        status_message: ""
    }))
}));
vi.mock("../providers/digitalocean/projects/projects.js", () => ({
    listProjects: vi.fn(async () => [{ id: "proj-1", name: "platform", is_default: true }])
}));
vi.mock("../providers/digitalocean/volumes/volumes.js", () => ({
    listVolumes: vi.fn(async () => [{ id: "vol-1", name: "data", region: { slug: "nyc3" }, size_gigabytes: 10 }])
}));
vi.mock("../providers/digitalocean/reserved-ips/reserved-ips.js", () => ({
    listReservedIps: vi.fn(async () => [{ ip: "203.0.113.10", region: { slug: "nyc3" } }])
}));
vi.mock("../providers/digitalocean/kubernetes/kubernetes.js", () => ({
    listKubernetesClusters: vi.fn(async () => [
        { id: "k8s-1", name: "app", region: "nyc3", version: "1.31.1-do.0", status: { state: "running" } }
    ])
}));
vi.mock("../providers/digitalocean/snapshots/snapshots.js", () => ({
    listAccountSnapshots: vi.fn(async () => [{ id: "snap-1", name: "web" }])
}));
vi.mock("../providers/digitalocean/monitoring/uptime.js", () => ({
    listUptimeChecks: vi.fn(async () => [])
}));
vi.mock("../providers/digitalocean/registry/registry.js", () => ({
    getContainerRegistry: vi.fn(async () => ({ name: "citrus", region: "nyc3" })),
    listRegistryRepositories: vi.fn(async () => [{ name: "web" }])
}));
vi.mock("../providers/digitalocean/billing/billing.js", () => ({
    getCustomerBalance: vi.fn(async () => {
        throw new DigitalOceanError("forbidden", { status: 403 });
    }),
    listInvoices: vi.fn(async () => ({ invoices: [], invoice_preview: undefined }))
}));

describe("fetchLiveInventory", () => {
    beforeEach(() => {
        process.env.DO_TOKEN = "super-secret-token";
    });

    it("includes dashboard resources and keeps billing failures local", async () => {
        const inventory = await fetchLiveInventory();
        expect(inventory.account).toMatchObject({ email: "ops@example.com", droplet_limit: 25 });
        expect(inventory.projects).toHaveLength(1);
        expect(inventory.volumes).toHaveLength(1);
        expect(inventory.reserved_ips[0]?.ip).toBe("203.0.113.10");
        expect(inventory.kubernetes_clusters[0]?.name).toBe("app");
        expect(inventory.snapshots).toHaveLength(1);
        expect(inventory.registry).toMatchObject({ name: "citrus" });
        expect(inventory.registry_repositories).toEqual([{ name: "web" }]);
        expect(inventory.spaces_listed).toBe(false);
        expect(inventory.billing.balance).toBeNull();
        expect(inventory.billing.error).toMatch(/forbidden/);
        expect(inventory.billing.invoices).toEqual([]);
        expect(JSON.stringify(inventory)).not.toContain("super-secret-token");
    });
});
