import type { Route } from "../core/types.js";

export type CompiledRoute = Route & {
    keys: string[];
    regex: RegExp;
};

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function compilePath(routePath: string) {
    const keys: string[] = [];
    const pattern = routePath
        .split("/")
        .map((segment) => {
            if (segment.startsWith(":")) {
                keys.push(segment.slice(1));
                return "([^/]+)";
            }
            return escapeRegex(segment);
        })
        .join("/");

    return {
        keys,
        regex: new RegExp(`^${pattern}$`),
    };
}

export function compileRoute(route: Route): CompiledRoute {
    return {
        ...route,
        ...compilePath(route.path),
    };
}

export function matchRoute(
    routes: CompiledRoute[],
    method: string,
    path: string,
): CompiledRoute | undefined {
    return routes.find((route) => route.method === method && route.regex.test(path));
}

export function paramsFromMatch(route: CompiledRoute, path: string): Record<string, string> {
    const paramMatch = path.match(route.regex);
    const params: Record<string, string> = {};
    route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(paramMatch?.[index + 1] ?? "");
    });
    return params;
}
