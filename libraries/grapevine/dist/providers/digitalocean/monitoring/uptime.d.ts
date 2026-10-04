export type UptimeCheckType = "ping" | "http" | "https" | (string & {});
export interface UptimeCheckBlueprint {
    name: string;
    type: UptimeCheckType;
    target: string;
    regions: string[];
    enabled?: boolean;
}
export interface UptimeCheck extends UptimeCheckBlueprint {
    id: string;
    enabled: boolean;
}
export declare function listUptimeChecks(): Promise<UptimeCheck[]>;
export declare function getUptimeCheck(id: string): Promise<UptimeCheck>;
export declare function createUptimeCheck(blueprint: UptimeCheckBlueprint): Promise<UptimeCheck>;
export declare function updateUptimeCheck(id: string, blueprint: UptimeCheckBlueprint): Promise<UptimeCheck>;
export declare function deleteUptimeCheck(id: string): Promise<void>;
