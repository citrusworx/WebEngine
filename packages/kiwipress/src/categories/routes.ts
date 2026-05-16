import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils";
import type { ApiDefinition } from "../types/api";

type CleanCategoryRoutes = {
    allCategories: ApiDefinition;
    categoryById: ApiDefinition;
    categoryBySlug: ApiDefinition;
};

const routes: CleanCategoryRoutes = {
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
