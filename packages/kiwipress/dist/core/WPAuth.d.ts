export type AuthStrategy = "basic" | "bearer" | "api-key" | "none";
export type WPAuthCredentials = {
    username?: string;
    appPassword?: string;
    token?: string;
    apiKey?: string;
    headers?: Record<string, string>;
};
export declare class WPAuth {
    private readonly credentials;
    constructor(credentials?: WPAuthCredentials);
    static fromConfig(config: WPAuthCredentials): WPAuth;
    strategy(): AuthStrategy;
    isConfigured(): boolean;
    headers(): Record<string, string>;
}
