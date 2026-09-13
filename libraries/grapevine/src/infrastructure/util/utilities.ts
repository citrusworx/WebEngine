import fs from "node:fs";
import * as jsyaml from "js-yaml";

export { client, doRequest, getDoToken, DigitalOceanError } from "../../providers/digitalocean/client.js";

export function parseYAML<T>(file: string): T {
    const deployManifest = fs.readFileSync(file, "utf8");
    return parseYAMLString<T>(deployManifest);
}

export function parseYAMLString<T>(source: string): T {
    return jsyaml.load(source) as T;
}
