const jsyaml = require('js-yaml');
const fs = require('fs');

interface YAMLdata {
  [key: string]: any;
}

export function loadYAML(filepath: string): YAMLdata {
  const file: string = fs.readFileSync(filepath, 'utf8');
  const yaml: YAMLdata = jsyaml.load(file) as YAMLdata;
  console.log(yaml);
  return yaml;
}

export function registerRoute(yaml: string, method: string, route: string): any{
    // Take YAML and parse into obj
    const api_obj: YAMLdata = loadYAML(yaml);
    // Capture specific part of obj for routes ex api_obj["get"]["allUsers"]
    const config = api_obj[method]?.[route];
    
    if(!config){
      throw new Error(`Route configuration not found for method: ${method}, route: ${route}`);
    }
    return config;
}

//Generate SQL Statements
export function gensql(yaml: string, type: string, method: string, config: string): any{
	// Take sql.yml and parse
  const sql_obj: YAMLdata = loadYAML(yaml);
	// to create SubSQL obj for CRUD and simplicity
  const obj = sql_obj[type]?.[method]?.[config];
  if(!obj){
    throw new Error(`SQL Configuration not found for that type: ${type}, method: ${method}, config: ${config}`)
  }
	return obj;
}
