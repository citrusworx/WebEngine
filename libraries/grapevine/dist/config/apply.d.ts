import { type DropletResource } from "../providers/digitalocean/droplet/droplet.js";
import { type SSHKeyResource } from "../providers/digitalocean/ssh/ssh.js";
import { type VPCResponse } from "../providers/digitalocean/vpc/vpc.js";
import type { DropletBlueprintConfig, GrapeConfig, GrapeDropletEntry, GrapeResources } from "./schema.js";
import { type GrapeRunOptions } from "./source.js";
export type { GrapeRunOptions } from "./source.js";
export interface AppliedSSHKey extends SSHKeyResource {
    /** Absolute path of a generated private key. Never contains key material. */
    private_key_path?: string;
}
export interface AppliedDatabase {
    id: string;
    name: string;
    engine: string;
    status: string;
    host?: string;
}
export interface AppliedStack {
    name: string;
    droplet: string;
    workdir: string;
    files: string[];
    steps: string[];
    user_data_generated: boolean;
}
export interface ApplyResult {
    tags: string[];
    ssh_keys: AppliedSSHKey[];
    vpcs: VPCResponse[];
    databases: AppliedDatabase[];
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
    stacks: AppliedStack[];
    /** Absolute paths of private keys written during this apply (generate: true). */
    private_key_paths: string[];
    warnings: string[];
}
export declare function unwrapDropletEntry(entry: GrapeDropletEntry): DropletBlueprintConfig;
export declare function normalizeResources(config: GrapeConfig): GrapeResources;
export declare function applyGrapeConfig(config: GrapeConfig, options?: GrapeRunOptions): Promise<ApplyResult>;
