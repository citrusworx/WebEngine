import type { NectarineConfig } from "@citrusworx/nectarine/config";
import {
  response,
  type ExecuteArgs,
  type ResponseData,
  type Route,
} from "@citrusworx/seltzer";
import { createNectarineRoutes } from "@citrusworx/webengine";
import { asProductRecord, type ProductRecord } from "../data/seed-products.js";
import {
  deleteProductFromDb,
  insertProductPayload,
  isDatabaseConnected,
  loadProductByIdFromDb,
  loadProductsFromDb,
  updateProductPayload,
} from "../db/postgres.js";
import type { BlackwaterContext } from "../types/context.js";

function stringField(product: ProductRecord, key: string): string | undefined {
  const value = (product as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : undefined;
}

function catalogOf(product: ProductRecord): string {
  return product.catalog === "software" ? "software" : "gear";
}

function payloadRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

function replaceLocalProduct(ctx: BlackwaterContext, product: ProductRecord): void {
  const index = ctx.locals.products.findIndex((entry) => entry.id === product.id);
  if (index >= 0) {
    ctx.locals.products[index] = product;
    return;
  }
  ctx.locals.products.push(product);
}

function removeLocalProduct(ctx: BlackwaterContext, id: string): boolean {
  const index = ctx.locals.products.findIndex((entry) => entry.id === id);
  if (index < 0) {
    return false;
  }
  ctx.locals.products.splice(index, 1);
  return true;
}

/**
 * `productAPI.yml` `query:` vs live SQL in `named-queries.ts`:
 *
 * | API `query:`        | Live named query | Why |
 * | allProducts         | allPayloads      | Catalog lives in JSONB `payload`; relational columns are NULL |
 * | productById         | payloadById      | same |
 * | productsByCatalog   | (filter payload) | no JSONB catalog query; seed/hardware maps to `gear` |
 * | productBySlug       | (filter payload) | no JSONB slug query; seed `id` used as slug fallback |
 * | insertPayload       | insertPayload    | HTTP body is the catalog document, not `{ payload }` |
 * | updatePayload       | updatePayload    | host merges then replaces JSONB (no compiler `||`) |
 * | deleteProduct       | deleteProduct    | row delete; payload column stays protected |
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

/** Writes against Postgres must not hit the in-memory seed fallback. */
async function findStoredById(
  ctx: BlackwaterContext,
  id: string | undefined,
): Promise<ProductRecord | null> {
  if (!id) {
    return null;
  }

  if (isDatabaseConnected()) {
    return loadProductByIdFromDb(id);
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
      return (await loadCatalog(ctx)).filter((product) => catalogOf(product) === catalog);
    }
    case "allProducts":
      return loadCatalog(ctx);
    default:
      return null;
  }
}

function invalidProduct(): ResponseData {
  return response({ status: 400, body: { error: "Product payload is invalid" } });
}

async function createProduct({
  body,
  ctx,
}: ExecuteArgs<BlackwaterContext>): Promise<unknown> {
  const product = asProductRecord(payloadRecord(body));
  if (!product) {
    return invalidProduct();
  }

  if (await findStoredById(ctx, product.id)) {
    return response({ status: 409, body: { error: "Product already exists" } });
  }

  if (isDatabaseConnected()) {
    return insertProductPayload(product);
  }

  ctx.locals.products.push(product);
  return product;
}

async function updateProduct({
  body,
  params,
  ctx,
}: ExecuteArgs<BlackwaterContext>): Promise<unknown> {
  const id = params.id?.trim();
  if (!id) {
    return null;
  }

  const existing = await findStoredById(ctx, id);
  if (!existing) {
    return null;
  }

  const patch = payloadRecord(body);
  const merged = asProductRecord({ ...existing, ...patch, id });
  if (!merged) {
    return invalidProduct();
  }

  if (isDatabaseConnected()) {
    const updated = await updateProductPayload(id, merged);
    return updated ? merged : null;
  }

  replaceLocalProduct(ctx, merged);
  return merged;
}

async function deleteProduct({
  params,
  ctx,
}: ExecuteArgs<BlackwaterContext>): Promise<unknown> {
  const id = params.id?.trim();
  if (!id) {
    return null;
  }

  if (isDatabaseConnected()) {
    const deleted = await deleteProductFromDb(id);
    return deleted ? { ok: true, id } : null;
  }

  return removeLocalProduct(ctx, id) ? { ok: true, id } : null;
}

export async function executeProduct(args: ExecuteArgs<BlackwaterContext>): Promise<unknown> {
  switch (args.query) {
    case "insertPayload":
    case "newProduct":
      return createProduct(args);
    case "updatePayload":
    case "updateProduct":
      return updateProduct(args);
    case "deleteProduct":
      return deleteProduct(args);
    default:
      return executeProductRead(args);
  }
}

const productNotFound = (): ResponseData => ({ status: 404, body: { error: "Product not found" } });

/** Product GET + JSONB create/update/delete from `productAPI.yml`. */
export function createProductRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  return createNectarineRoutes(nectarine, {
    resources: ["product"],
    execute: executeProduct,
    notFound: productNotFound,
  });
}

/** Product GET ops from `productAPI.yml`. */
export function createProductReadRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  return createProductRoutes(nectarine).filter((route) => route.method === "GET");
}
