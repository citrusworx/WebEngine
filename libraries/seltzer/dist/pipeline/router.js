function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function compilePath(routePath) {
    const keys = [];
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
export function compileRoute(route) {
    return {
        ...route,
        ...compilePath(route.path),
    };
}
export function matchRoute(routes, method, path) {
    return routes.find((route) => route.method === method && route.regex.test(path));
}
export function paramsFromMatch(route, path) {
    const paramMatch = path.match(route.regex);
    const params = {};
    route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(paramMatch?.[index + 1] ?? "");
    });
    return params;
}
//# sourceMappingURL=router.js.map