import { authorizeKiwiPressGateway, Bridge, isBridgeError, type KiwiPressGatewayOptions } from "@citrusworx/kiwipress";
import type { RequestContext, ResponseData, Seltzer } from "@citrusworx/seltzer";
import { decryptApplicationPassword, encryptApplicationPassword, resolveSecretKey, SecretKeyError } from "./crypto.js";
import {
    evaluatePairedStatus,
    FRONTEND_REACHABILITY_TIMEOUT_MS,
    isFrontendReachable,
    urlsMatch
} from "./status.js";
import { BridgeStore, defaultBridgeFilePath, type BridgeRecord } from "./store.js";

export class BridgeInputError extends Error {
    readonly status = 400;

    constructor(message: string) {
        super(message);
        this.name = "BridgeInputError";
    }
}

export type BridgeRouteOptions = KiwiPressGatewayOptions & {
    store?: BridgeStore;
    now?: () => Date;
    resolveKey?: () => Buffer;
    reachabilityTimeoutMs?: number;
};

const PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function json(status: number, body: unknown): ResponseData {
    return { status, body };
}

function asObject(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

export function normalizeHttpUrl(value: unknown, label: string): string {
    if (typeof value !== "string" || value.trim() === "") {
        throw new BridgeInputError(`${label} is required.`);
    }

    let url: URL;
    try {
        url = new URL(value.trim());
    } catch {
        throw new BridgeInputError(`${label} must be an absolute http(s) URL.`);
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new BridgeInputError(`${label} must be an absolute http(s) URL.`);
    }

    if (url.username || url.password) {
        throw new BridgeInputError(`${label} must not include a username or password.`);
    }

    url.hash = "";
    if (url.pathname.length > 1) {
        url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
}

function assertProjectId(id: string | undefined): string {
    const projectId = id?.trim() ?? "";
    if (!PROJECT_ID.test(projectId)) {
        throw new BridgeInputError("Project id must be a short slug (letters, numbers, dot, underscore, hyphen).");
    }
    return projectId;
}

function scrub(message: string, secrets: string[]): string {
    let next = message;
    for (const secret of secrets) {
        if (secret.length >= 4) {
            next = next.split(secret).join("[redacted]");
        }
    }
    return next;
}

function failure(error: unknown, secrets: string[] = []): ResponseData {
    if (error instanceof BridgeInputError) {
        return json(400, { error: scrub(error.message, secrets), code: "invalid_input" });
    }

    if (error instanceof SecretKeyError) {
        return json(503, { error: error.message, code: error.code });
    }

    if (isBridgeError(error)) {
        const status = error.code === "bad_credentials"
            ? 401
            : error.code === "insufficient_role"
                ? 403
                : error.code === "plugin_missing"
                    ? 404
                    : 502;
        return json(status, { error: scrub(error.message, secrets), code: error.code });
    }

    const message = error instanceof Error ? error.message : "WordPress bridge request failed.";
    return json(500, { error: scrub(message, secrets), code: "bridge_failed" });
}

function publicPairing(projectId: string, record: BridgeRecord) {
    return {
        projectId,
        siteUrl: record.siteUrl,
        username: record.username,
        frontendUrl: record.frontendUrl,
        pairedAt: record.pairedAt,
        lastHealth: record.lastHealth
    };
}

function disconnected(projectId: string): ResponseData {
    return json(200, {
        status: "disconnected",
        reasons: ["This project is not paired with WordPress."],
        projectId,
        pluginPresent: false,
        frontendReachable: false,
        lastHealth: null
    });
}

export function registerKiwiPressBridge(app: Seltzer, options: BridgeRouteOptions = {}): Seltzer {
    const store = options.store ?? new BridgeStore(defaultBridgeFilePath());
    const now = options.now ?? (() => new Date());
    const resolveKey = options.resolveKey ?? (() => resolveSecretKey());
    const reachabilityTimeoutMs = options.reachabilityTimeoutMs ?? FRONTEND_REACHABILITY_TIMEOUT_MS;

    const guard = (handler: (ctx: RequestContext) => Promise<ResponseData> | ResponseData) => {
        return (ctx: RequestContext): Promise<ResponseData> | ResponseData => {
            if (!authorizeKiwiPressGateway(ctx.req, options)) {
                return json(401, { error: "Unauthorized" });
            }
            return handler(ctx);
        };
    };

    app.route({
        method: "POST",
        path: "/projects/:id/bridge/probe",
        handler: guard(async (ctx) => {
            try {
                assertProjectId(ctx.params.id);
                const siteUrl = normalizeHttpUrl(asObject(ctx.body).siteUrl, "Site URL");
                const bridge = new Bridge({ url: siteUrl });

                try {
                    const health = await bridge.health();
                    return json(200, {
                        pluginPresent: true,
                        pluginVersion: health.plugin_version,
                        wpVersion: health.wp_version,
                        lockdown: health.lockdown,
                        paired: health.paired,
                        frontendUrlSet: health.frontend_url_set,
                        siteUrl: health.site_url
                    });
                } catch (error) {
                    if (isBridgeError(error) && (error.code === "plugin_missing" || error.code === "site_unreachable" || error.code === "request_failed")) {
                        return json(200, {
                            pluginPresent: false,
                            code: error.code,
                            message: error.message
                        });
                    }
                    throw error;
                }
            } catch (error) {
                return failure(error);
            }
        })
    });

    app.route({
        method: "POST",
        path: "/projects/:id/bridge/pair",
        handler: guard(async (ctx) => {
            const body = asObject(ctx.body);
            const password = typeof body.applicationPassword === "string" ? body.applicationPassword : "";
            try {
                const projectId = assertProjectId(ctx.params.id);
                const siteUrl = normalizeHttpUrl(body.siteUrl, "Site URL");
                const frontendUrl = normalizeHttpUrl(body.frontendUrl, "Frontend URL");
                const username = typeof body.username === "string" ? body.username.trim() : "";

                if (!username) {
                    throw new BridgeInputError("Username is required.");
                }
                if (!password.trim()) {
                    throw new BridgeInputError("Application password is required.");
                }

                const key = resolveKey();
                const bridge = new Bridge({
                    url: siteUrl,
                    username,
                    appPassword: password
                });

                await bridge.health();
                await bridge.verifyCredentials();
                await bridge.saveSettings({
                    frontend_url: frontendUrl,
                    paired: true,
                    project_label: projectId
                });
                const confirmed = await bridge.getSettings();

                if (confirmed.paired !== true || confirmed.project_label !== projectId || !urlsMatch(confirmed.frontend_url, frontendUrl)) {
                    try {
                        await bridge.saveSettings({ paired: false });
                    } catch {
                        // The local record is still unsaved. A retry can write settings again.
                    }
                    return json(502, {
                        error: "WordPress did not confirm the pairing. Nothing was saved.",
                        code: "confirm_failed"
                    });
                }

                const record: BridgeRecord = {
                    siteUrl,
                    username,
                    applicationPassword: encryptApplicationPassword(password, projectId, key),
                    frontendUrl,
                    pairedAt: now().toISOString(),
                    lastHealth: null
                };

                try {
                    await store.save(projectId, record);
                } catch (error) {
                    try {
                        await bridge.saveSettings({ paired: false });
                    } catch {
                        // Best effort. The password is not left in the store.
                    }
                    throw error;
                }

                return json(200, {
                    ...publicPairing(projectId, record),
                    settings: confirmed
                });
            } catch (error) {
                return failure(error, [password]);
            }
        })
    });

    app.route({
        method: "GET",
        path: "/projects/:id/bridge/status",
        handler: guard(async (ctx) => {
            try {
                const projectId = assertProjectId(ctx.params.id);
                const record = await store.get(projectId);
                if (!record) {
                    return disconnected(projectId);
                }

                const bridge = new Bridge({ url: record.siteUrl });
                let health = null;
                let healthError: unknown = null;
                try {
                    health = await bridge.health();
                } catch (error) {
                    healthError = error;
                }

                const reachable = await isFrontendReachable(record.frontendUrl, reachabilityTimeoutMs);
                const result = evaluatePairedStatus({
                    health,
                    healthError,
                    frontendReachable: reachable
                });
                const lastHealth = { at: now().toISOString(), result };
                await store.updateLastHealth(projectId, lastHealth);

                return json(200, {
                    ...publicPairing(projectId, { ...record, lastHealth }),
                    status: result.status,
                    reasons: result.reasons,
                    pluginPresent: result.pluginPresent,
                    pluginVersion: result.pluginVersion,
                    pluginPaired: result.pluginPaired,
                    lockdown: result.lockdown,
                    wpVersion: result.wpVersion,
                    frontendReachable: result.frontendReachable
                });
            } catch (error) {
                return failure(error);
            }
        })
    });

    app.route({
        method: "POST",
        path: "/projects/:id/bridge/unpair",
        handler: guard(async (ctx) => {
            try {
                const projectId = assertProjectId(ctx.params.id);
                const record = await store.get(projectId);
                let remoteUpdated = false;

                if (record) {
                    try {
                        const key = resolveKey();
                        const password = decryptApplicationPassword(record.applicationPassword, projectId, key);
                        const bridge = new Bridge({
                            url: record.siteUrl,
                            username: record.username,
                            appPassword: password
                        });
                        await bridge.saveSettings({ paired: false });
                        remoteUpdated = true;
                    } catch {
                        remoteUpdated = false;
                    }

                    await store.delete(projectId);
                }

                return json(200, {
                    unpaired: true,
                    remoteUpdated,
                    projectId
                });
            } catch (error) {
                return failure(error);
            }
        })
    });

    return app;
}
