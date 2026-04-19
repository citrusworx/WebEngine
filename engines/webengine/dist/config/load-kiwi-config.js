import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse } from "smol-toml";
import { kiwiConfigSchema } from "./kiwi-schema.js";
export async function loadKiwiConfigFromPath(configPath) {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = parse(raw);
    const result = kiwiConfigSchema.safeParse(parsed);
    if (!result.success) {
        const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error(`Invalid kiwi.config.toml: ${msg}`);
    }
    return {
        config: result.data,
        projectRoot: path.dirname(path.resolve(configPath)),
        configPath: path.resolve(configPath),
    };
}
//# sourceMappingURL=load-kiwi-config.js.map