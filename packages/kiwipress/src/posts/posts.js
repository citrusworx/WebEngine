import { WPCreate } from "../core/WPCreate.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createPost, deletePost, getAllPosts, getPostByAuthor, getPostById, getPostBySlug, getPostsByCategory, getPostsByDate, getPostsByTag, updatePost } from "./routes.js";
class PostCreate extends WPCreate {
    createPost(data) {
        return this.create(createPost, data);
    }
}
class PostUpdate extends WPUpdate {
    updatePost(id, data) {
        return this.update(updatePost, data, { id });
    }
}
export class Posts extends WPRead {
    creator;
    updater;
    constructor(config) {
        super(config);
        this.creator = new PostCreate(config);
        this.updater = new PostUpdate(config);
    }
    getAll() {
        return this.read(getAllPosts);
    }
    getById(id) {
        return this.read(getPostById, { id });
    }
    getBySlug(slug) {
        return this.read(getPostBySlug, { slug });
    }
    getByAuthor(author) {
        return this.read(getPostByAuthor, { author });
    }
    getByTag(tag) {
        return this.read(getPostsByTag, { tag });
    }
    getByCategory(category) {
        return this.read(getPostsByCategory, { category });
    }
    getByDate(date) {
        return this.read(getPostsByDate, { date });
    }
    create(data) {
        return this.creator.createPost(data);
    }
    update(id, data) {
        return this.updater.updatePost(id, data);
    }
    delete(id) {
        return this.mutate(deletePost, undefined, { id });
    }
}
//# sourceMappingURL=posts.js.map
