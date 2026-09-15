import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export type KiwiPressGatewayOptions = {
    token?: string;
    allowLoopbackWithoutToken?: boolean;
};

export function isLoopbackAddress(address?: string | null): boolean {
    if (!address) {
        return false;
    }

    return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function tokensEqual(left: string, right: string): boolean {
    const hashedLeft = createHash("sha256").update(left).digest();
    const hashedRight = createHash("sha256").update(right).digest();
    return timingSafeEqual(hashedLeft, hashedRight);
}

export function readGatewayToken(req: IncomingMessage): string {
    const authorization = req.headers.authorization;
    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
        return authorization.slice("Bearer ".length).trim();
    }

    const header = req.headers["x-kiwipress-token"];
    if (typeof header === "string") {
        return header.trim();
    }

    if (Array.isArray(header) && typeof header[0] === "string") {
        return header[0].trim();
    }

    return "";
}

export function authorizeKiwiPressGateway(
    req: IncomingMessage,
    options: KiwiPressGatewayOptions = {}
): boolean {
    const configuredToken = options.token?.trim();
    const presented = readGatewayToken(req);

    if (configuredToken) {
        return tokensEqual(presented, configuredToken);
    }

    if (options.allowLoopbackWithoutToken === false) {
        return false;
    }

    const remote = "socket" in req ? req.socket?.remoteAddress : undefined;
    return isLoopbackAddress(remote);
}
