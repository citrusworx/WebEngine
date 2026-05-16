import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api";
export declare function requestWordPress(ctx: Endpoint, init?: RequestInit): Promise<any>;
export declare function createWordPressRoute(config: ApiDefinition, init?: RequestInit): Route<Endpoint>;
export declare function getLastParam(ctx: Endpoint): string;
export declare function buildCollectionQueryEndpoint(ctx: Endpoint, collection: string, query: string): string;
export declare function createAliasedQueryRoute(config: ApiDefinition, collection: string, queryKey: string): Route<Endpoint>;
