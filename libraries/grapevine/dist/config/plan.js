import { getDoToken } from "../providers/digitalocean/client.js";
import { resolveCdnOrigin } from "../providers/digitalocean/cdn/cdn.js";
import { grapeConfigWarnings, normalizeResources, unwrapDropletEntry } from "./apply.js";
import { lookupByName, lookupCdnByOrigin, lookupVPC, lookupWhere } from "./adopt.js";
import { fetchLiveInventory, tokenIsSet } from "./live.js";
import { resolvePrivateKeyPath } from "./ssh-private-key.js";
import { getConfigSourceDir } from "./source.js";
import { declaredStacks, resolveDeclaredStacks, stackPlanDetails } from "./stack.js";
export const LOCAL_PLAN_NOTE = "Plan is local-only: no DigitalOcean token is set, so create vs adopt was not checked against the account.";
export const RESOURCE_KINDS = [
    "tags",
    "ssh_keys",
    "vpcs",
    "databases",
    "droplets",
    "firewalls",
    "domains",
    "load_balancers",
    "alert_policies",
    "apps",
    "spaces",
    "certificates",
    "cdn",
    "stacks"
];
export function emptyCounts() {
    return {
        tags: 0,
        ssh_keys: 0,
        vpcs: 0,
        databases: 0,
        droplets: 0,
        firewalls: 0,
        domains: 0,
        load_balancers: 0,
        alert_policies: 0,
        apps: 0,
        spaces: 0,
        certificates: 0,
        cdn: 0,
        stacks: 0
    };
}
export function countResources(resources, stackCount = 0) {
    return {
        tags: resources.tags?.length ?? 0,
        ssh_keys: resources.ssh_keys?.length ?? 0,
        vpcs: resources.vpcs?.length ?? 0,
        databases: resources.databases?.length ?? 0,
        droplets: resources.droplets?.length ?? 0,
        firewalls: resources.firewalls?.length ?? 0,
        domains: resources.domains?.length ?? 0,
        load_balancers: resources.load_balancers?.length ?? 0,
        alert_policies: resources.alert_policies?.length ?? 0,
        apps: resources.apps?.length ?? 0,
        spaces: resources.spaces?.length ?? 0,
        certificates: resources.certificates?.length ?? 0,
        cdn: resources.cdn?.length ?? 0,
        stacks: stackCount
    };
}
export function countNormalized(config) {
    return countResources(normalizeResources(config), declaredStacks(config).length);
}
function detail(entries) {
    const result = {};
    for (const [key, value] of entries) {
        if (value === undefined || value === null || value === "") {
            continue;
        }
        result[key] = Array.isArray(value) ? value.join(",") : String(value);
    }
    return result;
}
export function planGrapeConfig(config, options = {}) {
    const resources = normalizeResources(config);
    const planned = [];
    const warnings = grapeConfigWarnings(config);
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
    for (const database of resources.databases ?? []) {
        planned.push({
            kind: "database",
            name: database.name,
            detail: detail([
                ["engine", database.engine],
                ["version", database.version],
                ["region", database.region ?? config.region],
                ["size", database.size],
                ["vpc", database.vpc],
                ["wait", database.wait === false ? "false" : "true"]
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
    const spaceRegions = new Map();
    for (const space of resources.spaces ?? []) {
        const region = space.region ?? config.region;
        if (region) {
            spaceRegions.set(space.name, region);
        }
        planned.push({
            kind: "space",
            name: space.name,
            detail: detail([
                ["region", region],
                ["acl", space.acl ?? "private"]
            ])
        });
    }
    for (const certificate of resources.certificates ?? []) {
        planned.push({
            kind: "certificate",
            name: certificate.name,
            detail: detail([
                ["type", certificate.type],
                ["dns_names", certificate.dns_names],
                [
                    "private_key",
                    certificate.private_key
                        ? "provided"
                        : certificate.private_key_env
                            ? `env:${certificate.private_key_env}`
                            : undefined
                ],
                ["wait", certificate.wait === false ? "false" : undefined]
            ])
        });
    }
    for (const endpoint of resources.cdn ?? []) {
        let origin;
        try {
            origin = resolveCdnOrigin({
                origin: endpoint.origin,
                space: endpoint.space,
                region: endpoint.region,
                spaceRegion: endpoint.space ? spaceRegions.get(endpoint.space) : undefined,
                fallbackRegion: config.region
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            warnings.push(message);
        }
        planned.push({
            kind: "cdn",
            name: endpoint.custom_domain ?? origin ?? endpoint.space ?? "cdn",
            detail: detail([
                ["origin", origin],
                ["space", endpoint.space],
                ["ttl", endpoint.ttl],
                ["certificate", endpoint.certificate ?? endpoint.certificate_id],
                ["custom_domain", endpoint.custom_domain]
            ])
        });
    }
    const dropletNames = new Set((resources.droplets ?? []).map((entry) => unwrapDropletEntry(entry).name));
    const stacks = declaredStacks(config);
    for (const stack of stacks) {
        if (!dropletNames.has(stack.droplet)) {
            warnings.push(`stack "${stack.name ?? stack.droplet}" targets droplet "${stack.droplet}" which is not declared in this config`);
        }
    }
    try {
        const resolved = resolveDeclaredStacks(config, {
            baseDir: options.baseDir ?? getConfigSourceDir(config)
        });
        for (const stack of resolved) {
            planned.push({
                kind: "stack",
                name: stack.name,
                detail: stackPlanDetails(stack)
            });
            for (const step of stack.steps) {
                planned.push({
                    kind: "stack_step",
                    name: step,
                    detail: detail([
                        ["stack", stack.name],
                        ["droplet", stack.droplet],
                        ["workdir", stack.workdir]
                    ])
                });
            }
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`stack assets could not be resolved: ${message}`);
        for (const stack of stacks) {
            planned.push({
                kind: "stack",
                name: stack.name ?? stack.droplet,
                detail: detail([
                    ["droplet", stack.droplet],
                    ["workdir", stack.workdir],
                    ["compose", stack.compose.file ?? stack.compose.files?.join(",") ?? "inline"]
                ])
            });
        }
    }
    return {
        dry_run: true,
        provider: config.provider,
        region: config.region,
        lookup: "local",
        counts: countResources(resources, stacks.length),
        resources: planned,
        warnings
    };
}
function withAction(resource, action, note) {
    return {
        ...resource,
        detail: {
            ...resource.detail,
            action,
            ...(note ? { note } : {})
        }
    };
}
function decide(found) {
    if (found.status === "unique") {
        return { action: "adopt" };
    }
    if (found.status === "missing") {
        return { action: "create" };
    }
    if (found.status === "mismatch") {
        return { action: "skip", note: found.reason ?? "not an exact match" };
    }
    return { action: "skip", note: found.reason ?? `ambiguous (${found.count})` };
}
function actionFor(resource, inventory, region) {
    switch (resource.kind) {
        case "tag":
            return decide(lookupByName(inventory.tags, resource.name));
        case "ssh_key":
            return decide(lookupByName(inventory.ssh_keys, resource.name));
        case "vpc":
            return decide(lookupVPC(inventory.vpcs, resource.name, resource.detail.region ?? region ?? ""));
        case "database":
            return decide(lookupByName(inventory.databases, resource.name));
        case "droplet":
            return decide(lookupByName(inventory.droplets, resource.name));
        case "firewall":
            return decide(lookupByName(inventory.firewalls, resource.name));
        case "domain":
            return decide(lookupByName(inventory.domains, resource.name));
        case "load_balancer":
            return decide(lookupByName(inventory.load_balancers, resource.name));
        case "alert_policy":
            return decide(lookupWhere(inventory.alert_policies, (item) => item.description === resource.name, (item) => item.uuid));
        case "app":
            return decide(lookupWhere(inventory.apps, (item) => item.spec?.name === resource.name, (item) => item.id));
        case "space":
            return decide(lookupByName(inventory.spaces, resource.name));
        case "certificate":
            return decide(lookupByName(inventory.certificates, resource.name));
        case "cdn": {
            const origin = resource.detail.origin;
            if (!origin) {
                return { action: "skip", note: "origin could not be resolved" };
            }
            return decide(lookupCdnByOrigin(inventory.cdn, origin));
        }
        default:
            return { action: "create" };
    }
}
/** Read-only annotation. Does not create or update anything. */
export function annotatePlan(plan, inventory) {
    const warnings = [...plan.warnings];
    let notedSpaces = false;
    const resources = plan.resources.map((resource) => {
        if (resource.kind === "stack" || resource.kind === "stack_step") {
            return resource;
        }
        if (resource.kind === "space" && !inventory.spaces_listed) {
            if (!notedSpaces) {
                warnings.push("Spaces credentials are not set, so plan did not check whether Spaces already exist.");
                notedSpaces = true;
            }
            return withAction(resource, "unchecked", "spaces not listed");
        }
        const decision = actionFor(resource, inventory, plan.region);
        return withAction(resource, decision.action, decision.note);
    });
    return { ...plan, lookup: "live", resources, warnings };
}
/**
 * `grape plan` / `grape apply --dry-run`.
 * Lists the account when a token is set. Does not POST, PUT, or DELETE.
 */
export async function resolveGrapePlan(config, options = {}) {
    const plan = planGrapeConfig(config, options);
    const envName = config.credentials?.env ?? "DO_TOKEN";
    if (!tokenIsSet(envName)) {
        return { ...plan, warnings: [...plan.warnings, LOCAL_PLAN_NOTE] };
    }
    if (envName !== "DO_TOKEN") {
        process.env.DO_TOKEN = getDoToken(envName);
    }
    const inventory = await fetchLiveInventory();
    return annotatePlan(plan, inventory);
}
//# sourceMappingURL=plan.js.map