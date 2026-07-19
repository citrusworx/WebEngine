import type { CatalogProduct } from "../../data/catalog";
import { ProductCard } from "./ProductCard";

export function ProductShelf(props: {
  products: readonly CatalogProduct[];
  columns?: "default" | "three";
}) {
  return (
    <div product-grid={props.columns === "three" ? "three" : "default"} grid>
      {props.products.map((product) => (
        <a key={product.id} href="/product" product-link>
          <ProductCard p={product} />
        </a>
      ))}
    </div>
  );
}
