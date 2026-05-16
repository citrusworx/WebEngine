import { WPRead } from "../core/WPRead";
import { getAllComments, getCommentById, getCommentsByPost } from "./routes";
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