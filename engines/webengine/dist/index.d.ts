import { Blueprint } from "@citrusworx/types";
import { Environment } from "@citrusworx/types/environment/environment.js";
export declare class WebEngine {
    private currentBlueprint?;
    private manifest;
    constructor();
    start(): void;
    loadBlueprint(blueprint: Blueprint, custom?: string): void;
    resolveModules(): void;
    deploy(env: Environment): void;
    private validateBlueprint;
    private buildManifest;
}
