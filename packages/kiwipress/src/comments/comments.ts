import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import {
    createComment,
    deleteComment,
    getAllComments,
    getCommentById,
    getCommentsByPost,
    updateComment
} from "./routes.js";
import type { WordPressPayload } from "../types/api.js";

class CommentCreate extends WPCreate {
    createComment(data: WordPressPayload) {
        return this.create(createComment, data);
    }
}

class CommentUpdate extends WPUpdate {
    updateComment(id: string | number, data: WordPressPayload) {
        return this.update(updateComment, data, { id });
    }
}

class CommentDelete extends WPDelete {
    deleteComment(id: string | number) {
        return this.delete(deleteComment, { id });
    }
}

export class Comments extends WPRead {
    private readonly creator: CommentCreate;
    private readonly updater: CommentUpdate;
    private readonly deleter: CommentDelete;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new CommentCreate(config);
        this.updater = new CommentUpdate(config);
        this.deleter = new CommentDelete(config);
    }

    getAll() {
        return this.read(getAllComments);
    }

    getById(id: string | number) {
        return this.read(getCommentById, { id });
    }

    getByPost(post: string | number) {
        return this.read(getCommentsByPost, { post });
    }

    create(data: WordPressPayload) {
        return this.creator.createComment(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.updater.updateComment(id, data);
    }

    delete(id: string | number) {
        return this.deleter.deleteComment(id);
    }
}
