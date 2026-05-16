import { WPRead } from "../core/WPRead";
import { getAllTags, getTagById, getTagBySlug } from "./routes";
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