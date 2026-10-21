import http from "node:http";
import type { RequestListener } from "node:http";
import { describe, expect, it } from "vitest";
import { Seltzer } from "./seltzer.js";

/**
 * `tsc -p tsconfig.types.json` checks these annotations.
 * `app.handler()` is only the request listener. `adapter(config)` returns the app.
 */
describe("app.handler() types", () => {
    it("returns a Node request listener", () => {
        const app = Seltzer.init();
        const listener: RequestListener = app.handler();
        const server = http.createServer(app.handler());
        const stashed: Seltzer = app.adapter({
            adapter: "node:http",
            options: { baseUrl: "https://example.test" },
        });

        expect(listener).toBeTypeOf("function");
        expect(server).toBeInstanceOf(http.Server);
        expect(stashed).toBe(app);
        server.close();
    });
});
