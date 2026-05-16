export type WPCoreConfig = {
    url: string;
    apiBase: string;
    username?: string;
    appPassword?: string;
    token?: string;
    apiKey?: string;
    allowSelfSigned?: boolean;
    headers?: Record<string, string>;
};
export type RouteParams = Record<string, string | number>;
export declare class WPCore {
    protected readonly config: WPCoreConfig;
    constructor(config?: Partial<WPCoreConfig>);
    protected createConfig(overrides?: Partial<WPCoreConfig>): WPCoreConfig;
    protected createAuthHeaders(): Record<string, string>;
    protected interpolatePath(routePath: string, params?: RouteParams): string;
    protected getConfig(): WPCoreConfig;
}
