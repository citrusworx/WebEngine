import type { Endpoint, Route } from "@citrusworx/seltzer";
import type { ApiDefinition } from "../types/api.js";
/**
 * Seltzer's client does not bypass TLS. KiwiPress still stores this flag and
 * applies it in `requestWordPress` with its own fetch path.
 */
export type KiwiPressCallOptions = {
    baseUrl?: string;
    headers?: Record<string, string>;
    allowSelfSigned?: boolean;
};
export declare function kiwiCallOptions(options: KiwiPressCallOptions): NonNullable<Endpoint["options"]>;
export declare function requestWordPress(ctx: Endpoint, init?: RequestInit): Promise<any>;
export type WordPressPage = {
    data: unknown;
    total: number;
    totalPages: number;
};
export declare function requestWordPressPage(ctx: Endpoint, init?: RequestInit): Promise<WordPressPage>;
export declare function createWordPressRoute(config: ApiDefinition, init?: RequestInit): Route<Endpoint>;
export declare function getLastParam(ctx: Endpoint): string;
export declare function buildCollectionQueryEndpoint(ctx: Endpoint, collection: string, query: string): string;
export declare function createAliasedQueryRoute(config: ApiDefinition, collection: string, queryKey: string): Route<Endpoint>;
export declare function createAliasedQueryRouteFromKeys(config: ApiDefinition, collection: string, queryKeys: readonly string[]): Route<Endpoint>;
