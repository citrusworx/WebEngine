export interface SecurityFinding {
    affected_resources_count?: number;
    business_impact?: string;
    details?: string;
    found_at?: string;
    mitigation_steps?: Array<{
        description?: string;
        step?: number;
        title?: string;
    }>;
    name?: string;
    rule_uuid?: string;
    severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
    technical_details?: string;
    uuid?: string;
}
export interface SecurityScan {
    id: string;
    created_at?: string;
    status?: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CSPM_NOT_ENABLED" | "SCAN_NOT_RUN" | string;
    findings?: SecurityFinding[];
}
export interface SecuritySettings {
    plan_downgrades?: Record<string, unknown>;
    settings?: {
        suppressions?: Record<string, unknown>;
        [key: string]: unknown;
    };
    tier_coverage?: Record<string, unknown>;
    resources?: SecuritySuppression[];
}
export interface SecuritySuppression {
    id?: string;
    resource_id?: string;
    resource_type?: string;
    rule_name?: string;
    rule_uuid?: string;
}
export interface SecurityAffectedResource {
    urn?: string;
    name?: string;
    resource_id?: string;
    resource_type?: string;
}
export interface CreateSuppressionRequest {
    rule_uuid: string;
    resources: string[];
}
export interface UpdatePlanRequest {
    tier_coverage: Record<string, {
        resources?: string[];
        tags?: string[];
    }>;
}
export interface PageQuery {
    per_page?: number;
    page?: number;
}
export declare function listScans(query?: PageQuery): Promise<SecurityScan[]>;
export declare function getLatestScans(): Promise<SecurityScan>;
export declare function getScan(scanId: string): Promise<SecurityScan>;
export declare function listSettings(query?: PageQuery): Promise<SecuritySettings>;
export declare function listAffectedResources(scanId: string, findingUuid: string, query?: PageQuery): Promise<SecurityAffectedResource[]>;
export declare function createScan(): Promise<SecurityScan>;
export declare function createScanRule(resource: string): Promise<void>;
export declare function createSuppression(request: CreateSuppressionRequest): Promise<SecuritySettings>;
export declare function updatePlan(request: UpdatePlanRequest): Promise<UpdatePlanRequest>;
export declare function deleteSuppression(suppressionUuid: string): Promise<void>;
