import type { BridgeHealth } from "@citrusworx/kiwipress";
import { isBridgeError } from "@citrusworx/kiwipress";
import type { BridgeConnectionStatus, BridgeHealthResult } from "./store.js";

/** Oldest plugin release this app will treat as healthy. 0.1.0 has no draft preview. */
export const MIN_BRIDGE_VERSION = "0.2.0";

export const FRONTEND_REACHABILITY_TIMEOUT_MS = 4_000;

export type VersionCheck = "ok" | "old" | "invalid";

export function compareBridgeVersion(version: string, minimum = MIN_BRIDGE_VERSION): VersionCheck {
    const parse = (value: string): number[] | null => {
        const parts = value.trim().split(".");
        if (parts.length === 0 || parts.some((part) => !/^\d+$/.test(part))) {
            return null;
        }
        return parts.map((part) => Number(part));
    };

    const left = parse(version);
    const right = parse(minimum);
    if (!left || !right) {
        return "invalid";
    }

    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
        const current = left[index] ?? 0;
        const floor = right[index] ?? 0;
        if (current < floor) {
            return "old";
        }
        if (current > floor) {
            return "ok";
        }
    }

    return "ok";
}

export function urlsMatch(left: string, right: string): boolean {
    try {
        const a = new URL(left);
        const b = new URL(right);
        const pathOf = (url: URL) => url.pathname.replace(/\/+$/, "") || "/";
        return a.protocol === b.protocol
            && a.host === b.host
            && pathOf(a) === pathOf(b)
            && a.search === b.search;
    } catch {
        return false;
    }
}

export type StatusInput = {
    health: BridgeHealth | null;
    healthError: unknown;
    frontendReachable: boolean;
};

/**
 * Paired projects are `connected` only when the plugin is current, still
 * reports paired, and the frontend URL answered. Anything else that still
 * has a stored pairing is `needs_attention`.
 */
export function evaluatePairedStatus(input: StatusInput): BridgeHealthResult {
    const reasons: string[] = [];
    const health = input.health;

    if (!health) {
        reasons.push(healthFailureReason(input.healthError));
    } else {
        const version = compareBridgeVersion(health.plugin_version);
        if (version === "old") {
            reasons.push(
                `Plugin version ${health.plugin_version} is older than ${MIN_BRIDGE_VERSION}. Update the plugin for draft preview.`
            );
        } else if (version === "invalid") {
            reasons.push(
                `Plugin version "${health.plugin_version}" is not a supported KiwiPress Bridge version (minimum ${MIN_BRIDGE_VERSION}). Update the plugin for draft preview.`
            );
        }

        if (health.paired === false) {
            reasons.push("WordPress reports this site is not paired.");
        }
    }

    if (!input.frontendReachable) {
        reasons.push("The frontend URL is unreachable.");
    }

    const status: BridgeConnectionStatus = reasons.length === 0 ? "connected" : "needs_attention";

    return {
        status,
        reasons,
        pluginPresent: Boolean(health),
        pluginVersion: health?.plugin_version,
        pluginPaired: health?.paired,
        lockdown: health?.lockdown,
        wpVersion: health?.wp_version,
        frontendReachable: input.frontendReachable,
        siteUrl: health?.site_url
    };
}

export type ContentGatewaySnapshot = {
    mode: string;
    siteUrl: string | null;
};

export type PreviewReady = {
    previewReady: boolean;
    previewReason: string | null;
};

/**
 * Draft preview is ready when the paired plugin is current, advertises
 * `preview`, and — when the caller knows the content gateway — that gateway
 * is in WordPress mode on the same site URL as the pairing.
 *
 * `gateway: null` means this process is not looking at the content gateway
 * (unit tests and callers that only have the bridge). The dashboard passes
 * a snapshot so the Preview button can stay disabled with a reason.
 */
export function evaluatePreviewReady(input: {
    health: BridgeHealth | null;
    pairedSiteUrl: string;
    gateway: ContentGatewaySnapshot | null;
}): PreviewReady {
    const health = input.health;
    if (!health) {
        return {
            previewReady: false,
            previewReason: "Draft preview needs a paired KiwiPress Bridge plugin."
        };
    }

    const version = compareBridgeVersion(health.plugin_version);
    if (version !== "ok") {
        return {
            previewReady: false,
            previewReason: `Plugin version ${health.plugin_version} is older than ${MIN_BRIDGE_VERSION}. Update the plugin for draft preview.`
        };
    }

    if (health.paired === false) {
        return {
            previewReady: false,
            previewReason: "WordPress reports this site is not paired."
        };
    }

    if (!health.features.includes("preview")) {
        return {
            previewReady: false,
            previewReason: "Update the KiwiPress Bridge plugin for draft preview."
        };
    }

    if (input.gateway) {
        if (input.gateway.mode !== "wordpress") {
            return {
                previewReady: false,
                previewReason: "Draft preview is available when the content gateway is in WordPress mode."
            };
        }
        if (!input.gateway.siteUrl || !urlsMatch(input.gateway.siteUrl, input.pairedSiteUrl)) {
            return {
                previewReady: false,
                previewReason: "The content gateway WordPress URL does not match the paired site."
            };
        }
    }

    return { previewReady: true, previewReason: null };
}

function healthFailureReason(error: unknown): string {
    if (isBridgeError(error)) {
        if (error.code === "site_unreachable") {
            return "The WordPress site is unreachable.";
        }
        if (error.code === "plugin_missing") {
            return "The KiwiPress Bridge plugin is not installed or kiwipress/v1 returned 404.";
        }
        return error.message;
    }

    return "The WordPress health check failed.";
}

/** Any HTTP response counts as reachable. A thrown fetch (including timeout) does not. */
export async function isFrontendReachable(url: string, timeoutMs = FRONTEND_REACHABILITY_TIMEOUT_MS): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        await fetch(url, {
            method: "GET",
            redirect: "manual",
            signal: controller.signal
        });
        return true;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}
