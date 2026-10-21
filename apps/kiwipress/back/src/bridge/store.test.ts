import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BridgeStore, type BridgeRecord } from "./store.js";

function sample(password = "v1.ciphertext"): BridgeRecord {
    return {
        siteUrl: "https://cms.example.com",
        username: "admin",
        applicationPassword: password,
        frontendUrl: "https://app.example.com",
        pairedAt: "2026-10-21T00:00:00.000Z",
        lastHealth: null
    };
}

describe("BridgeStore", () => {
    it("keeps records per project and drops them on delete", async () => {
        const store = BridgeStore.memory();
        expect(await store.get("acme")).toBeNull();

        await store.save("acme", sample());
        await store.save("other", sample("v1.other"));

        expect((await store.get("acme"))?.applicationPassword).toBe("v1.ciphertext");
        expect((await store.get("other"))?.username).toBe("admin");

        await store.delete("acme");
        expect(await store.get("acme")).toBeNull();
        expect(await store.get("other")).not.toBeNull();
    });

    it("updates last health without rewriting the ciphertext", async () => {
        const store = BridgeStore.memory();
        await store.save("acme", sample());
        const updated = await store.updateLastHealth("acme", {
            at: "2026-10-21T01:00:00.000Z",
            result: {
                status: "connected",
                reasons: [],
                pluginPresent: true,
                frontendReachable: true
            }
        });

        expect(updated?.applicationPassword).toBe("v1.ciphertext");
        expect(updated?.lastHealth?.result.status).toBe("connected");
        expect(await store.updateLastHealth("missing", {
            at: "2026-10-21T01:00:00.000Z",
            result: { status: "disconnected", reasons: [], pluginPresent: false, frontendReachable: false }
        })).toBeNull();
    });

    it("writes the file and refuses to replace a corrupt store", async () => {
        const dir = mkdtempSync(path.join(tmpdir(), "kiwi-bridge-"));
        const filePath = path.join(dir, "bridges.json");
        const store = new BridgeStore(filePath);

        await store.save("acme", sample("v1.secret-cipher"));
        const raw = readFileSync(filePath, "utf8");
        expect(raw).toContain("v1.secret-cipher");
        expect(raw).not.toContain("plain-password");

        writeFileSync(filePath, "{not json", "utf8");
        await expect(store.save("acme", sample())).rejects.toThrow(/not valid JSON/);
        expect(readFileSync(filePath, "utf8")).toBe("{not json");
    });
});
