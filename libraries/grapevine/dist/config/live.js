import { getAccountSummary } from "../providers/digitalocean/account/account.js";
import { getCustomerBalance, listInvoices } from "../providers/digitalocean/billing/billing.js";
import { getDoToken } from "../providers/digitalocean/client.js";
import { listKubernetesClusters } from "../providers/digitalocean/kubernetes/kubernetes.js";
import { listProjects } from "../providers/digitalocean/projects/projects.js";
import { getContainerRegistry, listRegistryRepositories } from "../providers/digitalocean/registry/registry.js";
import { listReservedIps } from "../providers/digitalocean/reserved-ips/reserved-ips.js";
import { listAccountSnapshots } from "../providers/digitalocean/snapshots/snapshots.js";
import { listUptimeChecks } from "../providers/digitalocean/monitoring/uptime.js";
import { listVolumes } from "../providers/digitalocean/volumes/volumes.js";
import { listApps } from "../providers/digitalocean/apps/apps.js";
import { listAllDroplets } from "../providers/digitalocean/droplet/droplet.js";
import { listAllFirewalls } from "../providers/digitalocean/firewall/firewall.js";
import { listAlertPolicies } from "../providers/digitalocean/monitoring/monitoring.js";
import { listAllDomains } from "../providers/digitalocean/networking/domains.js";
import { listAllLoadBalancers } from "../providers/digitalocean/networking/load-balancer.js";
import { listSSHKeys } from "../providers/digitalocean/ssh/ssh.js";
import { listAllTags } from "../providers/digitalocean/tags/tags.js";
import { listAllVPCs } from "../providers/digitalocean/vpc/vpc.js";
import { listDatabases } from "../providers/digitalocean/databases/databases.js";
import { listCdnEndpoints } from "../providers/digitalocean/cdn/cdn.js";
import { listCertificates } from "../providers/digitalocean/certificates/certificates.js";
import { listSpaces, spacesCredentialsAreSet } from "../providers/digitalocean/spaces/spaces.js";
export function emptyLiveInventory(partial = {}) {
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
export function tokenIsSet(envName = "DO_TOKEN") {
    try {
        getDoToken(envName);
        return true;
    }
    catch {
        return false;
    }
}
async function capture(task) {
    try {
        return { value: await task, error: null };
    }
    catch (error) {
        return { value: null, error: error instanceof Error ? error.message : String(error) };
    }
}
export async function fetchLiveInventory() {
    const spacesListed = spacesCredentialsAreSet();
    const [droplets, vpcs, firewalls, domains, load_balancers, ssh_keys, apps, alert_policies, tags, databases, cdn, certificates, spaces, account, projects, volumes, reserved_ips, kubernetes_clusters, snapshots, uptime_checks, balanceResult, invoiceResult] = await Promise.all([
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
    let registry = null;
    let registry_repositories = [];
    let registry_error = null;
    try {
        registry = await getContainerRegistry();
        if (registry?.name) {
            registry_repositories = await listRegistryRepositories(registry.name);
        }
    }
    catch (error) {
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
export function dropletAddresses(droplet) {
    const networks = droplet.networks;
    const v4 = Array.isArray(networks?.v4) ? networks.v4 : [];
    const pub = v4.find((entry) => entry.type === "public");
    const priv = v4.find((entry) => entry.type === "private");
    return {
        publicIp: pub?.ip_address ?? "",
        privateIp: priv?.ip_address ?? ""
    };
}
export function dropletRegion(droplet) {
    const region = droplet.region;
    if (region && typeof region === "object" && "slug" in region) {
        const slug = region.slug;
        if (typeof slug === "string") {
            return slug;
        }
    }
    return "";
}
//# sourceMappingURL=live.js.map