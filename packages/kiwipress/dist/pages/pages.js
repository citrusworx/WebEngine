import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createPage, deletePage, getAllPages, getPageByAuthor, getPageByCategory, getPageById, getPageBySlug, getPageByTag, updatePage } from "./routes.js";
class PageCreate extends WPCreate {
    createPage(data) {
        return this.create(createPage, data);
    }
}
class PageUpdate extends WPUpdate {
    updatePage(id, data) {
        return this.update(updatePage, data, { id });
    }
}
class PageDelete extends WPDelete {
    deletePage(id) {
        return this.delete(deletePage, { id });
    }
}
export class Pages extends WPRead {
    creator;
    updater;
    deleter;
    constructor(config) {
        super(config);
        this.creator = new PageCreate(config);
        this.updater = new PageUpdate(config);
        this.deleter = new PageDelete(config);
    }
    getAll() {
        return this.read(getAllPages);
    }
    getById(id) {
        return this.read(getPageById, { id });
    }
    getByCategory(category) {
        return this.read(getPageByCategory, { category });
    }
    getBySlug(slug) {
        return this.read(getPageBySlug, { slug });
    }
    getByAuthor(author) {
        return this.read(getPageByAuthor, { author });
    }
    getByTag(tag) {
        return this.read(getPageByTag, { tag });
    }
    create(data) {
        return this.creator.createPage(data);
    }
    update(id, data) {
        return this.updater.updatePage(id, data);
    }
    delete(id) {
        return this.deleter.deletePage(id);
    }
}
//# sourceMappingURL=pages.js.map