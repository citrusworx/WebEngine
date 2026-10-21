import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { Seltzer } from "./seltzer.js";
import type { ResponseData } from "./response.js";
import type { RequestContext } from "./types.js";

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    if (!server.listening) {
                        resolve();
                        return;
                    }
                    server.close((error) => (error ? reject(error) : resolve()));
                    server.closeIdleConnections();
                }),
        ),
    );
});

function waitListening(server: http.Server): Promise<void> {
    if (server.listening) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        server.once("listening", () => resolve());
        server.once("error", reject);
    });
}

/**
 * Same handler as the recipe in docs/seltzer/seltzer-request-response.md#form-urlencoded.
 * `URLSearchParams` is the platform parser. This file does not add a dependency.
 */
function loginHandler(ctx: RequestContext): ResponseData {
    if (typeof ctx.body !== "string") {
        return { status: 400, body: { error: "Expected a urlencoded body" } };
    }

    const fields = new URLSearchParams(ctx.body);
    return {
        body: {
            email: fields.get("email"),
            name: fields.get("name"),
        },
    };
}

describe("urlencoded recipe", () => {
    it("parses application/x-www-form-urlencoded with URLSearchParams on 127.0.0.1", async () => {
        const app = Seltzer.init().route({
            method: "POST",
            path: "/login",
            handler: loginHandler,
        });
        const server = app.listen(0, { onListening: () => undefined });
        servers.push(server);
        await waitListening(server);

        const address = server.address();
        if (!address || typeof address === "string") {
            throw new Error("Expected TCP address");
        }
        expect(address.address).toBe("127.0.0.1");

        const res = await fetch(`http://127.0.0.1:${address.port}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "email=ada%2Blist%40example.com&name=Ada+Lovelace",
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            email: "ada+list@example.com",
            name: "Ada Lovelace",
        });
    });
});
