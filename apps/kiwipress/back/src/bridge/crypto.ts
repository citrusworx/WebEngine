import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type SecretKeyProblem = "secret_key_missing" | "secret_key_invalid";

export class SecretKeyError extends Error {
    readonly code: SecretKeyProblem;

    constructor(code: SecretKeyProblem, message: string) {
        super(message);
        this.name = "SecretKeyError";
        this.code = code;
    }
}

const MISSING_KEY_MESSAGE =
    "KIWIPRESS_SECRET_KEY is not configured. Add a 32-byte base64 or hex key to apps/kiwipress/back/.env and restart the API before pairing.";

const INVALID_KEY_MESSAGE =
    "KIWIPRESS_SECRET_KEY must be 32 bytes, encoded as base64 or as 64 hex characters.";

/**
 * Decode `KIWIPRESS_SECRET_KEY`. Hex (64 chars) or base64/base64url of 32 bytes.
 * A short passphrase is not stretched into a key.
 */
export function resolveSecretKey(env: NodeJS.ProcessEnv = process.env): Buffer {
    const raw = env.KIWIPRESS_SECRET_KEY;
    if (typeof raw !== "string" || raw.trim() === "") {
        throw new SecretKeyError("secret_key_missing", MISSING_KEY_MESSAGE);
    }

    return decodeSecretKey(raw.trim());
}

export function decodeSecretKey(raw: string): Buffer {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
        return Buffer.from(raw, "hex");
    }

    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64");

    if (decoded.length !== 32 || decoded.toString("base64").replace(/=+$/, "") !== padded.replace(/=+$/, "")) {
        throw new SecretKeyError("secret_key_invalid", INVALID_KEY_MESSAGE);
    }

    return decoded;
}

function aadFor(projectId: string): Buffer {
    return Buffer.from(`kiwipress-bridge:${projectId}`, "utf8");
}

/** AES-256-GCM. The returned string is ciphertext, never the application password. */
export function encryptApplicationPassword(plaintext: string, projectId: string, key: Buffer): string {
    if (key.length !== 32) {
        throw new SecretKeyError("secret_key_invalid", INVALID_KEY_MESSAGE);
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(aadFor(projectId));
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptApplicationPassword(payload: string, projectId: string, key: Buffer): string {
    const parts = payload.split(".");
    if (parts.length !== 4 || parts[0] !== "v1" || !parts[1] || !parts[2] || !parts[3]) {
        throw new Error("Stored WordPress application password could not be read.");
    }

    try {
        const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parts[1], "base64url"));
        decipher.setAAD(aadFor(projectId));
        decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
        const plain = Buffer.concat([
            decipher.update(Buffer.from(parts[3], "base64url")),
            decipher.final()
        ]);
        return plain.toString("utf8");
    } catch {
        throw new Error("Stored WordPress application password could not be read.");
    }
}
