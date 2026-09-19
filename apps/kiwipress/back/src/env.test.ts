import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyDotEnv, loadBackEnv, parseDotEnv } from "./env.js";

describe("parseDotEnv", () => {
    it("ignores comments, blanks, and malformed lines", () => {
        const parsed = parseDotEnv(`
# heading
KIWIPRESS_API_PORT=8787

DO_TOKEN="dop_v1_file"
# DO_TOKEN=should-not-load
WP_USER='drew'

export_not_a_value
=missing-key
BROKEN
QUOTED_EMPTY=""
`);

        expect(parsed).toEqual({
            KIWIPRESS_API_PORT: "8787",
            DO_TOKEN: "dop_v1_file",
            WP_USER: "drew",
            QUOTED_EMPTY: ""
        });
    });

    it("keeps unquoted values and strips matching quotes only", () => {
        expect(parseDotEnv(`HOST=localhost\nNOTE="say 'hi'"`)).toEqual({
            HOST: "localhost",
            NOTE: "say 'hi'"
        });
    });
});

describe("applyDotEnv", () => {
    it("fills unset keys and leaves shell values in place", () => {
        const env: Record<string, string | undefined> = {
            DO_TOKEN: "dop_v1_shell",
            KIWIPRESS_GATEWAY_TOKEN: ""
        };

        const filled = applyDotEnv(
            {
                DO_TOKEN: "dop_v1_file",
                KIWIPRESS_GATEWAY_TOKEN: "from-file",
                KIWIPRESS_API_PORT: "8787"
            },
            env
        );

        expect(filled).toBe(1);
        expect(env.DO_TOKEN).toBe("dop_v1_shell");
        expect(env.KIWIPRESS_GATEWAY_TOKEN).toBe("");
        expect(env.KIWIPRESS_API_PORT).toBe("8787");
    });
});

describe("loadBackEnv", () => {
    it("is a no-op when the file is missing", () => {
        const env = { DO_TOKEN: "keep" };
        const result = loadBackEnv(path.join(tmpdir(), "kiwipress-missing.env"), env);

        expect(result.loaded).toBe(false);
        expect(result.filled).toBe(0);
        expect(env.DO_TOKEN).toBe("keep");
    });

    it("loads a file without overriding process-owned keys", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "kiwipress-env-"));
        const filePath = path.join(dir, ".env");
        writeFileSync(
            filePath,
            "# local\nDO_TOKEN=dop_v1_file\nKIWIPRESS_API_PORT=9999\n",
            "utf8"
        );

        const env: Record<string, string | undefined> = { DO_TOKEN: "dop_v1_shell" };
        const result = loadBackEnv(filePath, env);

        expect(result).toMatchObject({ loaded: true, filled: 1 });
        expect(env.DO_TOKEN).toBe("dop_v1_shell");
        expect(env.KIWIPRESS_API_PORT).toBe("9999");
        expect(JSON.stringify(result)).not.toMatch(/dop_v1_/);
    });
});
