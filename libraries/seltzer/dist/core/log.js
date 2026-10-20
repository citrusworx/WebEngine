import { inspect } from "node:util";
export const INVALID_RETURN_MESSAGE = "Handler must return ResponseData ({ status?, headers?, body? }). Bare values are not wrapped.";
/** HTTP body for a thrown error. No message and no stack. */
export function genericInternalError() {
    return {
        status: 500,
        body: { error: "Internal Server Error" },
    };
}
/** HTTP body for a handler or hook that did not return ResponseData. */
export function invalidReturnResponse() {
    return {
        status: 500,
        body: {
            error: "Internal Server Error",
            message: INVALID_RETURN_MESSAGE,
        },
    };
}
export function defaultLogger(message) {
    console.error(message);
}
export function emitLog(ctx, message) {
    const logger = ctx.logger ?? defaultLogger;
    try {
        logger(message);
    }
    catch (error) {
        try {
            defaultLogger(`Seltzer logger threw: ${error instanceof Error ? error.message : String(error)}`);
        }
        catch {
            // A broken logger must not replace the HTTP response.
        }
    }
}
/** `GET /items/:id (request /items/42)` when the pattern and the path differ. */
export function routePhrase(ctx) {
    const method = ctx.route?.method ?? ctx.method ?? "?";
    const pattern = ctx.route?.path;
    const actual = ctx.path ?? "";
    if (pattern && actual && pattern !== actual) {
        return `${method} ${pattern} (request ${actual})`;
    }
    const path = pattern || actual;
    return path ? `${method} ${path}` : method;
}
export function describeReturned(value) {
    if (value === undefined) {
        return "undefined";
    }
    const preview = inspect(value, {
        depth: 2,
        maxArrayLength: 8,
        maxStringLength: 80,
        breakLength: 120,
        compact: true,
        getters: false,
    });
    return `${returnedKind(value)} ${preview}`;
}
function returnedKind(value) {
    if (value === null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "array";
    }
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
        return "Buffer";
    }
    if (value instanceof Uint8Array) {
        return "Uint8Array";
    }
    if (typeof value === "object") {
        return "object";
    }
    return typeof value;
}
export function logInvalidReturn(ctx, value, where) {
    emitLog(ctx, `Seltzer: ${where} returned ${describeReturned(value)}. ${INVALID_RETURN_MESSAGE}`);
}
export function logThrown(ctx, where, error) {
    emitLog(ctx, `Seltzer: ${routePhrase(ctx)} ${where} threw: ${thrownDetail(error, ctx.debug === true)}`);
}
function thrownDetail(error, debug) {
    if (!(error instanceof Error)) {
        return String(error);
    }
    if (debug && error.stack) {
        return error.stack;
    }
    return error.message || error.name || "Error";
}
//# sourceMappingURL=log.js.map