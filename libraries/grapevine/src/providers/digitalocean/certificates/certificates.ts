import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

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

export async function listCertificates(): Promise<CertificateResource[]> {
    const response = await doRequest<{ certificates?: CertificateResource[] }>({
        method: "GET",
        url: "/certificates"
    });
    return response.certificates ?? [];
}

export async function getCertificate(id: string): Promise<CertificateResource> {
    const response = await doRequest<{ certificate: CertificateResource }>({
        method: "GET",
        url: `/certificates/${encodeURIComponent(id)}`
    });
    return response.certificate;
}

export async function createCertificate(blueprint: CertificateBlueprint): Promise<CertificateResource> {
    const response = await doRequest<{ certificate: CertificateResource }>({
        method: "POST",
        url: "/certificates",
        data: cleanPayload({
            name: blueprint.name,
            type: blueprint.type,
            dns_names: blueprint.dns_names,
            private_key: blueprint.private_key,
            leaf_certificate: blueprint.leaf_certificate,
            certificate_chain: blueprint.certificate_chain
        })
    });
    return response.certificate;
}

export async function deleteCertificate(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/certificates/${encodeURIComponent(id)}`
    });
}

export interface WaitForCertificateOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Poll GET /certificates/:id until `state` is `verified`.
 * Let's Encrypt certificates are created as `pending`. Used when a same-apply
 * CDN endpoint needs the certificate id. This does not wait for the CDN edge.
 */
export async function waitForCertificate(
    id: string,
    options: WaitForCertificateOptions = {}
): Promise<CertificateResource> {
    const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
    const intervalMs = options.intervalMs ?? 5_000;
    const sleep = options.sleep ?? defaultSleep;
    const started = Date.now();

    let current = await getCertificate(id);
    while (current.state !== "verified") {
        if (current.state === "error") {
            throw new Error(
                `DigitalOcean certificate "${current.name}" (${id}) entered state "error"`
            );
        }
        if (Date.now() - started > timeoutMs) {
            throw new Error(
                `Timed out waiting for DigitalOcean certificate "${current.name}" (${id}) to become verified (last state: ${current.state ?? "unknown"})`
            );
        }
        await sleep(intervalMs);
        current = await getCertificate(id);
    }
    return current;
}
