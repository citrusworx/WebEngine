/** Default directory (under process cwd) for generated SSH private keys. Local-only; do not commit. */
export declare const DEFAULT_GENERATED_SSH_DIR = ".grape/ssh";
export declare function sanitizeKeyFileName(name: string): string;
/**
 * Resolve where a generated private key should be written.
 * `configured` may be absolute or relative to `cwd` (default: process cwd).
 * When omitted, defaults to `.grape/ssh/<name>`.
 */
export declare function resolvePrivateKeyPath(name: string, configured?: string, cwd?: string): string;
/**
 * Derive an OpenSSH public key from an existing private key file.
 * Returns `undefined` when the file is absent so apply can generate instead.
 * Does not overwrite the file.
 */
export declare function readExistingPrivateKeyPublic(filePath: string): string | undefined;
/**
 * Write an OpenSSH private key to `filePath` with mode `0600` on POSIX.
 * Refuses to overwrite an existing file.
 */
export declare function persistGeneratedPrivateKey(filePath: string, privateKeyPem: string): string;
