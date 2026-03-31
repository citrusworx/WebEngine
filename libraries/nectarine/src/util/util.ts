const jsyaml = require('js-yaml');
const fs = require('fs');

interface YAMLdata {
  [key: string]: any;
}

// Parses the models & schema .yml/.yaml
export function parseYAML(filepath: string): YAMLdata {
  const file: string = fs.readFileSync(filepath, 'utf8');
  const yaml: YAMLdata = jsyaml.load(file) as YAMLdata;
  console.log(yaml);
  return yaml;
}
// Parses an API.yml file
export function registerRoute(yaml: string, method: string, route: string): any{
    if(!yaml.includes("api.yml") || !yaml.endsWith("api.yaml")){
      return "Config must end with 'api.yml' or 'api.yaml'."
    }
    // Take YAML and parse into obj
    const api_obj: YAMLdata = parseYAML(yaml);
    // Capture specific part of obj for routes ex api_obj["get"]["allUsers"]
    const config = api_obj[method]?.[route];
    
    if(!config){
      throw new Error(`Route configuration not found for method: ${method}, route: ${route}`); 
    }
    return config;
}

//Generate SQL Statements
export function genSQL(yaml: string, type: string, method: string, config: string): any{
	// Take sql.yml and parse
  const sql_obj: YAMLdata = parseYAML(yaml);
	// to create SubSQL obj for CRUD and simplicity
  const obj = sql_obj[type]?.[method]?.[config];
  if(!obj){
    throw new Error(`SQL Configuration not found for that type: ${type}, method: ${method}, config: ${config}`)
  }
	return obj;
}

// Create buildSQL function
// 
// Test over CRUD cases to make sure that SQL statements are built properly
// Test over DB cases to generate SQL statments based on DB engine (Postgres, MySQL, MariaDB, MSSQL, etc)
// Create Playwright test for this function

export function buildSQL(){

}