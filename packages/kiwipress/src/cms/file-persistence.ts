import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeDocument, type CmsPersistence } from "./persistence.js";
import type { CmsDocument } from "./types.js";

export function createFilePersistence(filePath: string): CmsPersistence {
    const resolved = path.resolve(filePath);

    return {
        kind: "file",
        async load() {
            try {
                const raw = await readFile(resolved, "utf8");
                return normalizeDocument(JSON.parse(raw));
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                    return null;
                }

                throw error;
            }
        },
        async save(document: CmsDocument) {
            const contents = `${JSON.stringify({ version: 1, types: document.types, collections: document.collections }, null, 2)}\n`;
            await mkdir(path.dirname(resolved), { recursive: true });
            const tmp = `${resolved}.${randomUUID()}.tmp`;
            try {
                await writeFile(tmp, contents, "utf8");
                await rename(tmp, resolved);
            } catch (error) {
                await rm(tmp, { force: true }).catch(() => undefined);
                throw error;
            }
        }
    };
}
