import { doRequest } from "../client.js";
import { pollUntil } from "../wait.js";
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
/** Default Let's Encrypt poll: 5 minutes, every 5 seconds. */
export const DEFAULT_CERTIFICATE_WAIT_MS = 5 * 60 * 1000;
export const DEFAULT_CERTIFICATE_POLL_MS = 5_000;
/**
 * Poll GET /certificates/:id until `state` is `verified`.
 * Let's Encrypt certificates are created as `pending`. `error` fails immediately.
 * The loop is bounded by `timeoutMs` and by `ceil(timeoutMs / intervalMs)` reads.
 */
export async function waitForCertificate(id, options = {}) {
    const timeoutMs = options.timeoutMs ?? DEFAULT_CERTIFICATE_WAIT_MS;
    const intervalMs = options.intervalMs ?? DEFAULT_CERTIFICATE_POLL_MS;
    return pollUntil({
        timeoutMs,
        intervalMs,
        sleep: options.sleep,
        read: () => getCertificate(id),
        done: (current) => current.state === "verified",
        failure: (current) => current.state === "error"
            ? `DigitalOcean certificate "${current.name}" (${id}) entered state "error"`
            : undefined,
        timeoutError: (current) => `Timed out waiting for DigitalOcean certificate "${current.name}" (${id}) to become verified (last state: ${current.state ?? "unknown"})`
    });
}
//# sourceMappingURL=certificates.js.map