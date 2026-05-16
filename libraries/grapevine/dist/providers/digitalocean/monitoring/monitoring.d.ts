export declare const postAlertPolicy: (policy: string) => Promise<any>;
export interface CreateAlertPolicy {
    id?: number;
    alerts: Record<string, string>;
    description: string;
    enabled: boolean;
    entities: string[];
    tags: string[];
    type: string;
    value: number;
    window: string;
}
export declare const createAlertPolicy: {
    memoryUsage: (name: string) => void;
    diskRead: (id: number) => void;
    diskUtilization: (id: number) => void;
    percentCPU: (id: number) => void;
};
