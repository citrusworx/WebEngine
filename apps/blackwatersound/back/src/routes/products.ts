import type { NectarineConfig } from "@citrusworx/nectarine/config";
import {
  generateRoutes,
  listApiOperations,
  type ExecuteArgs,
  type ResponseData,
  type Route,
} from "@citrusworx/seltzer";
import type { ProductRecord } from "../data/seed-products.js";
import { isDatabaseConnected, loadProductByIdFromDb, loadProductsFromDb } from "../db/postgres.js";
import type { BlackwaterContext } from "../types/context.js";

function stringField(product: ProductRecord, key: string): string | undefined {
  const value = (product as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : undefined;
}

/**
 * Live catalog is JSONB `payload` (allPayloads / payloadById), not the
 * relational allProducts / productById SQL (those columns stay NULL).
 * Empty DB falls back to boot-time `locals.products` (seed).
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

    const live = await loadProductsFromDb();
    if (live.length > 0) {
      return null;
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

async function executeProductRead({
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
      return (await loadCatalog(ctx)).filter((product) => stringField(product, "catalog") === catalog);
    }
    case "allProducts":
    default:
      return loadCatalog(ctx);
  }
}

/** Product GET ops from `productAPI.yml`. Create/update/delete stay unwired. */
export function createProductReadRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  const operations = listApiOperations(nectarine.getResource("product").api).filter(
    (operation) => operation.resource === "product" && operation.crud === "read" && operation.method === "GET",
  );

  return generateRoutes(operations, {
    execute: executeProductRead,
    notFound: (): ResponseData => ({ status: 404, body: { error: "Product not found" } }),
  });
}
