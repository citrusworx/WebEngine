import type { NectarineConfig } from "@citrusworx/nectarine/config";
import type { Route } from "@citrusworx/seltzer";
import type { BlackwaterContext } from "../types/context.js";
import { getLessonRoute, getPostBySlugRoute } from "./content.js";
import { healthRoute } from "./health.js";
import {
  createNectarineReadRoutes,
  executeCompiledRead,
} from "./nectarine-reads.js";
import { createProductReadRoutes } from "./products.js";
import { createWaitlistReadRoutes, joinWaitlistRoute } from "./waitlist.js";

/**
 * Reads compiled from `*API.yml` via {@link createNectarineReadRoutes}.
 * Product + waitlist keep specialized execute (JSONB catalog / JSON store).
 * Lesson `byId` is excluded so the hand KiwiPress `GET /api/lessons/:id` stays unique.
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
    ...createWaitlistReadRoutes(nectarine),
    ...createNectarineReadRoutes(nectarine, {
      resources: GENERATED_READ_RESOURCES,
      execute: executeCompiledRead,
      exclude: [{ resource: "lesson", name: "byId" }],
    }),
    joinWaitlistRoute,
    getPostBySlugRoute,
    getLessonRoute,
  ];
}
