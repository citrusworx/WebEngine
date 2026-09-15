import { createFilePersistence } from "./file-persistence.js";
import { createPostgresPersistence } from "./postgres-persistence.js";
import type { CmsPersistence } from "./persistence.js";

export function persistenceFromEnv(
    env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}
): CmsPersistence | undefined {
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
