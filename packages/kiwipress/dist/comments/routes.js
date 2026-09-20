import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils.js";
const routes = {
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
    },
    createComment: {
        method: "POST",
        endpoint: "/comments"
    },
    updateComment: {
        method: "PUT",
        endpoint: "/comments/:id"
    },
    deleteComment: {
        method: "DELETE",
        endpoint: "/comments/:id"
    }
};
export const getAllComments = createWordPressRoute(routes.allComments);
export const getCommentById = createWordPressRoute(routes.commentById);
export const getCommentsByPost = createAliasedQueryRoute(routes.commentsByPost, "comments", "post");
export const createComment = createWordPressRoute(routes.createComment, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
});
export const updateComment = createWordPressRoute(routes.updateComment, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    }
});
export const deleteComment = createWordPressRoute(routes.deleteComment, {
    method: "DELETE"
});
//# sourceMappingURL=routes.js.map