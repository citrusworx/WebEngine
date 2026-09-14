import { listApiOperations, type NectarineConfig } from "@citrusworx/nectarine/config";
import {
  generateRoutes,
  type ExecuteArgs,
  type ResponseData,
  type Route,
} from "@citrusworx/seltzer";
import { waitlistSourceApps } from "../db/named-ddl.js";
import { isDatabaseConnected, loadWaitlistByEmailFromDb, loadWaitlistFromDb } from "../db/postgres.js";
import { appendWaitlistEntry, hasWaitlistEmail } from "../store/waitlist-store.js";
import type { BlackwaterContext, WaitlistEntry } from "../types/context.js";

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

/**
 * `waitlistAPI.yml` `query:` vs live SQL in `named-queries.ts`:
 *
 * | API `query:`   | Live named query | Why |
 * | allEntries     | allEntries       | `SELECT * … ORDER BY created_at ASC` |
 * | entryByEmail   | entryByEmail     | `SELECT * … WHERE email = $1` |
 *
 * When Postgres is unset, use boot-time `locals.waitlist` (JSON file store).
 * An empty waitlist is valid — do not treat `[]` as a miss.
 */
function normalizeEmail(email: string | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

async function loadEntries(ctx: BlackwaterContext): Promise<WaitlistEntry[]> {
  if (isDatabaseConnected()) {
    return loadWaitlistFromDb();
  }

  return ctx.locals.waitlist;
}

async function findByEmail(
  ctx: BlackwaterContext,
  email: string | undefined,
): Promise<WaitlistEntry | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  if (isDatabaseConnected()) {
    const fromDb = await loadWaitlistByEmailFromDb(normalized);
    if (fromDb) {
      return fromDb;
    }
  }

  return ctx.locals.waitlist.find((entry) => entry.email === normalized) ?? null;
}

async function executeWaitlistRead({
  query,
  params,
  ctx,
}: ExecuteArgs<BlackwaterContext>): Promise<WaitlistEntry | WaitlistEntry[] | null> {
  switch (query) {
    case "allEntries":
      return loadEntries(ctx);
    case "entryByEmail":
      return findByEmail(ctx, params.email);
    default:
      return null;
  }
}

/** Waitlist GET ops from `waitlistAPI.yml`. `joinWaitlist` POST stays hand-written. */
export function createWaitlistReadRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  const operations = listApiOperations("waitlist", nectarine.getResource("waitlist").api).filter(
    (operation) => operation.crud === "read" && operation.method === "GET",
  );

  return generateRoutes(operations, {
    execute: executeWaitlistRead,
    notFound: (): ResponseData => ({ status: 404, body: { error: "Waitlist entry not found" } }),
  });
}

// Nectarine contract: src/schemas/waitlist/waitlistAPI.yml
export const joinWaitlistRoute: Route<BlackwaterContext> = {
  method: "POST",
  path: "/api/waitlist",
  contract: {
    resource: "waitlist",
    name: "joinWaitlist",
    body: {
      name: "string",
      email: "string.required",
      source_app: "string",
      interest: "string",
    },
  },
  handler: async ({ locals, body }): Promise<ResponseData> => {
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

    await appendWaitlistEntry(entry);
    locals.waitlist.push(entry);

    return { body: { ok: true } };
  },
};
