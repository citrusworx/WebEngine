import { createHash, generateKeyPairSync, hash } from "node:crypto";

interface SSHKey { // This is DigitalOceans shape
    public_key: string;
    name: string; // Name for this key
}

export interface SSHKeyPair {
    publicKey: string;
    privateKey: string;
}

export function createKeyPair(){
    const {publicKey, privateKey } = generateKeyPairSync("rsa", {
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

export function hashRSA(keyPair: SSHKeyPair){
    createHash("sha256")
    .update(keyPair.publicKey)
    .digest("base64");

    return `SHA256:${hash}`
}