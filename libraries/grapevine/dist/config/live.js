import { getDoToken } from "../providers/digitalocean/client.js";
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
export function tokenIsSet(envName = "DO_TOKEN") {
    try {
        getDoToken(envName);
        return true;
    }
    catch {
        return false;
    }
}
export async function fetchLiveInventory() {
    const spacesListed = spacesCredentialsAreSet();
    const [droplets, vpcs, firewalls, domains, load_balancers, ssh_keys, apps, alert_policies, tags, databases, cdn, certificates, spaces] = await Promise.all([
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
        spacesListed ? listSpaces() : Promise.resolve([])
    ]);
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
        spaces_listed: spacesListed
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