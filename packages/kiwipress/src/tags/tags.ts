import { WPRead } from "../core/WPRead";
import {
    getAllTags,
    getTagById,
    getTagBySlug
} from "./routes";

export class Tags extends WPRead {
    getAll() {
        return this.read(getAllTags);
    }

    getById(id: string | number) {
        return this.read(getTagById, { id });
    }

    getBySlug(slug: string) {
        return this.read(getTagBySlug, { slug });
    }
}
