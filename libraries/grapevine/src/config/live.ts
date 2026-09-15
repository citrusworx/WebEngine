import { getDoToken } from "../providers/digitalocean/client.js";
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
}

export function tokenIsSet(envName = "DO_TOKEN"): boolean {
    try {
        getDoToken(envName);
        return true;
    } catch {
        return false;
    }
}

export async function fetchLiveInventory(): Promise<LiveInventory> {
    const [
        droplets,
        vpcs,
        firewalls,
        domains,
        load_balancers,
        ssh_keys,
        apps,
        alert_policies,
        tags
    ] = await Promise.all([
        listAllDroplets(),
        listAllVPCs(),
        listAllFirewalls(),
        listAllDomains(),
        listAllLoadBalancers(),
        listSSHKeys(),
        listApps(),
        listAlertPolicies(),
        listAllTags()
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
        tags
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
