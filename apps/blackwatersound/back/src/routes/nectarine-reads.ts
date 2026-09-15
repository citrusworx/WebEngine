import {
  compileResourceQuery,
  createCompiledNectarineExecute,
  createNectarineReadRoutes,
  createNectarineRoutes,
  createNectarineWriteRoutes,
  createResourceReadRoutes,
  createResourceWriteRoutes,
  isSingularRead,
  isWriteOperation,
  listResourceOperations,
  listResourceReadOperations,
  listResourceWriteOperations,
  pathBindValues,
  resolveResourceQueries,
  writeBindValues,
  type CreateNectarineReadRoutesOptions,
  type CreateNectarineRoutesOptions,
  type CreateNectarineWriteRoutesOptions,
  type ReadRouteExclude,
  type RouteExclude,
} from "@citrusworx/webengine";
import type { ExecuteArgs } from "@citrusworx/seltzer";
import { isDatabaseConnected, runCompiledQuery } from "../db/postgres.js";
import type { BlackwaterContext } from "../types/context.js";

export {
  compileResourceQuery,
  createNectarineReadRoutes,
  createNectarineRoutes,
  createNectarineWriteRoutes,
  createResourceReadRoutes,
  createResourceWriteRoutes,
  isSingularRead,
  isWriteOperation,
  listResourceOperations,
  listResourceReadOperations,
  listResourceWriteOperations,
  pathBindValues,
  resolveResourceQueries,
  writeBindValues,
};
export type {
  CreateNectarineReadRoutesOptions,
  CreateNectarineRoutesOptions,
  CreateNectarineWriteRoutesOptions,
  ReadRouteExclude,
  RouteExclude,
};

/**
 * Blackwater compiled execute: engine helper + this host's Postgres adapter.
 * Prefer passing `query` / `connected` into {@link createNectarineRoutes}
 * at the call site (see `routes/index.ts`). Product JSONB catalog writes and
 * waitlist `joinWaitlist` keep their own `execute` on `createNectarineRoutes`
 * (same helper, host-only id / duplicate UX / allowlist / file-store).
 */
export function executeCompiledRead(
  args: ExecuteArgs<BlackwaterContext>,
): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
  return createCompiledNectarineExecute({
    config: args.ctx.locals.nectarine,
    query: async (sql, params) => (await runCompiledQuery(sql, params)) ?? { rows: [] },
    connected: () => isDatabaseConnected(),
  })(args);
}

export const executeCompiled = executeCompiledRead;
