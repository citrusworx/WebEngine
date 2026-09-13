import { parseYAML } from "../../../infrastructure/util/utilities.js";
import { doRequest } from "../client.js";
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
//# sourceMappingURL=apps.js.map