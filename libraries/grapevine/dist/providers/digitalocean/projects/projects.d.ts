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
export declare function listProjects(): Promise<Project[]>;
export declare function getProject(id: string): Promise<Project>;
export declare function getDefaultProject(): Promise<Project>;
export declare function createProject(blueprint: ProjectBlueprint): Promise<Project>;
export declare function updateProject(id: string, blueprint: ProjectBlueprint): Promise<Project>;
export declare function deleteProject(id: string): Promise<void>;
