import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
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
} from "./routes.js";
import type { WordPressPayload } from "../types/api.js";

class PageCreate extends WPCreate {
    createPage(data: WordPressPayload) {
        return this.create(createPage, data);
    }
}

class PageUpdate extends WPUpdate {
    updatePage(id: string | number, data: WordPressPayload) {
        return this.update(updatePage, data, { id });
    }
}

class PageDelete extends WPDelete {
    deletePage(id: string | number) {
        return this.delete(deletePage, { id });
    }
}

export class Pages extends WPRead {
    private readonly creator: PageCreate;
    private readonly updater: PageUpdate;
    private readonly deleter: PageDelete;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new PageCreate(config);
        this.updater = new PageUpdate(config);
        this.deleter = new PageDelete(config);
    }

    getAll() {
        return this.read(getAllPages);
    }

    getById(id: string | number) {
        return this.read(getPageById, { id });
    }

    getByCategory(category: string | number) {
        return this.read(getPageByCategory, { category });
    }

    getBySlug(slug: string) {
        return this.read(getPageBySlug, { slug });
    }

    getByAuthor(author: string | number) {
        return this.read(getPageByAuthor, { author });
    }

    getByTag(tag: string | number) {
        return this.read(getPageByTag, { tag });
    }

    create(data: WordPressPayload) {
        return this.creator.createPage(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.updater.updatePage(id, data);
    }

    delete(id: string | number) {
        return this.deleter.deletePage(id);
    }
}
