export class SigRouter {
    routes = new Map();
    namedRoutes = new Map();
    target;
    constructor(target = "#root") {
        this.target = target;
    }
    set(path, component, name) {
        this.routes.set(path, { path, component, name });
        if (name) {
            this.namedRoutes.set(name, path);
        }
        return this;
    }
    get(name) {
        if (name) {
            return this.namedRoutes.get(name);
        }
        return this.routes.get(name);
    }
    render(path) {
        const route = this.routes.get(path);
        if (!route || !route.component)
            return;
        const target = document.querySelector(this.target);
        if (!target)
            return;
        target.replaceChildren(route.component);
    }
    start() {
        this.globalanchorintercept();
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
    has(path) {
        return this.routes.has(path);
    }
    globalanchorintercept() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
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
        });
        window.addEventListener('popstate', () => {
            this.render(window.location.pathname);
        });
    }
}
//# sourceMappingURL=sig-router.js.map