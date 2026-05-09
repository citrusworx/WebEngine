import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils.ts";
import type { ApiDefinition } from "../types/api.ts";

type CleanTagRoutes = {
    allTags: ApiDefinition;
    tagById: ApiDefinition;
    tagBySlug: ApiDefinition;
};

const routes: CleanTagRoutes = {
    allTags: {
        method: "GET",
        endpoint: "/tags"
    },
    tagById: {
        method: "GET",
        endpoint: "/tags/:id"
    },
    tagBySlug: {
        method: "GET",
        endpoint: "/tags/:slug"
    }
};

export const getAllTags = createWordPressRoute(routes.allTags);

export const getTagById = createWordPressRoute(routes.tagById);

export const getTagBySlug = createAliasedQueryRoute(routes.tagBySlug, "tags", "slug");
