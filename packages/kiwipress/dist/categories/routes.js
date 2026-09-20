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
    },
    createCategory: {
        method: "POST",
        endpoint: "/categories"
    },
    updateCategory: {
        method: "PUT",
        endpoint: "/categories/:id"
    },
    deleteCategory: {
        method: "DELETE",
        endpoint: "/categories/:id"
    }
};
export const getAllCategories = createWordPressRoute(routes.allCategories);
export const getCategoryById = createWordPressRoute(routes.categoryById);
export const getCategoryBySlug = createAliasedQueryRoute(routes.categoryBySlug, "categories", "slug");
export const createCategory = createWordPressRoute(routes.createCategory, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});
export const updateCategory = createWordPressRoute(routes.updateCategory, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});
export const deleteCategory = createWordPressRoute(routes.deleteCategory, {
    method: "DELETE"
});
//# sourceMappingURL=routes.js.map