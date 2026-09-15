import { createHash, timingSafeEqual } from "node:crypto";
export function isLoopbackAddress(address) {
    if (!address) {
        return false;
    }
    return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}
function tokensEqual(left, right) {
    const hashedLeft = createHash("sha256").update(left).digest();
    const hashedRight = createHash("sha256").update(right).digest();
    return timingSafeEqual(hashedLeft, hashedRight);
}
export function readGatewayToken(req) {
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
export function authorizeKiwiPressGateway(req, options = {}) {
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
//# sourceMappingURL=auth.js.map