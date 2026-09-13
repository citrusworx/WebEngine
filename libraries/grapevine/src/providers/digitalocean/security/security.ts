import { doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export interface SecurityFinding {
    affected_resources_count?: number;
    business_impact?: string;
    details?: string;
    found_at?: string;
    mitigation_steps?: Array<{ description?: string; step?: number; title?: string }>;
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
    tier_coverage: Record<
        string,
        {
            resources?: string[];
            tags?: string[];
        }
    >;
}

export interface PageQuery {
    per_page?: number;
    page?: number;
}

export async function listScans(query: PageQuery = {}): Promise<SecurityScan[]> {
    const response = await doRequest<{ scans: SecurityScan[] }>({
        method: "GET",
        url: "/security/scans",
        params: cleanPayload(query)
    });
    return response.scans ?? [];
}

export async function getLatestScans(): Promise<SecurityScan> {
    const response = await doRequest<{ scan: SecurityScan } | SecurityScan>({
        method: "GET",
        url: "/security/scans/latest"
    });
    return "scan" in response && response.scan ? response.scan : (response as SecurityScan);
}

export async function getScan(scanId: string): Promise<SecurityScan> {
    const response = await doRequest<{ scan: SecurityScan } | SecurityScan>({
        method: "GET",
        url: `/security/scans/${scanId}`
    });
    return "scan" in response && response.scan ? response.scan : (response as SecurityScan);
}

export async function listSettings(query: PageQuery = {}): Promise<SecuritySettings> {
    return doRequest<SecuritySettings>({
        method: "GET",
        url: "/security/settings",
        params: cleanPayload(query)
    });
}

export async function listAffectedResources(
    scanId: string,
    findingUuid: string,
    query: PageQuery = {}
): Promise<SecurityAffectedResource[]> {
    const response = await doRequest<{ resources?: SecurityAffectedResource[]; affected_resources?: SecurityAffectedResource[] }>({
        method: "GET",
        url: `/security/scans/${scanId}/findings/${findingUuid}/affected_resources`,
        params: cleanPayload(query)
    });
    return response.resources ?? response.affected_resources ?? [];
}

export async function createScan(): Promise<SecurityScan> {
    const response = await doRequest<{ scan: SecurityScan } | SecurityScan>({
        method: "POST",
        url: "/security/scans"
    });
    return "scan" in response && response.scan ? response.scan : (response as SecurityScan);
}

export async function createScanRule(resource: string): Promise<void> {
    await doRequest<void>({
        method: "POST",
        url: "/security/scans/rules",
        data: { resource }
    });
}

export async function createSuppression(request: CreateSuppressionRequest): Promise<SecuritySettings> {
    return doRequest<SecuritySettings>({
        method: "POST",
        url: "/security/settings/suppressions",
        data: request
    });
}

export async function updatePlan(request: UpdatePlanRequest): Promise<UpdatePlanRequest> {
    return doRequest<UpdatePlanRequest>({
        method: "PUT",
        url: "/security/settings/plan",
        data: request
    });
}

export async function deleteSuppression(suppressionUuid: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/security/settings/suppressions/${suppressionUuid}`
    });
}
