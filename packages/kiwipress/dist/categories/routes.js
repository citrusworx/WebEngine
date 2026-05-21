import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils.js";
const routes = {
    allCategories: {
        method: "GET",
        endpoint: "/categories"
    },
    categoryById: {
        method: "GET",
        endpoint: "/categories/:id"
    },
    categoryBySlug: {
        method: "GET",
        endpoint: "/categories/:slug"
    }
};
export const getAllCategories = createWordPressRoute(routes.allCategories);
export const getCategoryById = createWordPressRoute(routes.categoryById);
export const getCategoryBySlug = createAliasedQueryRoute(routes.categoryBySlug, "categories", "slug");
//# sourceMappingURL=routes.js.map