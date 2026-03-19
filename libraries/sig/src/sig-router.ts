import { Signal } from "./signal.js";

interface Route {
    path: string;
    component: Node;
    name?: string;
}

export class SigRouter {
    private routes: Map<string, Route> = new Map();
    private namedRoutes: Map<string, Route> = new Map();

    set(path: string, component: Node, name?: string){
        this.routes.set(path, {path, component, name})
        if(name){
            this.namedRoutes.set(name, {path, component, name})
        }

        return this;
    }

    start(){

    }
    
    navigate(path: string){
        const route = this.routes.get(path);
        if(!route) return;

        window.history.pushState({}, "", path)
    }

    goBack(){
        window.history.back();
    }
    
}


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

    })