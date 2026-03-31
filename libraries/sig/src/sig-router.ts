import { Signal } from "./signal.js";

interface Route {
    path: string;
    component: Node | null;
    name?: string;
}

export class SigRouter {
    private routes: Map<string, Route> = new Map();
    private namedRoutes: Map<string, string> = new Map();
    private target: string;

    constructor(target: string = "#root") {
        this.target = target;
    }

    set(path: string, component: Node | null, name?: string){
        this.routes.set(path, {path, component, name})
        if(name){
            this.namedRoutes.set(name, path)
        }

        return this;
    }

    get(name: string){

        if(name){
            return this.namedRoutes.get(name);
        }
        return this.routes.get(name);
    }

    private render(path: string){
        const route = this.routes.get(path);
        if(!route || !route.component) return;
        const target = document.querySelector(this.target);
        if(!target) return;
        target.replaceChildren(route.component);
    }


    start(){
        this.globalanchorintercept();
    }
    
    navigate(path: string){
        const route = this.routes.get(path);
        if(!route) return;

        window.history.pushState({}, "", path);
        this.render(path);
    }

    goBack(){
        window.history.back();
    }

    has(path: string): boolean{
        return this.routes.has(path)
    }

    private globalanchorintercept(){
            document.addEventListener('click', (e) => {
                const anchor = (e.target as HTMLElement).closest('a');
                if(!anchor) return;
                if(anchor.target === "_blank") return;
                if(anchor.hasAttribute("download")) return;

                const href = anchor.getAttribute("href");
                if(!href) return;
                if(href?.startsWith("http") || href?.startsWith("https")) return;
                if(href?.startsWith("mailto") || href?.startsWith("tel") || href?.startsWith("ftp")) return;

                e.preventDefault();
                this.navigate(href);
        })

        window.addEventListener('popstate', () => {
            this.render(window.location.pathname);
        }
        )
    }
}