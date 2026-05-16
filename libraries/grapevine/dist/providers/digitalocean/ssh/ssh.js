import { createHash, generateKeyPairSync } from "node:crypto";
import sshpk from "sshpk";
import { client } from "../../../infrastructure/util/utilities.js";
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
    const hash = createHash("sha256")
        .update(keyPair.publicKey)
        .digest("base64");
    return `SHA256:${hash}`;
}
export function toOpenSSH(publickey) {
    const key = sshpk.parseKey(publickey, "pem");
    return key.toString("ssh");
}
export async function uploadSSHKey(key) {
    const response = await client.post("/account/keys", key);
    return response.data.ssh_key;
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