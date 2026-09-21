import type { GrapeConfig } from "./schema.js";
import { type LiveInventory } from "./live.js";
export declare const DESTROY_ORDER: readonly ["cdn", "app", "alert_policy", "load_balancer", "certificate", "firewall", "domain", "droplet", "database", "space", "ssh_key", "vpc", "tag"];
export type DestroyKind = (typeof DESTROY_ORDER)[number];
export interface DestroyTarget {
    kind: DestroyKind;
    name: string;
    id?: string | number;
    /** Spaces addressing. DeleteBucket uses `{name}.{region}.digitaloceanspaces.com`. */
    region?: string;
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
export declare const DESTROY_V1_NOTES = "v1 destroy support\n  Matches unique live names from the config and/or droplets with --tag, plus\n  firewalls clearly attached to those droplets (same tag, or droplet ids that\n  are a subset of the tagged set). Default VPCs, ambiguous names, and a VPC whose\n  region does not match the config are skipped. Local generated SSH private key\n  files are not removed. Apply uses the same unique-name, CDN-origin, and VPC\n  region checks and also skips instead of creating.\n\n  Order: CDN endpoints \u2192 apps \u2192 alert policies \u2192 load balancers \u2192\n  certificates \u2192 firewalls \u2192 domains \u2192 droplets \u2192 databases \u2192 Spaces \u2192\n  SSH keys \u2192 VPCs \u2192 tags.\n\n  CDN endpoints are removed before certificates and Spaces because DigitalOcean\n  rejects those deletes while a CDN endpoint still references them. Load\n  balancers are removed before certificates for the same reason. A Space delete\n  fails when the bucket still has objects; destroy does not empty it.\n\n  Droplet deletion is asynchronous at DigitalOcean; a VPC, tag, or Space CDN\n  may still be in use on the first pass. Re-run destroy after deallocation.";
