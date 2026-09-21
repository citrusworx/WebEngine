import sshpk from "sshpk";
import type { CdnEndpoint } from "../providers/digitalocean/cdn/cdn.js";
import type { DropletResource } from "../providers/digitalocean/droplet/droplet.js";
import type { FireWallResponse } from "../providers/digitalocean/firewall/firewall.js";
import type { SSHKeyResource } from "../providers/digitalocean/ssh/ssh.js";
import type { VPCResponse } from "../providers/digitalocean/vpc/vpc.js";

export interface NamedResource {
    name?: string;
    id?: string | number;
}

function normalizeFingerprint(value: string): string {
    return value.toLowerCase().replace(/^(md5:|sha256:)/, "").replace(/[^a-z0-9+/]/g, "");
}

function publicKeyFingerprints(publicKey: string): { md5: string; sha256: string } {
    const key = sshpk.parseKey(publicKey, "auto");
    return {
        md5: key.fingerprint("md5").toString(),
        sha256: key.fingerprint("sha256").toString()
    };
}

export function sshKeyMatchesPublicKey(accountKey: SSHKeyResource, publicKey: string): boolean {
    const derived = publicKeyFingerprints(publicKey);
    const candidates = [accountKey.fingerprint, accountKey.public_key].filter(
        (value): value is string => Boolean(value)
    );
    for (const candidate of candidates) {
        const normalized = normalizeFingerprint(candidate);
        if (
            normalized &&
            (normalized === normalizeFingerprint(derived.md5) ||
                normalized === normalizeFingerprint(derived.sha256))
        ) {
            return true;
        }
        try {
            const parsed = publicKeyFingerprints(candidate);
            if (
                normalizeFingerprint(parsed.md5) === normalizeFingerprint(derived.md5) ||
                normalizeFingerprint(parsed.sha256) === normalizeFingerprint(derived.sha256)
            ) {
                return true;
            }
        } catch {
            // candidate was a fingerprint string, not a public key
        }
    }
    return false;
}

export function formatAmbiguousError(kind: string, name: string, matches: NamedResource[]): string {
    const ids = matches.map((match) => (match.id !== undefined ? String(match.id) : "(missing id)")).join(", ");
    return `${kind} "${name}" is ambiguous: ${matches.length} live resources named "${name}" (ids: ${ids})`;
}

export interface LookupResult<T> {
    status: "missing" | "unique" | "ambiguous" | "mismatch";
    resource?: T;
    count: number;
    ids: string[];
    /** Set when status is mismatch or ambiguous. */
    reason?: string;
}

export function lookupWhere<T>(
    items: T[],
    predicate: (item: T) => boolean,
    idOf: (item: T) => string | number | undefined
): LookupResult<T> {
    const matches = items.filter(predicate);
    if (matches.length === 0) {
        return { status: "missing", count: 0, ids: [] };
    }
    const ids = matches.map((item) => {
        const id = idOf(item);
        return id !== undefined ? String(id) : "(missing id)";
    });
    if (matches.length > 1) {
        return {
            status: "ambiguous",
            count: matches.length,
            ids,
            reason: `ambiguous: ${matches.length} live resources`
        };
    }
    return { status: "unique", resource: matches[0], count: 1, ids };
}

export function lookupByName<T extends NamedResource>(items: T[], name: string): LookupResult<T> {
    return lookupWhere(
        items,
        (item) => item.name === name,
        (item) => item.id
    );
}

export function findUniqueByName<T extends NamedResource>(
    kind: string,
    name: string,
    items: T[]
): T | undefined {
    const found = lookupByName(items, name);
    if (found.status === "ambiguous") {
        throw new Error(formatAmbiguousError(kind, name, items.filter((item) => item.name === name)));
    }
    return found.resource;
}

/**
 * Adopt an account SSH key. When `publicKey` is provided (local private key reused),
 * prefer a unique fingerprint match over the blueprint name.
 */
export function adoptSSHKey(
    keys: SSHKeyResource[],
    name: string,
    publicKey?: string
): SSHKeyResource | undefined {
    if (publicKey) {
        const fingerprintMatches = keys.filter((key) => sshKeyMatchesPublicKey(key, publicKey));
        if (fingerprintMatches.length > 1) {
            throw new Error(formatAmbiguousError("SSH key", name, fingerprintMatches));
        }
        if (fingerprintMatches.length === 1) {
            return fingerprintMatches[0];
        }
    }
    return findUniqueByName("SSH key", name, keys);
}

/**
 * Name match, then fingerprint when a public key is known.
 * Ambiguous results are returned, not thrown, so apply can warn and skip.
 */
export function lookupSSHKey(
    keys: SSHKeyResource[],
    name: string,
    publicKey?: string
): LookupResult<SSHKeyResource> {
    if (publicKey) {
        const fingerprintMatches = keys.filter((key) => sshKeyMatchesPublicKey(key, publicKey));
        if (fingerprintMatches.length > 1) {
            return {
                status: "ambiguous",
                count: fingerprintMatches.length,
                ids: fingerprintMatches.map((key) => String(key.id)),
                reason: formatAmbiguousError("SSH key", name, fingerprintMatches)
            };
        }
        if (fingerprintMatches.length === 1) {
            return {
                status: "unique",
                resource: fingerprintMatches[0],
                count: 1,
                ids: [String(fingerprintMatches[0].id)]
            };
        }
    }
    const named = lookupByName(keys, name);
    if (named.status === "ambiguous") {
        return { ...named, reason: formatAmbiguousError("SSH key", name, keys.filter((key) => key.name === name)) };
    }
    return named;
}

export function lookupVPC(vpcs: VPCResponse[], name: string, region: string): LookupResult<VPCResponse> {
    const named = lookupByName(vpcs, name);
    if (named.status !== "unique" || !named.resource) {
        if (named.status === "ambiguous") {
            return {
                ...named,
                reason: formatAmbiguousError(
                    "VPC",
                    name,
                    vpcs.filter((vpc) => vpc.name === name)
                )
            };
        }
        return named;
    }
    if (region && named.resource.region !== region) {
        return {
            status: "mismatch",
            resource: named.resource,
            count: 1,
            ids: [named.resource.id],
            reason: `exists in region "${named.resource.region}" (id ${named.resource.id}), not "${region}"`
        };
    }
    return named;
}

export function lookupCdnByOrigin(endpoints: CdnEndpoint[], origin: string): LookupResult<CdnEndpoint> {
    const found = lookupWhere(
        endpoints,
        (endpoint) => endpoint.origin === origin,
        (endpoint) => endpoint.id
    );
    if (found.status === "ambiguous") {
        return {
            ...found,
            reason: formatAmbiguousError(
                "CDN endpoint",
                origin,
                endpoints
                    .filter((endpoint) => endpoint.origin === origin)
                    .map((endpoint) => ({ id: endpoint.id, name: endpoint.origin }))
            )
        };
    }
    return found;
}

export function adoptVPC(vpcs: VPCResponse[], name: string, region: string): VPCResponse | undefined {
    const found = lookupVPC(vpcs, name, region);
    if (found.status === "ambiguous") {
        throw new Error(found.reason ?? formatAmbiguousError("VPC", name, vpcs.filter((vpc) => vpc.name === name)));
    }
    if (found.status === "mismatch") {
        throw new Error(
            found.reason ??
                `VPC "${name}" exists in region "${found.resource?.region}" (id ${found.resource?.id}), not "${region}"`
        );
    }
    return found.resource;
}

export function adoptDroplet(droplets: DropletResource[], name: string): DropletResource | undefined {
    return findUniqueByName("Droplet", name, droplets);
}

export function adoptFirewall(firewalls: FireWallResponse[], name: string): FireWallResponse | undefined {
    return findUniqueByName("Firewall", name, firewalls);
}

export function adoptCdnByOrigin(endpoints: CdnEndpoint[], origin: string): CdnEndpoint | undefined {
    const found = lookupCdnByOrigin(endpoints, origin);
    if (found.status === "ambiguous") {
        throw new Error(
            found.reason ??
                formatAmbiguousError(
                    "CDN endpoint",
                    origin,
                    endpoints
                        .filter((endpoint) => endpoint.origin === origin)
                        .map((endpoint) => ({ id: endpoint.id, name: endpoint.origin }))
                )
        );
    }
    return found.resource;
}
