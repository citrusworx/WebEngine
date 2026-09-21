export interface AppServiceSpec {
    name: string;
    github?: {
        repo?: string;
        branch?: string;
        deploy_on_push?: boolean;
    };
    gitlab?: {
        repo?: string;
        branch?: string;
        deploy_on_push?: boolean;
    };
    image?: Record<string, unknown>;
    dockerfile_path?: string;
    source_dir?: string;
    http_port?: number;
    instance_count?: number;
    instance_size_slug?: string;
    run_command?: string;
    build_command?: string;
    envs?: Array<{
        key: string;
        value?: string;
        type?: string;
        scope?: string;
    }>;
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
    envs?: Array<{
        key: string;
        value?: string;
        type?: string;
        scope?: string;
    }>;
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
export declare function listApps(): Promise<AppResource[]>;
export declare function getApp(id: string): Promise<AppResource>;
export declare function createApp(request: AppCreateRequest | AppSpec): Promise<AppResource>;
export declare function createAppFromBlueprint(schematic: string): Promise<AppResource>;
export declare function updateApp(id: string, request: AppCreateRequest | AppSpec): Promise<AppResource>;
export declare function deleteApp(id: string): Promise<void>;
export declare function listDeployments(appId: string): Promise<AppDeployment[]>;
export declare function createDeployment(appId: string, forceBuild?: boolean): Promise<AppDeployment>;
export declare function getDeployment(appId: string, deploymentId: string): Promise<AppDeployment>;
export interface WaitForAppDeploymentOptions {
    timeoutMs?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
}
/** Default App Platform poll: 10 minutes, every 5 seconds. Opt-in from grape config (`wait: true`). */
export declare const DEFAULT_APP_WAIT_MS: number;
export declare const DEFAULT_APP_POLL_MS = 5000;
/**
 * Poll GET /apps/:id until there is no in-progress deployment and
 * `active_deployment.phase` is `ACTIVE`. ERROR and CANCELED fail immediately.
 * Juice static hosting does not use this; App Platform apply waits only when `wait: true`.
 */
export declare function waitForAppDeployment(appId: string, options?: WaitForAppDeploymentOptions): Promise<AppResource>;
