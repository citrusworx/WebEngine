import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils.js";
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
    },
    createTag: {
        method: "POST",
        endpoint: "/tags"
    },
    updateTag: {
        method: "PUT",
        endpoint: "/tags/:id"
    },
    deleteTag: {
        method: "DELETE",
        endpoint: "/tags/:id"
    }
};
export const getAllTags = createWordPressRoute(routes.allTags);
export const getTagById = createWordPressRoute(routes.tagById);
export const getTagBySlug = createAliasedQueryRoute(routes.tagBySlug, "tags", "slug");
export const createTag = createWordPressRoute(routes.createTag, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});
export const updateTag = createWordPressRoute(routes.updateTag, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});
export const deleteTag = createWordPressRoute(routes.deleteTag, {
    method: "DELETE"
});
//# sourceMappingURL=routes.js.map