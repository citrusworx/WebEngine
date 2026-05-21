import { WPRead } from "../core/WPRead.js";
import { getAllComments, getCommentById, getCommentsByPost } from "./routes.js";
export class Comments extends WPRead {
    getAll() {
        return this.read(getAllComments);
    }
    getById(id) {
        return this.read(getCommentById, { id });
    }
    getByPost(post) {
        return this.read(getCommentsByPost, { post });
    }
}
//# sourceMappingURL=comments.js.map