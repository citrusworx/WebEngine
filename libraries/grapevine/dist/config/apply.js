import { getDoToken } from "../providers/digitalocean/client.js";
import { createApp } from "../providers/digitalocean/apps/apps.js";
import { createCdnEndpoint, listCdnEndpoints, resolveCdnOrigin } from "../providers/digitalocean/cdn/cdn.js";
import { createCertificate, listCertificates, waitForCertificate } from "../providers/digitalocean/certificates/certificates.js";
import { createSpace, listSpaces, spaceOriginHostname } from "../providers/digitalocean/spaces/spaces.js";
import { createDatabase, pickDatabaseConnection, waitForDatabase } from "../providers/digitalocean/databases/databases.js";
import { createDroplet, listAllDroplets } from "../providers/digitalocean/droplet/droplet.js";
import { createFireWall, listAllFirewalls } from "../providers/digitalocean/firewall/firewall.js";
import { createAlertPolicy } from "../providers/digitalocean/monitoring/monitoring.js";
import { createDomain, createDomainRecord } from "../providers/digitalocean/networking/domains.js";
import { createLoadBalancer } from "../providers/digitalocean/networking/load-balancer.js";
import { createSSHKey, listSSHKeys, uploadSSHKey } from "../providers/digitalocean/ssh/ssh.js";
import { createTag, tagResource } from "../providers/digitalocean/tags/tags.js";
import { createVPC, listAllVPCs } from "../providers/digitalocean/vpc/vpc.js";
import { adoptCdnByOrigin, adoptDroplet, adoptFirewall, adoptSSHKey, adoptVPC, findUniqueByName } from "./adopt.js";
import { normalizeFirewallRules } from "./firewall-rules.js";
import { persistGeneratedPrivateKey, readExistingPrivateKeyPublic, resolvePrivateKeyPath } from "./ssh-private-key.js";
import { getConfigSourceDir } from "./source.js";
import { declaredStacks, generateStackUserData, mergeUserData, resolveStack, servicesNeedsLegacyWarning } from "./stack.js";
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
export const SERVICES_NOT_APPLIED_WARNING = "services is accepted for validation but is not applied. Declare a top-level stack (or a stack-shaped services section with droplet + compose) instead.";
export const NETWORKING_SSL_WARNING = "networking.ssl is deprecated and is not applied. Declare resources.certificates instead.";
export const NETWORKING_CDN_WARNING = "networking.cdn is deprecated and is not applied. Declare resources.cdn for a Spaces CDN endpoint instead.";
export function grapeConfigWarnings(config) {
    const warnings = [];
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
function spacesCallOptions(config) {
    return {
        accessKeyEnv: config.credentials?.spaces_access_key_env,
        secretKeyEnv: config.credentials?.spaces_secret_key_env
    };
}
function certificateMaterial(inline, envName, label) {
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
function connectionEnvOverlay(mapping, database, preferPrivate) {
    if (!mapping) {
        return {};
    }
    const connection = pickDatabaseConnection(database, preferPrivate);
    if (!connection) {
        return {};
    }
    const overlay = {};
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
export async function applyGrapeConfig(config, options = {}) {
    resolveToken(config);
    const resources = normalizeResources(config);
    const warnings = grapeConfigWarnings(config);
    const baseDir = options.baseDir ?? getConfigSourceDir(config);
    const result = {
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
    const accountKeys = (resources.ssh_keys ?? []).length > 0 ? await listSSHKeys() : [];
    const liveVpcs = (resources.vpcs ?? []).length > 0 ? await listAllVPCs() : [];
    const liveDroplets = (resources.droplets ?? []).length > 0 ? await listAllDroplets() : [];
    const liveFirewalls = (resources.firewalls ?? []).length > 0 ? await listAllFirewalls() : [];
    for (const key of resources.ssh_keys ?? []) {
        let publicKey = key.public_key ?? key.publicKey;
        let privateKeyPath;
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
        const adopted = adoptSSHKey(accountKeys, key.name, reusedPrivateKey ? publicKey : undefined);
        if (adopted) {
            result.ssh_keys.push(privateKeyPath ? { ...adopted, private_key_path: privateKeyPath } : adopted);
            sshKeyIds.push(adopted.id);
            warnings.push(`Adopting existing SSH key "${adopted.name}" (id ${adopted.id})`);
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
    }
    for (const vpc of resources.vpcs ?? []) {
        const region = vpc.region ?? config.region ?? "";
        const adopted = adoptVPC(liveVpcs, vpc.name, region);
        if (adopted) {
            result.vpcs.push(adopted);
            vpcIds.set(adopted.name, adopted.id);
            warnings.push(`Adopting existing VPC "${adopted.name}" (id ${adopted.id})`);
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
    }
    const envOverlay = {};
    for (const database of resources.databases ?? []) {
        const vpcUuid = database.private_network_uuid ??
            database.vpc_uuid ??
            (database.vpc ? vpcIds.get(database.vpc) : undefined);
        let created = await createDatabase({
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
        if (created.status !== "online" && database.wait !== false) {
            created = await waitForDatabase(created.id);
        }
        const preferPrivate = database.private !== false;
        Object.assign(envOverlay, connectionEnvOverlay(database.connection_env, created, preferPrivate));
        const connection = pickDatabaseConnection(created, preferPrivate);
        result.databases.push({
            id: created.id,
            name: created.name,
            engine: created.engine,
            status: created.status,
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
        if (stack) {
            const resolved = resolveStack(stack, { baseDir, envOverlay });
            userData = mergeUserData(fields.user_data, generateStackUserData(resolved));
            result.stacks.push({
                name: resolved.name,
                droplet: resolved.droplet,
                workdir: resolved.workdir,
                files: resolved.files.map((file) => file.dest),
                steps: resolved.steps,
                user_data_generated: true
            });
        }
        const existing = adoptDroplet(liveDroplets, grapeBlueprint.name);
        if (existing) {
            result.droplets.push(existing);
            if (existing.id !== undefined) {
                dropletIds.set(existing.name, existing.id);
            }
            warnings.push(`Adopting existing droplet "${existing.name}" (id ${existing.id}); skipping create`);
            continue;
        }
        const blueprint = {
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
    }
    for (const stack of stacks) {
        if (!result.stacks.some((applied) => applied.droplet === stack.droplet)) {
            throw new Error(`stack "${stack.name ?? stack.droplet}" targets droplet "${stack.droplet}" which is not declared in this config`);
        }
    }
    for (const firewall of resources.firewalls ?? []) {
        const droplet_ids = [
            ...(firewall.droplet_ids ?? []),
            ...(firewall.droplets ?? [])
                .map((name) => dropletIds.get(name))
                .filter((id) => typeof id === "number")
        ];
        const existing = adoptFirewall(liveFirewalls, firewall.name);
        if (existing) {
            result.firewalls.push({ id: existing.id, name: existing.name });
            warnings.push(`Adopting existing firewall "${existing.name}" (id ${existing.id}); skipping create`);
            continue;
        }
        const payload = {
            name: firewall.name,
            droplet_ids,
            tags: firewall.tags,
            inbound_rules: normalizeFirewallRules(firewall.inbound_rules ?? firewall.inbound),
            outbound_rules: normalizeFirewallRules(firewall.outbound_rules ?? firewall.outbound)
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
    const spaceRegions = new Map();
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
            const existing = findUniqueByName("Space", space.name, liveSpaces);
            if (existing) {
                result.spaces.push({
                    name: existing.name,
                    region,
                    origin: spaceOriginHostname(existing.name, region),
                    acl: space.acl
                });
                warnings.push(`Adopting existing Space "${existing.name}"; region and ACL are not changed`);
                continue;
            }
            const created = await createSpace({ name: space.name, region, acl: space.acl }, spaceOptions);
            result.spaces.push({
                name: created.name,
                region: created.region,
                origin: created.origin,
                acl: created.acl
            });
        }
    }
    const referencedCertificates = new Set((resources.cdn ?? []).map((endpoint) => endpoint.certificate).filter((name) => Boolean(name)));
    let liveCertificates;
    const loadCertificates = async () => {
        if (!liveCertificates) {
            liveCertificates = await listCertificates();
        }
        return liveCertificates;
    };
    const certificateIds = new Map();
    if ((resources.certificates ?? []).length > 0 || referencedCertificates.size > 0) {
        await loadCertificates();
    }
    for (const certificate of resources.certificates ?? []) {
        const adopted = findUniqueByName("Certificate", certificate.name, liveCertificates ?? []);
        let current;
        if (adopted) {
            current = adopted;
            warnings.push(`Adopting existing certificate "${adopted.name}" (id ${adopted.id})`);
        }
        else {
            current = await createCertificate({
                name: certificate.name,
                type: certificate.type,
                dns_names: certificate.dns_names,
                private_key: certificateMaterial(certificate.private_key, certificate.private_key_env, "private_key"),
                leaf_certificate: certificateMaterial(certificate.leaf_certificate, certificate.leaf_certificate_env, "leaf_certificate"),
                certificate_chain: certificateMaterial(certificate.certificate_chain, certificate.certificate_chain_env, "certificate_chain")
            });
        }
        const referenced = referencedCertificates.has(certificate.name);
        if (referenced && current.state !== "verified" && certificate.wait !== false) {
            current = await waitForCertificate(current.id);
        }
        else if (referenced && current.state !== "verified" && certificate.wait === false) {
            warnings.push(`Certificate "${current.name}" is ${current.state ?? "not verified"}; CDN attach will use it because wait is false`);
        }
        else if (!referenced && current.state === "pending") {
            warnings.push(`Certificate "${current.name}" is pending Let's Encrypt issuance. Apply waits only when a resources.cdn entry references it.`);
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
            const existing = adoptCdnByOrigin(liveCdn, origin);
            if (existing) {
                result.cdn.push(toAppliedCdn(existing));
                warnings.push(`Adopting existing CDN endpoint for origin "${origin}" (id ${existing.id}); TTL and custom domain are not updated`);
                continue;
            }
            let certificateId = endpoint.certificate_id ?? (endpoint.certificate ? certificateIds.get(endpoint.certificate) : undefined);
            if (endpoint.certificate && !certificateId) {
                const match = findUniqueByName("Certificate", endpoint.certificate, await loadCertificates());
                if (!match) {
                    throw new Error(`CDN endpoint references certificate "${endpoint.certificate}" which was not created in this apply and was not found on the account`);
                }
                certificateId = match.id;
                if (match.state !== "verified") {
                    const ready = await waitForCertificate(match.id);
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
        }
    }
    return result;
}
function toAppliedCdn(endpoint) {
    return {
        id: endpoint.id,
        origin: endpoint.origin,
        endpoint: endpoint.endpoint,
        custom_domain: endpoint.custom_domain
    };
}
//# sourceMappingURL=apply.js.map