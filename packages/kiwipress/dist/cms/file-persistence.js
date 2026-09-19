import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeDocument } from "./persistence.js";
export function createFilePersistence(filePath) {
    const resolved = path.resolve(filePath);
    return {
        kind: "file",
        async load() {
            try {
                const raw = await readFile(resolved, "utf8");
                return normalizeDocument(JSON.parse(raw));
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    return null;
                }
                throw error;
            }
        },
        async save(document) {
            await mkdir(path.dirname(resolved), { recursive: true });
            const tmp = `${resolved}.${process.pid}.${Date.now()}.tmp`;
            await writeFile(tmp, `${JSON.stringify({ version: 1, types: document.types, collections: document.collections }, null, 2)}\n`, "utf8");
            await rename(tmp, resolved);
        }
    };
}
//# sourceMappingURL=file-persistence.js.map