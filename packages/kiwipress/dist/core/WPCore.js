function loadNodeEnvConfig() {
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
function shouldAllowSelfSigned(url) {
    try {
        const hostname = new URL(url).hostname;
        return hostname === "localhost" || hostname.endsWith(".local.citrusworx.test");
    }
    catch {
        return false;
    }
}
function encodeBase64(value) {
    const maybeBuffer = typeof Buffer !== "undefined" ? Buffer : undefined;
    if (maybeBuffer) {
        return maybeBuffer.from(value).toString("base64");
    }
    if (typeof btoa !== "undefined") {
        return btoa(value);
    }
    throw new Error("Unable to encode WordPress credentials.");
}
export class WPCore {
    config;
    constructor(config) {
        this.config = this.createConfig(config);
    }
    createConfig(overrides) {
        const envConfig = loadNodeEnvConfig();
        const url = overrides?.url ?? envConfig.url ?? "";
        const apiBase = overrides?.apiBase ?? envConfig.apiBase ?? "wp-json/wp/v2";
        const username = overrides?.username ?? envConfig.username;
        const appPassword = overrides?.appPassword ?? envConfig.appPassword;
        const token = overrides?.token ?? envConfig.token;
        const apiKey = overrides?.apiKey ?? envConfig.apiKey;
        const allowSelfSigned = overrides?.allowSelfSigned ??
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
    createAuthHeaders() {
        const headers = {
            ...this.config.headers
        };
        if (this.config.username && this.config.appPassword) {
            headers.Authorization = `Basic ${encodeBase64(`${this.config.username}:${this.config.appPassword}`)}`;
        }
        else if (this.config.token) {
            headers.Authorization = `Bearer ${this.config.token}`;
        }
        if (this.config.apiKey) {
            headers["X-API-Key"] = this.config.apiKey;
        }
        return headers;
    }
    interpolatePath(routePath, params = {}) {
        return Object.entries(params).reduce((resolvedPath, [key, value]) => {
            return resolvedPath.replace(`:${key}`, encodeURIComponent(String(value)));
        }, routePath);
    }
    getConfig() {
        return this.config;
    }
}
//# sourceMappingURL=WPCore.js.map