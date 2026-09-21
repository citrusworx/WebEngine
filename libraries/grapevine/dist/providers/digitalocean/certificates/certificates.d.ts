export type CertificateType = "custom" | "lets_encrypt";
export type CertificateState = "pending" | "verified" | "error" | (string & {});
export interface CertificateResource {
    id: string;
    name: string;
    dns_names?: string[];
    sha1_fingerprint?: string;
    created_at?: string;
    not_after?: string;
    state?: CertificateState;
    type?: CertificateType | string;
}
export interface CertificateBlueprint {
    name: string;
    type: CertificateType;
    dns_names?: string[];
    private_key?: string;
    leaf_certificate?: string;
    certificate_chain?: string;
}
export declare function listCertificates(): Promise<CertificateResource[]>;
export declare function getCertificate(id: string): Promise<CertificateResource>;
export declare function createCertificate(blueprint: CertificateBlueprint): Promise<CertificateResource>;
export declare function deleteCertificate(id: string): Promise<void>;
export interface WaitForCertificateOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}
/**
 * Poll GET /certificates/:id until `state` is `verified`.
 * Let's Encrypt certificates are created as `pending`. Used when a same-apply
 * CDN endpoint needs the certificate id. This does not wait for the CDN edge.
 */
export declare function waitForCertificate(id: string, options?: WaitForCertificateOptions): Promise<CertificateResource>;
