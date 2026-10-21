import { gatewayFetch } from "../../../api";
import { PROJECT_ID } from "../catalog";

export type ProbeFound = {
    pluginPresent: true;
    pluginVersion: string;
    wpVersion: string;
    lockdown: boolean;
    paired: boolean;
    frontendUrlSet: boolean;
    siteUrl: string;
};

export type ProbeMissing = {
    pluginPresent: false;
    code: string;
    message: string;
};

export type ProbeResult = ProbeFound | ProbeMissing;

export type BridgeConnectionStatus = "connected" | "disconnected" | "needs_attention";

export type BridgeStatus = {
    status: BridgeConnectionStatus;
    reasons: string[];
    projectId: string;
    siteUrl?: string;
    username?: string;
    frontendUrl?: string;
    pairedAt?: string;
    pluginPresent?: boolean;
    pluginVersion?: string;
    pluginPaired?: boolean;
    lockdown?: boolean;
    frontendReachable?: boolean;
};

async function readBody(response: Response): Promise<Record<string, unknown>> {
    try {
        const body: unknown = await response.json();
        if (body && typeof body === "object" && !Array.isArray(body)) {
            return body as Record<string, unknown>;
        }
    } catch {
        // Non-JSON failures still surface as a status error below.
    }
    return {};
}

function errorMessage(body: Record<string, unknown>, status: number): string {
    return typeof body.error === "string" && body.error.trim()
        ? body.error
        : `Request failed (${status}).`;
}

export function bridgeProjectId(): string {
    return PROJECT_ID;
}

export async function probeBridge(siteUrl: string): Promise<ProbeResult> {
    const response = await gatewayFetch(`/projects/${PROJECT_ID}/bridge/probe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl })
    });
    const body = await readBody(response);
    if (!response.ok) {
        throw new Error(errorMessage(body, response.status));
    }
    if (body.pluginPresent === true) {
        return {
            pluginPresent: true,
            pluginVersion: String(body.pluginVersion ?? ""),
            wpVersion: String(body.wpVersion ?? ""),
            lockdown: body.lockdown === true,
            paired: body.paired === true,
            frontendUrlSet: body.frontendUrlSet === true,
            siteUrl: String(body.siteUrl ?? siteUrl)
        };
    }
    return {
        pluginPresent: false,
        code: typeof body.code === "string" ? body.code : "request_failed",
        message: typeof body.message === "string"
            ? body.message
            : "The KiwiPress Bridge plugin was not found on that site."
    };
}

export async function pairBridge(input: {
    siteUrl: string;
    username: string;
    applicationPassword: string;
    frontendUrl: string;
}): Promise<void> {
    const response = await gatewayFetch(`/projects/${PROJECT_ID}/bridge/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
    });
    const body = await readBody(response);
    if (!response.ok) {
        throw new Error(errorMessage(body, response.status));
    }
}

export async function fetchBridgeStatus(): Promise<BridgeStatus> {
    const response = await gatewayFetch(`/projects/${PROJECT_ID}/bridge/status`);
    const body = await readBody(response);
    if (!response.ok) {
        throw new Error(errorMessage(body, response.status));
    }
    const status = body.status;
    if (status !== "connected" && status !== "disconnected" && status !== "needs_attention") {
        throw new Error("WordPress connection status was not recognized.");
    }
    const reasons = Array.isArray(body.reasons)
        ? body.reasons.filter((reason): reason is string => typeof reason === "string")
        : [];
    return {
        status,
        reasons,
        projectId: typeof body.projectId === "string" ? body.projectId : PROJECT_ID,
        siteUrl: typeof body.siteUrl === "string" ? body.siteUrl : undefined,
        username: typeof body.username === "string" ? body.username : undefined,
        frontendUrl: typeof body.frontendUrl === "string" ? body.frontendUrl : undefined,
        pairedAt: typeof body.pairedAt === "string" ? body.pairedAt : undefined,
        pluginPresent: typeof body.pluginPresent === "boolean" ? body.pluginPresent : undefined,
        pluginVersion: typeof body.pluginVersion === "string" ? body.pluginVersion : undefined,
        pluginPaired: typeof body.pluginPaired === "boolean" ? body.pluginPaired : undefined,
        lockdown: typeof body.lockdown === "boolean" ? body.lockdown : undefined,
        frontendReachable: typeof body.frontendReachable === "boolean" ? body.frontendReachable : undefined
    };
}

export async function unpairBridge(): Promise<void> {
    const response = await gatewayFetch(`/projects/${PROJECT_ID}/bridge/unpair`, {
        method: "POST"
    });
    const body = await readBody(response);
    if (!response.ok) {
        throw new Error(errorMessage(body, response.status));
    }
}
