import { WPRead } from "../core/WPRead";
import {
    createPost,
    deletePost,
    getAllPosts,
    getPostByAuthor,
    getPostById,
    getPostBySlug,
    getPostsByCategory,
    getPostsByDate,
    getPostsByTag,
    updatePost
} from "./routes";
import type { WordPressPayload } from "../types/api";

export class Posts extends WPRead {
    getAll() {
        return this.read(getAllPosts);
    }

    getById(id: string | number) {
        return this.read(getPostById, { id });
    }

    getBySlug(slug: string) {
        return this.read(getPostBySlug, { slug });
    }

    getByAuthor(author: string | number) {
        return this.read(getPostByAuthor, { author });
    }

    getByTag(tag: string | number) {
        return this.read(getPostsByTag, { tag });
    }

    getByCategory(category: string | number) {
        return this.read(getPostsByCategory, { category });
    }

    getByDate(date: string) {
        return this.read(getPostsByDate, { date });
    }

    create(data: WordPressPayload) {
        return this.mutate(createPost, data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.mutate(updatePost, data, { id });
    }

    delete(id: string | number) {
        return this.mutate(deletePost, undefined, { id });
    }
}
