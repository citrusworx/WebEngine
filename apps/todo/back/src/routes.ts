import type { PgSql } from "@citrusworx/nectarine/adapters/pg";
import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { ResponseData, Route } from "@citrusworx/seltzer";
import { createNectarineRoutes } from "@citrusworx/webengine";

/** Hand-written. Generated CRUD does not include a health check. */
export function healthRoute(): Route {
  return {
    method: "GET",
    path: "/api/health",
    handler: (): ResponseData => ({ body: { ok: true } }),
  };
}

/**
 * Object routes. Todo CRUD comes from schemas/todo/todoAPI.yml.
 * `query` runs compiler SQL through the pg adapter.
 */
export function createRoutes(nectarine: NectarineConfig, adapter: PgSql): Route[] {
  return [
    healthRoute(),
    ...createNectarineRoutes(nectarine, {
      resources: ["todo"],
      query: (sql, params) => adapter.query(sql, params ?? []),
      connected: () => adapter.connected,
    }),
  ];
}
