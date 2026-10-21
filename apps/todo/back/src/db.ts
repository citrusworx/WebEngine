import { createPgAdapterFromConfig, type PgSql } from "@citrusworx/nectarine/adapters/pg";
import type { NectarineConfig } from "@citrusworx/nectarine/config";
import { applyMigrations } from "@citrusworx/nectarine/migrate";

/** Connect the pg adapter and create the todo table from schema YAML. */
export async function connectTodoDatabase(nectarine: NectarineConfig): Promise<PgSql> {
  const adapter = createPgAdapterFromConfig(nectarine);
  if (!adapter) {
    const status = nectarine.credentialStatus();
    throw new Error(
      `Postgres env is incomplete. Missing: ${status.missing.join(", ")}. Set the names in nectarine.config.yaml.`,
    );
  }

  await adapter.connect();
  await applyMigrations({
    execute: adapter,
    vendor: "postgres",
    schemas: [nectarine.getResource("todo").schema],
  });
  return adapter;
}
