import type { Endpoint, Route } from "@citrusworx/seltzer";
import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import type { WordPressPayload } from "../types/api.js";
import { createTaxonomyRoutes, type TaxonomyRouteSet } from "./routes.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";

class TaxonomyCreate extends WPCreate {
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

class TaxonomyUpdate extends WPUpdate {
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

class TaxonomyDelete extends WPDelete {
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

export class CustomTaxonomy extends WPRead {
    readonly restBase: string;
    private readonly routes: TaxonomyRouteSet;
    private readonly creator: TaxonomyCreate;
    private readonly updater: TaxonomyUpdate;
    private readonly deleter: TaxonomyDelete;

    constructor(config: Partial<WPCoreConfig> | undefined, restBase: string) {
        super(config);
        this.restBase = sanitizeRestBase(restBase);
        this.routes = createTaxonomyRoutes(this.restBase);
        this.creator = new TaxonomyCreate(config, this.routes.create);
        this.updater = new TaxonomyUpdate(config, this.routes.update);
        this.deleter = new TaxonomyDelete(config, this.routes.delete);
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
