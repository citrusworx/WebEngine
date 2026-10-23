import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PgSql } from "@citrusworx/nectarine/adapters/pg";
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";
import { connectTodoDatabase } from "./db.js";
import { createRoutes } from "./routes.js";

/** Fill unset keys from a local env file. Process env wins. No dotenv package. */
function loadLocalEnv(file: string) {
  if (!existsSync(file)) {
    return;
  }

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath =
  process.env.NECTARINE_CONFIG?.trim() ||
  path.resolve(here, "../nectarine.config.yaml");
const apiRoot = path.dirname(configPath);

loadLocalEnv(path.join(apiRoot, ".env"));
loadLocalEnv(path.join(apiRoot, ".env.example"));

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN?.trim();
const nectarine = loadNectarineConfig(configPath);

let adapter: PgSql;
try {
  adapter = await connectTodoDatabase(nectarine);
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`ToDo API boot failed: ${message}`);
  process.exit(1);
}

const app = Seltzer.init();

for (const route of createRoutes(nectarine, adapter)) {
  app.route(route);
}

const server = app.listen(port, {
  // Seltzer defaults to 127.0.0.1. The droplet must accept other hosts.
  host: "0.0.0.0",
  cors: {
    ...(corsOrigin ? { origin: corsOrigin } : {}),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    headers: ["Content-Type"],
  },
  onListening: (listeningPort) => {
    console.log(`ToDo API listening on http://localhost:${listeningPort}`);
  },
});

function shutdown(signal: string) {
  console.log(`${signal}: shutting down ToDo API`);
  server.close(() => {
    void adapter.disconnect().finally(() => {
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
