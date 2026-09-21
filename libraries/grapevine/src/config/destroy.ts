import { normalizeResources, unwrapDropletEntry } from "./apply.js";
import type { GrapeConfig } from "./schema.js";
import { deleteApp } from "../providers/digitalocean/apps/apps.js";
import { deleteDroplet } from "../providers/digitalocean/droplet/droplet.js";
import { deleteFirewall } from "../providers/digitalocean/firewall/firewall.js";
import { deleteAlertPolicy } from "../providers/digitalocean/monitoring/monitoring.js";
import { deleteDomain } from "../providers/digitalocean/networking/domains.js";
import { deleteLoadBalancer } from "../providers/digitalocean/networking/load-balancer.js";
import { deleteSSHKey } from "../providers/digitalocean/ssh/ssh.js";
import { deleteTag } from "../providers/digitalocean/tags/tags.js";
import { deleteVPC } from "../providers/digitalocean/vpc/vpc.js";
import { deleteDatabase } from "../providers/digitalocean/databases/databases.js";
import { deleteCdnEndpoint, resolveCdnOrigin } from "../providers/digitalocean/cdn/cdn.js";
import { deleteCertificate } from "../providers/digitalocean/certificates/certificates.js";
import { deleteSpace } from "../providers/digitalocean/spaces/spaces.js";
import { lookupCdnByOrigin, lookupVPC, lookupWhere } from "./adopt.js";
import { fetchLiveInventory, type LiveInventory } from "./live.js";

export const DESTROY_ORDER = [
    "cdn",
    "app",
    "alert_policy",
    "load_balancer",
    "certificate",
    "firewall",
    "domain",
    "droplet",
    "database",
    "space",
    "ssh_key",
    "vpc",
    "tag"
] as const;

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
    failed: Array<DestroyTarget & { error: string }>;
    warnings: string[];
}

export interface DestroyOptions {
    config?: GrapeConfig;
    tag?: string;
    dryRun?: boolean;
    inventory?: LiveInventory;
}

function orderIndex(kind: DestroyKind): number {
    return DESTROY_ORDER.indexOf(kind);
}

function sortTargets(targets: DestroyTarget[]): DestroyTarget[] {
    return [...targets].sort((a, b) => orderIndex(a.kind) - orderIndex(b.kind));
}

function uniqueMatch<T>(
    items: T[],
    name: string,
    getName: (item: T) => string | undefined,
    kind: DestroyKind,
    skipped: DestroyTarget[],
    idOf: (item: T) => string | number | undefined = (item) =>
        (item as { id?: string | number; uuid?: string }).id ?? (item as { uuid?: string }).uuid
): T | undefined {
    const found = lookupWhere(items, (item) => getName(item) === name, idOf);
    if (found.status === "missing") {
        skipped.push({ kind, name, reason: "not found" });
        return undefined;
    }
    if (found.status !== "unique" || !found.resource) {
        skipped.push({
            kind,
            name,
            reason: `ambiguous: ${found.count} live resources named "${name}"`
        });
        return undefined;
    }
    return found.resource;
}

function addUniqueTarget(
    targets: DestroyTarget[],
    skipped: DestroyTarget[],
    target: DestroyTarget
): void {
    const exists = targets.some((item) => item.kind === target.kind && item.id !== undefined && item.id === target.id);
    if (exists) {
        return;
    }
    const named = targets.some(
        (item) => item.kind === target.kind && item.id === undefined && item.name === target.name
    );
    if (named && target.id === undefined) {
        skipped.push({ ...target, reason: "duplicate candidate" });
        return;
    }
    targets.push(target);
}

function tagNamesFromConfig(config: GrapeConfig): string[] {
    return (normalizeResources(config).tags ?? []).map((tag) => (typeof tag === "string" ? tag : tag.name));
}

function firewallAttachment(
    firewall: LiveInventory["firewalls"][number],
    taggedDropletIds: Set<number>,
    tag: string
): "yes" | "no" | "ambiguous" {
    const tagged = firewall.tags?.includes(tag) ?? false;
    const ids = firewall.droplet_ids ?? [];
    const extra = ids.filter((id) => !taggedDropletIds.has(id));
    const overlap = ids.filter((id) => taggedDropletIds.has(id));

    if (tagged && extra.length === 0) {
        return "yes";
    }
    if (tagged && extra.length > 0) {
        return "ambiguous";
    }
    if (!tagged && ids.length > 0 && extra.length === 0 && overlap.length > 0) {
        return "yes";
    }
    if (!tagged && extra.length > 0 && overlap.length > 0) {
        return "ambiguous";
    }
    return "no";
}

export function planDestroy(inventory: LiveInventory, options: { config?: GrapeConfig; tag?: string }): DestroyPlan {
    const targets: DestroyTarget[] = [];
    const skipped: DestroyTarget[] = [];
    const warnings: string[] = [];
    const { config, tag } = options;

    if (!config && !tag) {
        warnings.push("No config or --tag provided");
        return { targets, skipped, warnings };
    }

    if (config) {
        const resources = normalizeResources(config);

        const spaceRegions = new Map<string, string>();
        for (const space of resources.spaces ?? []) {
            const region = space.region ?? config.region;
            if (region) {
                spaceRegions.set(space.name, region);
            }
        }

        for (const endpoint of resources.cdn ?? []) {
            const label = endpoint.custom_domain ?? endpoint.space ?? endpoint.origin ?? "cdn";
            let origin: string;
            try {
                origin = resolveCdnOrigin({
                    origin: endpoint.origin,
                    space: endpoint.space,
                    region: endpoint.region,
                    spaceRegion: endpoint.space ? spaceRegions.get(endpoint.space) : undefined,
                    fallbackRegion: config.region
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                skipped.push({ kind: "cdn", name: label, reason: message });
                continue;
            }
            const found = lookupCdnByOrigin(inventory.cdn, origin);
            if (found.status === "missing") {
                skipped.push({ kind: "cdn", name: origin, reason: "not found" });
                continue;
            }
            if (found.status !== "unique" || !found.resource) {
                skipped.push({
                    kind: "cdn",
                    name: origin,
                    reason: `ambiguous: ${found.count} live resources named "${origin}"`
                });
                continue;
            }
            addUniqueTarget(targets, skipped, {
                kind: "cdn",
                name: found.resource.custom_domain || found.resource.origin,
                id: found.resource.id
            });
        }

        for (const app of resources.apps ?? []) {
            const match = uniqueMatch(inventory.apps, app.spec.name, (item) => item.spec?.name, "app", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "app", name: match.spec.name, id: match.id });
            }
        }

        for (const policy of resources.alert_policies ?? []) {
            const match = uniqueMatch(
                inventory.alert_policies,
                policy.description,
                (item) => item.description,
                "alert_policy",
                skipped
            );
            if (match) {
                addUniqueTarget(targets, skipped, {
                    kind: "alert_policy",
                    name: match.description,
                    id: match.uuid
                });
            }
        }

        for (const lb of resources.load_balancers ?? []) {
            const match = uniqueMatch(
                inventory.load_balancers,
                lb.name,
                (item) => item.name,
                "load_balancer",
                skipped
            );
            if (match?.id) {
                addUniqueTarget(targets, skipped, {
                    kind: "load_balancer",
                    name: match.name ?? lb.name,
                    id: match.id
                });
            }
        }

        for (const certificate of resources.certificates ?? []) {
            const match = uniqueMatch(
                inventory.certificates,
                certificate.name,
                (item) => item.name,
                "certificate",
                skipped
            );
            if (match) {
                addUniqueTarget(targets, skipped, {
                    kind: "certificate",
                    name: match.name,
                    id: match.id
                });
            }
        }

        for (const firewall of resources.firewalls ?? []) {
            const match = uniqueMatch(inventory.firewalls, firewall.name, (item) => item.name, "firewall", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "firewall", name: match.name, id: match.id });
            }
        }

        for (const domain of resources.domains ?? []) {
            const match = uniqueMatch(inventory.domains, domain.name, (item) => item.name, "domain", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "domain", name: match.name });
            }
        }

        for (const entry of resources.droplets ?? []) {
            const droplet = unwrapDropletEntry(entry);
            const match = uniqueMatch(inventory.droplets, droplet.name, (item) => item.name, "droplet", skipped);
            if (match?.id !== undefined) {
                addUniqueTarget(targets, skipped, { kind: "droplet", name: match.name, id: match.id });
            }
        }

        for (const database of resources.databases ?? []) {
            const match = uniqueMatch(inventory.databases, database.name, (item) => item.name, "database", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "database", name: match.name, id: match.id });
            }
        }

        for (const space of resources.spaces ?? []) {
            if (!inventory.spaces_listed) {
                skipped.push({
                    kind: "space",
                    name: space.name,
                    reason:
                        "Spaces credentials are not set (DO_SPACES_ACCESS_KEY_ID and DO_SPACES_SECRET_ACCESS_KEY); the bucket was not listed"
                });
                continue;
            }
            const region = space.region ?? config.region;
            const match = uniqueMatch(inventory.spaces, space.name, (item) => item.name, "space", skipped);
            if (!match) {
                continue;
            }
            if (!region) {
                skipped.push({
                    kind: "space",
                    name: space.name,
                    reason: "region required to delete the Space"
                });
                continue;
            }
            addUniqueTarget(targets, skipped, { kind: "space", name: match.name, region });
        }

        for (const key of resources.ssh_keys ?? []) {
            const match = uniqueMatch(inventory.ssh_keys, key.name, (item) => item.name, "ssh_key", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "ssh_key", name: match.name, id: match.id });
            }
        }

        for (const vpc of resources.vpcs ?? []) {
            const region = vpc.region ?? config.region ?? "";
            const found = lookupVPC(inventory.vpcs, vpc.name, region);
            if (found.status === "missing") {
                skipped.push({ kind: "vpc", name: vpc.name, reason: "not found" });
                continue;
            }
            if (found.status === "ambiguous") {
                skipped.push({
                    kind: "vpc",
                    name: vpc.name,
                    reason: `ambiguous: ${found.count} live resources named "${vpc.name}"`
                });
                continue;
            }
            if (found.status === "mismatch" || !found.resource) {
                skipped.push({
                    kind: "vpc",
                    name: vpc.name,
                    id: found.resource?.id,
                    reason: found.reason ?? "region does not match"
                });
                continue;
            }
            if (found.resource.default) {
                skipped.push({
                    kind: "vpc",
                    name: found.resource.name,
                    id: found.resource.id,
                    reason: "refusing to delete the default VPC"
                });
                continue;
            }
            addUniqueTarget(targets, skipped, {
                kind: "vpc",
                name: found.resource.name,
                id: found.resource.id
            });
        }

        for (const name of tagNamesFromConfig(config)) {
            const match = uniqueMatch(inventory.tags, name, (item) => item.name, "tag", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "tag", name: match.name });
            }
        }
    }

    if (tag) {
        const tagged = inventory.droplets.filter((droplet) => droplet.tags?.includes(tag));
        const taggedIds = new Set(
            tagged.map((droplet) => droplet.id).filter((id): id is number => typeof id === "number")
        );

        for (const droplet of tagged) {
            if (droplet.id === undefined) {
                skipped.push({ kind: "droplet", name: droplet.name, reason: "missing id" });
                continue;
            }
            addUniqueTarget(targets, skipped, { kind: "droplet", name: droplet.name, id: droplet.id });
        }

        for (const firewall of inventory.firewalls) {
            const attachment = firewallAttachment(firewall, taggedIds, tag);
            if (attachment === "yes") {
                addUniqueTarget(targets, skipped, { kind: "firewall", name: firewall.name, id: firewall.id });
            } else if (attachment === "ambiguous") {
                skipped.push({
                    kind: "firewall",
                    name: firewall.name,
                    id: firewall.id,
                    reason: `attached to droplets outside tag "${tag}"`
                });
                warnings.push(
                    `Skipping firewall "${firewall.name}" because it is also attached to untagged droplets`
                );
            }
        }

        const tagMatch = inventory.tags.find((item) => item.name === tag);
        if (tagMatch) {
            addUniqueTarget(targets, skipped, { kind: "tag", name: tagMatch.name });
        } else {
            skipped.push({ kind: "tag", name: tag, reason: "not found" });
        }
    }

    return {
        targets: sortTargets(targets),
        skipped,
        warnings
    };
}

async function runDelete(target: DestroyTarget): Promise<void> {
    switch (target.kind) {
        case "cdn":
            await deleteCdnEndpoint(String(target.id));
            return;
        case "app":
            await deleteApp(String(target.id));
            return;
        case "certificate":
            await deleteCertificate(String(target.id));
            return;
        case "alert_policy":
            await deleteAlertPolicy(String(target.id));
            return;
        case "load_balancer":
            await deleteLoadBalancer(String(target.id));
            return;
        case "firewall":
            await deleteFirewall(String(target.id));
            return;
        case "domain":
            await deleteDomain(target.name);
            return;
        case "droplet":
            await deleteDroplet(Number(target.id));
            return;
        case "database":
            await deleteDatabase(String(target.id));
            return;
        case "space":
            if (!target.region) {
                throw new Error(`Space "${target.name}" is missing region`);
            }
            await deleteSpace(target.name, target.region);
            return;
        case "ssh_key":
            await deleteSSHKey(target.id ?? target.name);
            return;
        case "vpc":
            await deleteVPC(String(target.id));
            return;
        case "tag":
            await deleteTag(target.name);
            return;
        default: {
            const exhaustive: never = target.kind;
            throw new Error(`Unsupported destroy kind: ${exhaustive}`);
        }
    }
}

export async function destroyGrapeResources(options: DestroyOptions): Promise<DestroyResult> {
    const inventory = options.inventory ?? (await fetchLiveInventory());
    const plan = planDestroy(inventory, { config: options.config, tag: options.tag });
    const result: DestroyResult = {
        dry_run: Boolean(options.dryRun),
        deleted: [],
        skipped: plan.skipped,
        failed: [],
        warnings: [...plan.warnings]
    };

    if (options.dryRun) {
        result.deleted = plan.targets;
        return result;
    }

    for (const target of plan.targets) {
        try {
            await runDelete(target);
            result.deleted.push(target);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            result.failed.push({ ...target, error: message });
            result.warnings.push(`Failed to delete ${target.kind} "${target.name}": ${message}`);
        }
    }

    return result;
}

export const DESTROY_V1_NOTES = `v1 destroy support
  Matches unique live names from the config and/or droplets with --tag, plus
  firewalls clearly attached to those droplets (same tag, or droplet ids that
  are a subset of the tagged set). Default VPCs, ambiguous names, and a VPC whose
  region does not match the config are skipped. Local generated SSH private key
  files are not removed. Apply uses the same unique-name, CDN-origin, and VPC
  region checks and also skips instead of creating.

  Order: CDN endpoints → apps → alert policies → load balancers →
  certificates → firewalls → domains → droplets → databases → Spaces →
  SSH keys → VPCs → tags.

  CDN endpoints are removed before certificates and Spaces because DigitalOcean
  rejects those deletes while a CDN endpoint still references them. Load
  balancers are removed before certificates for the same reason. A Space delete
  fails when the bucket still has objects; destroy does not empty it.

  Droplet deletion is asynchronous at DigitalOcean; a VPC, tag, or Space CDN
  may still be in use on the first pass. Re-run destroy after deallocation.`;
