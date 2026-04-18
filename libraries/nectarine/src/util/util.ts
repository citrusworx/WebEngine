const jsyaml = require('js-yaml');
const fs = require('fs');

export interface YAMLdata {
  [key: string]: any;
}

export const parser = {
  // Create parseYAML function that takes a filepath and returns the parsed YAML as an object
  yaml: (filepath: string): YAMLdata => {
    const file: string = fs.readFileSync(filepath, 'utf8');
    const yaml: YAMLdata = jsyaml.load(file) as YAMLdata;
    console.log(yaml);
    return yaml;
  },

  // Create registerRoute function that takes a YAML string, method, and route, and returns the route configuration for that method and route
  registerRoute: (
    yaml: string,
    method: string,
    route: string
    ): any => {
    
      if(!yaml.includes("api.yml") && !yaml.endsWith("api.yaml")){
        return "Config must end with 'api.yml' or be named 'api.yaml'."
      }
      
      // Take YAML and parse into obj
      const api_obj: YAMLdata = parser.yaml(yaml);
      
      // Capture specific part of obj for routes ex api_obj["get"]["allUsers"]
      const config = api_obj[method]?.[route];

      if(!config){
        throw new Error(`Route configuration not found for method: ${method}, route: ${route}`);
      }
      
      return config;
    },

  // Create genSQL function that takes a YAML string, type, method, and config, and returns the SQL statement for that type, method, and config (ex: genSQL('user.yml, 'user', 'get', 'UserById');
  genSQL: (
    yaml: string,
    type: string,
    method: string,
    config: string
    ): any => {
      
      // Take sql.yml and parse
      const sql_obj: YAMLdata = parser.yaml(yaml);
      
      // to create SubSQL obj for CRUD and simplicity
      const obj = sql_obj[type]?.[method]?.[config];
      
      if(!obj){
        throw new Error(`SQL Configuration not found for that type: ${type}, method: ${method}, config: ${config}`)
      }
      
      return obj;
  },

  buildSQL: (genSQL: Record<string, any>) => {
    // Take the genSQL object and parse through to make sure
    // 1. Validate shape
    // 2. Validate semantics (required keys exist, proper keys, operators are from DSL set)
    // 3. Tokenize each part of the genSQL object
    // 4. Normalize (convert YAML -> SQL)
    // 5. Compile (Create SQL statement from tokens)

    

  }
}