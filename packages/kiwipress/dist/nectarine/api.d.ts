import type { YAMLdata } from "@citrusworx/nectarine/util";
export type NectarineApiRoute = {
    resource: string;
    operation: string;
    name: string;
    method: string;
    endpoint: string;
};
export declare function loadNectarineApi(data: YAMLdata | Record<string, unknown>): NectarineApiRoute[];
export declare function loadNectarineApiFile(filepath: string): NectarineApiRoute[];
