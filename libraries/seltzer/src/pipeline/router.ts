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

export type PathRank = {
    staticCount: number;
    paramCount: number;
    segments: number;
};

/** Rank a route path so static prefixes beat `:param` segments. */
export function rankPath(path: string): PathRank {
    const segments = path.split("/").filter((segment) => segment.length > 0);
    let staticCount = 0;
    let paramCount = 0;

    for (const segment of segments) {
        if (segment.startsWith(":")) {
            paramCount += 1;
        } else {
            staticCount += 1;
        }
    }

    return { staticCount, paramCount, segments: segments.length };
}

/** More static segments first, then fewer params, then longer paths. */
export function comparePathRank(a: PathRank, b: PathRank): number {
    if (a.staticCount !== b.staticCount) {
        return b.staticCount - a.staticCount;
    }

    if (a.paramCount !== b.paramCount) {
        return a.paramCount - b.paramCount;
    }

    return b.segments - a.segments;
}

/**
 * First-match is not enough: `/api/products/:id` must not steal
 * `/api/products/catalog/:catalog` if a future matcher overlaps, and
 * `/items/:id` must not steal `/items/new`. Prefer the most specific path.
 */
export function matchRoute(
    routes: CompiledRoute[],
    method: string,
    path: string,
): CompiledRoute | undefined {
    let best: CompiledRoute | undefined;
    let bestRank: PathRank | undefined;
    let bestIndex = -1;

    for (let index = 0; index < routes.length; index += 1) {
        const route = routes[index];
        if (route.method !== method || !route.regex.test(path)) {
            continue;
        }

        const rank = rankPath(route.path);
        const better =
            !best ||
            comparePathRank(rank, bestRank!) < 0 ||
            (comparePathRank(rank, bestRank!) === 0 && index < bestIndex);

        if (better) {
            best = route;
            bestRank = rank;
            bestIndex = index;
        }
    }

    return best;
}

export function paramsFromMatch(route: CompiledRoute, path: string): Record<string, string> {
    const paramMatch = path.match(route.regex);
    const params: Record<string, string> = {};
    route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(paramMatch?.[index + 1] ?? "");
    });
    return params;
}
