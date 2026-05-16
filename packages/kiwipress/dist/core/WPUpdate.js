import { WPClient } from "./WPClient";
export class WPUpdate extends WPClient {
    constructor(config) {
        super(config);
    }
    update(route, body, params) {
        return this.mutate(route, body, params);
    }
}
//# sourceMappingURL=WPUpdate.js.map