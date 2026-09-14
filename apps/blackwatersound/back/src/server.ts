import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";
import { createAppContext } from "./context.js";
import { closeDatabase, isDatabaseConnected } from "./db/postgres.js";
import { routes } from "./routes/index.js";
import type { AppLocals } from "./types/context.js";

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN?.trim();

const configPath =
  process.env.NECTARINE_CONFIG?.trim() ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../nectarine.config.yaml");

const nectarine = loadNectarineConfig(configPath);

let locals: AppLocals;
try {
  locals = await createAppContext(nectarine);
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Blackwater Sound boot failed: ${message}`);
  process.exit(1);
}

const app = Seltzer.init();

for (const route of routes) {
  app.route(route);
}

const server = app.listen(port, {
  locals,
  cors: corsOrigin
    ? {
        origin: corsOrigin,
        methods: ["GET", "POST", "OPTIONS"],
        headers: ["Content-Type"],
      }
    : {
        methods: ["GET", "POST", "OPTIONS"],
        headers: ["Content-Type"],
      },
  onListening: (listeningPort) => {
    const wpStatus = locals.wpUrl ? `KiwiPress → ${locals.wpUrl}` : "KiwiPress → seed fallback";
    const dbStatus = isDatabaseConnected()
      ? `Nectarine DB → ${nectarine.getVendor()} (${nectarine.getEnvKeys().database})`
      : "Nectarine DB → seed fallback";

    console.log(`Blackwater Sound API listening on http://localhost:${listeningPort}`);
    console.log(`Seltzer + Nectarine ${nectarine.version} (${nectarine.resources.size} resources)`);
    console.log(wpStatus);
    console.log(dbStatus);
  },
});

function shutdown(signal: string) {
  console.log(`${signal}: shutting down Blackwater Sound API`);
  server.close(() => {
    void closeDatabase().finally(() => {
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error("Shutdown timed out; exiting");
    process.exit(1);
  }, 10_000).unref();
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
