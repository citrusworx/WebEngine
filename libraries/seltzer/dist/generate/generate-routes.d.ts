import { type ResponseData } from "../core/response.js";
import type { RequestContext, Route } from "../core/types.js";
import type { ApiOperation } from "./types.js";
export type ExecuteArgs<TContext extends RequestContext = RequestContext> = {
    resource: string;
    query?: string;
    params: Record<string, string>;
    body: unknown;
    ctx: TContext;
    operation: ApiOperation;
};
export type GenerateRoutesOptions<TContext extends RequestContext = RequestContext> = {
    /**
     * Host data access. Return a payload to wrap as `{ body }`,
     * `response({ status?, headers?, body? })` to send as-is, or
     * `null`/`undefined` for the default 404 on reads.
     */
    execute: (args: ExecuteArgs<TContext>) => unknown | Promise<unknown>;
    notFound?: (args: ExecuteArgs<TContext>) => ResponseData;
    filter?: (operation: ApiOperation) => boolean;
};
/**
 * Turn Nectarine `ApiOperation[]` (`listApiOperations`) into object-based
 * Seltzer `Route`s. Nectarine does not generate routes.
 *
 * Copies `resource`, `name`, and `body` field specs onto `Route.contract`
 * so the default `validate` stage can see `.required` keys.
 *
 * Handlers read `ctx.params` / `ctx.query` / `ctx.body`, call `execute`, and
 * return `ResponseData`. They never write `ctx.json`.
 */
export declare function generateRoutes<TContext extends RequestContext = RequestContext>(operations: readonly ApiOperation[], options: GenerateRoutesOptions<TContext>): Route<TContext>[];
