export interface BlueprintInfo {
    id: string;
    file: string;
    summary: string;
    aliases: string[];
}
export declare const DEFAULT_INIT_OUT = "grape.config.yaml";
export declare function resolveBlueprintsDir(from?: string): string;
export declare function listBlueprints(dir?: string): Promise<BlueprintInfo[]>;
export declare function resolveBlueprint(query: string, blueprints: BlueprintInfo[]): BlueprintInfo;
export declare function copyBlueprint(options: {
    query: string;
    out?: string;
    force?: boolean;
    blueprintsDir?: string;
}): Promise<{
    blueprint: BlueprintInfo;
    dest: string;
}>;
