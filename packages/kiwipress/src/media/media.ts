import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import {
    createMedia,
    deleteMedia,
    getAllMedia,
    getMediaById,
    updateMedia
} from "./routes.js";
import { isMediaUploadPayload, type WordPressPayload } from "../types/api.js";

export type { MediaFileBytes, MediaUploadPayload } from "../types/api.js";
export { isMediaUploadPayload } from "../types/api.js";

class MediaCreate extends WPCreate {
    createMedia(data: WordPressPayload) {
        if (isMediaUploadPayload(data)) {
            return this.mutateUpload(createMedia, data);
        }

        return this.create(createMedia, data);
    }
}

class MediaUpdate extends WPUpdate {
    updateMedia(id: string | number, data: WordPressPayload) {
        return this.update(updateMedia, data, { id });
    }
}

class MediaDelete extends WPDelete {
    deleteMedia(id: string | number) {
        return this.delete(deleteMedia, { id });
    }
}

export class Media extends WPRead {
    private readonly creator: MediaCreate;
    private readonly updater: MediaUpdate;
    private readonly deleter: MediaDelete;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new MediaCreate(config);
        this.updater = new MediaUpdate(config);
        this.deleter = new MediaDelete(config);
    }

    getAll() {
        return this.read(getAllMedia);
    }

    getById(id: string | number) {
        return this.read(getMediaById, { id });
    }

    create(data: WordPressPayload) {
        return this.creator.createMedia(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.updater.updateMedia(id, data);
    }

    delete(id: string | number) {
        return this.deleter.deleteMedia(id);
    }
}
