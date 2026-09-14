import type { Route } from "../core/types.js";
export type CompiledRoute = Route & {
    keys: string[];
    regex: RegExp;
};
export declare function compilePath(routePath: string): {
    keys: string[];
    regex: RegExp;
};
export declare function compileRoute(route: Route): CompiledRoute;
export type PathRank = {
    staticCount: number;
    paramCount: number;
    segments: number;
};
/** Rank a route path so static prefixes beat `:param` segments. */
export declare function rankPath(path: string): PathRank;
/** More static segments first, then fewer params, then longer paths. */
export declare function comparePathRank(a: PathRank, b: PathRank): number;
/**
 * First-match is not enough: `/api/products/:id` must not steal
 * `/api/products/catalog/:catalog` if a future matcher overlaps, and
 * `/items/:id` must not steal `/items/new`. Prefer the most specific path.
 */
export declare function matchRoute(routes: CompiledRoute[], method: string, path: string): CompiledRoute | undefined;
export declare function paramsFromMatch(route: CompiledRoute, path: string): Record<string, string>;
