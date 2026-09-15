import {
  compileResourceQuery,
  createCompiledNectarineExecute,
  createNectarineReadRoutes,
  createResourceReadRoutes,
  isSingularRead,
  listResourceReadOperations,
  pathBindValues,
  resolveResourceQueries,
  type CreateNectarineReadRoutesOptions,
  type ReadRouteExclude,
} from "@citrusworx/webengine";
import type { ExecuteArgs } from "@citrusworx/seltzer";
import { isDatabaseConnected, runCompiledQuery } from "../db/postgres.js";
import type { BlackwaterContext } from "../types/context.js";

export {
  compileResourceQuery,
  createNectarineReadRoutes,
  createResourceReadRoutes,
  isSingularRead,
  listResourceReadOperations,
  pathBindValues,
  resolveResourceQueries,
};
export type { CreateNectarineReadRoutesOptions, ReadRouteExclude };

/**
 * Blackwater compiled-read execute: engine helper + this host's Postgres adapter.
 * Prefer passing `query` / `connected` into {@link createNectarineReadRoutes}
 * at the call site (see `routes/index.ts`).
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
