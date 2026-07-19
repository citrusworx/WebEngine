import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { Seltzer } from "@citrusworx/seltzer";
import { createAppContext } from "./context.js";
import { routes } from "./routes/index.js";

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN?.trim();

const configPath =
  process.env.NECTARINE_CONFIG?.trim() ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../nectarine.config.yaml");

const nectarine = loadNectarineConfig(configPath);
const locals = await createAppContext(nectarine);

const app = Seltzer.init();

for (const route of routes) {
  app.route(route);
}

app.listen(port, {
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
    const dbStatus = nectarine.isDatabaseConfigured()
      ? `Nectarine DB → ${nectarine.getVendor()} (${nectarine.getEnvKeys().database})`
      : "Nectarine DB → seed fallback";

    console.log(`Blackwater Sound API listening on http://localhost:${listeningPort}`);
    console.log(`Seltzer + Nectarine ${nectarine.version} (${nectarine.resources.size} resources)`);
    console.log(wpStatus);
    console.log(dbStatus);
  },
});
