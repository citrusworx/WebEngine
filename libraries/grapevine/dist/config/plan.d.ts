import type { GrapeConfig, GrapeResources } from "./schema.js";
export declare const RESOURCE_KINDS: readonly ["tags", "ssh_keys", "vpcs", "droplets", "firewalls", "domains", "load_balancers", "alert_policies", "apps"];
export type ResourceKind = (typeof RESOURCE_KINDS)[number];
export type PlannedKind = "tag" | "ssh_key" | "vpc" | "droplet" | "firewall" | "domain" | "load_balancer" | "alert_policy" | "app";
export interface PlannedResource {
    kind: PlannedKind;
    name: string;
    detail: Record<string, string>;
}
export type ResourceCounts = Record<ResourceKind, number>;
export interface GrapePlan {
    dry_run: true;
    provider: "digitalocean";
    region?: string;
    counts: ResourceCounts;
    resources: PlannedResource[];
    warnings: string[];
}
export declare function emptyCounts(): ResourceCounts;
export declare function countResources(resources: GrapeResources): ResourceCounts;
export declare function countNormalized(config: GrapeConfig): ResourceCounts;
export declare function planGrapeConfig(config: GrapeConfig): GrapePlan;
