import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import * as jsyaml from "js-yaml";
import { type GrapeConfig, validateGrapeConfig } from "./schema.js";
import { setConfigSourceDir } from "./source.js";

export function isRemoteConfigSource(source: string): boolean {
    return /^https?:\/\//i.test(source);
}

export async function readConfigSource(source: string): Promise<string> {
    if (isRemoteConfigSource(source)) {
        const response = await axios.get<string>(source, {
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

export function parseConfigText(text: string, source = "config"): unknown {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error(`${source} is empty`);
    }

    const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[") || source.endsWith(".json");
    if (looksJson) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // Fall through to YAML — some `.json` URLs still serve YAML.
        }
    }

    const parsed = jsyaml.load(trimmed);
    if (parsed === undefined || parsed === null) {
        throw new Error(`${source} did not contain YAML or JSON`);
    }
    return parsed;
}

export async function loadGrapeConfig(source: string): Promise<GrapeConfig> {
    const text = await readConfigSource(source);
    const raw = parseConfigText(text, source);
    const config = validateGrapeConfig(raw);
    if (!isRemoteConfigSource(source)) {
        setConfigSourceDir(config, path.dirname(path.resolve(source)));
    }
    return config;
}
