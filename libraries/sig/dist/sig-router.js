import { disposeTree } from "./jsx-runtime.js";
export class SigRouter {
    routes = new Map();
    namedRoutes = new Map();
    target;
    started = false;
    onDocumentClick = (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        const anchor = target.closest("a");
        if (!anchor)
            return;
        if (anchor.target === "_blank")
            return;
        if (anchor.hasAttribute("download"))
            return;
        const href = anchor.getAttribute("href");
        if (!href)
            return;
        if (href?.startsWith("http") || href?.startsWith("https"))
            return;
        if (href?.startsWith("mailto") || href?.startsWith("tel") || href?.startsWith("ftp"))
            return;
        e.preventDefault();
        this.navigate(href);
    };
    onPopState = () => {
        this.render(window.location.pathname);
    };
    constructor(target = "#root") {
        this.target = target;
    }
    normalizePath(path) {
        if (path === "/") {
            return path;
        }
        return path.startsWith("/") ? path : `/${path}`;
    }
    register(path, view, name) {
        const normalizedPath = this.normalizePath(path);
        this.routes.set(normalizedPath, { path: normalizedPath, view, name });
        if (name) {
            this.namedRoutes.set(name, normalizedPath);
        }
    }
    resolveView(view) {
        if (typeof view === "function") {
            return view();
        }
        return view;
    }
    set(pathOrRoutes, component, name) {
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
    get(name) {
        return this.namedRoutes.get(name) ?? this.routes.get(this.normalizePath(name))?.path;
    }
    render(path) {
        const route = this.routes.get(path);
        const target = document.querySelector(this.target);
        if (!target)
            return;
        [...target.childNodes].forEach(node => disposeTree(node));
        if (!route) {
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
    start() {
        if (this.started) {
            this.render(window.location.pathname);
            return;
        }
        this.started = true;
        this.globalanchorintercept();
        this.render(window.location.pathname);
    }
    navigate(path) {
        const route = this.routes.get(path);
        if (!route)
            return;
        window.history.pushState({}, "", path);
        this.render(path);
    }
    goBack() {
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
    has(path) {
        return this.routes.has(this.normalizePath(path));
    }
    globalanchorintercept() {
        document.addEventListener("click", this.onDocumentClick);
        window.addEventListener("popstate", this.onPopState);
    }
}
//# sourceMappingURL=sig-router.js.map