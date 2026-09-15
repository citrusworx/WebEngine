import { WPAuth } from "./WPAuth.js";

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

function loadNodeEnvConfig(): Partial<WPCoreConfig> {
    const maybeProcess = typeof process !== "undefined" ? process : undefined;

    if (!maybeProcess?.versions?.node) {
        return {};
    }

    return {
        url: maybeProcess.env.WP_URL?.trim(),
        apiBase: maybeProcess.env.WP_API?.trim(),
        username: maybeProcess.env.WP_USER?.trim(),
        appPassword: maybeProcess.env.WP_APP_PASSWORD?.trim(),
        token: maybeProcess.env.WP_TOKEN?.trim(),
        apiKey: maybeProcess.env.WP_API_KEY?.trim(),
        allowSelfSigned: maybeProcess.env.WP_ALLOW_SELF_SIGNED?.trim()
            ? /^(1|true|yes)$/i.test(maybeProcess.env.WP_ALLOW_SELF_SIGNED.trim())
            : undefined
    };
}

function shouldAllowSelfSigned(url: string): boolean {
    try {
        const hostname = new URL(url).hostname;
        return hostname === "localhost" || hostname.endsWith(".local.citrusworx.test");
    } catch {
        return false;
    }
}

export class WPCore {
    protected readonly config: WPCoreConfig;
    protected readonly auth: WPAuth;

    constructor(config?: Partial<WPCoreConfig>) {
        this.config = this.createConfig(config);
        this.auth = WPAuth.fromConfig(this.config);
    }

    protected createConfig(overrides?: Partial<WPCoreConfig>): WPCoreConfig {
        const envConfig = loadNodeEnvConfig();
        const url = overrides?.url ?? envConfig.url ?? "";
        const apiBase = overrides?.apiBase ?? envConfig.apiBase ?? "wp-json/wp/v2";
        const username = overrides?.username ?? envConfig.username;
        const appPassword = overrides?.appPassword ?? envConfig.appPassword;
        const token = overrides?.token ?? envConfig.token;
        const apiKey = overrides?.apiKey ?? envConfig.apiKey;
        const allowSelfSigned =
            overrides?.allowSelfSigned ??
            envConfig.allowSelfSigned ??
            shouldAllowSelfSigned(url);
        const headers = overrides?.headers ?? {};

        if (!url) {
            throw new Error("WPCore requires a WordPress URL via config.url or process.env.WP_URL.");
        }

        return {
            url: url.replace(/\/+$/, ""),
            apiBase: apiBase.replace(/^\/+/, "").replace(/\/+$/, ""),
            username,
            appPassword,
            token,
            apiKey,
            allowSelfSigned,
            headers
        };
    }

    protected createAuthHeaders(): Record<string, string> {
        return this.auth.headers();
    }

    protected interpolatePath(routePath: string, params: RouteParams = {}): string {
        return Object.entries(params).reduce((resolvedPath, [key, value]) => {
            return resolvedPath.replace(`:${key}`, encodeURIComponent(String(value)));
        }, routePath);
    }

    protected getConfig(): WPCoreConfig {
        return this.config;
    }
}
