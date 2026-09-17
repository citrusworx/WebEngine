import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { CCompiler } from "@citrusworx/nectarine/compiler";

export const compiler = new CCompiler();
export const schemaPath = fileURLToPath(new URL("./models/schema.yml", import.meta.url));
export const queryPath = fileURLToPath(new URL("./models/queries.yml", import.meta.url));
const queries = compiler.parse_config(queryPath);

export function compileNamed(resource, method, name) {
  return compiler.buildQuery(compiler.clean_parse(queries, resource, method), name);
}

export async function sqlFile(name) {
  if (!/^[a-z0-9-]+\.sql$/.test(name)) throw new Error("Use a SQL filename from lab/sql");
  return readFile(new URL(`./sql/${name}`, import.meta.url), "utf8");
}

export async function openLab() {
  // Embedded PostgreSQL teaching runtime, not Nectarine's network pg adapter.
  const db = new PGlite();
  try {
    await db.exec(compiler.buildDdl(schemaPath));
    await db.exec(await sqlFile("seed.sql"));
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}

export function runNamed(db, resource, method, name, params = []) {
  return db.query(compileNamed(resource, method, name), params);
}
