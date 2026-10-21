import { isExplicitResponse } from "../core/response.js";
import { comparePathRank, rankPath } from "../pipeline/router.js";
const DEFAULT_NOT_FOUND = {
    status: 404,
    body: { error: "Not found" },
};
function notImplementedResponse() {
    return {
        status: 501,
        body: { error: "Not Implemented" },
    };
}
/**
 * Thrown by {@link generateRoutes} when `unbound` is `"throw"` (the default)
 * and at least one selected operation has no handler binding.
 * `message` lists every unbound operation as `name method path`, one per line.
 */
export class UnboundOperationsError extends Error {
    constructor(operations) {
        const lines = operations.map((operation) => `${operation.name} ${operation.method} ${operation.path}`);
        super(`Unbound operations:\n${lines.join("\n")}`);
        this.name = "UnboundOperationsError";
        this.operations = [...operations];
    }
}
function resolveUnboundPolicy(value) {
    if (value === undefined || value === "throw") {
        return "throw";
    }
    if (value === "notImplemented") {
        return "notImplemented";
    }
    throw new Error(`Unknown unbound policy ${JSON.stringify(value)}. Expected "throw" or "notImplemented".`);
}
function handlerFor(operation, options) {
    return options.handlers?.[operation.name] ?? options.execute;
}
/**
 * Turn a plain `ApiOperation[]` (Nectarine `listApiOperations`, or a list
 * written by hand) into object-based Seltzer `Route`s. Seltzer does not
 * import Nectarine and does not read YAML.
 *
 * Copies `resource`, `name`, and `body` field specs onto `Route.contract`
 * so the default `validate` stage can see `.required` keys. Those specs are
 * strings, not schemas. A `replace("validate")` stage reads `ctx.route`
 * and dispatches itself; this function does not attach a validator.
 *
 * Each operation needs a binding: `handlers[operation.name]`, or `execute`
 * for every name that map does not cover. With neither, the default is to
 * throw {@link UnboundOperationsError} before any route is returned.
 * `unbound: "notImplemented"` registers those operations as 501 instead.
 * `filter` runs first and removes operations from that check.
 *
 * Bound handlers read `ctx.params` / `ctx.query` / `ctx.body`, return
 * `ResponseData` from this wrapper, and never write `ctx.json`.
 */
export function generateRoutes(operations, options) {
    const policy = resolveUnboundPolicy(options.unbound);
    const selected = options.filter ? operations.filter(options.filter) : [...operations];
    const unbound = selected.filter((operation) => handlerFor(operation, options) === undefined);
    if (unbound.length > 0 && policy === "throw") {
        throw new UnboundOperationsError(unbound);
    }
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
            const bound = handlerFor(operation, options);
            if (!bound) {
                return notImplementedResponse();
            }
            const args = {
                resource: operation.resource,
                query: operation.query,
                params: ctx.params,
                body: ctx.body,
                ctx,
                operation,
            };
            const result = await bound(args);
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