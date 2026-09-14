import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const blackwaterDb = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/back/src/db",
);
const blackwaterStore = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/back/src/store",
);

const DML_LITERAL =
    /(['"`])(?:(?!\1)[\s\S])*?\b(SELECT|INSERT|UPDATE|DELETE)\b(?:(?!\1)[\s\S])*?\1/;

function listTsFiles(dir: string): string[] {
    return fs
        .readdirSync(dir)
        .filter((name) => name.endsWith(".ts"))
        .map((name) => path.join(dir, name));
}

describe("Blackwater data access has no hard-coded DML", () => {
    it("db and store modules contain no SELECT/INSERT/UPDATE/DELETE string literals", () => {
        const files = [...listTsFiles(blackwaterDb), ...listTsFiles(blackwaterStore)];
        expect(files.length).toBeGreaterThan(2);

        for (const file of files) {
            const src = fs.readFileSync(file, "utf8");
            const relative = path.relative(blackwaterDb, file);

            if (relative === "phase3-ddl.ts") {
                expect(src, relative).not.toMatch(/\b(SELECT|INSERT|UPDATE|DELETE)\b/);
                continue;
            }

            expect(src, relative).not.toMatch(DML_LITERAL);
        }
    });
});
