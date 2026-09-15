import { createHash, generateKeyPairSync } from "node:crypto";
import sshpk from "sshpk";
import { doRequest } from "../client.js";

export interface SSHKey {
    public_key: string;
    name: string;
}

export interface SSHKeyResource {
    id: number;
    fingerprint: string;
    public_key: string;
    name: string;
}

export interface SSHKeyPair {
    publicKey: string;
    privateKey: string;
}

export function createKeyPair(): SSHKeyPair {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: "spki",
            format: "pem"
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem"
        }
    });

    return {
        publicKey,
        privateKey
    };
}

export function hashRSA(keyPair: SSHKeyPair): string {
    const hash = createHash("sha256").update(keyPair.publicKey).digest("base64");
    return `SHA256:${hash}`;
}

export function toOpenSSH(publickey: string): string {
    const key = sshpk.parseKey(publickey, "pem");
    return key.toString("ssh");
}

/** Convert a PEM/PKCS8 (or already-OpenSSH) private key to OpenSSH format for `ssh -i`. */
export function toOpenSSHPrivateKey(privateKey: string): string {
    const key = sshpk.parsePrivateKey(privateKey, "auto");
    const serialized = key.toString("openssh");
    return serialized.endsWith("\n") ? serialized : `${serialized}\n`;
}

export async function uploadSSHKey(key: SSHKey): Promise<SSHKeyResource> {
    const response = await doRequest<{ ssh_key: SSHKeyResource }>({
        method: "POST",
        url: "/account/keys",
        data: key
    });
    return response.ssh_key;
}

export async function listSSHKeys(): Promise<SSHKeyResource[]> {
    const response = await doRequest<{ ssh_keys: SSHKeyResource[] }>({
        method: "GET",
        url: "/account/keys"
    });
    return response.ssh_keys;
}

export async function getSSHKey(id: number | string): Promise<SSHKeyResource> {
    const response = await doRequest<{ ssh_key: SSHKeyResource }>({
        method: "GET",
        url: `/account/keys/${id}`
    });
    return response.ssh_key;
}

export async function updateSSHKey(id: number | string, name: string): Promise<SSHKeyResource> {
    const response = await doRequest<{ ssh_key: SSHKeyResource }>({
        method: "PUT",
        url: `/account/keys/${id}`,
        data: { name }
    });
    return response.ssh_key;
}

export async function deleteSSHKey(id: number | string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/account/keys/${id}`
    });
}

export function createSSHKey(name: string): {
    name: string;
    publicKey: string;
    keys: SSHKeyPair;
    fingerprint: string;
} {
    const keys = createKeyPair();
    const openSSH = toOpenSSH(keys.publicKey);
    const fingerprint = hashRSA(keys);

    return {
        name,
        publicKey: openSSH,
        keys,
        fingerprint
    };
}
