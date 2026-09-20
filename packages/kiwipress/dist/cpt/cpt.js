import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createCptRoutes } from "./routes.js";
import { sanitizeRestBase } from "./rest-base.js";
class CptCreate extends WPCreate {
    createRoute;
    constructor(config, createRoute) {
        super(config);
        this.createRoute = createRoute;
    }
    createItem(data) {
        return this.create(this.createRoute, data);
    }
}
class CptUpdate extends WPUpdate {
    updateRoute;
    constructor(config, updateRoute) {
        super(config);
        this.updateRoute = updateRoute;
    }
    updateItem(id, data) {
        return this.update(this.updateRoute, data, { id });
    }
}
class CptDelete extends WPDelete {
    deleteRoute;
    constructor(config, deleteRoute) {
        super(config);
        this.deleteRoute = deleteRoute;
    }
    deleteItem(id) {
        return this.delete(this.deleteRoute, { id });
    }
}
export class CustomPostType extends WPRead {
    restBase;
    routes;
    creator;
    updater;
    deleter;
    constructor(config, restBase) {
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
//# sourceMappingURL=cpt.js.map