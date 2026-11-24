import { WPClient } from "./WPClient.js";
export class WPDelete extends WPClient {
    constructor(config) {
        super(config);
    }
    delete(route, params, body) {
        return this.mutate(route, body, params);
    }
}
//# sourceMappingURL=WPDelete.js.map