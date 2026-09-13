import { type GrapeConfig } from "./schema.js";
export declare function isRemoteConfigSource(source: string): boolean;
export declare function readConfigSource(source: string): Promise<string>;
export declare function parseConfigText(text: string, source?: string): unknown;
export declare function loadGrapeConfig(source: string): Promise<GrapeConfig>;
