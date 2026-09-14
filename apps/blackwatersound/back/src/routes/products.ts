import type { Route } from "@citrusworx/seltzer";
import type { BlackwaterContext } from "../types/context.js";

// Nectarine contract: src/schemas/product/productAPI.yml
export const listProductsRoute: Route<BlackwaterContext> = {
  method: "GET",
  path: "/api/products",
  handler: ({ locals }) => ({
    body: locals.products,
  }),
};

export const getProductRoute: Route<BlackwaterContext> = {
  method: "GET",
  path: "/api/products/:id",
  handler: ({ locals, params }) => {
    const product = locals.products.find((item) => item.id === params.id);

    if (!product) {
      return { status: 404, body: { error: "Product not found" } };
    }

    return { body: product };
  },
};
