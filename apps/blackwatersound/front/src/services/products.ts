import { CATALOG, type CatalogProduct } from "../data/catalog";
import { api } from "./api";

export async function getProducts(): Promise<CatalogProduct[]> {
  try {
    return await api.get<CatalogProduct[]>("/api/products");
  } catch {
    return [...CATALOG];
  }
}

export async function getProductById(id: string): Promise<CatalogProduct | undefined> {
  try {
    return await api.get<CatalogProduct>(`/api/products/${encodeURIComponent(id)}`);
  } catch {
    return CATALOG.find((product) => product.id === id);
  }
}

export async function getFeaturedProduct(): Promise<CatalogProduct> {
  const products = await getProducts();
  return products[0] ?? CATALOG[0];
}
