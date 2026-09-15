import { describe, expect, it } from "vitest";
import type { IncomingMessage } from "node:http";
import { authorizeKiwiPressGateway, isLoopbackAddress } from "./auth.js";

function request(partial: {
    remoteAddress?: string;
    authorization?: string;
    tokenHeader?: string;
}): IncomingMessage {
    return {
        headers: {
            ...(partial.authorization ? { authorization: partial.authorization } : {}),
            ...(partial.tokenHeader ? { "x-kiwipress-token": partial.tokenHeader } : {})
        },
        socket: {
            remoteAddress: partial.remoteAddress
        }
    } as IncomingMessage;
}

describe("authorizeKiwiPressGateway", () => {
    it("allows loopback callers when no token is configured", () => {
        expect(isLoopbackAddress("127.0.0.1")).toBe(true);
        expect(authorizeKiwiPressGateway(request({ remoteAddress: "127.0.0.1" }))).toBe(true);
        expect(authorizeKiwiPressGateway(request({ remoteAddress: "10.0.0.4" }))).toBe(false);
    });

    it("requires the configured bearer token for non-local callers", () => {
        const options = { token: "secret-token" };

        expect(authorizeKiwiPressGateway(request({
            remoteAddress: "10.0.0.4",
            authorization: "Bearer secret-token"
        }), options)).toBe(true);

        expect(authorizeKiwiPressGateway(request({
            remoteAddress: "10.0.0.4",
            tokenHeader: "secret-token"
        }), options)).toBe(true);

        expect(authorizeKiwiPressGateway(request({
            remoteAddress: "10.0.0.4",
            authorization: "Bearer wrong"
        }), options)).toBe(false);
    });

    it("can disable the loopback exception", () => {
        expect(authorizeKiwiPressGateway(
            request({ remoteAddress: "127.0.0.1" }),
            { allowLoopbackWithoutToken: false }
        )).toBe(false);
    });
});
