import type { GrapeConfig, GrapeResources } from "./schema.js";
import { normalizeResources, unwrapDropletEntry } from "./apply.js";
import { resolvePrivateKeyPath } from "./ssh-private-key.js";

export const RESOURCE_KINDS = [
    "tags",
    "ssh_keys",
    "vpcs",
    "droplets",
    "firewalls",
    "domains",
    "load_balancers",
    "alert_policies",
    "apps"
] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export type PlannedKind =
    | "tag"
    | "ssh_key"
    | "vpc"
    | "droplet"
    | "firewall"
    | "domain"
    | "load_balancer"
    | "alert_policy"
    | "app";

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

export function emptyCounts(): ResourceCounts {
    return {
        tags: 0,
        ssh_keys: 0,
        vpcs: 0,
        droplets: 0,
        firewalls: 0,
        domains: 0,
        load_balancers: 0,
        alert_policies: 0,
        apps: 0
    };
}

export function countResources(resources: GrapeResources): ResourceCounts {
    return {
        tags: resources.tags?.length ?? 0,
        ssh_keys: resources.ssh_keys?.length ?? 0,
        vpcs: resources.vpcs?.length ?? 0,
        droplets: resources.droplets?.length ?? 0,
        firewalls: resources.firewalls?.length ?? 0,
        domains: resources.domains?.length ?? 0,
        load_balancers: resources.load_balancers?.length ?? 0,
        alert_policies: resources.alert_policies?.length ?? 0,
        apps: resources.apps?.length ?? 0
    };
}

export function countNormalized(config: GrapeConfig): ResourceCounts {
    return countResources(normalizeResources(config));
}

function detail(entries: Array<[string, string | undefined | number | boolean | string[] | null]>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of entries) {
        if (value === undefined || value === null || value === "") {
            continue;
        }
        result[key] = Array.isArray(value) ? value.join(",") : String(value);
    }
    return result;
}

export function planGrapeConfig(config: GrapeConfig): GrapePlan {
    const resources = normalizeResources(config);
    const planned: PlannedResource[] = [];
    const warnings: string[] = [];

    if (config.services && Object.keys(config.services).length > 0) {
        warnings.push(
            "services is accepted for validation but is not applied. Declare droplets or apps under resources instead."
        );
    }

    for (const tag of resources.tags ?? []) {
        const name = typeof tag === "string" ? tag : tag.name;
        planned.push({ kind: "tag", name, detail: {} });
    }

    for (const key of resources.ssh_keys ?? []) {
        const generate = Boolean(key.generate);
        planned.push({
            kind: "ssh_key",
            name: key.name,
            detail: detail([
                ["generate", generate ? "true" : undefined],
                [
                    "private_key",
                    generate ? resolvePrivateKeyPath(key.name, key.private_key_path) : undefined
                ],
                ["public_key", key.public_key || key.publicKey ? "provided" : undefined]
            ])
        });
    }

    for (const vpc of resources.vpcs ?? []) {
        planned.push({
            kind: "vpc",
            name: vpc.name,
            detail: detail([
                ["region", vpc.region ?? config.region],
                ["ip_range", vpc.ip_range]
            ])
        });
    }

    for (const entry of resources.droplets ?? []) {
        const droplet = unwrapDropletEntry(entry);
        planned.push({
            kind: "droplet",
            name: droplet.name,
            detail: detail([
                ["region", droplet.region ?? config.region],
                ["size", droplet.size],
                ["image", droplet.image],
                ["vpc", droplet.vpc],
                ["tags", droplet.tags]
            ])
        });
    }

    for (const firewall of resources.firewalls ?? []) {
        planned.push({
            kind: "firewall",
            name: firewall.name,
            detail: detail([
                ["droplets", firewall.droplets],
                ["droplet_ids", firewall.droplet_ids?.map(String)],
                ["tags", firewall.tags]
            ])
        });
    }

    for (const domain of resources.domains ?? []) {
        planned.push({
            kind: "domain",
            name: domain.name,
            detail: detail([["records", domain.records?.length ?? 0]])
        });
    }

    for (const lb of resources.load_balancers ?? []) {
        planned.push({
            kind: "load_balancer",
            name: lb.name,
            detail: detail([
                ["region", lb.region ?? config.region],
                ["tag", lb.tag]
            ])
        });
    }

    for (const policy of resources.alert_policies ?? []) {
        planned.push({
            kind: "alert_policy",
            name: policy.description,
            detail: detail([["type", policy.type]])
        });
    }

    for (const app of resources.apps ?? []) {
        planned.push({
            kind: "app",
            name: app.spec.name,
            detail: detail([["region", app.spec.region ?? config.region]])
        });
    }

    return {
        dry_run: true,
        provider: config.provider,
        region: config.region,
        counts: countResources(resources),
        resources: planned,
        warnings
    };
}
