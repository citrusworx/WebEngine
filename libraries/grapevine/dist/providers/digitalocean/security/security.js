import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listScans(query = {}) {
    const response = await doRequest({
        method: "GET",
        url: "/security/scans",
        params: cleanPayload(query)
    });
    return response.scans ?? [];
}
export async function getLatestScans() {
    const response = await doRequest({
        method: "GET",
        url: "/security/scans/latest"
    });
    return "scan" in response && response.scan ? response.scan : response;
}
export async function getScan(scanId) {
    const response = await doRequest({
        method: "GET",
        url: `/security/scans/${scanId}`
    });
    return "scan" in response && response.scan ? response.scan : response;
}
export async function listSettings(query = {}) {
    return doRequest({
        method: "GET",
        url: "/security/settings",
        params: cleanPayload(query)
    });
}
export async function listAffectedResources(scanId, findingUuid, query = {}) {
    const response = await doRequest({
        method: "GET",
        url: `/security/scans/${scanId}/findings/${findingUuid}/affected_resources`,
        params: cleanPayload(query)
    });
    return response.resources ?? response.affected_resources ?? [];
}
export async function createScan() {
    const response = await doRequest({
        method: "POST",
        url: "/security/scans"
    });
    return "scan" in response && response.scan ? response.scan : response;
}
export async function createScanRule(resource) {
    await doRequest({
        method: "POST",
        url: "/security/scans/rules",
        data: { resource }
    });
}
export async function createSuppression(request) {
    return doRequest({
        method: "POST",
        url: "/security/settings/suppressions",
        data: request
    });
}
export async function updatePlan(request) {
    return doRequest({
        method: "PUT",
        url: "/security/settings/plan",
        data: request
    });
}
export async function deleteSuppression(suppressionUuid) {
    await doRequest({
        method: "DELETE",
        url: `/security/settings/suppressions/${suppressionUuid}`
    });
}
//# sourceMappingURL=security.js.map