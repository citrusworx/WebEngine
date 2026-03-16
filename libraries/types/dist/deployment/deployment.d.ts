import { DeploymentStatus } from "./deployment-status.js";
import { Environment } from "../environment/environment.js";
export interface Deployment {
    id: string;
    projectId: string;
    environment: Environment;
    status: DeploymentStatus;
    createdAt: Date;
    updatedAt?: Date;
}
