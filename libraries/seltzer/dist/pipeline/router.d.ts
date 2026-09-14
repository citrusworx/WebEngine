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
export declare function matchRoute(routes: CompiledRoute[], method: string, path: string): CompiledRoute | undefined;
export declare function paramsFromMatch(route: CompiledRoute, path: string): Record<string, string>;
