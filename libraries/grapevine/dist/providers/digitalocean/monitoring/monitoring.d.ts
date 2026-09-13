export interface AlertDestination {
    email?: string[];
    slack?: Array<{
        channel: string;
        url: string;
    }>;
}
export interface CreateAlertPolicy {
    alerts: AlertDestination;
    compare?: "GreaterThan" | "LessThan";
    description: string;
    enabled: boolean;
    entities?: string[];
    tags?: string[];
    type: string;
    value: number;
    window: string;
}
export interface AlertPolicy extends CreateAlertPolicy {
    uuid: string;
}
export declare function createAlertPolicy(policy: CreateAlertPolicy): Promise<AlertPolicy>;
export declare function postAlertPolicy(policy: CreateAlertPolicy): Promise<AlertPolicy>;
export declare function listAlertPolicies(): Promise<AlertPolicy[]>;
export declare function getAlertPolicy(alert_uuid: string): Promise<AlertPolicy>;
export declare function updateAlertPolicy(alert_uuid: string, policy: CreateAlertPolicy): Promise<AlertPolicy>;
export declare function deleteAlertPolicy(alert_uuid: string): Promise<void>;
export declare const alertPolicyPresets: {
    memoryUsage: (entities: string[], value?: number) => Promise<AlertPolicy>;
    diskRead: (entities: string[], value?: number) => Promise<AlertPolicy>;
    diskUtilization: (entities: string[], value?: number) => Promise<AlertPolicy>;
    percentCPU: (entities: string[], value?: number) => Promise<AlertPolicy>;
};
