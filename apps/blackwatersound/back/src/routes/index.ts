import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { Route } from "@citrusworx/seltzer";
import { createNectarineReadRoutes } from "@citrusworx/webengine";
import type { BlackwaterContext } from "../types/context.js";
import { isDatabaseConnected, runCompiledQuery } from "../db/postgres.js";
import { getLessonRoute, getPostBySlugRoute } from "./content.js";
import { healthRoute } from "./health.js";
import { createProductReadRoutes } from "./products.js";
import { createWaitlistRoutes } from "./waitlist.js";

/**
 * Reads compiled from `*API.yml` via engine {@link createNectarineReadRoutes}.
 * Product + waitlist keep specialized execute (JSONB catalog / JSON store).
 * Waitlist also includes POST `joinWaitlist`. Lesson `byId` is excluded so the
 * hand KiwiPress `GET /api/lessons/:id` stays unique.
 */
export const GENERATED_READ_RESOURCES = [
  "course",
  "coach",
  "enrollment",
  "booking",
  "client",
  "order",
  "order_item",
  "session",
  "mix_review",
  "lesson",
] as const;

/** Object-based Seltzer routes. Resource reads come from `*API.yml`. */
export function createRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  return [
    healthRoute,
    ...createProductReadRoutes(nectarine),
    ...createWaitlistRoutes(nectarine),
    ...createNectarineReadRoutes(nectarine, {
      resources: GENERATED_READ_RESOURCES,
      query: async (sql, params) => (await runCompiledQuery(sql, params)) ?? { rows: [] },
      connected: () => isDatabaseConnected(),
      exclude: [{ resource: "lesson", name: "byId" }],
    }),
    getPostBySlugRoute,
    getLessonRoute,
  ];
}
