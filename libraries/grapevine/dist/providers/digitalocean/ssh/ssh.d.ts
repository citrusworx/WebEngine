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
export declare function createKeyPair(): SSHKeyPair;
export declare function hashRSA(keyPair: SSHKeyPair): string;
export declare function toOpenSSH(publickey: string): string;
/** Convert a PEM/PKCS8 (or already-OpenSSH) private key to OpenSSH format for `ssh -i`. */
export declare function toOpenSSHPrivateKey(privateKey: string): string;
export declare function uploadSSHKey(key: SSHKey): Promise<SSHKeyResource>;
export declare function listSSHKeys(): Promise<SSHKeyResource[]>;
export declare function getSSHKey(id: number | string): Promise<SSHKeyResource>;
export declare function updateSSHKey(id: number | string, name: string): Promise<SSHKeyResource>;
export declare function deleteSSHKey(id: number | string): Promise<void>;
export declare function createSSHKey(name: string): {
    name: string;
    publicKey: string;
    keys: SSHKeyPair;
    fingerprint: string;
};
