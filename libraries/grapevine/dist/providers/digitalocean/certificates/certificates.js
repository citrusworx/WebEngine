import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listCertificates() {
    const response = await doRequest({
        method: "GET",
        url: "/certificates"
    });
    return response.certificates ?? [];
}
export async function getCertificate(id) {
    const response = await doRequest({
        method: "GET",
        url: `/certificates/${encodeURIComponent(id)}`
    });
    return response.certificate;
}
export async function createCertificate(blueprint) {
    const response = await doRequest({
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
export async function deleteCertificate(id) {
    await doRequest({
        method: "DELETE",
        url: `/certificates/${encodeURIComponent(id)}`
    });
}
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Poll GET /certificates/:id until `state` is `verified`.
 * Let's Encrypt certificates are created as `pending`. Used when a same-apply
 * CDN endpoint needs the certificate id. This does not wait for the CDN edge.
 */
export async function waitForCertificate(id, options = {}) {
    const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
    const intervalMs = options.intervalMs ?? 5_000;
    const sleep = options.sleep ?? defaultSleep;
    const started = Date.now();
    let current = await getCertificate(id);
    while (current.state !== "verified") {
        if (current.state === "error") {
            throw new Error(`DigitalOcean certificate "${current.name}" (${id}) entered state "error"`);
        }
        if (Date.now() - started > timeoutMs) {
            throw new Error(`Timed out waiting for DigitalOcean certificate "${current.name}" (${id}) to become verified (last state: ${current.state ?? "unknown"})`);
        }
        await sleep(intervalMs);
        current = await getCertificate(id);
    }
    return current;
}
//# sourceMappingURL=certificates.js.map