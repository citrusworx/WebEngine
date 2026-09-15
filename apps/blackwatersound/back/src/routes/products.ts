import type { NectarineConfig } from "@citrusworx/nectarine/config";
import { type ExecuteArgs, type ResponseData, type Route } from "@citrusworx/seltzer";
import { createResourceReadRoutes } from "@citrusworx/webengine";
import type { ProductRecord } from "../data/seed-products.js";
import { isDatabaseConnected, loadProductByIdFromDb, loadProductsFromDb } from "../db/postgres.js";
import type { BlackwaterContext } from "../types/context.js";

function stringField(product: ProductRecord, key: string): string | undefined {
  const value = (product as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : undefined;
}

function catalogOf(product: ProductRecord): string {
  return product.catalog === "software" ? "software" : "gear";
}

/**
 * `productAPI.yml` `query:` vs live SQL in `named-queries.ts`:
 *
 * | API `query:`        | Live named query | Why |
 * | allProducts         | allPayloads      | Catalog lives in JSONB `payload`; relational columns are NULL |
 * | productById         | payloadById      | same |
 * | productsByCatalog   | (filter payload) | no JSONB catalog query; seed/hardware maps to `gear` |
 * | productBySlug       | (filter payload) | no JSONB slug query; seed `id` used as slug fallback |
 *
 * When Postgres is unset (or the live catalog is empty), use boot-time
 * `locals.products` / seed — the same fallback the hand routes used.
 */
async function loadCatalog(ctx: BlackwaterContext): Promise<ProductRecord[]> {
  if (isDatabaseConnected()) {
    const fromDb = await loadProductsFromDb();
    if (fromDb.length > 0) {
      return fromDb;
    }
  }

  return ctx.locals.products;
}

async function findById(ctx: BlackwaterContext, id: string | undefined): Promise<ProductRecord | null> {
  if (!id) {
    return null;
  }

  if (isDatabaseConnected()) {
    const fromDb = await loadProductByIdFromDb(id);
    if (fromDb) {
      return fromDb;
    }
  }

  return ctx.locals.products.find((product) => product.id === id) ?? null;
}

function findBySlug(products: ProductRecord[], slug: string | undefined): ProductRecord | null {
  if (!slug) {
    return null;
  }

  return (
    products.find((product) => stringField(product, "slug") === slug) ??
    products.find((product) => product.id === slug) ??
    null
  );
}

export async function executeProductRead({
  query,
  params,
  ctx,
}: ExecuteArgs<BlackwaterContext>): Promise<ProductRecord | ProductRecord[] | null> {
  switch (query) {
    case "productById":
      return findById(ctx, params.id);
    case "productBySlug":
      return findBySlug(await loadCatalog(ctx), params.slug);
    case "productsByCatalog": {
      const catalog = params.catalog;
      if (!catalog) {
        return [];
      }
      return (await loadCatalog(ctx)).filter((product) => catalogOf(product) === catalog);
    }
    case "allProducts":
      return loadCatalog(ctx);
    default:
      return null;
  }
}

/** Product GET ops from `productAPI.yml`. Create/update/delete stay unwired (JSONB). */
export function createProductReadRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  return createResourceReadRoutes(nectarine, "product", executeProductRead, {
    notFound: (): ResponseData => ({ status: 404, body: { error: "Product not found" } }),
  });
}
