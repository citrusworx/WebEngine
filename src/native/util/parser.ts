import fs from 'node:fs';
import jsyaml from 'js-yaml';

export const parser = {
  yaml: <T = unknown>(filepath: string): T => {
    const file: string = fs.readFileSync(filepath, 'utf8');
    const yaml = jsyaml.load(file) as T;
    console.log(yaml);
    return yaml;
  }
};
