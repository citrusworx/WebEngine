import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { toOpenSSHPrivateKey } from "../providers/digitalocean/ssh/ssh.js";

/** Default directory (under process cwd) for generated SSH private keys. Local-only; do not commit. */
export const DEFAULT_GENERATED_SSH_DIR = ".grape/ssh";

export function sanitizeKeyFileName(name: string): string {
    const stripped = name.replace(/[/\\:\0]/g, "-").trim();
    const base = path.basename(stripped);
    if (!base || base === "." || base === "..") {
        throw new Error(`SSH key name "${name}" cannot be used as a default private key filename`);
    }
    return base;
}

/**
 * Resolve where a generated private key should be written.
 * `configured` may be absolute or relative to `cwd` (default: process cwd).
 * When omitted, defaults to `.grape/ssh/<name>`.
 */
export function resolvePrivateKeyPath(name: string, configured?: string, cwd = process.cwd()): string {
    const relative = configured ?? path.join(DEFAULT_GENERATED_SSH_DIR, sanitizeKeyFileName(name));
    return path.resolve(cwd, relative);
}

/**
 * Write an OpenSSH private key to `filePath` with mode `0600` on POSIX.
 * Refuses to overwrite an existing file.
 */
export function persistGeneratedPrivateKey(filePath: string, privateKeyPem: string): string {
    const dir = path.dirname(filePath);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const body = toOpenSSHPrivateKey(privateKeyPem);
    try {
        writeFileSync(filePath, body, { encoding: "utf8", mode: 0o600, flag: "wx" });
    } catch (error) {
        const code = error && typeof error === "object" && "code" in error
            ? (error as NodeJS.ErrnoException).code
            : undefined;
        if (code === "EEXIST") {
            throw new Error(
                `SSH private key already exists at ${filePath}; choose a different private_key_path or remove the file`
            );
        }
        throw error;
    }
    if (process.platform !== "win32") {
        chmodSync(filePath, 0o600);
    }
    return filePath;
}
