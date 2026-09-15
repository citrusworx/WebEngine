import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeSnapshot } from "./persistence.js";
export function createFilePersistence(filePath) {
    const resolved = path.resolve(filePath);
    return {
        kind: "file",
        async load() {
            try {
                const raw = await readFile(resolved, "utf8");
                return normalizeSnapshot(JSON.parse(raw));
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    return null;
                }
                throw error;
            }
        },
        async save(snapshot) {
            await mkdir(path.dirname(resolved), { recursive: true });
            const tmp = `${resolved}.${process.pid}.${Date.now()}.tmp`;
            await writeFile(tmp, `${JSON.stringify({ version: 1, collections: snapshot }, null, 2)}\n`, "utf8");
            await rename(tmp, resolved);
        }
    };
}
//# sourceMappingURL=file-persistence.js.map