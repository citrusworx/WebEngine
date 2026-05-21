import { WPClient } from "./WPClient.js";
export class WPDelete extends WPClient {
    constructor(config) {
        super(config);
    }
    delete(route, params) {
        return this.mutate(route, undefined, params);
    }
}
//# sourceMappingURL=WPDelete.js.map