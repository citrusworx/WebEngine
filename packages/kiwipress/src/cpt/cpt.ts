import type { Endpoint, Route } from "@citrusworx/seltzer";
import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import type { WordPressPayload } from "../types/api.js";
import { createCptRoutes, type CptRouteSet } from "./routes.js";
import { sanitizeRestBase } from "./rest-base.js";

class CptCreate extends WPCreate {
    constructor(
        config: Partial<WPCoreConfig> | undefined,
        private readonly createRoute: Route<Endpoint>
    ) {
        super(config);
    }

    createItem(data: WordPressPayload) {
        return this.create(this.createRoute, data);
    }
}

class CptUpdate extends WPUpdate {
    constructor(
        config: Partial<WPCoreConfig> | undefined,
        private readonly updateRoute: Route<Endpoint>
    ) {
        super(config);
    }

    updateItem(id: string | number, data: WordPressPayload) {
        return this.update(this.updateRoute, data, { id });
    }
}

class CptDelete extends WPDelete {
    constructor(
        config: Partial<WPCoreConfig> | undefined,
        private readonly deleteRoute: Route<Endpoint>
    ) {
        super(config);
    }

    deleteItem(id: string | number) {
        return this.delete(this.deleteRoute, { id });
    }
}

export class CustomPostType extends WPRead {
    readonly restBase: string;
    private readonly routes: CptRouteSet;
    private readonly creator: CptCreate;
    private readonly updater: CptUpdate;
    private readonly deleter: CptDelete;

    constructor(config: Partial<WPCoreConfig> | undefined, restBase: string) {
        super(config);
        this.restBase = sanitizeRestBase(restBase);
        this.routes = createCptRoutes(this.restBase);
        this.creator = new CptCreate(config, this.routes.create);
        this.updater = new CptUpdate(config, this.routes.update);
        this.deleter = new CptDelete(config, this.routes.delete);
    }

    getAll() {
        return this.read(this.routes.getAll);
    }

    getById(id: string | number) {
        return this.read(this.routes.getById, { id });
    }

    getBySlug(slug: string) {
        return this.read(this.routes.getBySlug, { slug });
    }

    create(data: WordPressPayload) {
        return this.creator.createItem(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.updater.updateItem(id, data);
    }

    delete(id: string | number) {
        return this.deleter.deleteItem(id);
    }
}
