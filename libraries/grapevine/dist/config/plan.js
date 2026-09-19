import { normalizeResources, unwrapDropletEntry } from "./apply.js";
import { resolvePrivateKeyPath } from "./ssh-private-key.js";
import { getConfigSourceDir } from "./source.js";
import { declaredStacks, resolveDeclaredStacks, servicesNeedsLegacyWarning, stackPlanDetails } from "./stack.js";
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
    const warnings = [];
    if (servicesNeedsLegacyWarning(config)) {
        warnings.push("services is accepted for validation but is not applied. Declare a top-level stack (or a stack-shaped services section with droplet + compose) instead.");
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
        counts: countResources(resources, stacks.length),
        resources: planned,
        warnings
    };
}
//# sourceMappingURL=plan.js.map