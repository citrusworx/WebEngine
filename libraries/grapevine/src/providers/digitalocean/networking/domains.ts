import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface Domain {
    name: string;
    ttl?: number;
    zone_file?: string;
}

export interface DomainCreateRequest {
    name: string;
    ip_address?: string;
}

export type DomainBlueprint = DomainCreateRequest;

export interface DomainRecord {
    id?: number;
    type: string;
    name: string;
    data: string;
    priority?: number | null;
    port?: number | null;
    ttl?: number;
    weight?: number | null;
    flags?: number | null;
    tag?: string | null;
}

export interface DomainListQuery {
    per_page?: number;
    page?: number;
}

export interface DomainRecordQuery extends DomainListQuery {
    name?: string;
    type?: string;
}

export async function listAllDomains(query: DomainListQuery = {}): Promise<Domain[]> {
    const response = await doRequest<{ domains: Domain[] }>({
        method: "GET",
        url: "/domains",
        params: cleanPayload(query)
    });
    return response.domains;
}

export async function listExistingDomain(domain: string): Promise<Domain> {
    const response = await doRequest<{ domain: Domain }>({
        method: "GET",
        url: `/domains/${encodeURIComponent(domain)}`
    });
    return response.domain;
}

export async function createDomain(request: DomainCreateRequest): Promise<Domain> {
    const response = await doRequest<{ domain: Domain }>({
        method: "POST",
        url: "/domains",
        data: cleanPayload(request)
    });
    return response.domain;
}

export async function deleteDomain(domain: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/domains/${encodeURIComponent(domain)}`
    });
}

export async function listAllDomainRecords(
    domain: string,
    query: DomainRecordQuery = {}
): Promise<DomainRecord[]> {
    const response = await doRequest<{ domain_records: DomainRecord[] }>({
        method: "GET",
        url: `/domains/${encodeURIComponent(domain)}/records`,
        params: cleanPayload(query)
    });
    return response.domain_records;
}

export async function createDomainRecord(domain: string, record: DomainRecord): Promise<DomainRecord> {
    const response = await doRequest<{ domain_record: DomainRecord }>({
        method: "POST",
        url: `/domains/${encodeURIComponent(domain)}/records`,
        data: cleanPayload(record)
    });
    return response.domain_record;
}

export async function listExistingDomainRecord(domain: string, recordId: number): Promise<DomainRecord> {
    const response = await doRequest<{ domain_record: DomainRecord }>({
        method: "GET",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`
    });
    return response.domain_record;
}

export async function updateDomainRecord(
    domain: string,
    recordId: number,
    record: Partial<DomainRecord>
): Promise<DomainRecord> {
    const response = await doRequest<{ domain_record: DomainRecord }>({
        method: "PUT",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`,
        data: cleanPayload(record)
    });
    return response.domain_record;
}

export async function patchDomainRecord(
    domain: string,
    recordId: number,
    record: Partial<DomainRecord>
): Promise<DomainRecord> {
    const response = await doRequest<{ domain_record: DomainRecord }>({
        method: "PATCH",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`,
        data: cleanPayload(record)
    });
    return response.domain_record;
}

export async function deleteDomainRecord(domain: string, recordId: number): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/domains/${encodeURIComponent(domain)}/records/${recordId}`
    });
}
