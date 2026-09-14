import type { Route } from "@citrusworx/seltzer";
import { appendWaitlistEntry, hasWaitlistEmail } from "../store/waitlist-store.js";
import type { BlackwaterContext } from "../types/context.js";

// Nectarine contract: src/schemas/waitlist/waitlistAPI.yml
export const joinWaitlistRoute: Route<BlackwaterContext> = {
  method: "POST",
  path: "/api/waitlist",
  handler: async ({ locals, body }) => {
    const payload = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    const name = String(payload.name ?? "").trim();
    const email = String(payload.email ?? "").trim().toLowerCase();

    if (!email) {
      return { status: 400, body: { error: "Email is required" } };
    }

    if (await hasWaitlistEmail(email)) {
      return { body: { ok: true, duplicate: true } };
    }

    const entry = {
      id: `wl_${Date.now()}`,
      name,
      email,
      createdAt: new Date().toISOString(),
    };

    locals.waitlist.push(entry);
    await appendWaitlistEntry(entry);

    return { body: { ok: true } };
  },
};
