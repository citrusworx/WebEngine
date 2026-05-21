import { WPClient } from "./WPClient.js";
export class WPCreate extends WPClient {
    constructor(config) {
        super(config);
    }
    create(route, body, params) {
        return this.mutate(route, body, params);
    }
}
//# sourceMappingURL=WPCreate.js.map