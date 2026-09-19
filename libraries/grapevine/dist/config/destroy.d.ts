import type { GrapeConfig } from "./schema.js";
import { type LiveInventory } from "./live.js";
export declare const DESTROY_ORDER: readonly ["app", "alert_policy", "load_balancer", "firewall", "domain", "droplet", "database", "ssh_key", "vpc", "tag"];
export type DestroyKind = (typeof DESTROY_ORDER)[number];
export interface DestroyTarget {
    kind: DestroyKind;
    name: string;
    id?: string | number;
    reason?: string;
}
export interface DestroyPlan {
    targets: DestroyTarget[];
    skipped: DestroyTarget[];
    warnings: string[];
}
export interface DestroyResult {
    dry_run: boolean;
    deleted: DestroyTarget[];
    skipped: DestroyTarget[];
    failed: Array<DestroyTarget & {
        error: string;
    }>;
    warnings: string[];
}
export interface DestroyOptions {
    config?: GrapeConfig;
    tag?: string;
    dryRun?: boolean;
    inventory?: LiveInventory;
}
export declare function planDestroy(inventory: LiveInventory, options: {
    config?: GrapeConfig;
    tag?: string;
}): DestroyPlan;
export declare function destroyGrapeResources(options: DestroyOptions): Promise<DestroyResult>;
export declare const DESTROY_V1_NOTES = "v1 destroy support\n  Matches unique live names from the config and/or droplets with --tag, plus\n  firewalls clearly attached to those droplets (same tag, or droplet ids that\n  are a subset of the tagged set). Default VPCs and ambiguous names are skipped.\n  Local generated SSH private key files are not removed.\n\n  Order: apps \u2192 alert policies \u2192 load balancers \u2192 firewalls \u2192 domains \u2192\n  droplets \u2192 databases \u2192 SSH keys \u2192 VPCs \u2192 tags.\n\n  Droplet deletion is asynchronous at DigitalOcean; a VPC or tag may still be\n  in use on the first pass. Re-run destroy after droplets finish deallocating.";
