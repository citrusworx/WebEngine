import { RESOURCE_KINDS } from "../config/plan.js";
import { dropletAddresses, dropletRegion } from "../config/live.js";
import { dash, formatLabeled, formatTable, println } from "./format.js";
function countLine(counts) {
    const parts = RESOURCE_KINDS.filter((kind) => counts[kind] > 0).map((kind) => `${counts[kind]} ${kind}`);
    return parts.length > 0 ? parts.join(", ") : "none";
}
function formatDetail(resource) {
    const extras = Object.entries(resource.detail)
        .map(([key, value]) => `${key}=${value}`)
        .join("  ");
    return extras ? `${resource.name}  ${extras}` : resource.name;
}
export function renderPlan(plan, heading = "Plan  (dry-run, no DigitalOcean mutations)") {
    println(heading);
    println();
    println(formatLabeled([
        ["Provider", plan.provider],
        ["Region", plan.region ?? "(none)"],
        ["Would create", `${plan.resources.length} resource(s) (${countLine(plan.counts)})`]
    ]));
    println();
    if (plan.resources.length === 0) {
        println("No resources declared.");
    }
    else {
        for (const resource of plan.resources) {
            println(`  ${resource.kind.toUpperCase().padEnd(14)}  ${formatDetail(resource)}`);
        }
    }
    if (plan.warnings.length > 0) {
        println();
        println("Warnings");
        for (const warning of plan.warnings) {
            println(`  - ${warning}`);
        }
    }
}
export function renderValidate(plan, source, heading = "Valid grape config") {
    println(heading);
    println();
    println(formatLabeled([
        ["Source", source],
        ["Provider", plan.provider],
        ["Region", plan.region ?? "(none)"],
        ["Resources", `${plan.resources.length} (${countLine(plan.counts)})`]
    ]));
    println();
    if (plan.resources.length === 0) {
        println("  (empty)");
        return;
    }
    for (const resource of plan.resources) {
        println(`  ${resource.kind.padEnd(14)}  ${resource.name}`);
    }
}
export function renderApply(result) {
    println("Applied grape config");
    println();
    const lines = [];
    for (const tag of result.tags) {
        lines.push(`  tag             ${tag}`);
    }
    for (const key of result.ssh_keys) {
        const pathNote = key.private_key_path ? `  private_key_path=${key.private_key_path}` : "";
        lines.push(`  ssh_key         ${key.name}  id=${key.id}${pathNote}`);
    }
    for (const vpc of result.vpcs) {
        lines.push(`  vpc             ${vpc.name}  id=${vpc.id}  region=${vpc.region}`);
    }
    for (const database of result.databases) {
        const host = database.host ? `  host=${database.host}` : "";
        lines.push(`  database        ${database.name}  id=${database.id}  engine=${database.engine}  status=${database.status}${host}`);
    }
    for (const droplet of result.droplets) {
        lines.push(`  droplet         ${droplet.name}  id=${dash(droplet.id)}  status=${droplet.status}`);
    }
    for (const firewall of result.firewalls) {
        lines.push(`  firewall        ${firewall.name}  id=${firewall.id}`);
    }
    for (const domain of result.domains) {
        lines.push(`  domain          ${domain.name}  records=${domain.records}`);
    }
    for (const lb of result.load_balancers) {
        lines.push(`  load_balancer   ${dash(lb.name)}  id=${lb.id}`);
    }
    for (const policy of result.alert_policies) {
        lines.push(`  alert_policy    ${policy.description}  uuid=${policy.uuid}`);
    }
    for (const app of result.apps) {
        lines.push(`  app             ${app.name}  id=${app.id}`);
    }
    for (const stack of result.stacks) {
        lines.push(`  stack           ${stack.name}  droplet=${stack.droplet}  workdir=${stack.workdir}  files=${stack.files.length}`);
    }
    if (lines.length === 0) {
        println("No resources created.");
    }
    else {
        println("Created");
        for (const line of lines) {
            println(line);
        }
    }
    if (result.private_key_paths.length > 0) {
        println();
        println("Private keys written");
        for (const keyPath of result.private_key_paths) {
            println(`  ${keyPath}`);
            println(`  ssh -i ${keyPath}`);
        }
        println("  (key material is never printed)");
    }
    if (result.warnings.length > 0) {
        println();
        println("Warnings");
        for (const warning of result.warnings) {
            println(`  - ${warning}`);
        }
    }
}
function formatTarget(target) {
    const id = target.id !== undefined ? `  id=${target.id}` : "";
    const reason = target.reason ? `  (${target.reason})` : "";
    return `  ${target.kind.padEnd(14)}  ${target.name}${id}${reason}`;
}
export function renderDestroy(result) {
    const heading = result.dry_run
        ? "Destroy plan  (dry-run, no deletions)"
        : "Destroy";
    println(heading);
    println();
    if (result.deleted.length === 0 && result.failed.length === 0) {
        println(result.dry_run ? "Nothing would be deleted." : "Nothing to destroy.");
    }
    else {
        println(result.dry_run ? `Would delete (${result.deleted.length})` : `Deleted (${result.deleted.length})`);
        for (const target of result.deleted) {
            println(formatTarget(target));
        }
    }
    if (result.failed.length > 0) {
        println();
        println(`Failed (${result.failed.length})`);
        for (const target of result.failed) {
            println(`${formatTarget(target)}  ${target.error}`);
        }
    }
    if (result.skipped.length > 0) {
        println();
        println(`Skipped (${result.skipped.length})`);
        for (const target of result.skipped) {
            println(formatTarget(target));
        }
    }
    if (result.warnings.length > 0) {
        println();
        println("Warnings");
        for (const warning of result.warnings) {
            println(`  - ${warning}`);
        }
    }
}
export function destroySummary(targets) {
    if (targets.length === 0) {
        return "No matching DigitalOcean resources to destroy.";
    }
    const lines = targets.map((target) => `  ${target.kind.padEnd(14)}  ${target.name}${target.id !== undefined ? `  id=${target.id}` : ""}`);
    return `This will delete ${targets.length} DigitalOcean resource(s):\n${lines.join("\n")}`;
}
export function overlapWithConfig(plan, inventory) {
    const rows = [];
    for (const resource of plan.resources) {
        switch (resource.kind) {
            case "droplet": {
                const matches = inventory.droplets.filter((item) => item.name === resource.name);
                if (matches.length === 1) {
                    rows.push({
                        kind: "droplet",
                        name: resource.name,
                        state: "present",
                        id: matches[0].id,
                        extra: `status=${matches[0].status}`
                    });
                }
                else if (matches.length === 0) {
                    rows.push({ kind: "droplet", name: resource.name, state: "missing" });
                }
                else {
                    rows.push({
                        kind: "droplet",
                        name: resource.name,
                        state: "present",
                        extra: `ambiguous (${matches.length} matches)`
                    });
                }
                break;
            }
            case "vpc": {
                const matches = inventory.vpcs.filter((item) => item.name === resource.name);
                if (matches.length === 1) {
                    rows.push({ kind: "vpc", name: resource.name, state: "present", id: matches[0].id });
                }
                else if (matches.length === 0) {
                    rows.push({ kind: "vpc", name: resource.name, state: "missing" });
                }
                else {
                    rows.push({
                        kind: "vpc",
                        name: resource.name,
                        state: "present",
                        extra: `ambiguous (${matches.length} matches)`
                    });
                }
                break;
            }
            case "firewall": {
                const matches = inventory.firewalls.filter((item) => item.name === resource.name);
                if (matches.length === 1) {
                    rows.push({ kind: "firewall", name: resource.name, state: "present", id: matches[0].id });
                }
                else if (matches.length === 0) {
                    rows.push({ kind: "firewall", name: resource.name, state: "missing" });
                }
                else {
                    rows.push({
                        kind: "firewall",
                        name: resource.name,
                        state: "present",
                        extra: `ambiguous (${matches.length} matches)`
                    });
                }
                break;
            }
            case "domain": {
                const match = inventory.domains.find((item) => item.name === resource.name);
                rows.push({
                    kind: "domain",
                    name: resource.name,
                    state: match ? "present" : "missing"
                });
                break;
            }
            case "ssh_key": {
                const matches = inventory.ssh_keys.filter((item) => item.name === resource.name);
                if (matches.length === 1) {
                    rows.push({ kind: "ssh_key", name: resource.name, state: "present", id: matches[0].id });
                }
                else if (matches.length === 0) {
                    rows.push({ kind: "ssh_key", name: resource.name, state: "missing" });
                }
                else {
                    rows.push({
                        kind: "ssh_key",
                        name: resource.name,
                        state: "present",
                        extra: `ambiguous (${matches.length} matches)`
                    });
                }
                break;
            }
            case "tag": {
                const match = inventory.tags.find((item) => item.name === resource.name);
                rows.push({ kind: "tag", name: resource.name, state: match ? "present" : "missing" });
                break;
            }
            default:
                break;
        }
    }
    return rows;
}
export function renderLiveStatus(inventory) {
    println(`Droplets (${inventory.droplets.length})`);
    if (inventory.droplets.length === 0) {
        println("  (none)");
    }
    else {
        println(formatTable(inventory.droplets.map((droplet) => {
            const ips = dropletAddresses(droplet);
            return {
                name: droplet.name,
                id: dash(droplet.id),
                status: droplet.status,
                region: dropletRegion(droplet) || "-",
                public: ips.publicIp || "-",
                private: ips.privateIp || "-",
                tags: droplet.tags?.join(",") || "-"
            };
        }), [
            { key: "name", header: "NAME" },
            { key: "id", header: "ID" },
            { key: "status", header: "STATUS" },
            { key: "region", header: "REGION" },
            { key: "public", header: "PUBLIC IP" },
            { key: "private", header: "PRIVATE IP" },
            { key: "tags", header: "TAGS" }
        ]));
    }
    println();
    println(`VPCs (${inventory.vpcs.length})`);
    if (inventory.vpcs.length === 0) {
        println("  (none)");
    }
    else {
        println(formatTable(inventory.vpcs.map((vpc) => ({
            name: vpc.name,
            id: vpc.id,
            region: vpc.region,
            ip: vpc.ip_range,
            def: vpc.default ? "yes" : "no"
        })), [
            { key: "name", header: "NAME" },
            { key: "id", header: "ID" },
            { key: "region", header: "REGION" },
            { key: "ip", header: "IP RANGE" },
            { key: "def", header: "DEFAULT" }
        ]));
    }
    println();
    println(`Firewalls (${inventory.firewalls.length})`);
    if (inventory.firewalls.length === 0) {
        println("  (none)");
    }
    else {
        println(formatTable(inventory.firewalls.map((firewall) => ({
            name: firewall.name,
            id: firewall.id,
            status: firewall.status,
            droplets: String(firewall.droplet_ids?.length ?? 0),
            tags: firewall.tags?.join(",") || "-"
        })), [
            { key: "name", header: "NAME" },
            { key: "id", header: "ID" },
            { key: "status", header: "STATUS" },
            { key: "droplets", header: "DROPLETS" },
            { key: "tags", header: "TAGS" }
        ]));
    }
    println();
    println(`Domains (${inventory.domains.length})`);
    if (inventory.domains.length === 0) {
        println("  (none)");
    }
    else {
        println(formatTable(inventory.domains.map((domain) => ({ name: domain.name })), [{ key: "name", header: "NAME" }]));
    }
}
export function renderOverlap(rows) {
    println("Config vs live");
    if (rows.length === 0) {
        println("  (no overlapping resource kinds to compare)");
        return;
    }
    for (const row of rows) {
        const id = row.id !== undefined ? `  id=${row.id}` : "";
        const extra = row.extra ? `  ${row.extra}` : "";
        println(`  ${row.kind.padEnd(12)}  ${row.name.padEnd(24)}  ${row.state}${id}${extra}`);
    }
}
//# sourceMappingURL=render.js.map