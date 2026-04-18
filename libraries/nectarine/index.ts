import path from "node:path";
import { parser } from './src/util/util';

// models
export const models = {
    user: path.resolve(import.meta.dirname, ''),
    product: path.resolve(import.meta.dirname, '')
}

// Extend models
export const extendModels = (filepath: string, overrides: string[]) => {
    const base = parser.yaml(filepath);
    return {...base, ...overrides}
}

// Parse utility
export * from "./src/util/util"
export * from "./src/util/msqlUtil";
export * from "./src/util/mgutil";
export * from "./src/adapters/pg/pgz";