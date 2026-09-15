import { isExplicitResponse } from "../core/response.js";
import { comparePathRank, rankPath } from "../pipeline/router.js";
const DEFAULT_NOT_FOUND = {
    status: 404,
    body: { error: "Not found" },
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
export function generateRoutes(operations, options) {
    const selected = options.filter ? operations.filter(options.filter) : [...operations];
    // Register static prefixes (`/catalog/:catalog`, `/slug/:slug`) before `:id`
    // so first-match registration is safe; matchRoute also prefers specificity.
    const ordered = selected
        .map((operation, index) => ({ operation, index }))
        .sort((left, right) => {
        const byPath = comparePathRank(rankPath(left.operation.path), rankPath(right.operation.path));
        return byPath !== 0 ? byPath : left.index - right.index;
    })
        .map(({ operation }) => operation);
    return ordered.map((operation) => ({
        method: operation.method,
        path: operation.path,
        contract: {
            resource: operation.resource,
            name: operation.name,
            ...(operation.body ? { body: operation.body } : {}),
        },
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
            if (isExplicitResponse(result)) {
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