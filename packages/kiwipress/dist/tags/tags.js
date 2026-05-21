import { WPRead } from "../core/WPRead.js";
import { getAllTags, getTagById, getTagBySlug } from "./routes.js";
export class Tags extends WPRead {
    getAll() {
        return this.read(getAllTags);
    }
    getById(id) {
        return this.read(getTagById, { id });
    }
    getBySlug(slug) {
        return this.read(getTagBySlug, { slug });
    }
}
//# sourceMappingURL=tags.js.map