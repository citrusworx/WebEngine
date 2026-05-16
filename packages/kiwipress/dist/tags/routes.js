import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils";
const routes = {
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
//# sourceMappingURL=routes.js.map