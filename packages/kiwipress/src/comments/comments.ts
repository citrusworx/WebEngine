import { WPRead } from "../core/WPRead.js";
import {
    getAllComments,
    getCommentById,
    getCommentsByPost
} from "./routes.js";

export class Comments extends WPRead {
    getAll() {
        return this.read(getAllComments);
    }

    getById(id: string | number) {
        return this.read(getCommentById, { id });
    }

    getByPost(post: string | number) {
        return this.read(getCommentsByPost, { post });
    }
}
