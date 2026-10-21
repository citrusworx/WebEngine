import { describe, expect, it } from "vitest";
import type { BridgeHealth } from "@citrusworx/kiwipress";
import { BridgeError } from "@citrusworx/kiwipress";
import { compareBridgeVersion, evaluatePairedStatus, MIN_BRIDGE_VERSION, urlsMatch } from "./status.js";

const health = (patch: Partial<BridgeHealth> = {}): BridgeHealth => ({
    plugin_version: "0.1.0",
    wp_version: "6.6",
    lockdown: true,
    paired: true,
    frontend_url_set: true,
    site_url: "https://cms.example.com",
    ...patch
});

describe("compareBridgeVersion", () => {
    it("treats the minimum as current and lower releases as old", () => {
        expect(MIN_BRIDGE_VERSION).toBe("0.1.0");
        expect(compareBridgeVersion("0.1.0")).toBe("ok");
        expect(compareBridgeVersion("0.1")).toBe("ok");
        expect(compareBridgeVersion("0.1.1")).toBe("ok");
        expect(compareBridgeVersion("1.0.0")).toBe("ok");
        expect(compareBridgeVersion("0.0.9")).toBe("old");
        expect(compareBridgeVersion("0.1.0-beta")).toBe("invalid");
    });
});

describe("evaluatePairedStatus", () => {
    it("is connected when the plugin is current, still paired, and the frontend answered", () => {
        const result = evaluatePairedStatus({
            health: health(),
            healthError: null,
            frontendReachable: true
        });

        expect(result.status).toBe("connected");
        expect(result.reasons).toEqual([]);
    });

    it("needs attention for an old plugin, a cleared paired flag, or an unreachable frontend", () => {
        const result = evaluatePairedStatus({
            health: health({ plugin_version: "0.0.9", paired: false }),
            healthError: null,
            frontendReachable: false
        });

        expect(result.status).toBe("needs_attention");
        expect(result.reasons).toEqual([
            "Plugin version 0.0.9 is older than 0.1.0.",
            "WordPress reports this site is not paired.",
            "The frontend URL is unreachable."
        ]);
    });

    it("needs attention when health itself fails", () => {
        const missing = evaluatePairedStatus({
            health: null,
            healthError: new BridgeError("plugin_missing", "missing", 404),
            frontendReachable: true
        });
        const down = evaluatePairedStatus({
            health: null,
            healthError: new BridgeError("site_unreachable", "down"),
            frontendReachable: false
        });

        expect(missing.status).toBe("needs_attention");
        expect(missing.reasons[0]).toMatch(/not installed/);
        expect(down.reasons).toEqual([
            "The WordPress site is unreachable.",
            "The frontend URL is unreachable."
        ]);
    });
});

describe("urlsMatch", () => {
    it("ignores a trailing slash and nothing else", () => {
        expect(urlsMatch("https://app.example.com", "https://app.example.com/")).toBe(true);
        expect(urlsMatch("https://app.example.com/blog", "https://app.example.com/blog/")).toBe(true);
        expect(urlsMatch("https://app.example.com", "http://app.example.com")).toBe(false);
        expect(urlsMatch("https://app.example.com/a", "https://app.example.com/b")).toBe(false);
    });
});
