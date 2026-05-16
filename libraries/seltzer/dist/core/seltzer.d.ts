export type Endpoint = {
    route?: Route;
    path: string;
    endpoint: string;
    options?: {
        baseUrl?: string;
        headers?: Record<string, string>;
        allowSelfSigned?: boolean;
    };
};
export type Route<TContext = any> = {
    method: string;
    path: string;
    handler: (ctx: TContext) => any;
};
type HandlerConfig = {
    adapter: string;
    options: {
        baseUrl?: string;
        headers?: Record<string, string>;
        allowSelfSigned?: boolean;
    };
};
export declare class Seltzer {
    private routes;
    private config;
    static init(): Seltzer;
    route(route: Route): this;
    handler(config: HandlerConfig): this;
    listen(port: number): void;
}
export {};
