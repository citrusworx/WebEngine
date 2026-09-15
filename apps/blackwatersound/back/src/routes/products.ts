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
  countPayloadsFromDb,
  deleteProductFromDb,
  insertProductPayload,
  isDatabaseConnected,
  loadProductByIdFromDb,
  loadProductBySlugFromDb,
  loadProductsByCatalogFromDb,
  loadProductsContainingFromDb,
  loadProductsFromDb,
  loadProductsWithKeyFromDb,
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
 * | API `query:`        | Live named query     | Why |
 * | allProducts         | allPayloads          | Catalog lives in JSONB `payload`; relational columns are NULL |
 * | productById         | payloadById          | same |
 * | payloadsByCatalog   | payloadsByCatalog    | `payload->>'catalog'` (seed/memory still maps missing catalog → `gear`) |
 * | payloadsBySlug      | payloadsBySlug       | `payload->>'slug'`; miss falls back to `payloadById` (seed `id` as slug) |
 * | payloadsContaining  | payloadsContaining   | `payload @> $1::jsonb`; `?contains=` JSON fragment |
 * | payloadsWithKey     | payloadsWithKey      | `payload ? $1` |
 * | countPayloads       | countPayloads        | `COUNT(*)` — also used to skip seed |
 * | insertPayload       | insertPayload        | HTTP body is the catalog document, not `{ payload }` |
 * | updatePayload       | updatePayload        | host merges then replaces JSONB (no compiler `||`) |
 * | deleteProduct       | deleteProduct        | row delete; payload column stays protected |
 *
 * When Postgres is unset (or the live catalog is empty), use boot-time
 * `locals.products` / seed — the same fallback the hand routes used.
 */
async function dbHasPayloads(): Promise<boolean> {
  return isDatabaseConnected() && (await countPayloadsFromDb()) > 0;
}

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

function productHasKey(product: ProductRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(product, key);
}

/**
 * Postgres `jsonb @>` for the seed/memory fallback: nested objects match a
 * subset of keys, arrays match if every needle element is contained in the
 * haystack, and key order does not matter.
 */
export function jsonbContains(haystack: unknown, needle: unknown): boolean {
  if (needle === null || typeof needle !== "object") {
    return Object.is(haystack, needle);
  }

  if (Array.isArray(needle)) {
    if (!Array.isArray(haystack)) {
      return false;
    }
    return needle.every((item) => haystack.some((candidate) => jsonbContains(candidate, item)));
  }

  if (haystack === null || typeof haystack !== "object" || Array.isArray(haystack)) {
    return false;
  }

  const document = haystack as Record<string, unknown>;
  return Object.entries(needle as Record<string, unknown>).every(
    ([key, value]) =>
      Object.prototype.hasOwnProperty.call(document, key) && jsonbContains(document[key], value),
  );
}

type ContainsFragment =
  | { ok: true; fragment: Record<string, unknown> }
  | { ok: false; error: ResponseData };

function parseContainsFragment(raw: string | undefined): ContainsFragment {
  if (!raw?.trim()) {
    return { ok: true, fragment: {} };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: response({ status: 400, body: { error: "contains must be a JSON object" } }) };
    }
    return { ok: true, fragment: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: response({ status: 400, body: { error: "contains must be JSON" } }) };
  }
}

async function executeProductRead({
  query,
  params,
  ctx,
}: ExecuteArgs<BlackwaterContext>): Promise<unknown> {
  switch (query) {
    case "productById":
    case "payloadById":
      return findById(ctx, params.id);
    case "productBySlug":
    case "payloadsBySlug": {
      const slug = params.slug;
      if (!slug) {
        return null;
      }
      if (await dbHasPayloads()) {
        return (await loadProductBySlugFromDb(slug)) ?? (await loadProductByIdFromDb(slug));
      }
      return findBySlug(ctx.locals.products, slug);
    }
    case "productsByCatalog":
    case "payloadsByCatalog": {
      const catalog = params.catalog;
      if (!catalog) {
        return [];
      }
      if (await dbHasPayloads()) {
        return loadProductsByCatalogFromDb(catalog);
      }
      return ctx.locals.products.filter((product) => catalogOf(product) === catalog);
    }
    case "payloadsWithKey": {
      const key = params.key;
      if (!key) {
        return [];
      }
      if (await dbHasPayloads()) {
        return loadProductsWithKeyFromDb(key);
      }
      return ctx.locals.products.filter((product) => productHasKey(product, key));
    }
    case "payloadsContaining": {
      const parsed = parseContainsFragment(ctx.query?.contains);
      if (!parsed.ok) {
        return parsed.error;
      }
      if (Object.keys(parsed.fragment).length === 0) {
        return [];
      }
      if (await dbHasPayloads()) {
        return loadProductsContainingFromDb(parsed.fragment);
      }
      return ctx.locals.products.filter((product) => jsonbContains(product, parsed.fragment));
    }
    case "countPayloads": {
      if (isDatabaseConnected()) {
        const count = await countPayloadsFromDb();
        if (count > 0) {
          return { count };
        }
      }
      return { count: ctx.locals.products.length };
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
