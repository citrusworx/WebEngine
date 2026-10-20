import type { ServerResponse } from "node:http";
/**
 * Reads of `res` still work. Writes throw so a handler cannot bypass ResponseData.
 * Builtin `send` keeps the real `ServerResponse`.
 */
export declare function guardRawResponse(res: ServerResponse): ServerResponse;
/**
 * `ctx.json` and `ctx.send` are not on the TypeScript context.
 * Calling either at runtime throws, including from plain JavaScript.
 */
export declare function installRemovedResponseMethods(ctx: object): void;
