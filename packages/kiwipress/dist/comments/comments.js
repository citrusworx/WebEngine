import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createComment, deleteComment, getAllComments, getCommentById, getCommentsByPost, updateComment } from "./routes.js";
class CommentCreate extends WPCreate {
    createComment(data) {
        return this.create(createComment, data);
    }
}
class CommentUpdate extends WPUpdate {
    updateComment(id, data) {
        return this.update(updateComment, data, { id });
    }
}
class CommentDelete extends WPDelete {
    deleteComment(id) {
        return this.delete(deleteComment, { id });
    }
}
export class Comments extends WPRead {
    creator;
    updater;
    deleter;
    constructor(config) {
        super(config);
        this.creator = new CommentCreate(config);
        this.updater = new CommentUpdate(config);
        this.deleter = new CommentDelete(config);
    }
    getAll() {
        return this.read(getAllComments);
    }
    getById(id) {
        return this.read(getCommentById, { id });
    }
    getByPost(post) {
        return this.read(getCommentsByPost, { post });
    }
    create(data) {
        return this.creator.createComment(data);
    }
    update(id, data) {
        return this.updater.updateComment(id, data);
    }
    delete(id) {
        return this.deleter.deleteComment(id);
    }
}
//# sourceMappingURL=comments.js.map