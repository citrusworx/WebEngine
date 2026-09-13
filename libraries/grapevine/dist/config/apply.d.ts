import { type DropletResource } from "../providers/digitalocean/droplet/droplet.js";
import { type SSHKeyResource } from "../providers/digitalocean/ssh/ssh.js";
import { type VPCResponse } from "../providers/digitalocean/vpc/vpc.js";
import type { DropletBlueprintConfig, GrapeConfig, GrapeDropletEntry, GrapeResources } from "./schema.js";
export interface ApplyResult {
    tags: string[];
    ssh_keys: SSHKeyResource[];
    vpcs: VPCResponse[];
    droplets: DropletResource[];
    firewalls: Array<{
        id: string;
        name: string;
    }>;
    domains: Array<{
        name: string;
        records: number;
    }>;
    load_balancers: Array<{
        id: string;
        name?: string;
    }>;
    alert_policies: Array<{
        uuid: string;
        description: string;
    }>;
    apps: Array<{
        id: string;
        name: string;
    }>;
    warnings: string[];
}
export declare function unwrapDropletEntry(entry: GrapeDropletEntry): DropletBlueprintConfig;
export declare function normalizeResources(config: GrapeConfig): GrapeResources;
export declare function applyGrapeConfig(config: GrapeConfig): Promise<ApplyResult>;
