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
        if (!publicKey && key.generate) {
            publicKey = createSSHKey(key.name).publicKey;
        }
        if (!publicKey) {
            throw new Error(`SSH key "${key.name}" is missing public_key (or set generate: true)`);
        }
        const uploaded = await uploadSSHKey({ name: key.name, public_key: publicKey });
        result.ssh_keys.push(uploaded);
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
    for (const droplet of resources.droplets ?? []) {
        const vpcUuid = droplet.vpc_uuid ?? (droplet.vpc ? vpcIds.get(droplet.vpc) : undefined);
        const created = await createDroplet({
            name: droplet.name,
            region: droplet.region ?? config.region ?? "",
            size: droplet.size,
            image: droplet.image,
            ssh_keys: droplet.ssh_keys ?? (sshKeyIds.length ? sshKeyIds : undefined),
            backups: droplet.backups,
            backup_policy: droplet.backup_policy,
            ipv6: droplet.ipv6,
            monitoring: droplet.monitoring,
            tags: droplet.tags,
            user_data: droplet.user_data,
            volumes: droplet.volumes,
            vpc_uuid: vpcUuid,
            with_droplet_agent: droplet.with_droplet_agent
        });
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