import { generateKeyPairSync } from "node:crypto";
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
    persistGeneratedPrivateKey,
    readExistingPrivateKeyPublic,
    resolvePrivateKeyPath,
    sanitizeKeyFileName
} from "./ssh-private-key.js";

function pkcs8Rsa(): string {
    const { privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });
    return privateKey;
}

describe("generated SSH private key persistence", () => {
    const dirs: string[] = [];

    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("defaults to .grape/ssh/<name> under cwd", () => {
        expect(resolvePrivateKeyPath("grapevine", undefined, "/tmp/project")).toBe(
            path.join("/tmp/project", ".grape", "ssh", "grapevine")
        );
    });

    it("resolves relative private_key_path against cwd", () => {
        expect(resolvePrivateKeyPath("ignored", "keys/id_grapevine", "/tmp/project")).toBe(
            path.join("/tmp/project", "keys", "id_grapevine")
        );
    });

    it("keeps an absolute private_key_path", () => {
        expect(resolvePrivateKeyPath("ignored", "/var/keys/id_grapevine", "/tmp/project")).toBe(
            "/var/keys/id_grapevine"
        );
    });

    it("sanitizes path separators in default filenames", () => {
        expect(sanitizeKeyFileName("team/prod:key")).toBe("team-prod-key");
    });

    it("writes OpenSSH private key material with mode 0600", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "grape-ssh-"));
        dirs.push(dir);
        const filePath = path.join(dir, "id_grapevine");
        const pem = pkcs8Rsa();

        persistGeneratedPrivateKey(filePath, pem);

        const written = readFileSync(filePath, "utf8");
        expect(written).toMatch(/^-----BEGIN OPENSSH PRIVATE KEY-----/);
        expect(written).not.toContain("BEGIN PRIVATE KEY");
        expect(written).not.toBe(pem);
        expect(statSync(filePath).mode & 0o777).toBe(0o600);
    });

    it("refuses to overwrite an existing file", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "grape-ssh-"));
        dirs.push(dir);
        const filePath = path.join(dir, "id_grapevine");
        writeFileSync(filePath, "existing\n", { mode: 0o600 });
        chmodSync(filePath, 0o600);

        expect(() => persistGeneratedPrivateKey(filePath, pkcs8Rsa())).toThrow(/already exists/);
        expect(readFileSync(filePath, "utf8")).toBe("existing\n");
    });

    it("derives a public key from an existing private key file without rewriting it", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "grape-ssh-"));
        dirs.push(dir);
        const filePath = path.join(dir, "id_grapevine");
        persistGeneratedPrivateKey(filePath, pkcs8Rsa());
        const before = readFileSync(filePath, "utf8");

        const publicKey = readExistingPrivateKeyPublic(filePath);

        expect(publicKey).toMatch(/^ssh-rsa /);
        expect(readFileSync(filePath, "utf8")).toBe(before);
        expect(readExistingPrivateKeyPublic(path.join(dir, "missing"))).toBeUndefined();
    });

    it("fails clearly when an existing file is not a private key", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "grape-ssh-"));
        dirs.push(dir);
        const filePath = path.join(dir, "id_grapevine");
        writeFileSync(filePath, "not-a-key\n", { mode: 0o600 });

        expect(() => readExistingPrivateKeyPublic(filePath)).toThrow(/Failed to read existing private key/);
    });
});
