import { getAccountSummary, type AccountSummary } from "../providers/digitalocean/account/account.js";
import { getCustomerBalance, listInvoices, type CustomerBalance, type InvoiceList } from "../providers/digitalocean/billing/billing.js";
import { getDoToken } from "../providers/digitalocean/client.js";
import { listKubernetesClusters, type KubernetesCluster } from "../providers/digitalocean/kubernetes/kubernetes.js";
import { listProjects, type Project } from "../providers/digitalocean/projects/projects.js";
import { getContainerRegistry, listRegistryRepositories, type ContainerRegistry, type RegistryRepository } from "../providers/digitalocean/registry/registry.js";
import { listReservedIps, type ReservedIp } from "../providers/digitalocean/reserved-ips/reserved-ips.js";
import { listAccountSnapshots, type AccountSnapshot } from "../providers/digitalocean/snapshots/snapshots.js";
import { listUptimeChecks, type UptimeCheck } from "../providers/digitalocean/monitoring/uptime.js";
import { listVolumes, type Volume } from "../providers/digitalocean/volumes/volumes.js";
import { listApps, type AppResource } from "../providers/digitalocean/apps/apps.js";
import {
    listAllDroplets,
    type DropletResource
} from "../providers/digitalocean/droplet/droplet.js";
import { listAllFirewalls, type FireWallResponse } from "../providers/digitalocean/firewall/firewall.js";
import { listAlertPolicies, type AlertPolicy } from "../providers/digitalocean/monitoring/monitoring.js";
import { listAllDomains, type Domain } from "../providers/digitalocean/networking/domains.js";
import {
    listAllLoadBalancers,
    type LoadBalancerResource
} from "../providers/digitalocean/networking/load-balancer.js";
import { listSSHKeys, type SSHKeyResource } from "../providers/digitalocean/ssh/ssh.js";
import { listAllTags, type Tag } from "../providers/digitalocean/tags/tags.js";
import { listAllVPCs, type VPCResponse } from "../providers/digitalocean/vpc/vpc.js";
import { listDatabases, type DatabaseResource } from "../providers/digitalocean/databases/databases.js";
import { listCdnEndpoints, type CdnEndpoint } from "../providers/digitalocean/cdn/cdn.js";
import { listCertificates, type CertificateResource } from "../providers/digitalocean/certificates/certificates.js";
import {
    listSpaces,
    spacesCredentialsAreSet,
    type SpaceBucket
} from "../providers/digitalocean/spaces/spaces.js";

export interface BillingInventory {
    balance: CustomerBalance | null;
    invoices: InvoiceList["invoices"];
    invoice_preview?: InvoiceList["invoice_preview"];
    /** Set when the token cannot read billing. Other inventory still returns. */
    error: string | null;
}

export interface LiveInventory {
    droplets: DropletResource[];
    vpcs: VPCResponse[];
    firewalls: FireWallResponse[];
    domains: Domain[];
    load_balancers: LoadBalancerResource[];
    ssh_keys: SSHKeyResource[];
    apps: AppResource[];
    alert_policies: AlertPolicy[];
    tags: Tag[];
    databases: DatabaseResource[];
    spaces: SpaceBucket[];
    cdn: CdnEndpoint[];
    certificates: CertificateResource[];
    /** False when Spaces keys were absent, so buckets were not listed. */
    spaces_listed: boolean;
    account: AccountSummary;
    projects: Project[];
    volumes: Volume[];
    reserved_ips: ReservedIp[];
    kubernetes_clusters: KubernetesCluster[];
    snapshots: AccountSnapshot[];
    uptime_checks: UptimeCheck[];
    registry: ContainerRegistry | null;
    registry_repositories: RegistryRepository[];
    /** Set when registry lookup fails for a reason other than "no registry". */
    registry_error: string | null;
    billing: BillingInventory;
}

export function emptyLiveInventory(partial: Partial<LiveInventory> = {}): LiveInventory {
    return {
        droplets: [],
        vpcs: [],
        firewalls: [],
        domains: [],
        load_balancers: [],
        ssh_keys: [],
        apps: [],
        alert_policies: [],
        tags: [],
        databases: [],
        spaces: [],
        cdn: [],
        certificates: [],
        spaces_listed: true,
        account: {
            droplet_limit: 0,
            email: "",
            uuid: "",
            email_verified: false,
            status: "active",
            status_message: ""
        },
        projects: [],
        volumes: [],
        reserved_ips: [],
        kubernetes_clusters: [],
        snapshots: [],
        uptime_checks: [],
        registry: null,
        registry_repositories: [],
        registry_error: null,
        billing: { balance: null, invoices: [], error: null },
        ...partial
    };
}

export function tokenIsSet(envName = "DO_TOKEN"): boolean {
    try {
        getDoToken(envName);
        return true;
    } catch {
        return false;
    }
}

async function capture<T>(task: Promise<T>): Promise<{ value: T | null; error: string | null }> {
    try {
        return { value: await task, error: null };
    } catch (error) {
        return { value: null, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function fetchLiveInventory(): Promise<LiveInventory> {
    const spacesListed = spacesCredentialsAreSet();
    const [
        droplets,
        vpcs,
        firewalls,
        domains,
        load_balancers,
        ssh_keys,
        apps,
        alert_policies,
        tags,
        databases,
        cdn,
        certificates,
        spaces,
        account,
        projects,
        volumes,
        reserved_ips,
        kubernetes_clusters,
        snapshots,
        uptime_checks,
        balanceResult,
        invoiceResult
    ] = await Promise.all([
        listAllDroplets(),
        listAllVPCs(),
        listAllFirewalls(),
        listAllDomains(),
        listAllLoadBalancers(),
        listSSHKeys(),
        listApps(),
        listAlertPolicies(),
        listAllTags(),
        listDatabases(),
        listCdnEndpoints(),
        listCertificates(),
        spacesListed ? listSpaces() : Promise.resolve([]),
        getAccountSummary(),
        listProjects(),
        listVolumes(),
        listReservedIps(),
        listKubernetesClusters(),
        listAccountSnapshots(),
        listUptimeChecks(),
        capture(getCustomerBalance()),
        capture(listInvoices())
    ]);

    let registry: ContainerRegistry | null = null;
    let registry_repositories: RegistryRepository[] = [];
    let registry_error: string | null = null;
    try {
        registry = await getContainerRegistry();
        if (registry?.name) {
            registry_repositories = await listRegistryRepositories(registry.name);
        }
    } catch (error) {
        registry_error = error instanceof Error ? error.message : String(error);
    }

    const billingError = [balanceResult.error, invoiceResult.error].filter(Boolean).join("; ");

    return {
        droplets,
        vpcs,
        firewalls,
        domains,
        load_balancers,
        ssh_keys,
        apps,
        alert_policies,
        tags,
        databases,
        spaces,
        cdn,
        certificates,
        spaces_listed: spacesListed,
        account,
        projects,
        volumes,
        reserved_ips,
        kubernetes_clusters,
        snapshots,
        uptime_checks,
        registry,
        registry_repositories,
        registry_error,
        billing: {
            balance: balanceResult.value,
            invoices: invoiceResult.value?.invoices ?? [],
            invoice_preview: invoiceResult.value?.invoice_preview,
            error: billingError || null
        }
    };
}

interface NetworkV4 {
    ip_address?: string;
    type?: string;
}

export function dropletAddresses(droplet: DropletResource): { publicIp: string; privateIp: string } {
    const networks = droplet.networks as { v4?: NetworkV4[] } | undefined;
    const v4 = Array.isArray(networks?.v4) ? networks.v4 : [];
    const pub = v4.find((entry) => entry.type === "public");
    const priv = v4.find((entry) => entry.type === "private");
    return {
        publicIp: pub?.ip_address ?? "",
        privateIp: priv?.ip_address ?? ""
    };
}

export function dropletRegion(droplet: DropletResource): string {
    const region = droplet.region;
    if (region && typeof region === "object" && "slug" in region) {
        const slug = (region as { slug?: unknown }).slug;
        if (typeof slug === "string") {
            return slug;
        }
    }
    return "";
}
