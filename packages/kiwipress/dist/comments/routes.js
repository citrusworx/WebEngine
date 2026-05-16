import { createAliasedQueryRoute, createWordPressRoute } from "../core/route-utils";
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
    }
};
export const getAllComments = createWordPressRoute(routes.allComments);
export const getCommentById = createWordPressRoute(routes.commentById);
export const getCommentsByPost = createAliasedQueryRoute(routes.commentsByPost, "comments", "post");
//# sourceMappingURL=routes.js.map