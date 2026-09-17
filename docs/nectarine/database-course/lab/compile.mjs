import { compiler, schemaPath, compileNamed } from "./runtime.mjs";

console.log("Schema -> DDL:\n", compiler.buildDdl(schemaPath));
for (const [resource, method, name] of [
  ["item", "get", "ByCategory"], ["loan", "get", "Overdue"],
  ["loan", "get", "CountOpen"], ["item", "create", "NewItem"],
  ["loan", "update", "MarkReturned"],
]) console.log(`${resource}.${method}.${name}:\n${compileNamed(resource, method, name)}\n`);
