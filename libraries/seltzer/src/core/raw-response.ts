import type { ServerResponse } from "node:http";

const WRITE_METHODS = new Set([
    "write",
    "end",
    "writeHead",
    "setHeader",
    "appendHeader",
    "removeHeader",
    "flushHeaders",
    "writeContinue",
    "addTrailers",
]);

const RAW_WRITE =
    "Seltzer handlers and hooks must return ResponseData. Writing to the raw response (ctx.res) is not supported. The runtime writes the HTTP response.";

function rawWriteMessage(method: string): string {
    return `Seltzer handlers and hooks must return ResponseData. Do not call ctx.res.${method}(). The runtime writes the HTTP response.`;
}

/**
 * Reads of `res` still work. Writes throw so a handler cannot bypass ResponseData.
 * Builtin `send` keeps the real `ServerResponse`.
 */
export function guardRawResponse(res: ServerResponse): ServerResponse {
    return new Proxy(res, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof prop === "string" && WRITE_METHODS.has(prop) && typeof value === "function") {
                return () => {
                    throw new Error(rawWriteMessage(prop));
                };
            }
            if (typeof value === "function") {
                return value.bind(target);
            }
            return value;
        },
        set() {
            throw new Error(RAW_WRITE);
        },
        defineProperty() {
            throw new Error(RAW_WRITE);
        },
        deleteProperty() {
            throw new Error(RAW_WRITE);
        },
    });
}

const REMOVED_RESPONSE_METHODS: Record<string, string> = {
    json: "ctx.json was removed. Return ResponseData ({ status?, headers?, body? }). The runtime writes the HTTP response.",
    send: "ctx.send is not a Seltzer API. Return ResponseData ({ status?, headers?, body? }). The runtime writes the HTTP response.",
};

/**
 * `ctx.json` and `ctx.send` are not on the TypeScript context.
 * Calling either at runtime throws, including from plain JavaScript.
 */
export function installRemovedResponseMethods(ctx: object): void {
    for (const [name, message] of Object.entries(REMOVED_RESPONSE_METHODS)) {
        Object.defineProperty(ctx, name, {
            configurable: true,
            enumerable: false,
            writable: false,
            value: () => {
                throw new Error(message);
            },
        });
    }
}
