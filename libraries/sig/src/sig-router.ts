import { disposeTree } from "./jsx-runtime.js";

export type RouteParams = Record<string, string>;
export type RouteFactory = (params: RouteParams) => Node | null;
export type RouteView = Node | RouteFactory | null;
export type RouteMap = Record<string, RouteView>;

interface Route {
    path: string;
    view: RouteView;
    name?: string;
}

interface ResolvedRoute {
    route: Route;
    params: RouteParams;
}

function splitPath(path: string): string[] {
    if (path === "/" || path === "*") {
        return [];
    }

    const parts = path.split("/");
    if (parts[0] === "") {
        parts.shift();
    }

    return parts;
}

function decodeSegment(segment: string): string {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

function isParamSegment(segment: string): boolean {
    return segment.startsWith(":") && segment.length > 1;
}

function isParamPattern(path: string): boolean {
    return splitPath(path).some(isParamSegment);
}

function matchParamPattern(pattern: string, path: string): RouteParams | null {
    const patternSegments = splitPath(pattern);
    const pathSegments = splitPath(path);

    if (patternSegments.length !== pathSegments.length) {
        return null;
    }

    const params: RouteParams = {};

    for (let i = 0; i < patternSegments.length; i++) {
        const patternSegment = patternSegments[i]!;
        const pathSegment = pathSegments[i]!;

        if (isParamSegment(patternSegment)) {
            if (!pathSegment) {
                return null;
            }

            params[patternSegment.slice(1)] = decodeSegment(pathSegment);
            continue;
        }

        if (patternSegment !== pathSegment) {
            return null;
        }
    }

    return params;
}

export class SigRouter {
    private routes: Map<string, Route> = new Map();
    private namedRoutes: Map<string, string> = new Map();
    private target: string;
    private started = false;
    private readonly onDocumentClick = (e: MouseEvent) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const anchor = target.closest("a");
        if(!anchor) return;
        if(anchor.target === "_blank") return;
        if(anchor.hasAttribute("download")) return;

        const href = anchor.getAttribute("href");
        if(!href) return;
        if(href?.startsWith("http") || href?.startsWith("https")) return;
        if(href?.startsWith("mailto") || href?.startsWith("tel") || href?.startsWith("ftp")) return;

        e.preventDefault();
        this.navigate(href);
    };
    private readonly onPopState = () => {
        this.render(window.location.pathname);
    };

    constructor(target: string = "#root") {
        this.target = target;
    }

    private normalizePath(path: string): string {
        if (path === "/" || path === "*") {
            return path;
        }

        return path.startsWith("/") ? path : `/${path}`;
    }

    private resolveRoute(path: string): ResolvedRoute | undefined {
        const normalizedPath = this.normalizePath(path);
        const exact = this.routes.get(normalizedPath);
        if (exact) {
            return { route: exact, params: {} };
        }

        for (const route of this.routes.values()) {
            if (route.path === "*" || !isParamPattern(route.path)) {
                continue;
            }

            const params = matchParamPattern(route.path, normalizedPath);
            if (params) {
                return { route, params };
            }
        }

        const fallback = this.routes.get("*");
        if (fallback) {
            return { route: fallback, params: {} };
        }

        return undefined;
    }

    private register(path: string, view: RouteView, name?: string) {
        const normalizedPath = this.normalizePath(path);

        this.routes.set(normalizedPath, { path: normalizedPath, view, name });
        if (name && normalizedPath !== "*") {
            this.namedRoutes.set(name, normalizedPath);
        }
    }

    private resolveView(view: RouteView, params: RouteParams): Node | null {
        if (typeof view === "function") {
            return view(params);
        }

        return view;
    }

    set(path: string, component: RouteView, name?: string): this;
    set(routes: RouteMap): this;
    set(pathOrRoutes: string | RouteMap, component?: RouteView, name?: string) {
        if (typeof pathOrRoutes === "string") {
            this.register(pathOrRoutes, component ?? null, name);
            return this;
        }

        for (const [routeKey, routeComponent] of Object.entries(pathOrRoutes)) {
            const routeName = routeKey.startsWith("/") ? undefined : routeKey;
            this.register(routeKey, routeComponent, routeName);
        }

        return this;
    }

    get(name: string): string | undefined {
        return this.namedRoutes.get(name) ?? this.routes.get(this.normalizePath(name))?.path;
    }

    private render(path: string){
        const resolved = this.resolveRoute(path);
        const target = document.querySelector(this.target);
        if(!target) return;

        [...target.childNodes].forEach(node => disposeTree(node));

        if(!resolved) {
            target.replaceChildren();
            return;
        }

        const nextView = this.resolveView(resolved.route.view, resolved.params);
        if (!nextView) {
            target.replaceChildren();
            return;
        }

        target.replaceChildren(nextView);
    }


    start(){
        if (this.started) {
            this.render(window.location.pathname);
            return;
        }

        this.started = true;
        this.attachNavigationListeners();
        this.render(window.location.pathname);
    }
    
    navigate(path: string){
        const normalizedPath = this.normalizePath(path);
        const resolved = this.resolveRoute(normalizedPath);
        if(!resolved) return;

        window.history.pushState({}, "", normalizedPath);
        this.render(normalizedPath);
    }

    goBack(){
        window.history.back();
    }

    stop() {
        if (!this.started) {
            return;
        }

        document.removeEventListener("click", this.onDocumentClick);
        window.removeEventListener("popstate", this.onPopState);
        this.started = false;
    }

    has(path: string): boolean{
        return this.routes.has(this.normalizePath(path))
    }

    private attachNavigationListeners(){
        document.addEventListener("click", this.onDocumentClick);
        window.addEventListener("popstate", this.onPopState);
    }
}
