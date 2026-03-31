import fs from 'node:fs';
import path from "node:path";
import yaml from "js-yaml";
import { parseYAML } from './src/util/util';

// models
export const models = {
    user: path.resolve(import.meta.dirname, ''),
    product: path.resolve(import.meta.dirname, '')
}

// Extend models
export const extendModels = (filepath: string, overrides: string[]) => {
    const base = parseYAML(filepath);
    return {...base, ...overrides}
}

// Parse utility
export * from "./src/util/util"