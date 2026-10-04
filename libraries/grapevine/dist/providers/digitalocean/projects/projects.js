import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";
export async function listProjects() {
    return doList("/projects", "projects");
}
export async function getProject(id) {
    const response = await doRequest({
        method: "GET",
        url: `/projects/${id}`
    });
    return response.project;
}
export async function getDefaultProject() {
    const response = await doRequest({
        method: "GET",
        url: "/projects/default"
    });
    return response.project;
}
export async function createProject(blueprint) {
    const response = await doRequest({
        method: "POST",
        url: "/projects",
        data: cleanPayload({
            name: blueprint.name,
            description: blueprint.description,
            purpose: blueprint.purpose ?? "Other",
            environment: blueprint.environment
        })
    });
    return response.project;
}
export async function updateProject(id, blueprint) {
    const response = await doRequest({
        method: "PUT",
        url: `/projects/${id}`,
        data: cleanPayload({
            name: blueprint.name,
            description: blueprint.description,
            purpose: blueprint.purpose,
            environment: blueprint.environment
        })
    });
    return response.project;
}
export async function deleteProject(id) {
    await doRequest({
        method: "DELETE",
        url: `/projects/${id}`
    });
}
//# sourceMappingURL=projects.js.map