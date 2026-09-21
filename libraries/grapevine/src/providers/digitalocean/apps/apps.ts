import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { doRequest } from "../client.js";
import { pollUntil } from "../wait.js";
import { cleanPayload } from "../utilities.js";

export interface AppServiceSpec {
    name: string;
    github?: { repo?: string; branch?: string; deploy_on_push?: boolean };
    gitlab?: { repo?: string; branch?: string; deploy_on_push?: boolean };
    image?: Record<string, unknown>;
    dockerfile_path?: string;
    source_dir?: string;
    http_port?: number;
    instance_count?: number;
    instance_size_slug?: string;
    run_command?: string;
    build_command?: string;
    envs?: Array<{ key: string; value?: string; type?: string; scope?: string }>;
    [key: string]: unknown;
}

export interface AppSpec {
    name: string;
    region?: string;
    services?: AppServiceSpec[];
    static_sites?: object[];
    workers?: object[];
    jobs?: object[];
    databases?: object[];
    domains?: object[];
    ingress?: object;
    envs?: Array<{ key: string; value?: string; type?: string; scope?: string }>;
    [key: string]: unknown;
}

export interface AppCreateRequest {
    spec: AppSpec;
    project_id?: string;
}

export interface AppResource {
    id: string;
    spec: AppSpec;
    default_ingress?: string;
    live_url?: string;
    created_at?: string;
    updated_at?: string;
    active_deployment?: AppDeployment;
    in_progress_deployment?: AppDeployment;
    last_deployment_created_at?: string;
    live_url_base?: string;
    region?: Record<string, unknown>;
}

export interface AppDeployment {
    id: string;
    spec?: AppSpec;
    phase?: string;
    created_at?: string;
    updated_at?: string;
    cause?: string;
    progress?: Record<string, unknown>;
}

export interface AppBlueprint {
    blueprint?: {
        name?: string;
        app?: AppSpec;
    };
    spec?: AppSpec;
}

export async function listApps(): Promise<AppResource[]> {
    const response = await doRequest<{ apps: AppResource[] }>({
        method: "GET",
        url: "/apps"
    });
    return response.apps ?? [];
}

export async function getApp(id: string): Promise<AppResource> {
    const response = await doRequest<{ app: AppResource }>({
        method: "GET",
        url: `/apps/${id}`
    });
    return response.app;
}

function asCreateRequest(request: AppCreateRequest | AppSpec): AppCreateRequest {
    if (typeof request === "object" && request !== null && "spec" in request) {
        const spec = (request as AppCreateRequest).spec;
        if (spec && typeof spec === "object") {
            return request as AppCreateRequest;
        }
    }
    return { spec: request as AppSpec };
}

export async function createApp(request: AppCreateRequest | AppSpec): Promise<AppResource> {
    const response = await doRequest<{ app: AppResource }>({
        method: "POST",
        url: "/apps",
        data: cleanPayload(asCreateRequest(request))
    });
    return response.app;
}

export async function createAppFromBlueprint(schematic: string): Promise<AppResource> {
    const blueprint = parseYAML<AppBlueprint>(schematic);
    const spec = blueprint.spec ?? blueprint.blueprint?.app;
    if (!spec) {
        throw new Error("App blueprint is missing spec");
    }
    return createApp({ spec });
}

export async function updateApp(id: string, request: AppCreateRequest | AppSpec): Promise<AppResource> {
    const response = await doRequest<{ app: AppResource }>({
        method: "PUT",
        url: `/apps/${id}`,
        data: cleanPayload(asCreateRequest(request))
    });
    return response.app;
}

export async function deleteApp(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/apps/${id}`
    });
}

export async function listDeployments(appId: string): Promise<AppDeployment[]> {
    const response = await doRequest<{ deployments: AppDeployment[] }>({
        method: "GET",
        url: `/apps/${appId}/deployments`
    });
    return response.deployments ?? [];
}

export async function createDeployment(
    appId: string,
    forceBuild = false
): Promise<AppDeployment> {
    const response = await doRequest<{ deployment: AppDeployment }>({
        method: "POST",
        url: `/apps/${appId}/deployments`,
        data: { force_build: forceBuild }
    });
    return response.deployment;
}

export async function getDeployment(appId: string, deploymentId: string): Promise<AppDeployment> {
    const response = await doRequest<{ deployment: AppDeployment }>({
        method: "GET",
        url: `/apps/${appId}/deployments/${deploymentId}`
    });
    return response.deployment;
}

export interface WaitForAppDeploymentOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}

/** Default App Platform poll: 10 minutes, every 5 seconds. Opt-in from grape config (`wait: true`). */
export const DEFAULT_APP_WAIT_MS = 10 * 60 * 1000;
export const DEFAULT_APP_POLL_MS = 5_000;

const APP_FAILED_PHASES = new Set(["ERROR", "CANCELED"]);

function appDeploymentPhase(app: AppResource): string | undefined {
    return app.in_progress_deployment?.phase ?? app.active_deployment?.phase;
}

function appDeploymentIsLive(app: AppResource): boolean {
    if (app.in_progress_deployment) {
        return false;
    }
    return app.active_deployment?.phase === "ACTIVE";
}

/**
 * Poll GET /apps/:id until there is no in-progress deployment and
 * `active_deployment.phase` is `ACTIVE`. ERROR and CANCELED fail immediately.
 * Juice static hosting does not use this; App Platform apply waits only when `wait: true`.
 */
export async function waitForAppDeployment(
    appId: string,
    options: WaitForAppDeploymentOptions = {}
): Promise<AppResource> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_APP_WAIT_MS;
    const intervalMs = options.intervalMs ?? DEFAULT_APP_POLL_MS;
    return pollUntil({
        timeoutMs,
        intervalMs,
        sleep: options.sleep,
        read: () => getApp(appId),
        done: appDeploymentIsLive,
        failure: (app) => {
            const phase = appDeploymentPhase(app);
            if (phase && APP_FAILED_PHASES.has(phase) && !app.in_progress_deployment) {
                return `DigitalOcean app ${appId} deployment entered phase "${phase}"`;
            }
            if (app.in_progress_deployment?.phase && APP_FAILED_PHASES.has(app.in_progress_deployment.phase)) {
                return `DigitalOcean app ${appId} deployment entered phase "${app.in_progress_deployment.phase}"`;
            }
            return undefined;
        },
        timeoutError: (app) =>
            `Timed out waiting for DigitalOcean app ${appId} deployment to become ACTIVE (last phase: ${appDeploymentPhase(app) ?? "none"})`
    });
}
