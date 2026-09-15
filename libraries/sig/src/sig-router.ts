import { disposeTree } from "./jsx-runtime.js";

interface Route {
    path: string;
    view: RouteView;
    name?: string;
}

type RouteFactory = () => Node | null;
type RouteView = Node | RouteFactory | null;
type RouteMap = Record<string, RouteView>;

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

    private resolveRoute(path: string): Route | undefined {
        const normalizedPath = this.normalizePath(path);
        return this.routes.get(normalizedPath) ?? this.routes.get("*");
    }

    private register(path: string, view: RouteView, name?: string) {
        const normalizedPath = this.normalizePath(path);

        this.routes.set(normalizedPath, { path: normalizedPath, view, name });
        if (name && normalizedPath !== "*") {
            this.namedRoutes.set(name, normalizedPath);
        }
    }

    private resolveView(view: RouteView): Node | null {
        if (typeof view === "function") {
            return view();
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
        const route = this.resolveRoute(path);
        const target = document.querySelector(this.target);
        if(!target) return;

        [...target.childNodes].forEach(node => disposeTree(node));

        if(!route) {
            target.replaceChildren();
            return;
        }

        const nextView = this.resolveView(route.view);
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
        const route = this.resolveRoute(normalizedPath);
        if(!route) return;

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
