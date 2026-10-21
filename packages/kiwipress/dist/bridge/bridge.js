import { WPCore } from "../core/WPCore.js";
import { kiwiCallOptions, sendWordPressRequest } from "../core/route-utils.js";
import { BridgeError } from "./errors.js";
const BRIDGE_API_BASE = "wp-json/kiwipress/v1";
const REQUEST_TIMEOUT_MS = 10_000;
const SETTINGS_KEYS = ["frontend_url", "lockdown", "paired", "project_label"];
function wordpressMessage(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "";
    }
    const message = body.message;
    if (typeof message !== "string") {
        return "";
    }
    const trimmed = message.trim();
    return trimmed.length > 300 ? `${trimmed.slice(0, 300)}…` : trimmed;
}
function withDetail(message, detail) {
    if (!detail || message.includes(detail)) {
        return message;
    }
    return `${message} ${detail}`;
}
function errorForStatus(status, endpoint, body) {
    const detail = wordpressMessage(body);
    if (status === 404 && endpoint.includes("/kiwipress/v1")) {
        return new BridgeError("plugin_missing", withDetail("The KiwiPress Bridge plugin is not available at kiwipress/v1 (HTTP 404). Install and activate it, and confirm /wp-json is reachable.", detail), 404);
    }
    if (status === 401) {
        return new BridgeError("bad_credentials", withDetail("WordPress rejected the username or application password.", detail), 401);
    }
    if (status === 403) {
        return new BridgeError("insufficient_role", withDetail("This WordPress user does not have the manage_options capability. Pair with an administrator application password.", detail), 403);
    }
    return new BridgeError("request_failed", withDetail(`WordPress request failed with HTTP ${status}.`, detail), status);
}
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function requireBoolean(record, key, code, message) {
    const value = record[key];
    if (typeof value !== "boolean") {
        throw new BridgeError(code, message);
    }
    return value;
}
function parseHealth(body) {
    if (!isRecord(body) || typeof body.plugin_version !== "string" || typeof body.site_url !== "string") {
        throw new BridgeError("request_failed", "The health response was not from the KiwiPress Bridge plugin.");
    }
    return {
        plugin_version: body.plugin_version,
        wp_version: typeof body.wp_version === "string" ? body.wp_version : "",
        lockdown: requireBoolean(body, "lockdown", "request_failed", "The health response was not from the KiwiPress Bridge plugin."),
        paired: requireBoolean(body, "paired", "request_failed", "The health response was not from the KiwiPress Bridge plugin."),
        frontend_url_set: requireBoolean(body, "frontend_url_set", "request_failed", "The health response was not from the KiwiPress Bridge plugin."),
        site_url: body.site_url
    };
}
function parseSettings(body) {
    if (!isRecord(body) || typeof body.frontend_url !== "string" || typeof body.project_label !== "string") {
        throw new BridgeError("request_failed", "WordPress did not return KiwiPress Bridge settings.");
    }
    return {
        frontend_url: body.frontend_url,
        lockdown: requireBoolean(body, "lockdown", "request_failed", "WordPress did not return KiwiPress Bridge settings."),
        paired: requireBoolean(body, "paired", "request_failed", "WordPress did not return KiwiPress Bridge settings."),
        project_label: body.project_label
    };
}
function hasManageOptions(body) {
    const capabilities = body.capabilities;
    if (!isRecord(capabilities)) {
        return false;
    }
    return capabilities.manage_options === true;
}
/**
 * Client for the KiwiPress Bridge plugin.
 *
 * The library owns HTTP. `health()` is unauthenticated. Settings calls and
 * `verifyCredentials()` send the same application-password basic auth the
 * content client uses. `verifyCredentials()` makes one authenticated request:
 * `GET /wp/v2/users/me?context=edit`.
 */
export class Bridge extends WPCore {
    constructor(config) {
        super({
            ...(config ?? {}),
            apiBase: BRIDGE_API_BASE
        });
    }
    /** `GET /wp-json/kiwipress/v1/health`. No Authorization header. */
    async health() {
        const endpoint = this.endpoint("/health");
        const body = await this.request(endpoint, { method: "GET" }, false);
        return parseHealth(body);
    }
    /** `GET /wp-json/kiwipress/v1/settings`. Requires manage_options. */
    async getSettings() {
        const endpoint = this.endpoint("/settings");
        const body = await this.request(endpoint, { method: "GET" }, true);
        return parseSettings(body);
    }
    /**
     * `POST /wp-json/kiwipress/v1/settings` with the provided keys only.
     * Omitted keys are left unchanged on the site.
     */
    async saveSettings(partial) {
        const payload = {};
        for (const key of SETTINGS_KEYS) {
            if (partial[key] !== undefined) {
                payload[key] = partial[key];
            }
        }
        const endpoint = this.endpoint("/settings");
        const body = await this.request(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, true);
        return parseSettings(body);
    }
    /**
     * Confirm the application password belongs to a user who can manage options.
     * This is the only authenticated call in the check: `GET /wp/v2/users/me?context=edit`.
     */
    async verifyCredentials() {
        const endpoint = `${this.config.url}/wp-json/wp/v2/users/me?context=edit`;
        const body = await this.request(endpoint, { method: "GET" }, true);
        if (!isRecord(body) || typeof body.id !== "number") {
            throw new BridgeError("request_failed", "WordPress did not return the current user from /wp/v2/users/me.");
        }
        if (!hasManageOptions(body)) {
            throw new BridgeError("insufficient_role", "This WordPress user does not have the manage_options capability. Create an application password for an administrator.");
        }
        return {
            id: body.id,
            slug: typeof body.slug === "string" ? body.slug : "",
            name: typeof body.name === "string" ? body.name : ""
        };
    }
    endpoint(path) {
        return `${this.config.url}/${this.config.apiBase}${path}`;
    }
    async request(endpoint, init, authenticated) {
        const headers = {
            ...this.createAuthHeaders()
        };
        if (!authenticated) {
            delete headers.Authorization;
            delete headers.authorization;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let response;
        try {
            response = await sendWordPressRequest({
                path: new URL(endpoint).pathname,
                endpoint,
                options: kiwiCallOptions({
                    headers,
                    allowSelfSigned: this.config.allowSelfSigned
                })
            }, {
                ...init,
                headers: {
                    ...headers,
                    ...(init.headers ?? {})
                },
                signal: controller.signal
            });
        }
        catch {
            throw new BridgeError("site_unreachable", `Could not reach the WordPress site at ${this.config.url}.`);
        }
        finally {
            clearTimeout(timer);
        }
        const raw = await response.text();
        let parsed = null;
        if (raw) {
            try {
                parsed = JSON.parse(raw);
            }
            catch {
                parsed = null;
            }
        }
        if (!response.ok) {
            throw errorForStatus(response.status, endpoint, parsed);
        }
        return parsed;
    }
}
//# sourceMappingURL=bridge.js.map