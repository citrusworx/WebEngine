import { Blueprint } from "../blueprint/blueprint.js";
import { Environment } from "../environment/environment.js";
export interface DeploymentManifest {
    id: string;
    createdAt: Date;
    projectId: string;
    blueprint: Blueprint;
    environment: Environment;
    modules: string[];
    services: string[];
    adapters?: {
        commerce?: string;
        cms?: string;
        payments?: string;
        storage?: string;
    };
    infrastructure: {
        server: boolean;
        database: boolean;
    };
}
