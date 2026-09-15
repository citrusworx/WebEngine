import { createFilePersistence } from "./file-persistence.js";
import { createPostgresPersistence } from "./postgres-persistence.js";
export function persistenceFromEnv(env = typeof process !== "undefined" ? process.env : {}) {
    const file = env.KIWIPRESS_CMS_FILE?.trim();
    if (file) {
        return createFilePersistence(file);
    }
    const database = env.KIWIPRESS_PG_DB?.trim() || env.PG_DB?.trim();
    if (database) {
        return createPostgresPersistence({ database });
    }
    return undefined;
}
//# sourceMappingURL=env-persistence.js.map