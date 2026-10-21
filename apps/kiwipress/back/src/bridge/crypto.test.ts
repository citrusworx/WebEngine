import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
    decryptApplicationPassword,
    decodeSecretKey,
    encryptApplicationPassword,
    resolveSecretKey,
    SecretKeyError
} from "./crypto.js";

describe("KIWIPRESS_SECRET_KEY", () => {
    it("requires a key and accepts 32-byte base64 or hex", () => {
        expect(() => resolveSecretKey({})).toThrow(SecretKeyError);
        expect(() => resolveSecretKey({ KIWIPRESS_SECRET_KEY: "   " })).toThrow(/not configured/);
        expect(() => decodeSecretKey("too-short")).toThrow(/32 bytes/);

        const raw = randomBytes(32);
        expect(decodeSecretKey(raw.toString("base64"))).toEqual(raw);
        expect(decodeSecretKey(raw.toString("base64url"))).toEqual(raw);
        expect(decodeSecretKey(raw.toString("hex"))).toEqual(raw);
    });
});

describe("application password encryption", () => {
    const key = randomBytes(32);
    const password = "abcd efgh ijkl mnop qrst uvwx";

    it("round-trips AES-256-GCM without storing the password in the payload", () => {
        const stored = encryptApplicationPassword(password, "acme", key);

        expect(stored.startsWith("v1.")).toBe(true);
        expect(stored).not.toContain(password);
        expect(decryptApplicationPassword(stored, "acme", key)).toBe(password);
    });

    it("refuses a different project id, key, or tampered payload", () => {
        const stored = encryptApplicationPassword(password, "acme", key);

        expect(() => decryptApplicationPassword(stored, "other", key)).toThrow(/could not be read/);
        expect(() => decryptApplicationPassword(stored, "acme", randomBytes(32))).toThrow(/could not be read/);
        expect(() => decryptApplicationPassword(`${stored}x`, "acme", key)).toThrow(/could not be read/);
    });
});
