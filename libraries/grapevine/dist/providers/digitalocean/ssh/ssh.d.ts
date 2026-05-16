export interface SSHKey {
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
export declare function uploadSSHKey(key: SSHKey): Promise<any>;
export declare function createSSHKey(name: string): {
    name: string;
    publicKey: string;
    keys: SSHKeyPair;
    fingerprint: string;
};
