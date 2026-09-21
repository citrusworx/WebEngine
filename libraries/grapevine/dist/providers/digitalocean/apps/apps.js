import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { doRequest } from "../client.js";
import { pollUntil } from "../wait.js";
import { cleanPayload } from "../utilities.js";
export async function listApps() {
    const response = await doRequest({
        method: "GET",
        url: "/apps"
    });
    return response.apps ?? [];
}
export async function getApp(id) {
    const response = await doRequest({
        method: "GET",
        url: `/apps/${id}`
    });
    return response.app;
}
function asCreateRequest(request) {
    if (typeof request === "object" && request !== null && "spec" in request) {
        const spec = request.spec;
        if (spec && typeof spec === "object") {
            return request;
        }
    }
    return { spec: request };
}
export async function createApp(request) {
    const response = await doRequest({
        method: "POST",
        url: "/apps",
        data: cleanPayload(asCreateRequest(request))
    });
    return response.app;
}
export async function createAppFromBlueprint(schematic) {
    const blueprint = parseYAML(schematic);
    const spec = blueprint.spec ?? blueprint.blueprint?.app;
    if (!spec) {
        throw new Error("App blueprint is missing spec");
    }
    return createApp({ spec });
}
export async function updateApp(id, request) {
    const response = await doRequest({
        method: "PUT",
        url: `/apps/${id}`,
        data: cleanPayload(asCreateRequest(request))
    });
    return response.app;
}
export async function deleteApp(id) {
    await doRequest({
        method: "DELETE",
        url: `/apps/${id}`
    });
}
export async function listDeployments(appId) {
    const response = await doRequest({
        method: "GET",
        url: `/apps/${appId}/deployments`
    });
    return response.deployments ?? [];
}
export async function createDeployment(appId, forceBuild = false) {
    const response = await doRequest({
        method: "POST",
        url: `/apps/${appId}/deployments`,
        data: { force_build: forceBuild }
    });
    return response.deployment;
}
export async function getDeployment(appId, deploymentId) {
    const response = await doRequest({
        method: "GET",
        url: `/apps/${appId}/deployments/${deploymentId}`
    });
    return response.deployment;
}
/** Default App Platform poll: 10 minutes, every 5 seconds. Opt-in from grape config (`wait: true`). */
export const DEFAULT_APP_WAIT_MS = 10 * 60 * 1000;
export const DEFAULT_APP_POLL_MS = 5_000;
const APP_FAILED_PHASES = new Set(["ERROR", "CANCELED"]);
function appDeploymentPhase(app) {
    return app.in_progress_deployment?.phase ?? app.active_deployment?.phase;
}
function appDeploymentIsLive(app) {
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
export async function waitForAppDeployment(appId, options = {}) {
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
        timeoutError: (app) => `Timed out waiting for DigitalOcean app ${appId} deployment to become ACTIVE (last phase: ${appDeploymentPhase(app) ?? "none"})`
    });
}
//# sourceMappingURL=apps.js.map