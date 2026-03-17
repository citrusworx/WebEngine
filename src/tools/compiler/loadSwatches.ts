import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export type SwatchRegistry = {
    [family: string]: {
        [step: string]: string;
    }
}

export function loadSwatches(projectRoot: string): SwatchRegistry{
    const dir = path.join(projectRoot, "src/tokens/colors");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".yml") || f.endsWith(".yaml"));

    const registry: SwatchRegistry = {}

    for(const file of files){
        const full = path.join(dir, file);
        const raw = fs.readFileSync(full, "utf8");
        const parsed = YAML.parse(raw);

        for(const family in parsed){
            if(registry[family]){
                throw new Error(`Duplicate family detected: ${family}`);
            }

            const scale = parsed[family];
            if(typeof scale !== "object"){
                throw new Error(`Swatch "${family}" must map steps to values`);
            }

            registry[family] = {};

            for(const step in scale){
                const value = scale[step];

                if(!value){
                    throw new Error(`Swatch "${family}-${step}" has empty value`);
                }
                registry[family][step] = value;
            }
        }
    }
    return registry;
}