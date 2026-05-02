import { WPRead } from "../core/WPRead";
import {
    createPage,
    deletePage,
    getAllPages,
    getPageByAuthor,
    getPageByCategory,
    getPageById,
    getPageBySlug,
    getPageByTag,
    updatePage
} from "./routes";
import type { WordPressPayload } from "../types/api";

export class Pages extends WPRead {
    getAll() {
        return this.read(getAllPages);
    }

    getById(id: string | number) {
        return this.read(getPageById, { id });
    }

    getByCategory(category: string) {
        return this.read(getPageByCategory, { category });
    }

    getBySlug(slug: string) {
        return this.read(getPageBySlug, { slug });
    }

    getByAuthor(author: string) {
        return this.read(getPageByAuthor, { author });
    }

    getByTag(tag: string) {
        return this.read(getPageByTag, { tag });
    }

    create(data: WordPressPayload) {
        return this.mutate(createPage, data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.mutate(updatePage, data, { id });
    }

    delete(id: string | number) {
        return this.mutate(deletePage, undefined, { id });
    }
}

