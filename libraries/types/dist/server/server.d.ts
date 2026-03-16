import { ServerStatus } from "./server-status.js";
import { CloudProvider } from "../cloud/cloud-provider.js";
export interface Server {
    id: string;
    projectId: string;
    provider: CloudProvider;
    ip: string;
    status: ServerStatus;
}
