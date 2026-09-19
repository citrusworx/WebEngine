import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import * as jsyaml from "js-yaml";
import { validateGrapeConfig } from "./schema.js";
import { setConfigSourceDir } from "./source.js";
export function isRemoteConfigSource(source) {
    return /^https?:\/\//i.test(source);
}
export async function readConfigSource(source) {
    if (isRemoteConfigSource(source)) {
        const response = await axios.get(source, {
            responseType: "text",
            transformResponse: [(data) => data]
        });
        if (typeof response.data !== "string") {
            return JSON.stringify(response.data);
        }
        return response.data;
    }
    const filePath = path.resolve(source);
    return fs.readFile(filePath, "utf8");
}
export function parseConfigText(text, source = "config") {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error(`${source} is empty`);
    }
    const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[") || source.endsWith(".json");
    if (looksJson) {
        try {
            return JSON.parse(trimmed);
        }
        catch {
            // Fall through to YAML — some `.json` URLs still serve YAML.
        }
    }
    const parsed = jsyaml.load(trimmed);
    if (parsed === undefined || parsed === null) {
        throw new Error(`${source} did not contain YAML or JSON`);
    }
    return parsed;
}
export async function loadGrapeConfig(source) {
    const text = await readConfigSource(source);
    const raw = parseConfigText(text, source);
    const config = validateGrapeConfig(raw);
    if (!isRemoteConfigSource(source)) {
        setConfigSourceDir(config, path.dirname(path.resolve(source)));
    }
    return config;
}
//# sourceMappingURL=load.js.map