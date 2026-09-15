import { normalizeResources, unwrapDropletEntry } from "./apply.js";
import { deleteApp } from "../providers/digitalocean/apps/apps.js";
import { deleteDroplet } from "../providers/digitalocean/droplet/droplet.js";
import { deleteFirewall } from "../providers/digitalocean/firewall/firewall.js";
import { deleteAlertPolicy } from "../providers/digitalocean/monitoring/monitoring.js";
import { deleteDomain } from "../providers/digitalocean/networking/domains.js";
import { deleteLoadBalancer } from "../providers/digitalocean/networking/load-balancer.js";
import { deleteSSHKey } from "../providers/digitalocean/ssh/ssh.js";
import { deleteTag } from "../providers/digitalocean/tags/tags.js";
import { deleteVPC } from "../providers/digitalocean/vpc/vpc.js";
import { fetchLiveInventory } from "./live.js";
export const DESTROY_ORDER = [
    "app",
    "alert_policy",
    "load_balancer",
    "firewall",
    "domain",
    "droplet",
    "ssh_key",
    "vpc",
    "tag"
];
function orderIndex(kind) {
    return DESTROY_ORDER.indexOf(kind);
}
function sortTargets(targets) {
    return [...targets].sort((a, b) => orderIndex(a.kind) - orderIndex(b.kind));
}
function uniqueMatch(items, name, getName, kind, skipped) {
    const matches = items.filter((item) => getName(item) === name);
    if (matches.length === 0) {
        skipped.push({ kind, name, reason: "not found" });
        return undefined;
    }
    if (matches.length > 1) {
        skipped.push({
            kind,
            name,
            reason: `ambiguous: ${matches.length} live resources named "${name}"`
        });
        return undefined;
    }
    return matches[0];
}
function addUniqueTarget(targets, skipped, target) {
    const exists = targets.some((item) => item.kind === target.kind && item.id !== undefined && item.id === target.id);
    if (exists) {
        return;
    }
    const named = targets.some((item) => item.kind === target.kind && item.id === undefined && item.name === target.name);
    if (named && target.id === undefined) {
        skipped.push({ ...target, reason: "duplicate candidate" });
        return;
    }
    targets.push(target);
}
function tagNamesFromConfig(config) {
    return (normalizeResources(config).tags ?? []).map((tag) => (typeof tag === "string" ? tag : tag.name));
}
function firewallAttachment(firewall, taggedDropletIds, tag) {
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
export function planDestroy(inventory, options) {
    const targets = [];
    const skipped = [];
    const warnings = [];
    const { config, tag } = options;
    if (!config && !tag) {
        warnings.push("No config or --tag provided");
        return { targets, skipped, warnings };
    }
    if (config) {
        const resources = normalizeResources(config);
        for (const app of resources.apps ?? []) {
            const match = uniqueMatch(inventory.apps, app.spec.name, (item) => item.spec?.name, "app", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "app", name: match.spec.name, id: match.id });
            }
        }
        for (const policy of resources.alert_policies ?? []) {
            const match = uniqueMatch(inventory.alert_policies, policy.description, (item) => item.description, "alert_policy", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, {
                    kind: "alert_policy",
                    name: match.description,
                    id: match.uuid
                });
            }
        }
        for (const lb of resources.load_balancers ?? []) {
            const match = uniqueMatch(inventory.load_balancers, lb.name, (item) => item.name, "load_balancer", skipped);
            if (match?.id) {
                addUniqueTarget(targets, skipped, {
                    kind: "load_balancer",
                    name: match.name ?? lb.name,
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
        for (const key of resources.ssh_keys ?? []) {
            const match = uniqueMatch(inventory.ssh_keys, key.name, (item) => item.name, "ssh_key", skipped);
            if (match) {
                addUniqueTarget(targets, skipped, { kind: "ssh_key", name: match.name, id: match.id });
            }
        }
        for (const vpc of resources.vpcs ?? []) {
            const match = uniqueMatch(inventory.vpcs, vpc.name, (item) => item.name, "vpc", skipped);
            if (!match) {
                continue;
            }
            if (match.default) {
                skipped.push({
                    kind: "vpc",
                    name: match.name,
                    id: match.id,
                    reason: "refusing to delete the default VPC"
                });
                continue;
            }
            addUniqueTarget(targets, skipped, { kind: "vpc", name: match.name, id: match.id });
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
        const taggedIds = new Set(tagged.map((droplet) => droplet.id).filter((id) => typeof id === "number"));
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
            }
            else if (attachment === "ambiguous") {
                skipped.push({
                    kind: "firewall",
                    name: firewall.name,
                    id: firewall.id,
                    reason: `attached to droplets outside tag "${tag}"`
                });
                warnings.push(`Skipping firewall "${firewall.name}" because it is also attached to untagged droplets`);
            }
        }
        const tagMatch = inventory.tags.find((item) => item.name === tag);
        if (tagMatch) {
            addUniqueTarget(targets, skipped, { kind: "tag", name: tagMatch.name });
        }
        else {
            skipped.push({ kind: "tag", name: tag, reason: "not found" });
        }
    }
    return {
        targets: sortTargets(targets),
        skipped,
        warnings
    };
}
async function runDelete(target) {
    switch (target.kind) {
        case "app":
            await deleteApp(String(target.id));
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
            const exhaustive = target.kind;
            throw new Error(`Unsupported destroy kind: ${exhaustive}`);
        }
    }
}
export async function destroyGrapeResources(options) {
    const inventory = options.inventory ?? (await fetchLiveInventory());
    const plan = planDestroy(inventory, { config: options.config, tag: options.tag });
    const result = {
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
        }
        catch (error) {
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
  are a subset of the tagged set). Default VPCs and ambiguous names are skipped.
  Local generated SSH private key files are not removed.

  Order: apps → alert policies → load balancers → firewalls → domains →
  droplets → SSH keys → VPCs → tags.

  Droplet deletion is asynchronous at DigitalOcean; a VPC or tag may still be
  in use on the first pass. Re-run destroy after droplets finish deallocating.`;
//# sourceMappingURL=destroy.js.map