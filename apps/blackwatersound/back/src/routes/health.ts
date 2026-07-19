import type { Route } from "@citrusworx/seltzer";
import { getPool } from "../db/postgres.js";
import type { BlackwaterContext } from "../types/context.js";

export const healthRoute: Route<BlackwaterContext> = {
  method: "GET",
  path: "/api/health",
  handler: ({ locals, json }) => {
    const { nectarine } = locals;

    json({
      ok: true,
      service: "blackwater-sound-back",
      runtime: "seltzer",
      nectarine: {
        version: nectarine.version,
        app: nectarine.app,
        transport: nectarine.transportServer,
        vendor: nectarine.getVendor(),
        resources: [...nectarine.resources.keys()],
        apps: nectarine.apps.map((app) => ({
          id: app.id,
          subdomain: app.subdomain,
        })),
      },
      kiwipress: {
        configured: Boolean(locals.wpUrl),
        url: locals.wpUrl,
        posts: Boolean(locals.postsClient),
        pages: Boolean(locals.pagesClient),
      },
      database: {
        configured: Boolean(getPool()),
        products: locals.products.length,
      },
      catalog: {
        products: locals.products.length,
      },
      waitlist: {
        entries: locals.waitlist.length,
      },
    });
  },
};
