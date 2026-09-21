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

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Poll `read` until `done`, a terminal failure, or the attempt budget is spent.
 * The budget is `ceil(timeoutMs / intervalMs)` reads (at least one), so a
 * sleep that never delays and a clock that barely moves still stop.
 */
export async function pollUntil<T>(options: PollUntilOptions<T>): Promise<T> {
    const sleep = options.sleep ?? defaultSleep;
    const intervalMs = options.intervalMs;
    const timeoutMs = options.timeoutMs;
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
        throw new Error("Poll timeout must be a non-negative number of milliseconds");
    }
    if (!Number.isFinite(intervalMs) || intervalMs < 0) {
        throw new Error("Poll interval must be a non-negative number of milliseconds");
    }
    const maxReads = Math.max(1, Math.ceil(timeoutMs / Math.max(intervalMs, 1)));
    const started = Date.now();

    let current = await options.read();
    let reads = 1;
    while (!options.done(current)) {
        const failure = options.failure?.(current);
        if (failure) {
            throw new Error(failure);
        }
        if (reads >= maxReads || Date.now() - started >= timeoutMs) {
            throw new Error(options.timeoutError(current));
        }
        await sleep(intervalMs);
        current = await options.read();
        reads += 1;
        if (reads > maxReads + 1) {
            throw new Error(options.timeoutError(current));
        }
    }
    return current;
}
