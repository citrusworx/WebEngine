import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createCategory, deleteCategory, getAllCategories, getCategoryById, getCategoryBySlug, updateCategory } from "./routes.js";
class CategoryCreate extends WPCreate {
    createCategory(data) {
        return this.create(createCategory, data);
    }
}
class CategoryUpdate extends WPUpdate {
    updateCategory(id, data) {
        return this.update(updateCategory, data, { id });
    }
}
class CategoryDelete extends WPDelete {
    deleteCategory(id) {
        return this.delete(deleteCategory, { id });
    }
}
export class Categories extends WPRead {
    creator;
    updater;
    deleter;
    constructor(config) {
        super(config);
        this.creator = new CategoryCreate(config);
        this.updater = new CategoryUpdate(config);
        this.deleter = new CategoryDelete(config);
    }
    getAll() {
        return this.read(getAllCategories);
    }
    getById(id) {
        return this.read(getCategoryById, { id });
    }
    getBySlug(slug) {
        return this.read(getCategoryBySlug, { slug });
    }
    create(data) {
        return this.creator.createCategory(data);
    }
    update(id, data) {
        return this.updater.updateCategory(id, data);
    }
    delete(id) {
        return this.deleter.deleteCategory(id);
    }
}
//# sourceMappingURL=categories.js.map