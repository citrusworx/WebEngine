/** Default request body limit. `listen({ bodyLimit: 0 })` means unlimited. */
export const DEFAULT_BODY_LIMIT_BYTES = 1048576;
/** Default `listen` bind. Public interfaces require an explicit `host`. */
export const DEFAULT_LISTEN_HOST = "127.0.0.1";
/**
 * Milliseconds to receive complete HTTP headers.
 * Greater than {@link DEFAULT_KEEP_ALIVE_TIMEOUT_MS} so Node does not
 * answer idle keep-alive sockets with 408.
 */
export const DEFAULT_HEADERS_TIMEOUT_MS = 20000;
/**
 * Milliseconds for the entire request, including the body.
 * Tighter than Node's 5-minute default. `0` disables the timer.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
/**
 * Default outbound client deadline. Same number as {@link DEFAULT_REQUEST_TIMEOUT_MS}.
 * `createClient({ timeout: 0 })` or `options.timeout: 0` disables it.
 */
export const DEFAULT_CLIENT_TIMEOUT_MS = DEFAULT_REQUEST_TIMEOUT_MS;
/** Milliseconds an idle keep-alive socket may wait for the next request. */
export const DEFAULT_KEEP_ALIVE_TIMEOUT_MS = 5000;
//# sourceMappingURL=types.js.map