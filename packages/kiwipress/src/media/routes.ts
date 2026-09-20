import { createWordPressRoute } from "../core/route-utils.js";
import type { ApiDefinition } from "../types/api.js";

type CleanMediaRoutes = {
    allMedia: ApiDefinition;
    mediaById: ApiDefinition;
    createMedia: ApiDefinition;
    updateMedia: ApiDefinition;
    deleteMedia: ApiDefinition;
};

const routes: CleanMediaRoutes = {
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
