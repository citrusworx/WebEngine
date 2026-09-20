import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory
} from "./routes.js";
import type { WordPressPayload } from "../types/api.js";

class CategoryCreate extends WPCreate {
    createCategory(data: WordPressPayload) {
        return this.create(createCategory, data);
    }
}

class CategoryUpdate extends WPUpdate {
    updateCategory(id: string | number, data: WordPressPayload) {
        return this.update(updateCategory, data, { id });
    }
}

class CategoryDelete extends WPDelete {
    deleteCategory(id: string | number) {
        return this.delete(deleteCategory, { id });
    }
}

export class Categories extends WPRead {
    private readonly creator: CategoryCreate;
    private readonly updater: CategoryUpdate;
    private readonly deleter: CategoryDelete;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new CategoryCreate(config);
        this.updater = new CategoryUpdate(config);
        this.deleter = new CategoryDelete(config);
    }

    getAll() {
        return this.read(getAllCategories);
    }

    getById(id: string | number) {
        return this.read(getCategoryById, { id });
    }

    getBySlug(slug: string) {
        return this.read(getCategoryBySlug, { slug });
    }

    create(data: WordPressPayload) {
        return this.creator.createCategory(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.updater.updateCategory(id, data);
    }

    delete(id: string | number) {
        return this.deleter.deleteCategory(id);
    }
}
