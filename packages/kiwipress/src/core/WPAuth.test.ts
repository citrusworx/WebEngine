import { describe, expect, it } from "vitest";
import { WPAuth } from "./WPAuth.js";

describe("WPAuth", () => {
    it("prefers Basic over Bearer and combines Basic with an API key", () => {
        const auth = new WPAuth({
            username: "admin",
            appPassword: "aaaa bbbb cccc dddd eeee ffff",
            token: "fallback-token",
            apiKey: "fixture-key"
        });

        expect(auth.strategy()).toBe("basic");
        expect(auth.isConfigured()).toBe(true);
        expect(auth.headers()).toEqual({
            Authorization: `Basic ${Buffer.from("admin:aaaa bbbb cccc dddd eeee ffff").toString("base64")}`,
            "X-API-Key": "fixture-key"
        });
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

    it("replaces generated header names case-insensitively without changing custom headers", () => {
        const headers = {
            authorization: "Bearer custom-token",
            "X-Api-KEY": "custom-key",
            "X-Site": "kiwi"
        };
        const auth = new WPAuth({ token: "fixture-token", apiKey: "fixture-key", headers });

        expect(auth.headers()).toEqual({
            Authorization: "Bearer fixture-token",
            "X-API-Key": "fixture-key",
            "X-Site": "kiwi"
        });
        expect(headers.authorization).toBe("Bearer custom-token");
        expect(headers["X-Api-KEY"]).toBe("custom-key");
    });

    it("reports API key as the primary strategy when it is the only credential option", () => {
        const auth = new WPAuth({ apiKey: "fixture-key", headers: { authorization: "Custom value" } });

        expect(auth.strategy()).toBe("api-key");
        expect(auth.isConfigured()).toBe(true);
        expect(auth.headers()).toEqual({ authorization: "Custom value", "X-API-Key": "fixture-key" });
    });

    it("reports none when no credentials are present", () => {
        const auth = new WPAuth();
        expect(auth.strategy()).toBe("none");
        expect(auth.isConfigured()).toBe(false);
        expect(auth.headers()).toEqual({});
    });
});
