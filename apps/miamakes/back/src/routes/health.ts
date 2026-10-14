import type { ResponseData, Route } from "@citrusworx/seltzer";
import { isDatabaseConnected } from "../db/postgres.js";
import type { MiaContext } from "../types/context.js";

export const healthRoute: Route<MiaContext> = {
  method: "GET",
  path: "/api/health",
  handler: ({ locals }): ResponseData => {
    const databaseConnected = isDatabaseConnected();

    return {
      body: {
        ok: true,
        service: "miamakes-back",
        runtime: "seltzer",
        nectarine: {
          version: locals.nectarine.version,
          app: locals.nectarine.app,
          transport: locals.nectarine.transportServer,
          vendor: locals.nectarine.getVendor(),
          resources: [...locals.nectarine.resources.keys()],
        },
        database: {
          configured: databaseConnected,
          seedFallback: !databaseConnected,
        },
        recipes: locals.recipes.length,
      },
    };
  },
};
