import {
    planGrapeConfig,
    unwrapDropletEntry,
    validateGrapeConfig,
    type GrapeConfig,
    type GrapePlan,
    type PlannedResource
} from "@citrusworx/grapevine";
import type {
    BlueprintPackId,
    ProvisionStep,
    TimelineStepId,
    WizardSnapshot
} from "./types.js";

export const DROPLET_SIZE_SLUGS: Record<string, string> = {
    starter: "s-1vcpu-2gb",
    growth: "s-2vcpu-4gb",
    scale: "s-4vcpu-8gb",
    pro: "s-8vcpu-16gb",
    enterprise: "s-8vcpu-32gb"
};

export const TIMELINE_LABELS: Record<TimelineStepId, string> = {
    droplet: "Droplet Create",
    docker: "Docker Install",
    stack: "Stack Deploy",
    db: "DB Init",
    backup: "Backup Setup",
    health: "Health Check",
    ssl: "SSL Issue",
    complete: "Provision Complete"
};

const SSH_PLACEHOLDER = "REPLACE_WITH_YOUR_IP";

export function selectBlueprintPack(snapshot: WizardSnapshot): BlueprintPackId {
    return snapshot.databaseType === "dedicated" ? "kiwipress-managed" : "kiwipress-compose";
}

export function mapDropletSize(size?: string): string {
    if (!size) {
        return DROPLET_SIZE_SLUGS.growth;
    }
    return DROPLET_SIZE_SLUGS[size] ?? DROPLET_SIZE_SLUGS.growth;
}

export function tagSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 255);
}

export function wizardTags(snapshot: WizardSnapshot): string[] {
    const tags = ["kiwipress"];

    if (snapshot.cdnEnabled) {
        tags.push("cdn");
    }
    if (snapshot.loadBalancer) {
        tags.push("lb");
    }
    if (snapshot.sslEnabled) {
        tags.push("ssl");
    }
    if (snapshot.autoScaling) {
        tags.push("autoscale");
    }
    if (snapshot.blueprintId) {
        tags.push(`blueprint-${tagSlug(snapshot.blueprintId)}`);
    }
    if (snapshot.databaseType) {
        tags.push(`db-${tagSlug(snapshot.databaseType)}`);
    }
    if (snapshot.dropletSize) {
        tags.push(`size-${tagSlug(snapshot.dropletSize)}`);
    }

    return unique(tags.filter(Boolean));
}

export function stackEnvFromWizard(snapshot: WizardSnapshot): Record<string, string> {
    const env: Record<string, string> = {
        KIWIPRESS_CDN: snapshot.cdnEnabled ? "1" : "0",
        KIWIPRESS_LOAD_BALANCER: snapshot.loadBalancer ? "1" : "0"
    };

    if (snapshot.blueprintId) {
        env.KIWIPRESS_BLUEPRINT = snapshot.blueprintId;
    }

    const domain = snapshot.domainName?.trim();
    if (domain) {
        env.DOMAIN = domain;
        env.WP_HOST = `wp.${domain}`;
        env.API_HOST = `api.${domain}`;
        env.FRONT_HOST = `www.${domain}`;
        env.MINIO_HOST = `minio.${domain}`;
        env.MINIO_CONSOLE_HOST = `minio-console.${domain}`;
        env.TRAEFIK_HOST = `traefik.${domain}`;
        env.WP_URL = `https://wp.${domain}`;
        env.CORS_ORIGIN = `https://www.${domain}`;
        env.VITE_API_BASE = `https://api.${domain}`;
    }

    return env;
}

export function patchGrapeConfig(config: GrapeConfig, snapshot: WizardSnapshot): {
    config: GrapeConfig;
    warnings: string[];
} {
    const region = snapshot.region?.trim() || config.region;
    const doSize = mapDropletSize(snapshot.dropletSize);
    const tags = wizardTags(snapshot);
    const warnings: string[] = [];

    config.region = region;

    if (!config.resources) {
        config.resources = {};
    }

    config.resources.tags = mergeTags(config.resources.tags, tags);

    for (const entry of config.resources.droplets ?? []) {
        const droplet = unwrapDropletEntry(entry);
        droplet.size = doSize;
        if (region) {
            droplet.region = region;
        }
        droplet.tags = unique([...(droplet.tags ?? []), ...tags]);
    }

    for (const database of config.resources.databases ?? []) {
        if (region) {
            database.region = region;
        }
        database.tags = unique([...(database.tags ?? []), ...tags]);
    }

    for (const vpc of config.resources.vpcs ?? []) {
        if (region) {
            vpc.region = region;
        }
    }

    const domain = snapshot.domainName?.trim();
    if (domain) {
        config.networking = {
            ...config.networking,
            domain,
            ssl: snapshot.sslEnabled,
            cdn: snapshot.cdnEnabled
        };
        const exists = config.resources.domains?.some((item) => item.name === domain);
        if (!exists) {
            config.resources.domains = [...(config.resources.domains ?? []), { name: domain }];
        }
    } else if (snapshot.cdnEnabled !== undefined || snapshot.sslEnabled !== undefined) {
        config.networking = {
            ...config.networking,
            ssl: snapshot.sslEnabled,
            cdn: snapshot.cdnEnabled
        };
    }

    if (replaceSshPlaceholder(config)) {
        warnings.push("SSH inbound 22 is open to 0.0.0.0/0; restrict it before a production apply.");
    }

    mergeStackEnv(config, stackEnvFromWizard(snapshot));

    return {
        config: validateGrapeConfig(config),
        warnings
    };
}

export function timelineSteps(plan: GrapePlan, snapshot: WizardSnapshot): ProvisionStep[] {
    const kinds = new Set(plan.resources.map((resource) => resource.kind));
    const stepNames = new Set(
        plan.resources.filter((resource) => resource.kind === "stack_step").map((resource) => resource.name)
    );

    const include: TimelineStepId[] = [];
    if (kinds.has("droplet")) {
        include.push("droplet");
    }
    if (stepNames.has("install-docker")) {
        include.push("docker");
    }
    if (kinds.has("stack") || stepNames.has("write-compose") || stepNames.has("compose-up")) {
        include.push("stack");
    }
    if (kinds.has("database") || stepNames.has("write-env") || snapshot.databaseType) {
        include.push("db");
    }
    if (snapshot.backupFrequency) {
        include.push("backup");
    }
    if (stepNames.has("health-wait") || kinds.has("stack")) {
        include.push("health");
    }
    if (snapshot.sslEnabled !== false) {
        include.push("ssl");
    }
    include.push("complete");

    return unique(include).map((id) => ({
        id,
        label: TIMELINE_LABELS[id],
        status: "pending"
    }));
}

export function publicPlan(plan: GrapePlan) {
    return {
        provider: plan.provider,
        region: plan.region,
        counts: plan.counts,
        resources: plan.resources.map((resource: PlannedResource) => ({
            kind: resource.kind,
            name: resource.name,
            detail: resource.detail
        })),
        warnings: plan.warnings
    };
}

function unique<T>(values: T[]): T[] {
    return [...new Set(values)];
}

function mergeTags(
    existing: NonNullable<GrapeConfig["resources"]>["tags"],
    extra: string[]
): NonNullable<NonNullable<GrapeConfig["resources"]>["tags"]> {
    const names = new Set<string>();
    const merged: NonNullable<NonNullable<GrapeConfig["resources"]>["tags"]> = [];

    for (const tag of existing ?? []) {
        const name = typeof tag === "string" ? tag : tag.name;
        if (!name || names.has(name)) {
            continue;
        }
        names.add(name);
        merged.push(tag);
    }

    for (const tag of extra) {
        if (!tag || names.has(tag)) {
            continue;
        }
        names.add(tag);
        merged.push(tag);
    }

    return merged;
}

function mergeStackEnv(config: GrapeConfig, keys: Record<string, string>): void {
    if (!config.stack) {
        return;
    }

    const stacks = Array.isArray(config.stack) ? config.stack : [config.stack];
    for (const stack of stacks) {
        stack.env = {
            ...stack.env,
            keys: {
                ...stack.env?.keys,
                ...keys
            }
        };
    }
}

function replaceSshPlaceholder(config: GrapeConfig): boolean {
    let replaced = false;
    const firewalls = [
        ...(config.resources?.firewalls ?? []),
        ...(config.firewall ? [config.firewall] : [])
    ];

    for (const firewall of firewalls) {
        for (const rule of [...(firewall.inbound ?? []), ...(firewall.inbound_rules ?? [])]) {
            if (!Array.isArray(rule.sources)) {
                continue;
            }
            rule.sources = rule.sources.map((source) => {
                if (typeof source === "string" && source.includes(SSH_PLACEHOLDER)) {
                    replaced = true;
                    return "0.0.0.0/0";
                }
                return source;
            });
        }
    }

    return replaced;
}

export function buildPlanSteps(
    config: GrapeConfig,
    snapshot: WizardSnapshot,
    baseDir: string,
    extraWarnings: string[] = []
): {
    plan: GrapePlan;
    steps: ProvisionStep[];
    warnings: string[];
} {
    const plan = planGrapeConfig(config, { baseDir });
    return {
        plan,
        steps: timelineSteps(plan, snapshot),
        warnings: unique([...plan.warnings, ...extraWarnings])
    };
}
