import { WPRead } from "../core/WPRead";
import {
    getAllPosts,
    getPostByAuthor,
    getPostById,
    getPostBySlug,
    getPostsByCategory,
    getPostsByDate,
    getPostsByTag
} from "./routes";

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
}
