interface Route {
    path: string;
    component: Node | null;
    name?: string;
}
export declare class SigRouter {
    private routes;
    private namedRoutes;
    private target;
    constructor(target?: string);
    set(path: string, component: Node | null, name?: string): this;
    get(name: string): string | Route | undefined;
    private render;
    start(): void;
    navigate(path: string): void;
    goBack(): void;
    has(path: string): boolean;
    private globalanchorintercept;
}
export {};
