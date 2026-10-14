import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { resolveBootCredentials } from "./context.js";
import { closeDatabase, configureDatabase, connectDatabase, migrate } from "./db/postgres.js";

const configPath =
  process.env.NECTARINE_CONFIG?.trim() ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../nectarine.config.yaml");

const nectarine = loadNectarineConfig(configPath);
const creds = resolveBootCredentials(nectarine);

if (!creds) {
  console.error("Refusing to migrate without Postgres. Set PG_USER, PG_PASS, PG_HOST, PG_PORT, and PG_DB.");
  process.exit(1);
}

configureDatabase(creds);

try {
  await connectDatabase();
  const result = await migrate();
  console.log(`MiaMakes migrations applied. Ledger versions: ${(result?.applied ?? []).join(", ") || "(none pending)"}`);
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`MiaMakes migrate failed: ${message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
