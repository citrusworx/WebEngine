import type { ResponseData } from "./response.js";
/** One formatted line. The default writes to `console.error`. */
export type SeltzerLogger = (message: string) => void;
export type LogContext = {
    logger?: SeltzerLogger;
    debug?: boolean;
    method?: string;
    path?: string;
    route?: {
        method: string;
        path: string;
    };
};
export declare const INVALID_RETURN_MESSAGE = "Handler must return ResponseData ({ status?, headers?, body? }). Bare values are not wrapped.";
/** HTTP body for a thrown error. No message and no stack. */
export declare function genericInternalError(): ResponseData;
/** HTTP body for a handler or hook that did not return ResponseData. */
export declare function invalidReturnResponse(): ResponseData;
export declare function defaultLogger(message: string): void;
export declare function emitLog(ctx: LogContext, message: string): void;
/** `GET /items/:id (request /items/42)` when the pattern and the path differ. */
export declare function routePhrase(ctx: LogContext): string;
export declare function describeReturned(value: unknown): string;
export declare function logInvalidReturn(ctx: LogContext, value: unknown, where: string): void;
export declare function logThrown(ctx: LogContext, where: string, error: unknown): void;
