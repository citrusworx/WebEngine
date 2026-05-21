import { WPRead } from "../core/WPRead";
import { createPost, deletePost, getAllPosts, getPostByAuthor, getPostById, getPostBySlug, getPostsByCategory, getPostsByDate, getPostsByTag, updatePost } from "./routes";
export class Posts extends WPRead {
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
        return this.mutate(createPost, data);
    }
    update(id, data) {
        return this.mutate(updatePost, data, { id });
    }
    delete(id) {
        return this.mutate(deletePost, undefined, { id });
    }
}
//# sourceMappingURL=posts.js.map