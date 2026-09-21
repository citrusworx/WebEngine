import sshpk from "sshpk";
function normalizeFingerprint(value) {
    return value.toLowerCase().replace(/^(md5:|sha256:)/, "").replace(/[^a-z0-9+/]/g, "");
}
function publicKeyFingerprints(publicKey) {
    const key = sshpk.parseKey(publicKey, "auto");
    return {
        md5: key.fingerprint("md5").toString(),
        sha256: key.fingerprint("sha256").toString()
    };
}
export function sshKeyMatchesPublicKey(accountKey, publicKey) {
    const derived = publicKeyFingerprints(publicKey);
    const candidates = [accountKey.fingerprint, accountKey.public_key].filter((value) => Boolean(value));
    for (const candidate of candidates) {
        const normalized = normalizeFingerprint(candidate);
        if (normalized &&
            (normalized === normalizeFingerprint(derived.md5) ||
                normalized === normalizeFingerprint(derived.sha256))) {
            return true;
        }
        try {
            const parsed = publicKeyFingerprints(candidate);
            if (normalizeFingerprint(parsed.md5) === normalizeFingerprint(derived.md5) ||
                normalizeFingerprint(parsed.sha256) === normalizeFingerprint(derived.sha256)) {
                return true;
            }
        }
        catch {
            // candidate was a fingerprint string, not a public key
        }
    }
    return false;
}
export function formatAmbiguousError(kind, name, matches) {
    const ids = matches.map((match) => (match.id !== undefined ? String(match.id) : "(missing id)")).join(", ");
    return `${kind} "${name}" is ambiguous: ${matches.length} live resources named "${name}" (ids: ${ids})`;
}
export function findUniqueByName(kind, name, items) {
    const matches = items.filter((item) => item.name === name);
    if (matches.length === 0) {
        return undefined;
    }
    if (matches.length > 1) {
        throw new Error(formatAmbiguousError(kind, name, matches));
    }
    return matches[0];
}
/**
 * Adopt an account SSH key. When `publicKey` is provided (local private key reused),
 * prefer a unique fingerprint match over the blueprint name.
 */
export function adoptSSHKey(keys, name, publicKey) {
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
export function adoptVPC(vpcs, name, region) {
    const named = vpcs.filter((vpc) => vpc.name === name);
    if (named.length === 0) {
        return undefined;
    }
    if (named.length > 1) {
        throw new Error(formatAmbiguousError("VPC", name, named));
    }
    const match = named[0];
    if (match.region !== region) {
        throw new Error(`VPC "${name}" exists in region "${match.region}" (id ${match.id}), not "${region}"`);
    }
    return match;
}
export function adoptDroplet(droplets, name) {
    return findUniqueByName("Droplet", name, droplets);
}
export function adoptFirewall(firewalls, name) {
    return findUniqueByName("Firewall", name, firewalls);
}
export function adoptCdnByOrigin(endpoints, origin) {
    const matches = endpoints.filter((endpoint) => endpoint.origin === origin);
    if (matches.length === 0) {
        return undefined;
    }
    if (matches.length > 1) {
        throw new Error(formatAmbiguousError("CDN endpoint", origin, matches.map((endpoint) => ({ id: endpoint.id, name: endpoint.origin }))));
    }
    return matches[0];
}
//# sourceMappingURL=adopt.js.map