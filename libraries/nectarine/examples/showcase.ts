/**
 * Nectarine showcase — config, compiler, and Postgres adapter.
 *
 *   yarn workspace @citrusworx/nectarine example
 *
 * Default path is dry-run (no live database). To execute one query:
 * set the YAML-declared PG_* env vars and NECTARINE_EXAMPLE_LIVE=1.
 */
import path from "node:path";
import { loadNectarineConfig } from "@citrusworx/nectarine";
import { createPgAdapter, createPgAdapterFromConfig } from "@citrusworx/nectarine/adapters/pg";
import { CCompiler } from "@citrusworx/nectarine/compiler";

const packageRoot = path.resolve(import.meta.dirname, "..");
const configPath = path.join(packageRoot, "src/config/__fixtures__/nectarine.config.yaml");
const userYml = path.join(packageRoot, "models/user/db/pg/user.yml");

const SHOWCASE_QUERIES = [
    { method: "get", name: "UserById", params: [1] },
    { method: "get", name: "AllUsers", params: [] },
    { method: "get", name: "UserByAge", params: [21] },
    { method: "create", name: "NewUser", params: ["ada@example.com", "secret", "Ada"] },
    { method: "update", name: "UserById", params: ["Ada", 36, 1] },
    { method: "delete", name: "User", params: [1] },
] as const;

async function main(): Promise<void> {
    console.log("Nectarine showcase");

    const config = loadNectarineConfig(configPath);
    const vendor = config.getVendor();
    const creds = config.resolveCredentials();
    const envKeys = config.getEnvKeys();
    const configured = config.isDatabaseConfigured();

    console.log(`Config: ${config.version} / ${config.app ?? "(no app)"} / ${vendor}`);
    console.log(
        `Credentials: ${configured ? "configured" : "incomplete"}` +
            ` (${[envKeys.user, envKeys.password, envKeys.host, envKeys.port, envKeys.database].join(", ")})`,
    );

    const compiler = new CCompiler();
    const parsed = compiler.parse_config(userYml);

    console.log("Compiled queries:");
    const compiled: { label: string; sql: string; params: readonly unknown[] }[] = [];
    for (const query of SHOWCASE_QUERIES) {
        const sql = compiler.buildQuery(
            compiler.clean_parse(parsed, "user", query.method),
            query.name,
        );
        const label = `user.${query.method}.${query.name}`;
        compiled.push({ label, sql, params: query.params });
        console.log(`  ${label} → ${sql}`);
    }

    const fromConfig = createPgAdapterFromConfig(config);
    const pg = fromConfig ?? (creds ? createPgAdapter(creds) : null);
    const live = process.env.NECTARINE_EXAMPLE_LIVE === "1";

    if (live && pg) {
        console.log("Postgres adapter: live (NECTARINE_EXAMPLE_LIVE=1)");
        await pg.connect();
        try {
            const result = await pg.query("SELECT 1 AS ok");
            console.log(`  SELECT 1 AS ok → ${JSON.stringify(result.rows)}`);
        } finally {
            await pg.disconnect();
        }
        return;
    }

    if (live && !pg) {
        console.log(
            "Postgres adapter: live requested but credentials incomplete; falling back to dry-run",
        );
    } else {
        console.log("Postgres adapter: dry-run (set NECTARINE_EXAMPLE_LIVE=1 to execute)");
    }

    console.log(
        `  createPgAdapterFromConfig: ${fromConfig ? "ready" : "null"}` +
            (creds && !fromConfig ? "; createPgAdapter: ready" : ""),
    );
    const sample = compiled[0];
    console.log(`  would query: ${sample.sql}`);
    console.log(`  params: ${JSON.stringify(sample.params)}`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
