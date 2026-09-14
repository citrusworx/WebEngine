import type { Route } from "@citrusworx/seltzer";
import { waitlistSourceApps } from "../db/named-ddl.js";
import { appendWaitlistEntry, hasWaitlistEmail } from "../store/waitlist-store.js";
import type { BlackwaterContext } from "../types/context.js";

const sourceApps = new Set(waitlistSourceApps);

function parseSourceApp(value: unknown): { ok: true; sourceApp?: string } | { ok: false } {
  if (value === undefined || value === null || value === "") {
    return { ok: true };
  }
  if (typeof value !== "string") {
    return { ok: false };
  }
  const sourceApp = value.trim().toLowerCase();
  if (!sourceApp) {
    return { ok: true };
  }
  if (!sourceApps.has(sourceApp)) {
    return { ok: false };
  }
  return { ok: true, sourceApp };
}

// Nectarine contract: src/schemas/waitlist/waitlistAPI.yml
export const joinWaitlistRoute: Route<BlackwaterContext> = {
  method: "POST",
  path: "/api/waitlist",
  handler: async ({ locals, body }) => {
    const payload = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    const name = String(payload.name ?? "").trim();
    const email = String(payload.email ?? "").trim().toLowerCase();
    const source = parseSourceApp(payload.source_app);
    const interestRaw = typeof payload.interest === "string" ? payload.interest.trim() : "";

    if (!email) {
      return { status: 400, body: { error: "Email is required" } };
    }

    if (!source.ok) {
      return { status: 400, body: { error: "source_app is invalid" } };
    }

    if (await hasWaitlistEmail(email)) {
      return { body: { ok: true, duplicate: true } };
    }

    const entry = {
      id: `wl_${Date.now()}`,
      name,
      email,
      sourceApp: source.sourceApp,
      interest: interestRaw || undefined,
      createdAt: new Date().toISOString(),
    };

    locals.waitlist.push(entry);
    await appendWaitlistEntry(entry);

    return { body: { ok: true } };
  },
};
