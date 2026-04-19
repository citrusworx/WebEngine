import yaml from "js-yaml";
import { yamlRuntimeConfigSchema } from "./kiwi-schema.js";
/**
 * Parses a YAML runtime document (native desktop/mobile or embedded IoT).
 */
export function parseYamlRuntimeDocument(raw, label) {
    const data = yaml.load(raw);
    if (data == null) {
        throw new Error(`${label}: empty or null YAML document`);
    }
    if (typeof data !== "object" || Array.isArray(data)) {
        throw new Error(`${label}: root must be a mapping (object), not an array or scalar`);
    }
    const result = yamlRuntimeConfigSchema.safeParse(data);
    if (!result.success) {
        const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error(`${label}: invalid structure — ${msg}`);
    }
    return result.data;
}
//# sourceMappingURL=parse-yaml-runtime.js.map