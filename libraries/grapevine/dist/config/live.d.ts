import { type AppResource } from "../providers/digitalocean/apps/apps.js";
import { type DropletResource } from "../providers/digitalocean/droplet/droplet.js";
import { type FireWallResponse } from "../providers/digitalocean/firewall/firewall.js";
import { type AlertPolicy } from "../providers/digitalocean/monitoring/monitoring.js";
import { type Domain } from "../providers/digitalocean/networking/domains.js";
import { type LoadBalancerResource } from "../providers/digitalocean/networking/load-balancer.js";
import { type SSHKeyResource } from "../providers/digitalocean/ssh/ssh.js";
import { type Tag } from "../providers/digitalocean/tags/tags.js";
import { type VPCResponse } from "../providers/digitalocean/vpc/vpc.js";
import { type DatabaseResource } from "../providers/digitalocean/databases/databases.js";
import { type CdnEndpoint } from "../providers/digitalocean/cdn/cdn.js";
import { type CertificateResource } from "../providers/digitalocean/certificates/certificates.js";
import { type SpaceBucket } from "../providers/digitalocean/spaces/spaces.js";
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
}
export declare function tokenIsSet(envName?: string): boolean;
export declare function fetchLiveInventory(): Promise<LiveInventory>;
export declare function dropletAddresses(droplet: DropletResource): {
    publicIp: string;
    privateIp: string;
};
export declare function dropletRegion(droplet: DropletResource): string;
