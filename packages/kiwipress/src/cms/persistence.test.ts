import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { KiwiPress } from "./KiwiPress.js";
import { persistenceFromEnv } from "./env-persistence.js";
import { createFilePersistence } from "./file-persistence.js";
import { emptySnapshot } from "./persistence.js";
import { createPostgresPersistence, type SqlExecutor } from "./postgres-persistence.js";
import { NectarineStore } from "./store.js";
import type { ContentRecord } from "./types.js";

const tempDirs: string[] = [];

afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function post(id = "1"): ContentRecord {
    return {
        id,
        collection: "posts",
        title: "Hello",
        content: "<p>Hi</p>",
        slug: "hello",
        status: "published",
        source: { cms: "nectarine", id },
        meta: {}
    };
}

function memoryExecutor() {
    const rows: { collection: string; id: string; record: string }[] = [];

    const executor: SqlExecutor = {
        async query(sql, params = []) {
            if (sql.includes("CREATE TABLE")) {
                return { rows: [] };
            }

            if (sql.includes("DELETE FROM")) {
                rows.length = 0;
                return { rows: [] };
            }

            if (sql.includes("INSERT INTO")) {
                rows.push({
                    collection: String(params[0]),
                    id: String(params[1]),
                    record: String(params[2])
                });
                return { rows: [] };
            }

            if (sql.includes("SELECT")) {
                return {
                    rows: rows.map((row) => ({
                        collection: row.collection,
                        id: row.id,
                        record: row.record
                    }))
                };
            }

            return { rows: [] };
        }
    };

    return { rows, executor };
}

describe("KiwiPress persistence", () => {
    it("round-trips a native CMS through a JSON file without WebEngine", async () => {
        const dir = await mkdtemp(path.join(os.tmpdir(), "kiwipress-cms-"));
        tempDirs.push(dir);
        const file = path.join(dir, "cms.json");

        const writer = KiwiPress.connect({
            mode: "nectarine",
            persistence: createFilePersistence(file)
        });
        await writer.native.posts.create({
            title: "Standalone post",
            content: "<p>No kernel required.</p>",
            status: "published",
            slug: "standalone-post"
        });

        const saved = JSON.parse(await readFile(file, "utf8")) as { collections?: { posts?: unknown[] } };
        expect(saved.collections?.posts).toHaveLength(1);

        const reader = KiwiPress.connect({
            mode: "nectarine",
            persistence: createFilePersistence(file)
        });
        await reader.ready();
        expect(await reader.native.posts.getBySlug("standalone-post")).toMatchObject({
            title: "Standalone post",
            status: "published"
        });
    });

    it("uses a Nectarine Postgres executor when one is injected", async () => {
        const { executor, rows } = memoryExecutor();
        const persistence = createPostgresPersistence({ executor });
        const store = new NectarineStore();
        store.usePersistence(persistence);
        store.upsert(post("42"));
        await store.flush();

        expect(rows).toHaveLength(1);
        expect(JSON.parse(rows[0]?.record ?? "{}")).toMatchObject({ id: "42", slug: "hello" });

        const hydrated = new NectarineStore();
        hydrated.usePersistence(persistence);
        await hydrated.hydrate();
        expect(hydrated.list("posts")).toMatchObject([{ id: "42", title: "Hello" }]);
    });

    it("throws when the Postgres adapter swallows a query error", async () => {
        const persistence = createPostgresPersistence({
            executor: {
                async query() {
                    return undefined;
                }
            }
        });

        await expect(persistence.load()).rejects.toThrow(/Postgres query failed/);
        await expect(persistence.save(emptySnapshot())).rejects.toThrow(/Postgres query failed/);
    });

    it("picks file persistence before Postgres from env", () => {
        expect(persistenceFromEnv({
            KIWIPRESS_CMS_FILE: "/tmp/kiwi.json",
            PG_DB: "ignored"
        })?.kind).toBe("file");

        expect(persistenceFromEnv({ PG_DB: "kiwipress" })?.kind).toBe("postgres");
        expect(persistenceFromEnv({})).toBeUndefined();
    });
});
