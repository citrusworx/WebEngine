import type { GrapeConfig, GrapeResources } from "./schema.js";
import { type LiveInventory } from "./live.js";
import { type GrapeRunOptions } from "./source.js";
export declare const LOCAL_PLAN_NOTE = "Plan is local-only: no DigitalOcean token is set, so create vs adopt was not checked against the account.";
export declare const RESOURCE_KINDS: readonly ["tags", "ssh_keys", "vpcs", "databases", "droplets", "firewalls", "domains", "load_balancers", "alert_policies", "apps", "spaces", "certificates", "cdn", "stacks"];
export type ResourceKind = (typeof RESOURCE_KINDS)[number];
export type PlannedKind = "tag" | "ssh_key" | "vpc" | "database" | "droplet" | "firewall" | "domain" | "load_balancer" | "alert_policy" | "app" | "space" | "certificate" | "cdn" | "stack" | "stack_step";
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
    /** `local` when names were not checked against the account. `live` after a read-only lookup. */
    lookup: "local" | "live";
    counts: ResourceCounts;
    resources: PlannedResource[];
    warnings: string[];
}
export declare function emptyCounts(): ResourceCounts;
export declare function countResources(resources: GrapeResources, stackCount?: number): ResourceCounts;
export declare function countNormalized(config: GrapeConfig): ResourceCounts;
export declare function planGrapeConfig(config: GrapeConfig, options?: GrapeRunOptions): GrapePlan;
/** Read-only annotation. Does not create or update anything. */
export declare function annotatePlan(plan: GrapePlan, inventory: LiveInventory): GrapePlan;
/**
 * `grape plan` / `grape apply --dry-run`.
 * Lists the account when a token is set. Does not POST, PUT, or DELETE.
 */
export declare function resolveGrapePlan(config: GrapeConfig, options?: GrapeRunOptions): Promise<GrapePlan>;
