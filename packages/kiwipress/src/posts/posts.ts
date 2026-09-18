import { WPCreate } from "../core/WPCreate.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
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
} from "./routes.js";
import type { WordPressPayload } from "../types/api.js";

class PostCreate extends WPCreate {
    createPost(data: WordPressPayload) {
        return this.create(createPost, data);
    }
}

class PostUpdate extends WPUpdate {
    updatePost(id: string | number, data: WordPressPayload) {
        return this.update(updatePost, data, { id });
    }
}

export class Posts extends WPRead {
    private readonly creator: PostCreate;
    private readonly updater: PostUpdate;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new PostCreate(config);
        this.updater = new PostUpdate(config);
    }

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
        return this.creator.createPost(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.updater.updatePost(id, data);
    }

    delete(id: string | number) {
        return this.mutate(deletePost, undefined, { id });
    }
}
