import fs from "node:fs";
import * as jsyaml from "js-yaml";
export { client, doRequest, getDoToken, DigitalOceanError } from "../../providers/digitalocean/client.js";
export function parseYAML(file) {
    const deployManifest = fs.readFileSync(file, "utf8");
    return parseYAMLString(deployManifest);
}
export function parseYAMLString(source) {
    return jsyaml.load(source);
}
//# sourceMappingURL=utilities.js.map