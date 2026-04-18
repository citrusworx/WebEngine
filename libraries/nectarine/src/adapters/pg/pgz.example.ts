import path from 'node:path';
import { parser } from '../../util/util';
import { PgSql } from './pgz';

type YAMLRecord = Record<string, any>;

const workspaceRoot = process.cwd();

const schemaPath = path.resolve(
  workspaceRoot,
  'apps/citrode/back/src/nectar/schema/schema.yml'
);

const sqlConfigPath = path.resolve(
  workspaceRoot,
  'libraries/nectarine/schemas/user/db/pg/user.yml'
);


// TODO: Refactor these functions into a more robust SQL builder utility that can handle various query types, conditions, and database engines. Consider using Knex.js for inspiration for complex query building needs.

// This is a simple utility function to convert a comma-separated string or an array of strings into a properly formatted list for SQL queries.

function listify(value: string | string[] | undefined): string[] {
  if (!value) {
    return []; // Returns an empty array if the value is undefined or null
  }

  if (Array.isArray(value)) {
    return value; // If it's already an array, return it as is
  }

  // If it's a string, split it by commas and trim whitespace
  // Example: "id, name, email" => ["id", "name", "email"]
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}


// The following functions are examples of how to build SQL statements based on the configuration objects parsed from YAML files. They demonstrate how to construct SELECT, INSERT, and CREATE TABLE statements dynamically based on the provided configurations.

function buildSelectSQL(config: YAMLRecord): string {
  const fields = Array.isArray(config.fields)
    ? config.fields.join(', ')
    : (config.fields ?? '*');
  const action = config.action ?? 'FROM';
  const table = config.table;
  const conditions = config.conditions;

  let sql = `${config.type} ${fields} ${action} ${table}`;

  if (conditions) {
    sql += ` ${conditions.condition} ${conditions.column} ${conditions.operator} ${conditions.value}`;
  }

  return sql;
}

// This function builds an INSERT SQL statement based on the provided configuration. It handles the columns and values for the INSERT operation, as well as optional action and keyword parameters.
function buildInsertSQL(config: YAMLRecord): string {
  const columns = listify(config.updates?.column).join(', ');
  const values = listify(config.updates?.values).join(', ');
  const action = config.action ?? 'INTO';
  const keyword = config.values ?? 'VALUES';

  return `${config.type} ${action} ${config.table} (${columns}) ${keyword} (${values})`;
}


// This function builds a CREATE TABLE SQL statement based on the model definition provided in a YAML file. It reads the schema for the specified model and constructs the appropriate SQL statement to create the table with the defined columns and their data types.

function buildCreateTableSQL(modelName: string, filepath: string): string {
  const schema = parser.yaml(filepath) as YAMLRecord;
  const model = schema[modelName];

  if (!model) {
    throw new Error(`Model "${modelName}" was not found in ${filepath}.`);
  }

  const columns = Object.entries(model.fields)
    .map(([column, definition]) => `${column} ${definition}`)
    .join(', ');

  return `CREATE TABLE IF NOT EXISTS ${model.table} (${columns});`;
}

async function example(): Promise<void> {
  const pg = new PgSql();

  // The class expects a registered DB key before connect().
  pg.addDb(process.env.PG_DB!);

  const client = await pg.connect(process.env.PG_DB!);

  if (!client) {
    throw new Error('Could not create a Postgres client.');
  }

  try {
    // Example 1: build a CREATE TABLE statement from the YAML schema object.
    const createUserTableSQL = buildCreateTableSQL('User', schemaPath);
    await pg.query(client, { sql: createUserTableSQL });

    // Example 2: build a SELECT statement from the YAML SQL definition.
    const getUserByIdConfig = parser.genSQL(sqlConfigPath, 'user', 'get', 'UserById');
    const getUserByIdSQL = buildSelectSQL(getUserByIdConfig);

    const user = await pg.query(client, {
      sql: getUserByIdSQL,
      params: [1]
    });

    console.log('UserById result:', user?.rows);

    // Example 3: build an INSERT statement from the YAML SQL definition.
    const newUserConfig = parser.genSQL(sqlConfigPath, 'user', 'create', 'NewUser');
    const newUserSQL = buildInsertSQL(newUserConfig);

    await pg.query(client, {
      sql: newUserSQL,
      params: ['dev@citrusworx.com', 'super-secret', 'Demo User']
    });
  }
  finally {
    await pg.disconnect(client);
  }
}

void example();
