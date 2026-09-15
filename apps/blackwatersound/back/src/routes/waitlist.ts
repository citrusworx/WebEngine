import type { NectarineConfig } from "@citrusworx/nectarine/config";
import {
  response,
  type ExecuteArgs,
  type ResponseData,
  type Route,
} from "@citrusworx/seltzer";
import { createNectarineRoutes } from "@citrusworx/webengine";
import { waitlistSourceApps } from "../db/named-ddl.js";
import { isDatabaseConnected, loadWaitlistByEmailFromDb, loadWaitlistFromDb } from "../db/postgres.js";
import { appendWaitlistEntry, hasWaitlistEmail } from "../store/waitlist-store.js";
import type { BlackwaterContext, WaitlistEntry } from "../types/context.js";

const sourceApps = new Set(waitlistSourceApps);

function payloadRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}

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

function normalizeEmail(email: string | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

function generateWaitlistId(): string {
  return `wl_${Date.now()}`;
}

/**
 * Host execute for waitlist. SQL stays in `waitlistQueries.yml`.
 *
 * Same contract as product JSONB writes: engine {@link createNectarineRoutes}
 * plus a thin `execute`. Default compiled writes cannot run this POST — the
 * INSERT needs a generated `id` that is not in the HTTP body, and the compiler
 * has no `ON CONFLICT`.
 *
 * Host-only:
 * - generated `id`
 * - duplicate-email UX `{ ok: true, duplicate: true }`
 * - `source_app` allowlist from schema enum
 * - JSON file-store fallback when Postgres is unset
 *
 * | API `query:` | Live named query | Why |
 * | allEntries   | allEntries       | `SELECT * … ORDER BY created_at ASC` |
 * | entryByEmail | entryByEmail     | `SELECT * … WHERE email = $1` |
 * | joinWaitlist | joinWaitlist     | `INSERT … (id, name, email, source_app, interest)` |
 *
 * An empty waitlist is valid — do not treat `[]` as a miss.
 * Required body fields (`email: string.required`) are enforced by Seltzer `validate`.
 */
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

async function joinWaitlist({ body, ctx }: ExecuteArgs<BlackwaterContext>): Promise<unknown> {
  const payload = payloadRecord(body);
  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const source = parseSourceApp(payload.source_app);
  const interestRaw = typeof payload.interest === "string" ? payload.interest.trim() : "";

  if (!source.ok) {
    return response({ status: 400, body: { error: "source_app is invalid" } });
  }

  if (await hasWaitlistEmail(email)) {
    return { ok: true, duplicate: true };
  }

  const entry: WaitlistEntry = {
    id: generateWaitlistId(),
    name,
    email,
    sourceApp: source.sourceApp,
    interest: interestRaw || undefined,
    createdAt: new Date().toISOString(),
  };

  await appendWaitlistEntry(entry);
  ctx.locals.waitlist.push(entry);

  return { ok: true };
}

export async function executeWaitlist(args: ExecuteArgs<BlackwaterContext>): Promise<unknown> {
  switch (args.query) {
    case "allEntries":
      return loadEntries(args.ctx);
    case "entryByEmail":
      return findByEmail(args.ctx, args.params.email);
    case "joinWaitlist":
      return joinWaitlist(args);
    default:
      return null;
  }
}

const waitlistNotFound = (): ResponseData => ({ status: 404, body: { error: "Waitlist entry not found" } });

/** Waitlist GET + POST `joinWaitlist` from `waitlistAPI.yml`. */
export function createWaitlistRoutes(nectarine: NectarineConfig): Route<BlackwaterContext>[] {
  return createNectarineRoutes(nectarine, {
    resources: ["waitlist"],
    execute: executeWaitlist,
    notFound: waitlistNotFound,
  });
}
