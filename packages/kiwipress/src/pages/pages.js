import { WPCreate } from "../core/WPCreate.js";
import { WPRead } from "../core/WPRead.js";
import { createPage, deletePage, getAllPages, getPageByAuthor, getPageByCategory, getPageById, getPageBySlug, getPageByTag, updatePage } from "./routes.js";
class PageCreate extends WPCreate {
    createPage(data) {
        return this.create(createPage, data);
    }
}
export class Pages extends WPRead {
    creator;
    constructor(config) {
        super(config);
        this.creator = new PageCreate(config);
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
        return this.mutate(updatePage, data, { id });
    }
    delete(id) {
        return this.mutate(deletePage, undefined, { id });
    }
}
//# sourceMappingURL=pages.js.map
