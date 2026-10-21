import { Signal } from "@citrusworx/sigjs";
import {
    fetchBridgeStatus,
    pairBridge,
    probeBridge,
    unpairBridge,
    type BridgeStatus,
    type ProbeResult
} from "./api";

export type BridgePhase = "loading" | "form" | "status" | "error";
export type BridgeStep = 1 | 2 | 3;

export const bridgePhase = Signal<BridgePhase>("loading");
export const bridgeStep = Signal<BridgeStep>(1);
export const bridgeProbe = Signal<ProbeResult | null>(null);
export const bridgeStatus = Signal<BridgeStatus | null>(null);
export const bridgeError = Signal("");
export const bridgeBusy = Signal(false);
export const bridgeConfirm = Signal(false);

export const bridgeDraft = {
    siteUrl: "",
    username: "",
    applicationPassword: "",
    frontendUrl: ""
};

export function trackBridgeView(): void {
    bridgePhase.get();
    bridgeStep.get();
    bridgeProbe.get();
    bridgeStatus.get();
    bridgeError.get();
    bridgeBusy.get();
    bridgeConfirm.get();
}

function messageFrom(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
}

export async function refreshBridgeStatus(): Promise<void> {
    bridgeBusy.set(true);
    bridgeError.set("");
    bridgeConfirm.set(false);
    try {
        const status = await fetchBridgeStatus();
        bridgeStatus.set(status);
        bridgePhase.set(status.status === "disconnected" ? "form" : "status");
        if (status.status !== "disconnected") {
            bridgeStep.set(1);
        }
    } catch (error) {
        bridgePhase.set("error");
        bridgeError.set(messageFrom(error, "Could not load the WordPress connection."));
    } finally {
        bridgeBusy.set(false);
    }
}

export async function submitProbe(): Promise<void> {
    const siteUrl = bridgeDraft.siteUrl.trim();
    if (!siteUrl) {
        bridgeError.set("Enter the WordPress site URL.");
        return;
    }

    bridgeBusy.set(true);
    bridgeError.set("");
    bridgeProbe.set(null);
    try {
        const result = await probeBridge(siteUrl);
        bridgeProbe.set(result);
        if (!result.pluginPresent) {
            bridgeError.set(result.message);
            return;
        }
        bridgeStep.set(2);
    } catch (error) {
        bridgeError.set(messageFrom(error, "Could not probe that WordPress site."));
    } finally {
        bridgeBusy.set(false);
    }
}

export function continueToFrontend(): void {
    if (!bridgeDraft.username.trim() || !bridgeDraft.applicationPassword.trim()) {
        bridgeError.set("Enter the WordPress username and application password.");
        return;
    }
    if (!bridgeDraft.frontendUrl.trim() && typeof window !== "undefined") {
        bridgeDraft.frontendUrl = window.location.origin;
    }
    bridgeError.set("");
    bridgeStep.set(3);
}

export async function submitPair(): Promise<void> {
    const siteUrl = bridgeDraft.siteUrl.trim();
    const username = bridgeDraft.username.trim();
    const applicationPassword = bridgeDraft.applicationPassword;
    const frontendUrl = bridgeDraft.frontendUrl.trim();

    if (!siteUrl || !username || !applicationPassword.trim() || !frontendUrl) {
        bridgeError.set("Site URL, username, application password, and frontend URL are required.");
        return;
    }

    bridgeBusy.set(true);
    bridgeError.set("");
    try {
        await pairBridge({ siteUrl, username, applicationPassword, frontendUrl });
        bridgeDraft.applicationPassword = "";
        await refreshBridgeStatus();
    } catch (error) {
        bridgeError.set(messageFrom(error, "Could not pair this WordPress site."));
        bridgeBusy.set(false);
    }
}

export async function submitUnpair(): Promise<void> {
    bridgeBusy.set(true);
    bridgeError.set("");
    try {
        await unpairBridge();
        bridgeDraft.applicationPassword = "";
        bridgeDraft.username = "";
        bridgeProbe.set(null);
        bridgeStep.set(1);
        bridgeConfirm.set(false);
        await refreshBridgeStatus();
    } catch (error) {
        bridgeError.set(messageFrom(error, "Could not disconnect WordPress."));
        bridgeBusy.set(false);
    }
}
