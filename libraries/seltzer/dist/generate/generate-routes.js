import { isResponseData } from "../core/response.js";
const DEFAULT_NOT_FOUND = {
    status: 404,
    body: { error: "Not found" },
};
/**
 * Turn flattened `*API.yml` operations into object-based Seltzer `Route`s.
 *
 * Handlers read `ctx.params` / `ctx.query` / `ctx.body`, call `execute`, and
 * return `ResponseData`. They never write `ctx.json`.
 */
export function generateRoutes(operations, options) {
    const selected = options.filter ? operations.filter(options.filter) : [...operations];
    return selected.map((operation) => ({
        method: operation.method,
        path: operation.path,
        handler: async (ctx) => {
            const args = {
                resource: operation.resource,
                query: operation.query,
                params: ctx.params,
                body: ctx.body,
                ctx,
                operation,
            };
            const result = await options.execute(args);
            if (isResponseData(result)) {
                return result;
            }
            if (result === null || result === undefined) {
                return options.notFound?.(args) ?? DEFAULT_NOT_FOUND;
            }
            return { body: result };
        },
    }));
}
//# sourceMappingURL=generate-routes.js.map