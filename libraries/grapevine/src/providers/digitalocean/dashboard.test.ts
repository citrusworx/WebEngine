import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { toAccountSummary, getAccountSummary } from "./account/account.js";
import { getCustomerBalance, listInvoices } from "./billing/billing.js";
import { createKubernetesCluster, listKubernetesOptions, listNodePools } from "./kubernetes/kubernetes.js";
import { getDropletTelemetry } from "./monitoring/metrics.js";
import { createUptimeCheck, listUptimeChecks } from "./monitoring/uptime.js";
import { fetchDigitalOceanOfferings } from "./offerings/offerings.js";
import { createProject, listProjects } from "./projects/projects.js";
import { getContainerRegistry, listRegistryRepositories } from "./registry/registry.js";
import { createReservedIp, listReservedIps } from "./reserved-ips/reserved-ips.js";
import { listAccountSnapshots } from "./snapshots/snapshots.js";
import { createVolume, createVolumeSnapshot, volumeRegionSlug } from "./volumes/volumes.js";

vi.mock("axios", () => {
    const request = vi.fn();
    const isAxiosError = (error: unknown) =>
        Boolean(error && typeof error === "object" && "isAxiosError" in error);
    return {
        default: { request, isAxiosError },
        isAxiosError
    };
});

const mockedAxios = vi.mocked(axios);

describe("digitalocean dashboard clients", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DO_TOKEN = "test-token-not-for-logs";
    });

    it("summarizes the account without copying the token", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: {
                account: {
                    droplet_limit: 25,
                    floating_ip_limit: 5,
                    email: "ops@example.com",
                    uuid: "acct-1",
                    email_verified: true,
                    status: "active",
                    status_message: "",
                    team: { uuid: "team-1", name: "Citrus" }
                }
            }
        });

        const summary = await getAccountSummary();
        expect(summary).toEqual({
            droplet_limit: 25,
            floating_ip_limit: 5,
            reserved_ip_limit: undefined,
            email: "ops@example.com",
            uuid: "acct-1",
            email_verified: true,
            status: "active",
            status_message: "",
            team: { uuid: "team-1", name: "Citrus" }
        });
        expect(JSON.stringify(summary)).not.toContain("test-token-not-for-logs");
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({ method: "GET", url: "/account" })
        );
    });

    it("drops unexpected account fields", () => {
        const summary = toAccountSummary({
            droplet_limit: 1,
            email: "ops@example.com",
            uuid: "acct-1",
            email_verified: true,
            status: "active",
            status_message: "",
            password: "do-not-keep"
        } as never);
        expect(JSON.stringify(summary)).not.toContain("do-not-keep");
    });

    it("lists and creates projects", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: { projects: [{ id: "p1", name: "platform", is_default: false }] }
        });
        await expect(listProjects()).resolves.toEqual([{ id: "p1", name: "platform", is_default: false }]);

        mockedAxios.request.mockResolvedValueOnce({
            data: { project: { id: "p2", name: "web" } }
        });
        await createProject({ name: "web" });
        expect(mockedAxios.request).toHaveBeenLastCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/projects",
                data: { name: "web", purpose: "Other" }
            })
        );
    });

    it("creates an unattached volume and a volume snapshot", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: { volume: { id: "v1", name: "data", region: { slug: "nyc3" }, size_gigabytes: 10 } }
        });
        const volume = await createVolume({ name: "data", region: "nyc3", size_gigabytes: 10 });
        expect(volumeRegionSlug(volume)).toBe("nyc3");
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/volumes",
                data: { name: "data", region: "nyc3", size_gigabytes: 10 }
            })
        );

        mockedAxios.request.mockResolvedValueOnce({
            data: { snapshot: { id: "snap-1", name: "data-snap" } }
        });
        await createVolumeSnapshot("v1", "data-snap");
        expect(mockedAxios.request).toHaveBeenLastCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/volumes/v1/snapshots",
                data: { name: "data-snap" }
            })
        );
    });

    it("reserves an IP by region and rejects mixed create inputs", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: { reserved_ips: [{ ip: "203.0.113.9", region: { slug: "nyc3" } }] }
        });
        await expect(listReservedIps()).resolves.toEqual([{ ip: "203.0.113.9", region: { slug: "nyc3" } }]);

        await expect(createReservedIp({})).rejects.toThrow(/exactly one/);
        await expect(createReservedIp({ region: "nyc3", droplet_id: 1 })).rejects.toThrow(/exactly one/);

        mockedAxios.request.mockResolvedValueOnce({
            data: { reserved_ip: { ip: "203.0.113.10", region: { slug: "nyc3" } } }
        });
        await createReservedIp({ region: "nyc3" });
        expect(mockedAxios.request).toHaveBeenLastCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/reserved_ips",
                data: { region: "nyc3" }
            })
        );
    });

    it("creates a kubernetes cluster and lists node pools and options", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: {
                kubernetes_cluster: {
                    id: "cluster-1",
                    name: "app",
                    region: "nyc3",
                    version: "1.31.1-do.0",
                    status: { state: "provisioning" }
                }
            }
        });
        await createKubernetesCluster({
            name: "app",
            region: "nyc3",
            version: "1.31.1-do.0",
            node_pools: [{ name: "workers", size: "s-2vcpu-4gb", count: 2 }]
        });
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/kubernetes/clusters",
                data: {
                    name: "app",
                    region: "nyc3",
                    version: "1.31.1-do.0",
                    node_pools: [{ name: "workers", size: "s-2vcpu-4gb", count: 2 }]
                }
            })
        );

        mockedAxios.request.mockResolvedValueOnce({
            data: { node_pools: [{ id: "pool-1", name: "workers", size: "s-2vcpu-4gb", count: 2 }] }
        });
        await expect(listNodePools("cluster-1")).resolves.toHaveLength(1);

        mockedAxios.request.mockResolvedValueOnce({
            data: { options: { versions: [{ slug: "1.31.1-do.0" }], regions: [], sizes: [] } }
        });
        await expect(listKubernetesOptions()).resolves.toMatchObject({
            versions: [{ slug: "1.31.1-do.0" }]
        });
    });

    it("treats a missing container registry as empty", async () => {
        mockedAxios.request.mockRejectedValueOnce({
            isAxiosError: true,
            message: "not found",
            response: { status: 404, data: { message: "registry not found", id: "not_found" } }
        });
        await expect(getContainerRegistry()).resolves.toBeNull();

        mockedAxios.request.mockResolvedValueOnce({
            data: { registry: { name: "citrus", region: "nyc3" } }
        });
        await expect(getContainerRegistry()).resolves.toMatchObject({ name: "citrus" });

        mockedAxios.request.mockResolvedValueOnce({
            data: { repositories: [{ name: "web" }] }
        });
        await expect(listRegistryRepositories("citrus")).resolves.toEqual([{ name: "web" }]);
        expect(mockedAxios.request).toHaveBeenLastCalledWith(
            expect.objectContaining({ url: "/registry/citrus/repositories" })
        );
    });

    it("reads offerings from regions, sizes, images, and option endpoints", async () => {
        mockedAxios.request.mockImplementation(async (config: { url?: string }) => {
            switch (config.url) {
                case "/regions":
                    return { data: { regions: [{ slug: "nyc3", name: "New York 3", available: true }] } };
                case "/sizes":
                    return { data: { sizes: [{ slug: "s-1vcpu-1gb", memory: 1024, price_monthly: 6 }] } };
                case "/images":
                    return { data: { images: [{ id: 1, name: "Ubuntu", slug: "ubuntu-24-04-x64", distribution: "Ubuntu" }] } };
                case "/databases/options":
                    return { data: { options: { pg: { versions: ["16"] } } } };
                case "/kubernetes/options":
                    return { data: { options: { versions: [{ slug: "1.31.1-do.0" }], regions: [], sizes: [] } } };
                default:
                    throw new Error(`unexpected ${config.url}`);
            }
        });

        const offerings = await fetchDigitalOceanOfferings();
        expect(offerings.regions[0]?.slug).toBe("nyc3");
        expect(offerings.sizes[0]?.slug).toBe("s-1vcpu-1gb");
        expect(offerings.images[0]?.slug).toBe("ubuntu-24-04-x64");
        expect(offerings.database_options.pg?.versions).toEqual(["16"]);
        expect(offerings.kubernetes_options.versions[0]?.slug).toBe("1.31.1-do.0");
        const imageCall = mockedAxios.request.mock.calls.find((call) => call[0]?.url === "/images");
        expect(imageCall?.[0]).toEqual(
            expect.objectContaining({
                params: expect.objectContaining({ type: "distribution", private: false })
            })
        );
    });

    it("reads droplet bandwidth, cpu, and memory metrics", async () => {
        mockedAxios.request.mockImplementation(async (config: { url?: string; params?: { direction?: string } }) => {
            if (config.url === "/monitoring/metrics/droplet/bandwidth") {
                return {
                    data: {
                        data: {
                            result: [{ metric: { direction: config.params?.direction ?? "" }, values: [[10, "5"]] }]
                        }
                    }
                };
            }
            if (config.url === "/monitoring/metrics/droplet/cpu") {
                return { data: { data: { result: [] } } };
            }
            return { data: { data: { result: [{ metric: {}, values: [[10, "1024"]] }] } } };
        });

        const telemetry = await getDropletTelemetry(99, { start: 100, end: 200 });
        expect(telemetry.host_id).toBe("99");
        expect(telemetry.bandwidth_public_inbound.agent_required).toBe(false);
        expect(telemetry.bandwidth_public_inbound.result[0]?.metric.direction).toBe("inbound");
        expect(telemetry.bandwidth_public_outbound.result[0]?.metric.direction).toBe("outbound");
        expect(telemetry.cpu.agent_required).toBe(true);
        expect(telemetry.cpu.result).toEqual([]);
        expect(telemetry.memory_available.agent_required).toBe(true);
        expect(JSON.stringify(telemetry)).not.toContain("test-token-not-for-logs");
    });

    it("lists and creates uptime checks", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: { checks: [{ id: "c1", name: "home", type: "https", target: "https://example.com", regions: ["us_east"], enabled: true }] }
        });
        await expect(listUptimeChecks()).resolves.toHaveLength(1);

        mockedAxios.request.mockResolvedValueOnce({
            data: { check: { id: "c2", name: "home", type: "https", target: "https://example.com", regions: ["us_east"], enabled: true } }
        });
        await createUptimeCheck({
            name: "home",
            type: "https",
            target: "https://example.com",
            regions: ["us_east"]
        });
        expect(mockedAxios.request).toHaveBeenLastCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/uptime/checks",
                data: {
                    name: "home",
                    type: "https",
                    target: "https://example.com",
                    regions: ["us_east"],
                    enabled: true
                }
            })
        );
    });

    it("reads balance and invoices", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: {
                month_to_date_balance: "1.00",
                account_balance: "0.00",
                month_to_date_usage: "1.00",
                generated_at: "2026-01-01T00:00:00Z"
            }
        });
        await expect(getCustomerBalance()).resolves.toMatchObject({ month_to_date_usage: "1.00" });

        mockedAxios.request.mockResolvedValueOnce({
            data: {
                invoices: [{ invoice_uuid: "inv-1", amount: "12.00", invoice_period: "2026-01" }],
                invoice_preview: { amount: "1.00", invoice_period: "2026-02" }
            }
        });
        await expect(listInvoices()).resolves.toMatchObject({
            invoices: [{ invoice_uuid: "inv-1" }],
            invoice_preview: { amount: "1.00" }
        });
    });

    it("lists account snapshots", async () => {
        mockedAxios.request.mockResolvedValueOnce({
            data: { snapshots: [{ id: "snap-1", name: "web-1", resource_type: "droplet" }] }
        });
        await expect(listAccountSnapshots()).resolves.toEqual([
            { id: "snap-1", name: "web-1", resource_type: "droplet" }
        ]);
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({ url: "/snapshots", params: expect.objectContaining({ per_page: 200 }) })
        );
    });
});
