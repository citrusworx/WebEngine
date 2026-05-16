import { WPRead } from "../core/WPRead";
import { getAllCategories, getCategoryById, getCategoryBySlug } from "./routes";
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