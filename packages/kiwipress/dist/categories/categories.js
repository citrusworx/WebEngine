import { WPRead } from "../core/WPRead.js";
import { getAllCategories, getCategoryById, getCategoryBySlug } from "./routes.js";
export class Categories extends WPRead {
    getAll() {
        return this.read(getAllCategories);
    }
    getById(id) {
        return this.read(getCategoryById, { id });
    }
    getBySlug(slug) {
        return this.read(getCategoryBySlug, { slug });
    }
}
//# sourceMappingURL=categories.js.map