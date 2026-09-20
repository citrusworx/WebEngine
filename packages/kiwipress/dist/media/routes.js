import { createWordPressRoute } from "../core/route-utils.js";
const routes = {
    allMedia: {
        method: "GET",
        endpoint: "/media"
    },
    mediaById: {
        method: "GET",
        endpoint: "/media/:id"
    },
    createMedia: {
        method: "POST",
        endpoint: "/media"
    },
    updateMedia: {
        method: "PUT",
        endpoint: "/media/:id"
    },
    deleteMedia: {
        method: "DELETE",
        endpoint: "/media/:id"
    }
};
export const getAllMedia = createWordPressRoute(routes.allMedia);
export const getMediaById = createWordPressRoute(routes.mediaById);
export const createMedia = createWordPressRoute(routes.createMedia, {
    method: "POST"
});
export const updateMedia = createWordPressRoute(routes.updateMedia, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});
export const deleteMedia = createWordPressRoute(routes.deleteMedia, {
    method: "DELETE"
});
//# sourceMappingURL=routes.js.map