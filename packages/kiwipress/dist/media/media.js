import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createMedia, deleteMedia, getAllMedia, getMediaById, updateMedia } from "./routes.js";
import { isMediaUploadPayload } from "../types/api.js";
export { isMediaUploadPayload } from "../types/api.js";
class MediaCreate extends WPCreate {
    createMedia(data) {
        if (isMediaUploadPayload(data)) {
            return this.mutateUpload(createMedia, data);
        }
        return this.create(createMedia, data);
    }
}
class MediaUpdate extends WPUpdate {
    updateMedia(id, data) {
        return this.update(updateMedia, data, { id });
    }
}
class MediaDelete extends WPDelete {
    deleteMedia(id) {
        return this.delete(deleteMedia, { id });
    }
}
export class Media extends WPRead {
    creator;
    updater;
    deleter;
    constructor(config) {
        super(config);
        this.creator = new MediaCreate(config);
        this.updater = new MediaUpdate(config);
        this.deleter = new MediaDelete(config);
    }
    getAll() {
        return this.read(getAllMedia);
    }
    getById(id) {
        return this.read(getMediaById, { id });
    }
    create(data) {
        return this.creator.createMedia(data);
    }
    update(id, data) {
        return this.updater.updateMedia(id, data);
    }
    delete(id) {
        return this.deleter.deleteMedia(id);
    }
}
//# sourceMappingURL=media.js.map