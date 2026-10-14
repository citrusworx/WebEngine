import type { DatabaseCredentials, NectarineConfig } from "@citrusworx/nectarine/config";
import { cloneSeedRecipes } from "./data/seed-recipes.js";
import {
  closeDatabase,
  configureDatabase,
  connectDatabase,
  isDatabaseConnected,
  loadRecipesFromDb,
  migrate,
  seedRecipesIfEmpty,
} from "./db/postgres.js";
import type { AppLocals } from "./types/context.js";

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function processRequiresDatabase(): boolean {
  if (envFlag("ALLOW_SEED_FALLBACK")) {
    return false;
  }

  return process.env.NODE_ENV === "production" || envFlag("REQUIRE_DATABASE");
}

/**
 * Complete PG_* → credentials.
 * Partial PG_* → throw.
 * Empty PG_* in production / REQUIRE_DATABASE → throw.
 * Empty PG_* locally → null, and the API keeps seed recipes in memory.
 */
export function resolveBootCredentials(config: NectarineConfig): DatabaseCredentials | null {
  const status = config.credentialStatus();
  if (status.credentials) {
    return status.credentials;
  }

  const keyNames = Object.values(status.keys).join(", ");
  const missing = status.missing.join(", ") || keyNames;

  if (status.present.length > 0) {
    throw new Error(
      `Nectarine ${status.vendor} env is incomplete (partially set). Present: ${status.present.join(", ")}. Missing: ${missing}. Set all of ${keyNames}, or unset them all to use seed fallback.`,
    );
  }

  if (processRequiresDatabase() || !config.seedFallback) {
    const nodeEnv = process.env.NODE_ENV ?? "(unset)";
    throw new Error(
      `Nectarine ${status.vendor} env is incomplete and this process requires a database (NODE_ENV=${nodeEnv}, fallback.seed=${config.seedFallback}). Missing: ${missing}. Set ${keyNames}. For local seed fallback, omit those vars and run with NODE_ENV unset or ALLOW_SEED_FALLBACK=1.`,
    );
  }

  console.warn(
    `Nectarine ${status.vendor} env is incomplete; using seed recipes in memory. Missing: ${missing}. Not for production.`,
  );
  return null;
}

export async function createAppContext(nectarine: NectarineConfig): Promise<AppLocals> {
  const creds = resolveBootCredentials(nectarine);
  configureDatabase(creds);

  try {
    if (creds) {
      await connectDatabase();
      await migrate();
      await seedRecipesIfEmpty(cloneSeedRecipes());
    }

    const recipes = isDatabaseConnected() ? await loadRecipesFromDb() : cloneSeedRecipes();
    return { recipes, nectarine };
  } catch (error) {
    await closeDatabase();
    throw error;
  }
}
