import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createTag, deleteTag, getAllTags, getTagById, getTagBySlug, updateTag } from "./routes.js";
class TagCreate extends WPCreate {
    createTag(data) {
        return this.create(createTag, data);
    }
}
class TagUpdate extends WPUpdate {
    updateTag(id, data) {
        return this.update(updateTag, data, { id });
    }
}
class TagDelete extends WPDelete {
    deleteTag(id) {
        return this.delete(deleteTag, { id });
    }
}
export class Tags extends WPRead {
    creator;
    updater;
    deleter;
    constructor(config) {
        super(config);
        this.creator = new TagCreate(config);
        this.updater = new TagUpdate(config);
        this.deleter = new TagDelete(config);
    }
    getAll() {
        return this.read(getAllTags);
    }
    getById(id) {
        return this.read(getTagById, { id });
    }
    getBySlug(slug) {
        return this.read(getTagBySlug, { slug });
    }
    create(data) {
        return this.creator.createTag(data);
    }
    update(id, data) {
        return this.updater.updateTag(id, data);
    }
    delete(id) {
        return this.deleter.deleteTag(id);
    }
}
//# sourceMappingURL=tags.js.map