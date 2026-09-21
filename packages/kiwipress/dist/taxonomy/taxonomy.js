import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createTaxonomyRoutes } from "./routes.js";
import { sanitizeRestBase } from "../cpt/rest-base.js";
class TaxonomyCreate extends WPCreate {
    createRoute;
    constructor(config, createRoute) {
        super(config);
        this.createRoute = createRoute;
    }
    createItem(data) {
        return this.create(this.createRoute, data);
    }
}
class TaxonomyUpdate extends WPUpdate {
    updateRoute;
    constructor(config, updateRoute) {
        super(config);
        this.updateRoute = updateRoute;
    }
    updateItem(id, data) {
        return this.update(this.updateRoute, data, { id });
    }
}
class TaxonomyDelete extends WPDelete {
    deleteRoute;
    constructor(config, deleteRoute) {
        super(config);
        this.deleteRoute = deleteRoute;
    }
    deleteItem(id) {
        return this.delete(this.deleteRoute, { id });
    }
}
export class CustomTaxonomy extends WPRead {
    restBase;
    routes;
    creator;
    updater;
    deleter;
    constructor(config, restBase) {
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
    getById(id) {
        return this.read(this.routes.getById, { id });
    }
    getBySlug(slug) {
        return this.read(this.routes.getBySlug, { slug });
    }
    create(data) {
        return this.creator.createItem(data);
    }
    update(id, data) {
        return this.updater.updateItem(id, data);
    }
    delete(id) {
        return this.deleter.deleteItem(id);
    }
}
//# sourceMappingURL=taxonomy.js.map