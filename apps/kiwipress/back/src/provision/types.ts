export type WizardSnapshot = {
    databaseType?: string;
    dropletSize?: string;
    region?: string;
    domainName?: string;
    domainOption?: string;
    cdnEnabled?: boolean;
    loadBalancer?: boolean;
    sslEnabled?: boolean;
    blueprintId?: string;
    autoScaling?: boolean;
    backupFrequency?: string;
};

export type BlueprintPackId = "kiwipress-managed" | "kiwipress-compose";

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

export type ProvisionEvent = {
    at: string;
    stepId: TimelineStepId;
    status: StepStatus;
    message?: string;
};

export type AppliedDropletSummary = {
    id?: number | string;
    name: string;
    ip?: string;
    status?: string;
};

export type AppliedDatabaseSummary = {
    id: string;
    name: string;
    host?: string;
    status?: string;
};

export type ApplySummary = {
    packId: BlueprintPackId;
    region?: string;
    domain?: string;
    droplets: AppliedDropletSummary[];
    databases: AppliedDatabaseSummary[];
    warnings: string[];
};

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type ProvisionJob = {
    id: string;
    status: JobStatus;
    packId: BlueprintPackId;
    steps: ProvisionStep[];
    events: ProvisionEvent[];
    result?: ApplySummary;
    error?: string;
    createdAt: string;
    updatedAt: string;
};

export type PlanResponse = {
    packId: BlueprintPackId;
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
};
