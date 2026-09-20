import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import {
    createTag,
    deleteTag,
    getAllTags,
    getTagById,
    getTagBySlug,
    updateTag
} from "./routes.js";
import type { WordPressPayload } from "../types/api.js";

class TagCreate extends WPCreate {
    createTag(data: WordPressPayload) {
        return this.create(createTag, data);
    }
}

class TagUpdate extends WPUpdate {
    updateTag(id: string | number, data: WordPressPayload) {
        return this.update(updateTag, data, { id });
    }
}

class TagDelete extends WPDelete {
    deleteTag(id: string | number) {
        return this.delete(deleteTag, { id });
    }
}

export class Tags extends WPRead {
    private readonly creator: TagCreate;
    private readonly updater: TagUpdate;
    private readonly deleter: TagDelete;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new TagCreate(config);
        this.updater = new TagUpdate(config);
        this.deleter = new TagDelete(config);
    }

    getAll() {
        return this.read(getAllTags);
    }

    getById(id: string | number) {
        return this.read(getTagById, { id });
    }

    getBySlug(slug: string) {
        return this.read(getTagBySlug, { slug });
    }

    create(data: WordPressPayload) {
        return this.creator.createTag(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.updater.updateTag(id, data);
    }

    delete(id: string | number) {
        return this.deleter.deleteTag(id);
    }
}
