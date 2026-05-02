import { WPRead } from "../core/WPRead";
import {
    getAllCategories,
    getCategoryById,
    getCategoryBySlug
} from "./routes";

export class Categories extends WPRead {
    getAll() {
        return this.read(getAllCategories);
    }

    getById(id: string | number) {
        return this.read(getCategoryById, { id });
    }

    getBySlug(slug: string) {
        return this.read(getCategoryBySlug, { slug });
    }
}
