import { describe, expect, it } from "vitest";
import { LOCAL_SSH_KEY_WARNING, summarizeDestroyResult } from "./summary.js";

describe("summarizeDestroyResult", () => {
    it("returns counts without secrets and always warns about local SSH files", () => {
        const summary = summarizeDestroyResult(
            "kiwipress-compose",
            {
                dry_run: false,
                deleted: [{ kind: "droplet", name: "kiwipress-01", id: 9 }],
                skipped: [{ kind: "vpc", name: "kiwipress", reason: "still in use" }],
                failed: [{ kind: "firewall", name: "kiwipress-web", error: "token=dop_v1_nope" }],
                warnings: ["first pass"]
            },
            { region: "nyc3" }
        );

        expect(summary).toMatchObject({
            packId: "kiwipress-compose",
            region: "nyc3",
            dryRun: false,
            deleted: [{ kind: "droplet", name: "kiwipress-01", id: 9 }]
        });
        expect(summary.warnings).toEqual(
            expect.arrayContaining(["first pass", LOCAL_SSH_KEY_WARNING])
        );
        expect(summary.failed[0]?.error).toBe("token=dop_v1_nope");
    });
});
