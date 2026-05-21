import { WPRead } from "../core/WPRead";
import { createPage, deletePage, getAllPages, getPageByAuthor, getPageByCategory, getPageById, getPageBySlug, getPageByTag, updatePage } from "./routes";
export class Pages extends WPRead {
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
        return this.mutate(createPage, data);
    }
    update(id, data) {
        return this.mutate(updatePage, data, { id });
    }
    delete(id) {
        return this.mutate(deletePage, undefined, { id });
    }
}
//# sourceMappingURL=pages.js.map