export interface PollUntilOptions<T> {
    timeoutMs: number;
    intervalMs: number;
    sleep?: (ms: number) => Promise<void>;
    read: () => Promise<T>;
    done: (value: T) => boolean;
    /** Return an error message to fail immediately, or undefined to keep polling. */
    failure?: (value: T) => string | undefined;
    timeoutError: (value: T) => string;
}
/**
 * Poll `read` until `done`, a terminal failure, or the attempt budget is spent.
 * The budget is `ceil(timeoutMs / intervalMs)` reads (at least one), so a
 * sleep that never delays and a clock that barely moves still stop.
 */
export declare function pollUntil<T>(options: PollUntilOptions<T>): Promise<T>;
