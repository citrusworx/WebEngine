export type AuthStrategy = "basic" | "bearer" | "api-key" | "none";

export type WPAuthCredentials = {
    username?: string;
    appPassword?: string;
    token?: string;
    apiKey?: string;
    headers?: Record<string, string>;
};

function encodeBase64(value: string): string {
    const maybeBuffer = typeof Buffer !== "undefined" ? Buffer : undefined;

    if (maybeBuffer) {
        return maybeBuffer.from(value).toString("base64");
    }

    if (typeof btoa !== "undefined") {
        return btoa(value);
    }

    throw new Error("Unable to encode WordPress credentials.");
}

export class WPAuth {
    constructor(private readonly credentials: WPAuthCredentials = {}) {}

    static fromConfig(config: WPAuthCredentials): WPAuth {
        return new WPAuth({
            username: config.username,
            appPassword: config.appPassword,
            token: config.token,
            apiKey: config.apiKey,
            headers: config.headers
        });
    }

    strategy(): AuthStrategy {
        if (this.credentials.username && this.credentials.appPassword) {
            return "basic";
        }

        if (this.credentials.token) {
            return "bearer";
        }

        if (this.credentials.apiKey) {
            return "api-key";
        }

        return "none";
    }

    isConfigured(): boolean {
        return this.strategy() !== "none";
    }

    headers(): Record<string, string> {
        const headers: Record<string, string> = {
            ...(this.credentials.headers ?? {})
        };

        if (this.credentials.username && this.credentials.appPassword) {
            headers.Authorization = `Basic ${encodeBase64(`${this.credentials.username}:${this.credentials.appPassword}`)}`;
        } else if (this.credentials.token) {
            headers.Authorization = `Bearer ${this.credentials.token}`;
        }

        if (this.credentials.apiKey) {
            headers["X-API-Key"] = this.credentials.apiKey;
        }

        return headers;
    }
}
