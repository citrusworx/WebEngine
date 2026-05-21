import { WPClient } from "./WPClient.js";
export class WPRead extends WPClient {
    read(route, params) {
        return this.execute(route, params);
    }
}
//# sourceMappingURL=WPRead.js.map