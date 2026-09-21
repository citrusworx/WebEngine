import { getDoToken } from "../providers/digitalocean/client.js";
import { createApp, listApps, type AppSpec } from "../providers/digitalocean/apps/apps.js";
import {
    createCdnEndpoint,
    listCdnEndpoints,
    resolveCdnOrigin,
    updateCdnEndpoint,
    type CdnEndpoint
} from "../providers/digitalocean/cdn/cdn.js";
import {
    createCertificate,
    listCertificates,
    waitForCertificate,
    type CertificateResource
} from "../providers/digitalocean/certificates/certificates.js";
import { createSpace, listSpaces, spaceOriginHostname, type SpaceCallOptions } from "../providers/digitalocean/spaces/spaces.js";
import {
    createDatabase,
    getDatabase,
    listDatabases,
    pickDatabaseConnection,
    waitForDatabase,
    type DatabaseResource
} from "../providers/digitalocean/databases/databases.js";
import { createDroplet, listAllDroplets, type DropletBlueprint, type DropletResource } from "../providers/digitalocean/droplet/droplet.js";
import {
    createFireWall,
    listAllFirewalls,
    updateFirewall,
    type FireWall,
    type FireWallResponse
} from "../providers/digitalocean/firewall/firewall.js";
import { createAlertPolicy, listAlertPolicies } from "../providers/digitalocean/monitoring/monitoring.js";
import {
    createDomain,
    createDomainRecord,
    listAllDomainRecords,
    listAllDomains,
    type DomainRecord
} from "../providers/digitalocean/networking/domains.js";
import { createLoadBalancer, listAllLoadBalancers } from "../providers/digitalocean/networking/load-balancer.js";
import { createSSHKey, listSSHKeys, uploadSSHKey, type SSHKeyResource } from "../providers/digitalocean/ssh/ssh.js";
import { createTag, listAllTags, tagResource } from "../providers/digitalocean/tags/tags.js";
import { createVPC, listAllVPCs, type VPCResponse } from "../providers/digitalocean/vpc/vpc.js";
import {
    lookupByName,
    lookupCdnByOrigin,
    lookupSSHKey,
    lookupVPC,
    lookupWhere,
    type LookupResult
} from "./adopt.js";
import { firewallRulesEqual, normalizeFirewallRules } from "./firewall-rules.js";
import type { DropletBlueprintConfig, GrapeConfig, GrapeDropletEntry, GrapeResources } from "./schema.js";
import { persistGeneratedPrivateKey, readExistingPrivateKeyPublic, resolvePrivateKeyPath } from "./ssh-private-key.js";
import { getConfigSourceDir, type GrapeRunOptions } from "./source.js";
import {
    declaredStacks,
    generateStackUserData,
    mergeUserData,
    resolveStack,
    servicesNeedsLegacyWarning
} from "./stack.js";

export type { GrapeRunOptions } from "./source.js";

export interface AppliedSSHKey extends SSHKeyResource {
    /** Absolute path of a generated private key. Never contains key material. */
    private_key_path?: string;
}

export interface AppliedDatabase {
    id: string;
    name: string;
    engine: string;
    status: string;
    host?: string;
}

export interface AppliedSpace {
    name: string;
    region: string;
    origin: string;
    acl?: string;
}

export interface AppliedCertificate {
    id: string;
    name: string;
    type?: string;
    state?: string;
}

export interface AppliedCdn {
    id: string;
    origin: string;
    endpoint?: string;
    custom_domain?: string;
}

export interface AppliedStack {
    name: string;
    droplet: string;
    workdir: string;
    files: string[];
    steps: string[];
    user_data_generated: boolean;
}

export type ApplyAction = "created" | "adopted" | "updated" | "skipped";

export interface ApplyReceiptItem {
    kind: string;
    name: string;
    action: ApplyAction;
    id?: string | number;
    note?: string;
}

export interface ApplyResult {
    tags: string[];
    ssh_keys: AppliedSSHKey[];
    vpcs: VPCResponse[];
    databases: AppliedDatabase[];
    droplets: DropletResource[];
    firewalls: Array<{ id: string; name: string }>;
    domains: Array<{ name: string; records: number }>;
    load_balancers: Array<{ id: string; name?: string }>;
    alert_policies: Array<{ uuid: string; description: string }>;
    apps: Array<{ id: string; name: string }>;
    spaces: AppliedSpace[];
    certificates: AppliedCertificate[];
    cdn: AppliedCdn[];
    stacks: AppliedStack[];
    /** Absolute paths of private keys written during this apply (generate: true). */
    private_key_paths: string[];
    /**
     * Created, adopted, updated, and skipped resources.
     * The typed arrays above include created and adopted resources so later steps
     * can use their ids. Skipped resources appear only here.
     */
    receipt: ApplyReceiptItem[];
    warnings: string[];
}

export function unwrapDropletEntry(entry: GrapeDropletEntry): DropletBlueprintConfig {
    if ("blueprint" in entry && entry.blueprint?.droplet) {
        return entry.blueprint.droplet;
    }
    return entry as DropletBlueprintConfig;
}

export function normalizeResources(config: GrapeConfig): GrapeResources {
    const resources: GrapeResources = {
        tags: [...(config.resources?.tags ?? [])],
        ssh_keys: [...(config.resources?.ssh_keys ?? [])],
        vpcs: [...(config.resources?.vpcs ?? [])],
        droplets: [...(config.resources?.droplets ?? [])],
        firewalls: [...(config.resources?.firewalls ?? [])],
        domains: [...(config.resources?.domains ?? [])],
        load_balancers: [...(config.resources?.load_balancers ?? [])],
        alert_policies: [...(config.resources?.alert_policies ?? [])],
        apps: [...(config.resources?.apps ?? [])],
        databases: [...(config.resources?.databases ?? [])],
        spaces: [...(config.resources?.spaces ?? [])],
        certificates: [...(config.resources?.certificates ?? [])],
        cdn: [...(config.resources?.cdn ?? [])]
    };

    if (config.networking?.vpc) {
        if (config.networking.vpc === true) {
            resources.vpcs?.push({
                name: `${config.provider}-vpc`,
                region: config.region,
                description: "Created by grape apply"
            });
        } else {
            resources.vpcs?.push({
                ...config.networking.vpc,
                region: config.networking.vpc.region ?? config.region
            });
        }
    }

    if (config.networking?.domain) {
        const exists = resources.domains?.some((domain) => domain.name === config.networking?.domain);
        if (!exists) {
            resources.domains?.push({ name: config.networking.domain });
        }
    }

    if (config.firewall && (config.firewall.inbound || config.firewall.outbound || config.firewall.inbound_rules || config.firewall.outbound_rules)) {
        resources.firewalls?.push({
            name: config.firewall.name ?? `${config.provider}-firewall`,
            droplet_ids: config.firewall.droplet_ids,
            tags: config.firewall.tags,
            inbound: config.firewall.inbound,
            outbound: config.firewall.outbound,
            inbound_rules: config.firewall.inbound_rules,
            outbound_rules: config.firewall.outbound_rules
        });
    }

    if (config.ssh) {
        resources.ssh_keys?.push(config.ssh);
    }

    return resources;
}

function resolveToken(config: GrapeConfig): void {
    const envName = config.credentials?.env ?? "DO_TOKEN";
    const token = getDoToken(envName);
    if (envName !== "DO_TOKEN") {
        process.env.DO_TOKEN = token;
    }
}

export const SERVICES_NOT_APPLIED_WARNING =
    "services is accepted for validation but is not applied. Declare a top-level stack (or a stack-shaped services section with droplet + compose) instead.";

export const NETWORKING_SSL_WARNING =
    "networking.ssl is deprecated and is not applied. Declare resources.certificates instead.";

export const NETWORKING_CDN_WARNING =
    "networking.cdn is deprecated and is not applied. Declare resources.cdn for a Spaces CDN endpoint instead.";

export function grapeConfigWarnings(config: GrapeConfig): string[] {
    const warnings: string[] = [];
    if (servicesNeedsLegacyWarning(config)) {
        warnings.push(SERVICES_NOT_APPLIED_WARNING);
    }
    if (config.networking?.ssl) {
        warnings.push(NETWORKING_SSL_WARNING);
    }
    if (config.networking?.cdn) {
        warnings.push(NETWORKING_CDN_WARNING);
    }
    return warnings;
}

function spacesCallOptions(config: GrapeConfig): SpaceCallOptions {
    return {
        accessKeyEnv: config.credentials?.spaces_access_key_env,
        secretKeyEnv: config.credentials?.spaces_secret_key_env
    };
}

function certificateMaterial(inline: string | undefined, envName: string | undefined, label: string): string | undefined {
    if (inline?.trim()) {
        return inline;
    }
    if (!envName) {
        return undefined;
    }
    const value = process.env[envName]?.trim();
    if (!value) {
        throw new Error(`Certificate ${label} is not set in ${envName}`);
    }
    return value;
}

function connectionEnvOverlay(
    mapping: NonNullable<GrapeResources["databases"]>[number]["connection_env"],
    database: DatabaseResource,
    preferPrivate: boolean
): Record<string, string> {
    if (!mapping) {
        return {};
    }
    const connection = pickDatabaseConnection(database, preferPrivate);
    if (!connection) {
        return {};
    }
    const overlay: Record<string, string> = {};
    const host = connection.host ?? "";
    const port = connection.port !== undefined ? String(connection.port) : "";
    if (mapping.host && host) {
        overlay[mapping.host] = host;
    }
    if (mapping.port && port) {
        overlay[mapping.port] = port;
    }
    if (mapping.user && connection.user) {
        overlay[mapping.user] = connection.user;
    }
    if (mapping.password && connection.password) {
        overlay[mapping.password] = connection.password;
    }
    if (mapping.database && connection.database) {
        overlay[mapping.database] = connection.database;
    }
    if (mapping.uri && connection.uri) {
        overlay[mapping.uri] = connection.uri;
    }
    return overlay;
}

export async function applyGrapeConfig(
    config: GrapeConfig,
    options: GrapeRunOptions = {}
): Promise<ApplyResult> {
    resolveToken(config);
    const resources = normalizeResources(config);
    const warnings = grapeConfigWarnings(config);
    const baseDir = options.baseDir ?? getConfigSourceDir(config);

    const result: ApplyResult = {
        tags: [],
        ssh_keys: [],
        vpcs: [],
        databases: [],
        droplets: [],
        firewalls: [],
        domains: [],
        load_balancers: [],
        alert_policies: [],
        apps: [],
        spaces: [],
        certificates: [],
        cdn: [],
        stacks: [],
        private_key_paths: [],
        receipt: [],
        warnings
    };

    const vpcIds = new Map<string, string>();
    const dropletIds = new Map<string, number>();
    const sshKeyIds: Array<string | number> = [];

    const liveTags = (resources.tags ?? []).length > 0 ? await listAllTags() : [];
    for (const tag of resources.tags ?? []) {
        const name = typeof tag === "string" ? tag : tag.name;
        const found = lookupByName(liveTags, name);
        if (skipLookup(result, "tag", name, found, "tag")) {
            continue;
        }
        if (found.status === "unique") {
            result.tags.push(name);
            record(result, { kind: "tag", name, action: "adopted" }, `Adopting existing tag "${name}"`);
        } else {
            await createTag(name);
            result.tags.push(name);
            record(result, { kind: "tag", name, action: "created" });
        }
        if (typeof tag !== "string" && tag.resources?.length) {
            await tagResource(name, tag.resources);
        }
    }

    const accountKeys = (resources.ssh_keys ?? []).length > 0 ? await listSSHKeys() : [];
    const liveVpcs = (resources.vpcs ?? []).length > 0 ? await listAllVPCs() : [];
    const liveDroplets = (resources.droplets ?? []).length > 0 ? await listAllDroplets() : [];
    const liveFirewalls = (resources.firewalls ?? []).length > 0 ? await listAllFirewalls() : [];
    const liveDatabases = (resources.databases ?? []).length > 0 ? await listDatabases() : [];
    const liveDomains = (resources.domains ?? []).length > 0 ? await listAllDomains() : [];
    const liveLoadBalancers = (resources.load_balancers ?? []).length > 0 ? await listAllLoadBalancers() : [];
    const liveAlerts = (resources.alert_policies ?? []).length > 0 ? await listAlertPolicies() : [];
    const liveApps = (resources.apps ?? []).length > 0 ? await listApps() : [];

    for (const key of resources.ssh_keys ?? []) {
        let publicKey = key.public_key ?? key.publicKey;
        let privateKeyPath: string | undefined;
        let reusedPrivateKey = false;
        const resolvedKeyPath = resolvePrivateKeyPath(key.name, key.private_key_path);

        if (!publicKey && key.generate) {
            const existingPublic = readExistingPrivateKeyPublic(resolvedKeyPath);
            if (existingPublic) {
                publicKey = existingPublic;
                privateKeyPath = resolvedKeyPath;
                reusedPrivateKey = true;
                warnings.push(`Reusing existing private key at ${resolvedKeyPath}`);
            }
        }

        const foundKey = lookupSSHKey(accountKeys, key.name, reusedPrivateKey ? publicKey : undefined);
        if (skipLookup(result, "ssh_key", key.name, foundKey, "SSH key")) {
            continue;
        }
        if (foundKey.status === "unique" && foundKey.resource) {
            const adopted = foundKey.resource;
            result.ssh_keys.push(privateKeyPath ? { ...adopted, private_key_path: privateKeyPath } : adopted);
            sshKeyIds.push(adopted.id);
            record(
                result,
                { kind: "ssh_key", name: adopted.name, action: "adopted", id: adopted.id },
                `Adopting existing SSH key "${adopted.name}" (id ${adopted.id})`
            );
            continue;
        }

        if (!publicKey && key.generate) {
            const generated = createSSHKey(key.name);
            publicKey = generated.publicKey;
            privateKeyPath = persistGeneratedPrivateKey(resolvedKeyPath, generated.keys.privateKey);
            result.private_key_paths.push(privateKeyPath);
            warnings.push(`Generated SSH private key for "${key.name}" saved to ${privateKeyPath}`);
        }
        if (!publicKey) {
            throw new Error(`SSH key "${key.name}" is missing public_key (or set generate: true)`);
        }
        const uploaded = await uploadSSHKey({ name: key.name, public_key: publicKey });
        result.ssh_keys.push(privateKeyPath ? { ...uploaded, private_key_path: privateKeyPath } : uploaded);
        sshKeyIds.push(uploaded.id);
        record(result, { kind: "ssh_key", name: uploaded.name, action: "created", id: uploaded.id });
    }

    for (const vpc of resources.vpcs ?? []) {
        const region = vpc.region ?? config.region ?? "";
        const found = lookupVPC(liveVpcs, vpc.name, region);
        if (skipLookup(result, "vpc", vpc.name, found, "VPC")) {
            continue;
        }
        if (found.status === "unique" && found.resource) {
            const adopted = found.resource;
            result.vpcs.push(adopted);
            vpcIds.set(adopted.name, adopted.id);
            record(
                result,
                { kind: "vpc", name: adopted.name, action: "adopted", id: adopted.id },
                `Adopting existing VPC "${adopted.name}" (id ${adopted.id})`
            );
            continue;
        }
        const created = await createVPC({
            name: vpc.name,
            description: vpc.description ?? "",
            region,
            ip_range: vpc.ip_range
        });
        result.vpcs.push(created);
        vpcIds.set(created.name, created.id);
        record(result, { kind: "vpc", name: created.name, action: "created", id: created.id });
    }

    const envOverlay: Record<string, string> = {};
    for (const database of resources.databases ?? []) {
        const found = lookupByName(liveDatabases, database.name);
        if (skipLookup(result, "database", database.name, found, "database")) {
            continue;
        }
        const vpcUuid =
            database.private_network_uuid ??
            database.vpc_uuid ??
            (database.vpc ? vpcIds.get(database.vpc) : undefined);
        let current: DatabaseResource;
        if (found.status === "unique" && found.resource) {
            current = found.resource;
            if (database.connection_env) {
                current = await getDatabase(current.id);
            }
            if (current.status !== "online" && database.wait !== false) {
                current = await waitForDatabase(current.id);
            }
            record(
                result,
                { kind: "database", name: current.name, action: "adopted", id: current.id },
                `Adopting existing database "${current.name}" (id ${current.id}); engine, size, and region are not changed`
            );
        } else {
            current = await createDatabase({
                name: database.name,
                engine: database.engine,
                version: database.version,
                region: database.region ?? config.region ?? "",
                size: database.size,
                num_nodes: database.num_nodes,
                tags: database.tags,
                private_network_uuid: vpcUuid,
                project_id: database.project_id
            });
            if (current.status !== "online" && database.wait !== false) {
                current = await waitForDatabase(current.id);
            }
            record(result, { kind: "database", name: current.name, action: "created", id: current.id });
        }
        const preferPrivate = database.private !== false;
        Object.assign(envOverlay, connectionEnvOverlay(database.connection_env, current, preferPrivate));
        const connection = pickDatabaseConnection(current, preferPrivate);
        result.databases.push({
            id: current.id,
            name: current.name,
            engine: current.engine,
            status: current.status,
            host: connection?.host
        });
    }

    const stacks = declaredStacks(config);
    const stacksByDroplet = new Map(stacks.map((stack) => [stack.droplet, stack]));
    if (stacks.length !== stacksByDroplet.size) {
        throw new Error("Each stack must target a unique droplet");
    }

    for (const entry of resources.droplets ?? []) {
        const grapeBlueprint = unwrapDropletEntry(entry);
        const { vpc, ...fields } = grapeBlueprint;
        const vpcUuid = fields.vpc_uuid ?? (vpc ? vpcIds.get(vpc) : undefined);
        const stack = stacksByDroplet.get(grapeBlueprint.name);
        let userData = fields.user_data;
        let resolvedStack: ReturnType<typeof resolveStack> | undefined;
        if (stack) {
            resolvedStack = resolveStack(stack, { baseDir, envOverlay });
            userData = mergeUserData(fields.user_data, generateStackUserData(resolvedStack));
        }
        const foundDroplet = lookupByName(liveDroplets, grapeBlueprint.name);
        if (skipLookup(result, "droplet", grapeBlueprint.name, foundDroplet, "droplet")) {
            if (resolvedStack) {
                record(
                    result,
                    {
                        kind: "stack",
                        name: resolvedStack.name,
                        action: "skipped",
                        note: "droplet was skipped"
                    },
                    `Skipping stack "${resolvedStack.name}" because droplet "${grapeBlueprint.name}" was skipped`
                );
            }
            continue;
        }
        if (foundDroplet.status === "unique" && foundDroplet.resource) {
            const existing = foundDroplet.resource;
            result.droplets.push(existing);
            if (existing.id !== undefined) {
                dropletIds.set(existing.name, existing.id);
            }
            record(
                result,
                { kind: "droplet", name: existing.name, action: "adopted", id: existing.id },
                `Adopting existing droplet "${existing.name}" (id ${existing.id}); skipping create`
            );
            if (resolvedStack) {
                record(
                    result,
                    {
                        kind: "stack",
                        name: resolvedStack.name,
                        action: "skipped",
                        note: "user_data is sent only when the droplet is created"
                    },
                    `Skipping stack user_data for "${resolvedStack.name}"; droplet "${existing.name}" already exists and is not rebuilt`
                );
            }
            continue;
        }
        const blueprint: DropletBlueprint = {
            ...fields,
            region: fields.region ?? config.region ?? "",
            ssh_keys: fields.ssh_keys ?? (sshKeyIds.length ? sshKeyIds : undefined),
            vpc_uuid: vpcUuid,
            user_data: userData
        };
        const created = await createDroplet(blueprint);
        result.droplets.push(created);
        if (created.id !== undefined) {
            dropletIds.set(created.name, created.id);
        }
        record(result, { kind: "droplet", name: created.name, action: "created", id: created.id });
        if (resolvedStack) {
            result.stacks.push({
                name: resolvedStack.name,
                droplet: resolvedStack.droplet,
                workdir: resolvedStack.workdir,
                files: resolvedStack.files.map((file) => file.dest),
                steps: resolvedStack.steps,
                user_data_generated: true
            });
            record(result, { kind: "stack", name: resolvedStack.name, action: "created" });
        }
    }

    const declaredDropletNames = new Set(
        (resources.droplets ?? []).map((entry) => unwrapDropletEntry(entry).name)
    );
    for (const stack of stacks) {
        if (!declaredDropletNames.has(stack.droplet)) {
            throw new Error(
                `stack "${stack.name ?? stack.droplet}" targets droplet "${stack.droplet}" which is not declared in this config`
            );
        }
    }

    for (const firewall of resources.firewalls ?? []) {
        const droplet_ids = [
            ...(firewall.droplet_ids ?? []),
            ...(firewall.droplets ?? [])
                .map((name) => dropletIds.get(name))
                .filter((id): id is number => typeof id === "number")
        ];
        const inbound = normalizeFirewallRules(firewall.inbound_rules ?? firewall.inbound);
        const outbound = normalizeFirewallRules(firewall.outbound_rules ?? firewall.outbound);
        const foundFirewall = lookupByName(liveFirewalls, firewall.name);
        if (skipLookup(result, "firewall", firewall.name, foundFirewall, "firewall")) {
            continue;
        }
        if (foundFirewall.status === "unique" && foundFirewall.resource) {
            const existing = foundFirewall.resource;
            const updated = await adoptFirewall(existing, {
                name: firewall.name,
                droplet_ids,
                tags: firewall.tags,
                inbound_rules: inbound,
                outbound_rules: outbound
            });
            result.firewalls.push({ id: updated.id, name: updated.name });
            if (updated.changed) {
                record(
                    result,
                    {
                        kind: "firewall",
                        name: updated.name,
                        action: "updated",
                        id: updated.id,
                        note: "rules replaced; droplet and tag attachments only added"
                    },
                    `Updating firewall "${updated.name}" (id ${updated.id}) rules to match the config. Droplet and tag attachments are only added, never removed. Name, and any other fields, are left alone.`
                );
            } else {
                record(
                    result,
                    { kind: "firewall", name: existing.name, action: "adopted", id: existing.id },
                    `Adopting existing firewall "${existing.name}" (id ${existing.id}); skipping create`
                );
            }
            continue;
        }
        const payload: FireWall = {
            name: firewall.name,
            droplet_ids,
            tags: firewall.tags,
            inbound_rules: inbound,
            outbound_rules: outbound
        };
        const created = await createFireWall(payload);
        result.firewalls.push({ id: created.id, name: created.name });
        record(result, { kind: "firewall", name: created.name, action: "created", id: created.id });
    }

    for (const domain of resources.domains ?? []) {
        const found = lookupByName(liveDomains, domain.name);
        if (skipLookup(result, "domain", domain.name, found, "domain")) {
            continue;
        }
        let domainAction: ApplyAction = "created";
        if (found.status === "unique") {
            domainAction = "adopted";
            record(
                result,
                { kind: "domain", name: domain.name, action: "adopted" },
                `Adopting existing domain "${domain.name}"; the apex address is not changed`
            );
        } else {
            await createDomain({ name: domain.name, ip_address: domain.ip_address });
            record(result, { kind: "domain", name: domain.name, action: "created" });
        }
        const liveRecords = domainAction === "adopted" ? await listAllDomainRecords(domain.name) : [];
        let records = 0;
        for (const entry of domain.records ?? []) {
            const outcome = await ensureDomainRecord(domain.name, entry, liveRecords, result);
            if (outcome === "created" || outcome === "adopted") {
                records += 1;
            }
        }
        result.domains.push({ name: domain.name, records });
    }

    for (const lb of resources.load_balancers ?? []) {
        const found = lookupByName(liveLoadBalancers, lb.name);
        if (skipLookup(result, "load_balancer", lb.name, found, "load balancer")) {
            continue;
        }
        if (found.status === "unique" && found.resource?.id) {
            result.load_balancers.push({ id: found.resource.id, name: found.resource.name ?? lb.name });
            record(
                result,
                { kind: "load_balancer", name: lb.name, action: "adopted", id: found.resource.id },
                `Adopting existing load balancer "${lb.name}" (id ${found.resource.id}); forwarding rules are not changed`
            );
            continue;
        }
        const created = await createLoadBalancer({
            ...lb,
            region: lb.region ?? config.region
        });
        result.load_balancers.push({ id: created.id, name: created.name });
        record(result, { kind: "load_balancer", name: created.name ?? lb.name, action: "created", id: created.id });
    }

    for (const policy of resources.alert_policies ?? []) {
        const found = lookupWhere(
            liveAlerts,
            (item) => item.description === policy.description,
            (item) => item.uuid
        );
        if (skipLookup(result, "alert_policy", policy.description, found, "alert policy")) {
            continue;
        }
        if (found.status === "unique" && found.resource) {
            result.alert_policies.push({ uuid: found.resource.uuid, description: found.resource.description });
            record(
                result,
                {
                    kind: "alert_policy",
                    name: found.resource.description,
                    action: "adopted",
                    id: found.resource.uuid
                },
                `Adopting existing alert policy "${found.resource.description}" (uuid ${found.resource.uuid}); thresholds are not changed`
            );
            continue;
        }
        const created = await createAlertPolicy({
            alerts: policy.alerts ?? { email: [] },
            compare: policy.compare,
            description: policy.description,
            enabled: policy.enabled,
            entities: policy.entities,
            tags: policy.tags,
            type: policy.type,
            value: policy.value,
            window: policy.window
        });
        result.alert_policies.push({ uuid: created.uuid, description: created.description });
        record(result, {
            kind: "alert_policy",
            name: created.description,
            action: "created",
            id: created.uuid
        });
    }

    for (const app of resources.apps ?? []) {
        const found = lookupWhere(
            liveApps,
            (item) => item.spec?.name === app.spec.name,
            (item) => item.id
        );
        if (skipLookup(result, "app", app.spec.name, found, "app")) {
            continue;
        }
        if (found.status === "unique" && found.resource) {
            result.apps.push({ id: found.resource.id, name: found.resource.spec.name });
            record(
                result,
                { kind: "app", name: found.resource.spec.name, action: "adopted", id: found.resource.id },
                `Adopting existing app "${found.resource.spec.name}" (id ${found.resource.id}); the spec is not updated`
            );
            continue;
        }
        const created = await createApp({ spec: app.spec as AppSpec });
        result.apps.push({ id: created.id, name: created.spec.name });
        record(result, { kind: "app", name: created.spec.name, action: "created", id: created.id });
    }

    const spaceRegions = new Map<string, string>();
    const spaceOptions = spacesCallOptions(config);
    if ((resources.spaces ?? []).length > 0) {
        const listRegion = resources.spaces?.[0]?.region ?? config.region ?? "nyc3";
        const liveSpaces = await listSpaces(listRegion, spaceOptions);
        for (const space of resources.spaces ?? []) {
            const region = space.region ?? config.region ?? "";
            if (!region) {
                throw new Error(`Space "${space.name}" is missing region`);
            }
            spaceRegions.set(space.name, region);
            const found = lookupByName(liveSpaces, space.name);
            if (skipLookup(result, "space", space.name, found, "Space")) {
                continue;
            }
            if (found.status === "unique" && found.resource) {
                result.spaces.push({
                    name: found.resource.name,
                    region,
                    origin: spaceOriginHostname(found.resource.name, region),
                    acl: space.acl
                });
                record(
                    result,
                    { kind: "space", name: found.resource.name, action: "adopted" },
                    `Adopting existing Space "${found.resource.name}"; region and ACL are not changed`
                );
                continue;
            }
            const created = await createSpace({ name: space.name, region, acl: space.acl }, spaceOptions);
            result.spaces.push({
                name: created.name,
                region: created.region,
                origin: created.origin,
                acl: created.acl
            });
            record(result, { kind: "space", name: created.name, action: "created" });
        }
    }

    const referencedCertificates = new Set(
        (resources.cdn ?? []).map((endpoint) => endpoint.certificate).filter((name): name is string => Boolean(name))
    );
    let liveCertificates: CertificateResource[] | undefined;
    const loadCertificates = async (): Promise<CertificateResource[]> => {
        if (!liveCertificates) {
            liveCertificates = await listCertificates();
        }
        return liveCertificates;
    };
    const certificateIds = new Map<string, string>();

    if ((resources.certificates ?? []).length > 0 || referencedCertificates.size > 0) {
        await loadCertificates();
    }

    for (const certificate of resources.certificates ?? []) {
        const found = lookupByName(liveCertificates ?? [], certificate.name);
        if (skipLookup(result, "certificate", certificate.name, found, "certificate")) {
            continue;
        }
        let current: CertificateResource;
        let createdCertificate = false;
        if (found.status === "unique" && found.resource) {
            current = found.resource;
            record(
                result,
                { kind: "certificate", name: current.name, action: "adopted", id: current.id },
                `Adopting existing certificate "${current.name}" (id ${current.id})`
            );
        } else {
            createdCertificate = true;
            current = await createCertificate({
                name: certificate.name,
                type: certificate.type,
                dns_names: certificate.dns_names,
                private_key: certificateMaterial(
                    certificate.private_key,
                    certificate.private_key_env,
                    "private_key"
                ),
                leaf_certificate: certificateMaterial(
                    certificate.leaf_certificate,
                    certificate.leaf_certificate_env,
                    "leaf_certificate"
                ),
                certificate_chain: certificateMaterial(
                    certificate.certificate_chain,
                    certificate.certificate_chain_env,
                    "certificate_chain"
                )
            });
        }

        if (createdCertificate) {
            record(result, { kind: "certificate", name: current.name, action: "created", id: current.id });
        }

        const referenced = referencedCertificates.has(certificate.name);
        if (referenced && current.state !== "verified" && certificate.wait !== false) {
            current = await waitForCertificate(current.id);
        } else if (referenced && current.state !== "verified" && certificate.wait === false) {
            warnings.push(
                `Certificate "${current.name}" is ${current.state ?? "not verified"}; CDN attach will use it because wait is false`
            );
        } else if (!referenced && current.state === "pending") {
            warnings.push(
                `Certificate "${current.name}" is pending Let's Encrypt issuance. Apply waits only when a resources.cdn entry references it.`
            );
        }

        certificateIds.set(current.name, current.id);
        result.certificates.push({
            id: current.id,
            name: current.name,
            type: current.type,
            state: current.state
        });
    }

    if ((resources.cdn ?? []).length > 0) {
        const liveCdn = await listCdnEndpoints();
        for (const endpoint of resources.cdn ?? []) {
            const origin = resolveCdnOrigin({
                origin: endpoint.origin,
                space: endpoint.space,
                region: endpoint.region,
                spaceRegion: endpoint.space ? spaceRegions.get(endpoint.space) : undefined,
                fallbackRegion: config.region
            });
            const foundCdn = lookupCdnByOrigin(liveCdn, origin);
            if (skipLookup(result, "cdn", origin, foundCdn, "CDN endpoint")) {
                continue;
            }
            if (foundCdn.status === "unique" && foundCdn.resource) {
                let current = foundCdn.resource;
                const ttlChanges = endpoint.ttl !== undefined && endpoint.ttl !== current.ttl;
                if (ttlChanges) {
                    current = await updateCdnEndpoint(current.id, { ttl: endpoint.ttl });
                    record(
                        result,
                        {
                            kind: "cdn",
                            name: origin,
                            action: "updated",
                            id: current.id,
                            note: "ttl only"
                        },
                        `Adopting existing CDN endpoint for origin "${origin}" (id ${current.id}); updated TTL to ${endpoint.ttl}. Custom domain and certificate are not changed`
                    );
                } else {
                    record(
                        result,
                        { kind: "cdn", name: origin, action: "adopted", id: current.id },
                        `Adopting existing CDN endpoint for origin "${origin}" (id ${current.id}); custom domain and certificate are not changed`
                    );
                }
                result.cdn.push(toAppliedCdn(current));
                continue;
            }

            let certificateId = endpoint.certificate_id ?? (endpoint.certificate ? certificateIds.get(endpoint.certificate) : undefined);
            if (endpoint.certificate && !certificateId) {
                const match = lookupByName(await loadCertificates(), endpoint.certificate);
                if (match.status === "ambiguous") {
                    skipLookup(result, "cdn", origin, match, "CDN endpoint");
                    warnings.push(
                        `Skipping CDN create for origin "${origin}" because certificate "${endpoint.certificate}" is ambiguous`
                    );
                    continue;
                }
                if (match.status !== "unique" || !match.resource) {
                    throw new Error(
                        `CDN endpoint references certificate "${endpoint.certificate}" which was not created in this apply and was not found on the account`
                    );
                }
                certificateId = match.resource.id;
                if (match.resource.state !== "verified") {
                    const ready = await waitForCertificate(match.resource.id);
                    certificateId = ready.id;
                }
            }

            const created = await createCdnEndpoint({
                origin,
                ttl: endpoint.ttl,
                certificate_id: certificateId,
                custom_domain: endpoint.custom_domain
            });
            result.cdn.push(toAppliedCdn(created));
            record(result, { kind: "cdn", name: origin, action: "created", id: created.id });
        }
    }

    return result;
}

function record(result: ApplyResult, item: ApplyReceiptItem, warning?: string): void {
    result.receipt.push(item);
    if (warning) {
        result.warnings.push(warning);
    }
}

function skipLookup(
    result: ApplyResult,
    kind: string,
    name: string,
    found: LookupResult<unknown>,
    label: string
): boolean {
    if (found.status === "ambiguous") {
        const ids = found.ids.length ? ` (ids: ${found.ids.join(", ")})` : "";
        const message = `Skipping ${label} "${name}": ambiguous, ${found.count} live matches${ids}`;
        record(result, { kind, name, action: "skipped", note: "ambiguous" }, message);
        return true;
    }
    if (found.status === "mismatch") {
        const message = `Skipping ${label} "${name}": ${found.reason ?? "not an exact match"}`;
        record(result, { kind, name, action: "skipped", note: found.reason }, message);
        return true;
    }
    return false;
}

function unionNumbers(left?: number[], right?: number[]): number[] {
    return [...new Set([...(left ?? []), ...(right ?? [])])];
}

function unionStrings(left?: string[], right?: string[]): string[] {
    return [...new Set([...(left ?? []), ...(right ?? [])])];
}

function sameNumberSet(left?: number[], right?: number[]): boolean {
    const a = [...(left ?? [])].sort((one, two) => one - two);
    const b = [...(right ?? [])].sort((one, two) => one - two);
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameStringSet(left?: string[], right?: string[]): boolean {
    const a = [...(left ?? [])].sort();
    const b = [...(right ?? [])].sort();
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Replace inbound/outbound rules with the config's full lists.
 * Droplet ids and tags are a union: attachments are added, never removed.
 * The firewall name is not changed.
 */
async function adoptFirewall(
    existing: FireWallResponse,
    desired: FireWall
): Promise<{ id: string; name: string; changed: boolean }> {
    const inbound = desired.inbound_rules ?? existing.inbound_rules;
    const outbound = desired.outbound_rules ?? existing.outbound_rules;
    const dropletIds = unionNumbers(existing.droplet_ids, desired.droplet_ids);
    const tags = unionStrings(existing.tags, desired.tags);
    const rulesSame =
        firewallRulesEqual(existing.inbound_rules, inbound) &&
        firewallRulesEqual(existing.outbound_rules, outbound);
    const attachmentsSame = sameNumberSet(existing.droplet_ids, dropletIds) && sameStringSet(existing.tags, tags);
    if (rulesSame && attachmentsSame) {
        return { id: existing.id, name: existing.name, changed: false };
    }
    const updated = await updateFirewall(existing.id, {
        name: existing.name,
        inbound_rules: inbound,
        outbound_rules: outbound,
        droplet_ids: dropletIds,
        tags
    });
    return { id: updated.id, name: updated.name, changed: true };
}

function domainRecordIdentity(entry: { type: string; name: string; data: string }): string {
    return `${entry.type.trim().toUpperCase()} ${entry.name.trim()} ${entry.data.trim()}`;
}

async function ensureDomainRecord(
    domain: string,
    entry: DomainRecord,
    liveRecords: DomainRecord[],
    result: ApplyResult
): Promise<ApplyAction> {
    const identity = domainRecordIdentity(entry);
    const label = `${entry.type} ${entry.name}`;
    const receiptName = `${domain} ${label}`;
    const sameName = liveRecords.filter(
        (item) =>
            item.type?.trim().toUpperCase() === entry.type.trim().toUpperCase() && item.name?.trim() === entry.name.trim()
    );
    const exact = sameName.filter((item) => item.data?.trim() === entry.data.trim());
    if (exact.length === 1) {
        record(result, { kind: "domain_record", name: receiptName, action: "adopted", id: exact[0]?.id });
        return "adopted";
    }
    if (exact.length > 1) {
        record(
            result,
            { kind: "domain_record", name: receiptName, action: "skipped", note: "ambiguous" },
            `Skipping domain record ${identity} on "${domain}": ${exact.length} live records already match`
        );
        return "skipped";
    }
    if (sameName.length > 0) {
        record(
            result,
            { kind: "domain_record", name: receiptName, action: "skipped", note: "data differs" },
            `Skipping domain record ${label} on "${domain}": a record with that type and name exists with different data and is not updated`
        );
        return "skipped";
    }
    const created = await createDomainRecord(domain, entry);
    record(result, { kind: "domain_record", name: receiptName, action: "created", id: created.id });
    return "created";
}

function toAppliedCdn(endpoint: CdnEndpoint): AppliedCdn {
    return {
        id: endpoint.id,
        origin: endpoint.origin,
        endpoint: endpoint.endpoint,
        custom_domain: endpoint.custom_domain
    };
}
