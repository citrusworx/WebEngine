import { Posts, Pages } from "@citrusworx/kiwipress";
import type { DatabaseCredentials, NectarineConfig } from "@citrusworx/nectarine/config";
import { SEED_PRODUCTS } from "./data/seed-products.js";
import { SEED_LESSON, SEED_POST } from "./data/seed-content.js";
import { loadWaitlist } from "./store/waitlist-store.js";
import {
  closeDatabase,
  configureDatabase,
  connectDatabase,
  isDatabaseConnected,
  loadProductsFromDb,
  migrate,
  seedProductsIfEmpty,
} from "./db/postgres.js";
import type { AppLocals } from "./types/context.js";

function createWordPressClients() {
  const url = process.env.WP_URL?.trim();

  if (!url) {
    return { postsClient: null, pagesClient: null, wpUrl: null };
  }

  const config = {
    url,
    apiBase: process.env.WP_API_BASE?.trim() || "wp-json/wp/v2",
    username: process.env.WP_USERNAME,
    appPassword: process.env.WP_APP_PASSWORD,
  };

  return {
    postsClient: new Posts(config),
    pagesClient: new Pages(config),
    wpUrl: url,
  };
}

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

/** Production and REQUIRE_DATABASE require Postgres unless ALLOW_SEED_FALLBACK is set. */
function processRequiresDatabase(): boolean {
  if (envFlag("ALLOW_SEED_FALLBACK")) {
    return false;
  }

  return process.env.NODE_ENV === "production" || envFlag("REQUIRE_DATABASE");
}

/**
 * Resolve Postgres credentials for boot.
 *
 * - Complete env → credentials
 * - Partial env (some PG_* set, some missing) → throw
 * - Empty env + production / REQUIRE_DATABASE / fallback.seed=false → throw
 * - Empty env + local seed fallback → null (in-memory products, JSON waitlist)
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
    `Nectarine ${status.vendor} env is incomplete; using seed fallback (in-memory products, JSON waitlist). Missing: ${missing}. Not for production.`,
  );
  return null;
}

export async function createAppContext(nectarine: NectarineConfig): Promise<AppLocals> {
  const creds = resolveBootCredentials(nectarine);
  configureDatabase(creds);

  const wpClients = createWordPressClients();

  try {
    if (creds) {
      await connectDatabase();
      await migrate();
      await seedProductsIfEmpty(SEED_PRODUCTS);
    }

    const waitlist = await loadWaitlist();
    const products = isDatabaseConnected() ? await loadProductsFromDb() : [...SEED_PRODUCTS];

    return {
      products: products.length > 0 ? products : [...SEED_PRODUCTS],
      waitlist,
      postsClient: wpClients.postsClient,
      pagesClient: wpClients.pagesClient,
      wpUrl: wpClients.wpUrl,
      nectarine,
    };
  } catch (error) {
    await closeDatabase();
    throw error;
  }
}

export { SEED_POST, SEED_LESSON };
export type { AppLocals, WaitlistEntry } from "./types/context.js";
