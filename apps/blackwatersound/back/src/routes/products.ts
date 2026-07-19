import type { Route } from "@citrusworx/seltzer";
import type { BlackwaterContext } from "../types/context.js";

// Nectarine contract: src/schemas/product/productAPI.yml
export const listProductsRoute: Route<BlackwaterContext> = {
  method: "GET",
  path: "/api/products",
  handler: ({ locals, json }) => {
    json(locals.products);
  },
};

export const getProductRoute: Route<BlackwaterContext> = {
  method: "GET",
  path: "/api/products/:id",
  handler: ({ locals, params, json }) => {
    const product = locals.products.find((item) => item.id === params.id);

    if (!product) {
      json({ error: "Product not found" }, 404);
      return;
    }

    json(product);
  },
};
