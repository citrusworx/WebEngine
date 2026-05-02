import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils";
import type { ApiDefinition } from "../types/api";

type CleanCommentRoutes = {
    allComments: ApiDefinition;
    commentById: ApiDefinition;
    commentsByPost: ApiDefinition;
};

const routes: CleanCommentRoutes = {
    allComments: {
        method: "GET",
        endpoint: "/comments"
    },
    commentById: {
        method: "GET",
        endpoint: "/comments/:id"
    },
    commentsByPost: {
        method: "GET",
        endpoint: "/comments/:post"
    }
};

export const getAllComments = createWordPressRoute(routes.allComments);

export const getCommentById = createWordPressRoute(routes.commentById);

export const getCommentsByPost = createAliasedQueryRoute(routes.commentsByPost, "comments", "post");
