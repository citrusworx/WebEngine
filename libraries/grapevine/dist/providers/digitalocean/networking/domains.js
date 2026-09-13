import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listAllDomains(query = {}) {
    const response = await doRequest({
        method: "GET",
        url: "/domains",
        params: cleanPayload(query)
    });
    return response.domains;
}
export async function listExistingDomain(domain) {
    const response = await doRequest({
        method: "GET",
        url: `/domains/${encodeURIComponent(domain)}`
    });
    return response.domain;
}
export async function createDomain(request) {
    const response = await doRequest({
        method: "POST",
        url: "/domains",
        data: cleanPayload(request)
    });
    return response.domain;
}
export async function deleteDomain(domain) {
    await doRequest({
        method: "DELETE",
        url: `/domains/${encodeURIComponent(domain)}`
    });
}
export async function listAllDomainRecords(domain, query = {}) {
    const response = await doRequest({
        method: "GET",
        url: `/domains/${encodeURIComponent(domain)}/records`,
        params: cleanPayload(query)
    });
    return response.domain_records;
}
export async function createDomainRecord(domain, record) {
    const response = await doRequest({
        method: "POST",
        url: `/domains/${encodeURIComponent(domain)}/records`,
        data: cleanPayload(record)
    });
    return response.domain_record;
}
export async function listExistingDomainRecord(domain, recordId) {
    const response = await doRequest({
        method: "GET",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`
    });
    return response.domain_record;
}
export async function updateDomainRecord(domain, recordId, record) {
    const response = await doRequest({
        method: "PUT",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`,
        data: cleanPayload(record)
    });
    return response.domain_record;
}
export async function patchDomainRecord(domain, recordId, record) {
    const response = await doRequest({
        method: "PATCH",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`,
        data: cleanPayload(record)
    });
    return response.domain_record;
}
export async function deleteDomainRecord(domain, recordId) {
    await doRequest({
        method: "DELETE",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`
    });
}
//# sourceMappingURL=domains.js.map