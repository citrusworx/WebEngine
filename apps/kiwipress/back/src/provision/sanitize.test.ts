import { describe, expect, it } from "vitest";
import { redactText, sanitizeForClient } from "./sanitize.js";

describe("provision sanitize", () => {
    it("strips token and password fields from client payloads", () => {
        const sanitized = sanitizeForClient({
            ok: true,
            token: "dop_v1_shouldnotleak",
            password: "hunter2",
            databases: [{ id: "db-1", host: "db.internal", password: "nope" }],
            note: "token=dop_v1_abc123secret"
        });

        expect(sanitized).toEqual({
            ok: true,
            databases: [{ id: "db-1", host: "db.internal" }],
            note: "token=[redacted]"
        });
        expect(JSON.stringify(sanitized)).not.toMatch(/hunter2|dop_v1_shouldnotleak|dop_v1_abc123secret/);
    });

    it("redacts DigitalOcean tokens in error strings", () => {
        expect(redactText("DO_TOKEN=dop_v1_abc123 and password=supersecret")).toBe(
            "DO_TOKEN=[redacted] and password=[redacted]"
        );
    });
});
