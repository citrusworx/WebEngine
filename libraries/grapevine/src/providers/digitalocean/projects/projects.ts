import { doList, doRequest } from "../client.js";
import { cleanPayload } from "../utilities.js";

export type ProjectEnvironment = "Development" | "Staging" | "Production";

export interface ProjectBlueprint {
    name: string;
    description?: string;
    /** DigitalOcean requires a purpose string. Apply defaults this to "Other". */
    purpose?: string;
    environment?: ProjectEnvironment | string;
}

export interface Project {
    id: string;
    owner_uuid?: string;
    name: string;
    description?: string;
    purpose?: string;
    environment?: string;
    is_default?: boolean;
    created_at?: string;
    updated_at?: string;
}

export async function listProjects(): Promise<Project[]> {
    return doList<Project>("/projects", "projects");
}

export async function getProject(id: string): Promise<Project> {
    const response = await doRequest<{ project: Project }>({
        method: "GET",
        url: `/projects/${id}`
    });
    return response.project;
}

export async function getDefaultProject(): Promise<Project> {
    const response = await doRequest<{ project: Project }>({
        method: "GET",
        url: "/projects/default"
    });
    return response.project;
}

export async function createProject(blueprint: ProjectBlueprint): Promise<Project> {
    const response = await doRequest<{ project: Project }>({
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

export async function updateProject(id: string, blueprint: ProjectBlueprint): Promise<Project> {
    const response = await doRequest<{ project: Project }>({
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

export async function deleteProject(id: string): Promise<void> {
    await doRequest<void>({
        method: "DELETE",
        url: `/projects/${id}`
    });
}
