declare enum DeploymentStatus {
    "pending" = 0,
    "deploying" = 1,
    "running" = 2,
    "failed" = 3
}
declare enum ServerStatus {
    "provisioning" = 0,
    "running" = 1,
    "error" = 2
}
export interface Project {
    id: string;
    name: string;
    createdAt: Date;
}
export interface Deployment {
    id: string;
    projectId: string;
    status: DeploymentStatus;
}
export interface Domain {
    id: string;
    name: string;
    projectId: string;
    createdAt: Date;
}
export interface Server {
    id: string;
    provider: string;
    ip: string;
    status: ServerStatus;
}
export {};
