import type { CdnEndpoint } from "../providers/digitalocean/cdn/cdn.js";
import type { DropletResource } from "../providers/digitalocean/droplet/droplet.js";
import type { FireWallResponse } from "../providers/digitalocean/firewall/firewall.js";
import type { SSHKeyResource } from "../providers/digitalocean/ssh/ssh.js";
import type { VPCResponse } from "../providers/digitalocean/vpc/vpc.js";
export interface NamedResource {
    name?: string;
    id?: string | number;
}
export declare function sshKeyMatchesPublicKey(accountKey: SSHKeyResource, publicKey: string): boolean;
export declare function formatAmbiguousError(kind: string, name: string, matches: NamedResource[]): string;
export interface LookupResult<T> {
    status: "missing" | "unique" | "ambiguous" | "mismatch";
    resource?: T;
    count: number;
    ids: string[];
    /** Set when status is mismatch or ambiguous. */
    reason?: string;
}
export declare function lookupWhere<T>(items: T[], predicate: (item: T) => boolean, idOf: (item: T) => string | number | undefined): LookupResult<T>;
export declare function lookupByName<T extends NamedResource>(items: T[], name: string): LookupResult<T>;
export declare function findUniqueByName<T extends NamedResource>(kind: string, name: string, items: T[]): T | undefined;
/**
 * Adopt an account SSH key. When `publicKey` is provided (local private key reused),
 * prefer a unique fingerprint match over the blueprint name.
 */
export declare function adoptSSHKey(keys: SSHKeyResource[], name: string, publicKey?: string): SSHKeyResource | undefined;
/**
 * Name match, then fingerprint when a public key is known.
 * Ambiguous results are returned, not thrown, so apply can warn and skip.
 */
export declare function lookupSSHKey(keys: SSHKeyResource[], name: string, publicKey?: string): LookupResult<SSHKeyResource>;
export declare function lookupVPC(vpcs: VPCResponse[], name: string, region: string): LookupResult<VPCResponse>;
export declare function lookupCdnByOrigin(endpoints: CdnEndpoint[], origin: string): LookupResult<CdnEndpoint>;
export declare function adoptVPC(vpcs: VPCResponse[], name: string, region: string): VPCResponse | undefined;
export declare function adoptDroplet(droplets: DropletResource[], name: string): DropletResource | undefined;
export declare function adoptFirewall(firewalls: FireWallResponse[], name: string): FireWallResponse | undefined;
export declare function adoptCdnByOrigin(endpoints: CdnEndpoint[], origin: string): CdnEndpoint | undefined;
