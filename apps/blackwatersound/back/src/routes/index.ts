import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { Route } from "@citrusworx/seltzer";
import { createNectarineRoutes } from "@citrusworx/webengine";
import type { BlackwaterContext } from "../types/context.js";
import { isDatabaseConnected, runCompiledQuery } from "../db/postgres.js";
import { getLessonRoute, getPostBySlugRoute } from "./content.js";
import { healthRoute } from "./health.js";
import { createProductRoutes } from "./products.js";
import { createWaitlistRoutes } from "./waitlist.js";

/**
 * Resource reads **and** YAML writes via engine {@link createNectarineRoutes}.
 * Product keeps specialized execute so JSONB `payload` is not flattened;
 * waitlist `joinWaitlist` keeps its allowlist execute.
 * Lesson `byId` is excluded so the hand KiwiPress `GET /api/lessons/:id` stays unique.
 */
export const GENERATED_RESOURCES = [
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

/** @deprecated Use {@link GENERATED_RESOURCES}. */
export const GENERATED_READ_RESOURCES = GENERATED_RESOURCES;

function compiledQuery(sql: string, params?: readonly unknown[]) {
  return runCompiledQuery(sql, params).then((result) => result ?? { rows: [] });
}

/** Object-based Seltzer routes. Resource CRUD comes from `*API.yml`. */
export function createRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  return [
    healthRoute,
    ...createProductRoutes(nectarine),
    ...createWaitlistRoutes(nectarine),
    ...createNectarineRoutes(nectarine, {
      resources: GENERATED_RESOURCES,
      query: compiledQuery,
      connected: () => isDatabaseConnected(),
      exclude: [{ resource: "lesson", name: "byId" }],
    }),
    getPostBySlugRoute,
    getLessonRoute,
  ];
}
