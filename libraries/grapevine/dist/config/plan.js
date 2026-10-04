import { grapeConfigWarnings, normalizeResources, unwrapDropletEntry } from "./apply.js";
import { resolveCdnOrigin } from "../providers/digitalocean/cdn/cdn.js";
import { resolvePrivateKeyPath } from "./ssh-private-key.js";
import { getConfigSourceDir } from "./source.js";
import { declaredStacks, resolveDeclaredStacks, stackPlanDetails } from "./stack.js";
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
    "projects",
    "volumes",
    "kubernetes_clusters",
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
        projects: 0,
        volumes: 0,
        kubernetes_clusters: 0,
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
        projects: resources.projects?.length ?? 0,
        volumes: resources.volumes?.length ?? 0,
        kubernetes_clusters: resources.kubernetes_clusters?.length ?? 0,
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
    for (const project of resources.projects ?? []) {
        planned.push({
            kind: "project",
            name: project.name,
            detail: detail([
                ["purpose", project.purpose ?? "Other"],
                ["environment", project.environment],
                ["description", project.description]
            ])
        });
    }
    for (const volume of resources.volumes ?? []) {
        planned.push({
            kind: "volume",
            name: volume.name,
            detail: detail([
                ["region", volume.region ?? config.region],
                ["size_gigabytes", volume.size_gigabytes],
                ["filesystem_type", volume.filesystem_type]
            ])
        });
    }
    for (const cluster of resources.kubernetes_clusters ?? []) {
        planned.push({
            kind: "kubernetes",
            name: cluster.name,
            detail: detail([
                ["region", cluster.region ?? config.region],
                ["version", cluster.version],
                ["vpc", cluster.vpc ?? cluster.vpc_uuid],
                ["node_pools", cluster.node_pools.map((pool) => pool.name)]
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
        counts: countResources(resources, stacks.length),
        resources: planned,
        warnings
    };
}
//# sourceMappingURL=plan.js.map