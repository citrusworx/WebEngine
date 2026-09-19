import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type EnvMap = Record<string, string | undefined>;

export type LoadEnvResult = {
    path: string;
    loaded: boolean;
    filled: number;
};

const BACK_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function resolveBackEnvPath(filePath = path.join(BACK_DIR, ".env")): string {
    return path.resolve(filePath);
}

/**
 * Parse a tiny `.env` subset: comments, blank lines, `KEY=value`, optional quotes.
 * Existing shell values are not applied here — see {@link applyDotEnv}.
 */
export function parseDotEnv(text: string): Record<string, string> {
    const parsed: Record<string, string> = {};

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) {
            continue;
        }

        const eq = line.indexOf("=");
        if (eq <= 0) {
            continue;
        }

        const key = line.slice(0, eq).trim();
        if (!key || key.startsWith("#") || /\s/.test(key)) {
            continue;
        }

        parsed[key] = unquoteEnvValue(line.slice(eq + 1).trim());
    }

    return parsed;
}

export function unquoteEnvValue(value: string): string {
    if (value.length >= 2) {
        const start = value[0];
        const end = value[value.length - 1];
        if ((start === '"' && end === '"') || (start === "'" && end === "'")) {
            return value.slice(1, -1);
        }
    }
    return value;
}

/**
 * Fill missing keys only. Keys already present on `env` (including empty strings)
 * win so a shell export always beats the file.
 */
export function applyDotEnv(parsed: Record<string, string>, env: EnvMap): number {
    let filled = 0;

    for (const [key, value] of Object.entries(parsed)) {
        if (Object.prototype.hasOwnProperty.call(env, key)) {
            continue;
        }
        env[key] = value;
        filled += 1;
    }

    return filled;
}

export function loadBackEnv(
    filePath = resolveBackEnvPath(),
    env: EnvMap = process.env
): LoadEnvResult {
    const resolved = path.resolve(filePath);
    if (!existsSync(resolved)) {
        return { path: resolved, loaded: false, filled: 0 };
    }

    const parsed = parseDotEnv(readFileSync(resolved, "utf8"));
    const filled = applyDotEnv(parsed, env);
    return { path: resolved, loaded: true, filled };
}
