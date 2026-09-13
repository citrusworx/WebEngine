export interface Domain {
    name: string;
    ttl?: number;
    zone_file?: string;
}
export interface DomainCreateRequest {
    name: string;
    ip_address?: string;
}
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
export declare function listAllDomains(query?: DomainListQuery): Promise<Domain[]>;
export declare function listExistingDomain(domain: string): Promise<Domain>;
export declare function createDomain(request: DomainCreateRequest): Promise<Domain>;
export declare function deleteDomain(domain: string): Promise<void>;
export declare function listAllDomainRecords(domain: string, query?: DomainRecordQuery): Promise<DomainRecord[]>;
export declare function createDomainRecord(domain: string, record: DomainRecord): Promise<DomainRecord>;
export declare function listExistingDomainRecord(domain: string, recordId: number): Promise<DomainRecord>;
export declare function updateDomainRecord(domain: string, recordId: number, record: Partial<DomainRecord>): Promise<DomainRecord>;
export declare function patchDomainRecord(domain: string, recordId: number, record: Partial<DomainRecord>): Promise<DomainRecord>;
export declare function deleteDomainRecord(domain: string, recordId: number): Promise<void>;
