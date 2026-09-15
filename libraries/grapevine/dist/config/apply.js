import { getDoToken } from "../providers/digitalocean/client.js";
import { createApp } from "../providers/digitalocean/apps/apps.js";
import { createDroplet } from "../providers/digitalocean/droplet/droplet.js";
import { createFireWall } from "../providers/digitalocean/firewall/firewall.js";
import { createAlertPolicy } from "../providers/digitalocean/monitoring/monitoring.js";
import { createDomain, createDomainRecord } from "../providers/digitalocean/networking/domains.js";
import { createLoadBalancer } from "../providers/digitalocean/networking/load-balancer.js";
import { createSSHKey, uploadSSHKey } from "../providers/digitalocean/ssh/ssh.js";
import { createTag, tagResource } from "../providers/digitalocean/tags/tags.js";
import { createVPC } from "../providers/digitalocean/vpc/vpc.js";
import { persistGeneratedPrivateKey, resolvePrivateKeyPath } from "./ssh-private-key.js";
function sourceFromList(values) {
    if (!values) {
        return undefined;
    }
    if (!Array.isArray(values)) {
        return values;
    }
    const addresses = [];
    const tags = [];
    const droplet_ids = [];
    for (const value of values) {
        if (value.startsWith("tag:")) {
            tags.push(value.slice(4));
        }
        else if (value.startsWith("droplet:")) {
            droplet_ids.push(Number(value.slice(8)));
        }
        else {
            addresses.push(value);
        }
    }
    return {
        ...(addresses.length ? { addresses } : {}),
        ...(tags.length ? { tags } : {}),
        ...(droplet_ids.length ? { droplet_ids } : {})
    };
}
function normalizeRules(rules) {
    if (!rules?.length) {
        return undefined;
    }
    return rules.map((rule) => ({
        protocol: rule.protocol,
        ports: rule.ports === undefined ? undefined : String(rule.ports),
        sources: sourceFromList(rule.sources),
        destinations: sourceFromList(rule.destinations)
    }));
}
export function unwrapDropletEntry(entry) {
    if ("blueprint" in entry && entry.blueprint?.droplet) {
        return entry.blueprint.droplet;
    }
    return entry;
}
export function normalizeResources(config) {
    const resources = {
        tags: [...(config.resources?.tags ?? [])],
        ssh_keys: [...(config.resources?.ssh_keys ?? [])],
        vpcs: [...(config.resources?.vpcs ?? [])],
        droplets: [...(config.resources?.droplets ?? [])],
        firewalls: [...(config.resources?.firewalls ?? [])],
        domains: [...(config.resources?.domains ?? [])],
        load_balancers: [...(config.resources?.load_balancers ?? [])],
        alert_policies: [...(config.resources?.alert_policies ?? [])],
        apps: [...(config.resources?.apps ?? [])]
    };
    if (config.networking?.vpc) {
        if (config.networking.vpc === true) {
            resources.vpcs?.push({
                name: `${config.provider}-vpc`,
                region: config.region,
                description: "Created by grape apply"
            });
        }
        else {
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
function resolveToken(config) {
    const envName = config.credentials?.env ?? "DO_TOKEN";
    const token = getDoToken(envName);
    if (envName !== "DO_TOKEN") {
        process.env.DO_TOKEN = token;
    }
}
export async function applyGrapeConfig(config) {
    resolveToken(config);
    const resources = normalizeResources(config);
    const warnings = [];
    if (config.services && Object.keys(config.services).length > 0) {
        warnings.push("services is accepted for validation but is not applied. Declare droplets or apps under resources instead.");
    }
    const result = {
        tags: [],
        ssh_keys: [],
        vpcs: [],
        droplets: [],
        firewalls: [],
        domains: [],
        load_balancers: [],
        alert_policies: [],
        apps: [],
        private_key_paths: [],
        warnings
    };
    const vpcIds = new Map();
    const dropletIds = new Map();
    const sshKeyIds = [];
    for (const tag of resources.tags ?? []) {
        const name = typeof tag === "string" ? tag : tag.name;
        await createTag(name);
        result.tags.push(name);
        if (typeof tag !== "string" && tag.resources?.length) {
            await tagResource(name, tag.resources);
        }
    }
    for (const key of resources.ssh_keys ?? []) {
        let publicKey = key.public_key ?? key.publicKey;
        let privateKeyPath;
        if (!publicKey && key.generate) {
            const generated = createSSHKey(key.name);
            publicKey = generated.publicKey;
            privateKeyPath = persistGeneratedPrivateKey(resolvePrivateKeyPath(key.name, key.private_key_path), generated.keys.privateKey);
            result.private_key_paths.push(privateKeyPath);
            warnings.push(`Generated SSH private key for "${key.name}" saved to ${privateKeyPath}`);
        }
        if (!publicKey) {
            throw new Error(`SSH key "${key.name}" is missing public_key (or set generate: true)`);
        }
        const uploaded = await uploadSSHKey({ name: key.name, public_key: publicKey });
        result.ssh_keys.push(privateKeyPath ? { ...uploaded, private_key_path: privateKeyPath } : uploaded);
        sshKeyIds.push(uploaded.id);
    }
    for (const vpc of resources.vpcs ?? []) {
        const created = await createVPC({
            name: vpc.name,
            description: vpc.description ?? "",
            region: vpc.region ?? config.region ?? "",
            ip_range: vpc.ip_range
        });
        result.vpcs.push(created);
        vpcIds.set(created.name, created.id);
    }
    for (const entry of resources.droplets ?? []) {
        const grapeBlueprint = unwrapDropletEntry(entry);
        const { vpc, ...fields } = grapeBlueprint;
        const vpcUuid = fields.vpc_uuid ?? (vpc ? vpcIds.get(vpc) : undefined);
        const blueprint = {
            ...fields,
            region: fields.region ?? config.region ?? "",
            ssh_keys: fields.ssh_keys ?? (sshKeyIds.length ? sshKeyIds : undefined),
            vpc_uuid: vpcUuid
        };
        const created = await createDroplet(blueprint);
        result.droplets.push(created);
        if (created.id !== undefined) {
            dropletIds.set(created.name, created.id);
        }
    }
    for (const firewall of resources.firewalls ?? []) {
        const droplet_ids = [
            ...(firewall.droplet_ids ?? []),
            ...(firewall.droplets ?? [])
                .map((name) => dropletIds.get(name))
                .filter((id) => typeof id === "number")
        ];
        const payload = {
            name: firewall.name,
            droplet_ids,
            tags: firewall.tags,
            inbound_rules: normalizeRules(firewall.inbound_rules ?? firewall.inbound),
            outbound_rules: normalizeRules(firewall.outbound_rules ?? firewall.outbound)
        };
        const created = await createFireWall(payload);
        result.firewalls.push({ id: created.id, name: created.name });
    }
    for (const domain of resources.domains ?? []) {
        await createDomain({ name: domain.name, ip_address: domain.ip_address });
        let records = 0;
        for (const record of domain.records ?? []) {
            await createDomainRecord(domain.name, record);
            records += 1;
        }
        result.domains.push({ name: domain.name, records });
    }
    for (const lb of resources.load_balancers ?? []) {
        const created = await createLoadBalancer({
            ...lb,
            region: lb.region ?? config.region
        });
        result.load_balancers.push({ id: created.id, name: created.name });
    }
    for (const policy of resources.alert_policies ?? []) {
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
    }
    for (const app of resources.apps ?? []) {
        const created = await createApp({ spec: app.spec });
        result.apps.push({ id: created.id, name: created.spec.name });
    }
    return result;
}
//# sourceMappingURL=apply.js.map