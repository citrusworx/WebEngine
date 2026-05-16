export interface DomainReponse {
    per_page?: number;
    page?: number;
}
export declare function listAllDomains(): Promise<void>;
export declare function listExistingDomain(): Promise<void>;
export declare function createDomain(): Promise<void>;
export declare function deleteDomain(domain: string): Promise<void>;
export declare function listAllDomainRecords(): Promise<void>;
export declare function createDomainRecord(): Promise<void>;
export declare function listExistingDomainRecord(): Promise<void>;
export declare function updateDomainRecord(): Promise<void>;
export declare function deleteDomainRecord(): Promise<void>;
