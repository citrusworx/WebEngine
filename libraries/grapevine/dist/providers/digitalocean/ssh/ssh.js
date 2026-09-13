import { createHash, generateKeyPairSync } from "node:crypto";
import sshpk from "sshpk";
import { doRequest } from "../client.js";
export function createKeyPair() {
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
export function hashRSA(keyPair) {
    const hash = createHash("sha256").update(keyPair.publicKey).digest("base64");
    return `SHA256:${hash}`;
}
export function toOpenSSH(publickey) {
    const key = sshpk.parseKey(publickey, "pem");
    return key.toString("ssh");
}
export async function uploadSSHKey(key) {
    const response = await doRequest({
        method: "POST",
        url: "/account/keys",
        data: key
    });
    return response.ssh_key;
}
export async function listSSHKeys() {
    const response = await doRequest({
        method: "GET",
        url: "/account/keys"
    });
    return response.ssh_keys;
}
export async function getSSHKey(id) {
    const response = await doRequest({
        method: "GET",
        url: `/account/keys/${id}`
    });
    return response.ssh_key;
}
export async function updateSSHKey(id, name) {
    const response = await doRequest({
        method: "PUT",
        url: `/account/keys/${id}`,
        data: { name }
    });
    return response.ssh_key;
}
export async function deleteSSHKey(id) {
    await doRequest({
        method: "DELETE",
        url: `/account/keys/${id}`
    });
}
export function createSSHKey(name) {
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
//# sourceMappingURL=ssh.js.map