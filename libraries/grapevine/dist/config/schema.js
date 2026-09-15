import { z } from "zod";
const tokenEnv = z.string().min(1).default("DO_TOKEN");
export const credentialsSchema = z.object({
    source: z.literal("env").default("env"),
    env: tokenEnv
});
export const dropletBlueprintSchema = z.object({
    name: z.string().min(1),
    region: z.string().min(1).optional(),
    size: z.string().min(1),
    image: z.union([z.string().min(1), z.number()]),
    ssh_keys: z.array(z.union([z.string(), z.number()])).optional(),
    backups: z.boolean().optional(),
    backup_policy: z
        .object({
        name: z.string().optional(),
        plan: z.string().optional(),
        weekday: z.string().optional(),
        hour: z.number().optional()
    })
        .optional(),
    ipv6: z.boolean().optional(),
    monitoring: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    user_data: z.string().optional(),
    volumes: z.array(z.string()).optional(),
    vpc_uuid: z.string().optional(),
    vpc: z.string().optional(),
    with_droplet_agent: z.boolean().optional()
});
export const dropletBlueprintDocumentSchema = z.object({
    grapevine: z.string().optional(),
    provider: z.string().optional(),
    blueprint: z.object({
        name: z.string().optional(),
        droplet: dropletBlueprintSchema
    })
});
export const dropletEntrySchema = z.union([dropletBlueprintSchema, dropletBlueprintDocumentSchema]);
export const vpcBlueprintSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    region: z.string().min(1).optional(),
    ip_range: z.string().optional()
});
export const vpcResourceSchema = vpcBlueprintSchema;
const firewallSourceSchema = z.union([
    z.array(z.string()),
    z.object({
        addresses: z.array(z.string()).optional(),
        droplet_ids: z.array(z.number()).optional(),
        load_balancer_uids: z.array(z.string()).optional(),
        kubernetes_ids: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional()
    })
]);
export const firewallRuleSchema = z.object({
    protocol: z.string().min(1),
    ports: z.union([z.string(), z.number()]).optional(),
    sources: firewallSourceSchema.optional(),
    destinations: firewallSourceSchema.optional()
});
export const firewallBlueprintSchema = z.object({
    name: z.string().min(1),
    droplet_ids: z.array(z.number()).optional(),
    droplets: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    inbound_rules: z.array(firewallRuleSchema).optional(),
    outbound_rules: z.array(firewallRuleSchema).optional(),
    inbound: z.array(firewallRuleSchema).optional(),
    outbound: z.array(firewallRuleSchema).optional()
});
export const firewallResourceSchema = firewallBlueprintSchema;
export const sshKeyResourceSchema = z.object({
    name: z.string().min(1),
    public_key: z.string().optional(),
    publicKey: z.string().optional(),
    generate: z.boolean().optional(),
    /**
     * Destination for a generated private key (OpenSSH format, mode 0600).
     * Absolute, or relative to process cwd. Used only with `generate: true`.
     * Defaults to `.grape/ssh/<name>` (local-only; do not commit).
     */
    private_key_path: z.string().min(1).optional()
});
export const domainRecordSchema = z.object({
    type: z.string().min(1),
    name: z.string().min(1),
    data: z.string().min(1),
    priority: z.number().nullable().optional(),
    port: z.number().nullable().optional(),
    ttl: z.number().optional(),
    weight: z.number().nullable().optional(),
    flags: z.number().nullable().optional(),
    tag: z.string().nullable().optional()
});
export const domainResourceSchema = z.object({
    name: z.string().min(1),
    ip_address: z.string().optional(),
    records: z.array(domainRecordSchema).optional()
});
export const tagResourceSchema = z.object({
    name: z.string().min(1),
    resources: z
        .array(z.object({
        resource_id: z.string(),
        resource_type: z.string()
    }))
        .optional()
});
export const loadBalancerBlueprintSchema = z.object({
    name: z.string().min(1),
    region: z.string().optional(),
    droplet_ids: z.array(z.number()).optional(),
    forwarding_rules: z.array(z.record(z.string(), z.unknown())).optional(),
    health_check: z.record(z.string(), z.unknown()).optional(),
    tag: z.string().optional(),
    vpc_uuid: z.string().optional(),
    redirect_http_to_https: z.boolean().optional()
});
export const loadBalancerResourceSchema = loadBalancerBlueprintSchema;
export const alertPolicyResourceSchema = z.object({
    description: z.string().min(1),
    type: z.string().min(1),
    value: z.number(),
    window: z.string().default("5m"),
    enabled: z.boolean().default(true),
    compare: z.enum(["GreaterThan", "LessThan"]).optional(),
    entities: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    alerts: z
        .object({
        email: z.array(z.string()).optional(),
        slack: z.array(z.object({ channel: z.string(), url: z.string() })).optional()
    })
        .optional()
});
export const appResourceSchema = z.object({
    spec: z.object({
        name: z.string().min(1),
        region: z.string().optional(),
        services: z.array(z.record(z.string(), z.unknown())).optional(),
        static_sites: z.array(z.record(z.string(), z.unknown())).optional(),
        databases: z.array(z.record(z.string(), z.unknown())).optional(),
        domains: z.array(z.record(z.string(), z.unknown())).optional()
    })
});
export const resourcesSchema = z.object({
    tags: z.array(z.union([z.string(), tagResourceSchema])).optional(),
    ssh_keys: z.array(sshKeyResourceSchema).optional(),
    vpcs: z.array(vpcResourceSchema).optional(),
    droplets: z.array(dropletEntrySchema).optional(),
    firewalls: z.array(firewallBlueprintSchema).optional(),
    domains: z.array(domainResourceSchema).optional(),
    load_balancers: z.array(loadBalancerResourceSchema).optional(),
    alert_policies: z.array(alertPolicyResourceSchema).optional(),
    apps: z.array(appResourceSchema).optional()
});
export const grapeConfigSchema = z.object({
    version: z.string().optional().default("0.1"),
    grapevine: z.string().optional(),
    provider: z.literal("digitalocean"),
    credentials: credentialsSchema.optional().default({ source: "env", env: "DO_TOKEN" }),
    region: z.string().optional(),
    blueprint: z
        .object({
        name: z.string().optional(),
        droplet: dropletBlueprintSchema.optional(),
        vpc: vpcBlueprintSchema.optional(),
        firewall: firewallBlueprintSchema.optional()
    })
        .optional(),
    resources: resourcesSchema.optional().default({}),
    networking: z
        .object({
        vpc: z.union([z.boolean(), vpcResourceSchema]).optional(),
        domain: z.string().optional(),
        ssl: z.boolean().optional(),
        cdn: z.boolean().optional()
    })
        .optional(),
    firewall: firewallResourceSchema.partial().extend({
        name: z.string().optional()
    }).optional(),
    ssh: sshKeyResourceSchema.optional(),
    monitoring: z
        .object({
        enabled: z.boolean().optional(),
        alerts: z.array(z.unknown()).optional()
    })
        .optional(),
    services: z.record(z.string(), z.unknown()).optional()
});
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : undefined;
}
/** Fold a classic `{ blueprint: { droplet | vpc | firewall } }` document into `resources`. */
export function hoistBlueprintDocument(input) {
    const doc = asRecord(input);
    const blueprint = asRecord(doc?.blueprint);
    if (!doc || !blueprint) {
        return input;
    }
    const resources = { ...asRecord(doc.resources) };
    const droplets = Array.isArray(resources.droplets) ? [...resources.droplets] : [];
    const vpcs = Array.isArray(resources.vpcs) ? [...resources.vpcs] : [];
    const firewalls = Array.isArray(resources.firewalls) ? [...resources.firewalls] : [];
    if (blueprint.droplet) {
        droplets.push({
            blueprint: {
                name: blueprint.name,
                droplet: blueprint.droplet
            }
        });
    }
    if (blueprint.vpc) {
        vpcs.push(blueprint.vpc);
    }
    if (blueprint.firewall) {
        firewalls.push(blueprint.firewall);
    }
    return {
        ...doc,
        provider: doc.provider ?? "digitalocean",
        resources: {
            ...resources,
            ...(droplets.length ? { droplets } : {}),
            ...(vpcs.length ? { vpcs } : {}),
            ...(firewalls.length ? { firewalls } : {})
        }
    };
}
export function validateGrapeConfig(input) {
    return grapeConfigSchema.parse(hoistBlueprintDocument(input));
}
export function safeValidateGrapeConfig(input) {
    return grapeConfigSchema.safeParse(hoistBlueprintDocument(input));
}
//# sourceMappingURL=schema.js.map