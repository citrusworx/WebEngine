import { gatewayFetch } from "../../api";
import type { WizardData } from "./state";

export type TimelineStepId =
    | "droplet"
    | "docker"
    | "stack"
    | "db"
    | "backup"
    | "health"
    | "ssl"
    | "complete";

export type StepStatus = "pending" | "running" | "completed" | "failed";

export type ProvisionStep = {
    id: TimelineStepId;
    label: string;
    status: StepStatus;
    timestamp?: string;
    logs?: string[];
};

export type ApplySummary = {
    packId: string;
    region?: string;
    domain?: string;
    droplets: Array<{ id?: number | string; name: string; ip?: string; status?: string }>;
    databases: Array<{ id: string; name: string; host?: string; status?: string }>;
    warnings: string[];
};

export type PlanResponse = {
    packId: string;
    region?: string;
    dropletSize?: string;
    doSize: string;
    steps: ProvisionStep[];
    plan: {
        provider: string;
        region?: string;
        counts: Record<string, number>;
        resources: Array<{ kind: string; name: string; detail: Record<string, string> }>;
        warnings: string[];
    };
    warnings: string[];
    error?: string;
};

export type JobResponse = {
    id: string;
    status: "queued" | "running" | "succeeded" | "failed";
    packId: string;
    steps: ProvisionStep[];
    events: Array<{ at: string; stepId: TimelineStepId; status: StepStatus; message?: string }>;
    result?: ApplySummary;
    error?: string;
};

export type ApiError = {
    error?: string;
    env?: string;
    packId?: string;
};

async function readBody<T>(response: Response): Promise<T & ApiError> {
    const payload = (await response.json().catch(() => ({}))) as T & ApiError;
    if (!response.ok) {
        const error = new Error(payload.error || `Provision request failed (${response.status})`);
        (error as Error & { status: number; body: T & ApiError }).status = response.status;
        (error as Error & { status: number; body: T & ApiError }).body = payload;
        throw error;
    }
    return payload;
}

export function wizardSnapshot(data: WizardData): Record<string, unknown> {
    return {
        databaseType: data.databaseType,
        dropletSize: data.dropletSize,
        region: data.region,
        domainName: data.domainName,
        domainOption: data.domainOption,
        cdnEnabled: data.cdnEnabled,
        loadBalancer: data.loadBalancer,
        sslEnabled: data.sslEnabled,
        blueprintId: data.blueprintId,
        autoScaling: data.autoScaling,
        backupFrequency: data.backupFrequency
    };
}

export function planProvision(data: WizardData): Promise<PlanResponse> {
    return gatewayFetch("/provision/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wizardSnapshot(data))
    }).then((response) => readBody<PlanResponse>(response));
}

export function applyProvision(data: WizardData): Promise<JobResponse> {
    return gatewayFetch("/provision/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wizardSnapshot(data))
    }).then((response) => readBody<JobResponse>(response));
}

export function getProvisionJob(id: string): Promise<JobResponse> {
    return gatewayFetch(`/provision/${encodeURIComponent(id)}`).then((response) =>
        readBody<JobResponse>(response)
    );
}
