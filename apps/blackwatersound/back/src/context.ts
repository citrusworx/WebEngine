import { Posts, Pages } from "@citrusworx/kiwipress";
import type { NectarineConfig } from "@citrusworx/nectarine/config";
import { SEED_PRODUCTS } from "./data/seed-products.js";
import { SEED_LESSON, SEED_POST } from "./data/seed-content.js";
import { loadWaitlist } from "./store/waitlist-store.js";
import {
  configurePool,
  getPool,
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

export async function createAppContext(nectarine: NectarineConfig): Promise<AppLocals> {
  configurePool(nectarine.resolveCredentials());

  const wpClients = createWordPressClients();
  const waitlist = await loadWaitlist();

  if (getPool()) {
    await migrate();
    await seedProductsIfEmpty(SEED_PRODUCTS);
  }

  const products = getPool() ? await loadProductsFromDb() : [...SEED_PRODUCTS];

  return {
    products: products.length > 0 ? products : [...SEED_PRODUCTS],
    waitlist,
    postsClient: wpClients.postsClient,
    pagesClient: wpClients.pagesClient,
    wpUrl: wpClients.wpUrl,
    nectarine,
  };
}

export { SEED_POST, SEED_LESSON };
export type { AppLocals, WaitlistEntry } from "./types/context.js";
