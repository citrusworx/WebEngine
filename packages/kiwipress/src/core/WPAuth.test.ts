import { describe, expect, it } from "vitest";
import { WPAuth } from "./WPAuth.js";

describe("WPAuth", () => {
    it("uses basic auth when username and app password are set", () => {
        const auth = new WPAuth({
            username: "admin",
            appPassword: "aaaa bbbb cccc dddd eeee ffff"
        });

        expect(auth.strategy()).toBe("basic");
        expect(auth.isConfigured()).toBe(true);
        expect(auth.headers().Authorization).toMatch(/^Basic /);
    });

    it("falls back to bearer when basic is incomplete", () => {
        const auth = new WPAuth({
            username: "admin",
            token: "jwt-token"
        });

        expect(auth.strategy()).toBe("bearer");
        expect(auth.headers().Authorization).toBe("Bearer jwt-token");
    });

    it("adds an API key alongside another strategy", () => {
        const auth = new WPAuth({
            token: "jwt-token",
            apiKey: "secret",
            headers: { "X-Site": "kiwi" }
        });

        expect(auth.headers()).toMatchObject({
            Authorization: "Bearer jwt-token",
            "X-API-Key": "secret",
            "X-Site": "kiwi"
        });
    });

    it("reports none when no credentials are present", () => {
        const auth = new WPAuth();
        expect(auth.strategy()).toBe("none");
        expect(auth.isConfigured()).toBe(false);
        expect(auth.headers()).toEqual({});
    });
});
