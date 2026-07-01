type RouteFactory = () => Node | null;
type RouteView = Node | RouteFactory | null;
type RouteMap = Record<string, RouteView>;
export declare class SigRouter {
    private routes;
    private namedRoutes;
    private target;
    private started;
    private readonly onDocumentClick;
    private readonly onPopState;
    constructor(target?: string);
    private normalizePath;
    private register;
    private resolveView;
    set(path: string, component: RouteView, name?: string): this;
    set(routes: RouteMap): this;
    get(name: string): string | undefined;
    private render;
    start(): void;
    navigate(path: string): void;
    goBack(): void;
    stop(): void;
    has(path: string): boolean;
    private globalanchorintercept;
}
export {};
