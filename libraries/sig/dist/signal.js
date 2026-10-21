/**
 * A reactive signal system for managing state with automatic DOM updates.
 *
 * This module provides a lightweight reactivity system that allows components
 * to subscribe to state changes and automatically update only the affected DOM elements,
 * rather than re-rendering the entire DOM.
 *
 * @example
 * ```typescript
 * const count = Signal(0);
 *
 * effect(() => {
 *   document.body.textContent = count.get();
 * });
 *
 * count.set(1); // Only the effect callback runs, updating the DOM
 * ```
 */
let batchDepth = 0;
const pendingSubscribers = new Set();
let currentSubscriber = null;
let currentCleanupScope = null;
function runCleanup(cleanup) {
    cleanup?.();
}
function scheduleSubscriber(subscriber) {
    if (batchDepth > 0) {
        pendingSubscribers.add(subscriber);
        return;
    }
    subscriber.notify();
}
function flushPendingSubscribers() {
    const queued = [...pendingSubscribers];
    pendingSubscribers.clear();
    for (const subscriber of queued) {
        subscriber.notify();
    }
}
function registerCleanup(cleanup) {
    currentCleanupScope?.cleanups.add(cleanup);
}
function disposeScope(scope) {
    for (const cleanup of scope.cleanups) {
        runCleanup(cleanup);
    }
    scope.cleanups.clear();
}
/**
 * Collects cleanups registered while `fn` runs and returns them as `dispose`.
 * The JSX runtime uses this for a component call. `bindList` uses it for a row.
 * If `fn` throws, those cleanups run before the error propagates.
 *
 * App code should not call this. It stays exported so existing imports keep working.
 *
 * @internal
 */
export function captureCleanupScope(fn) {
    const parentScope = currentCleanupScope;
    const scope = { cleanups: new Set() };
    currentCleanupScope = scope;
    try {
        let value;
        try {
            value = fn();
        }
        catch (error) {
            disposeScope(scope);
            throw error;
        }
        let disposed = false;
        return {
            value,
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                disposeScope(scope);
            },
        };
    }
    finally {
        currentCleanupScope = parentScope;
    }
}
/**
 * Runs `fn` without subscribing the current effect or memo.
 * Reads inside `fn` still return the current value.
 */
export function untrack(fn) {
    const prev = currentSubscriber;
    currentSubscriber = null;
    try {
        return fn();
    }
    finally {
        currentSubscriber = prev;
    }
}
/**
 * Creates a reactive signal that tracks subscribers for state changes.
 *
 * When the signal's getter is called within an {@link effect}, the effect function
 * is automatically subscribed to receive updates. When the setter is called with a new value,
 * all subscribers are notified and their callback functions are executed.
 *
 * @template T - The type of value stored in the signal
 * @param value - The initial value of the signal
 * @returns An object with `get` and `set` methods for reading and writing the signal value
 * @returns {Object} Signal object
 * @returns {Function} Signal.get - Retrieves the current value and registers the current subscriber
 * @returns {Function} Signal.set - Updates the value and notifies all subscribers
 *
 * @example
 * const message = Signal('hello');
 * const current = message.get(); // Returns 'hello'
 * message.set('world'); // Notifies all subscribers
 */
export function Signal(value) {
    const subscribers = new Set();
    function getter() {
        if (currentSubscriber) {
            subscribers.add(currentSubscriber);
            currentSubscriber.addDependency(subscribers);
        }
        return value;
    }
    function setter(newValue) {
        value = newValue;
        [...subscribers].forEach(subscriber => scheduleSubscriber(subscriber));
    }
    return {
        get: getter,
        set: setter
    };
}
export function batch(fn) {
    batchDepth += 1;
    try {
        fn();
    }
    finally {
        batchDepth -= 1;
        if (batchDepth === 0) {
            flushPendingSubscribers();
        }
    }
}
export function memo(fn) {
    let cachedValue;
    let isDirty = true;
    const subscribers = new Set();
    const dependencies = new Set();
    const invalidate = {
        addDependency(subscriberSet) {
            dependencies.add(subscriberSet);
        },
        notify() {
            isDirty = true;
            [...subscribers].forEach(subscriber => scheduleSubscriber(subscriber));
        },
        dispose() {
            for (const subscriberSet of dependencies) {
                subscriberSet.delete(invalidate);
            }
            dependencies.clear();
            subscribers.clear();
        },
    };
    function getter() {
        if (currentSubscriber) {
            subscribers.add(currentSubscriber);
            currentSubscriber.addDependency(subscribers);
        }
        if (isDirty) {
            for (const subscriberSet of dependencies) {
                subscriberSet.delete(invalidate);
            }
            dependencies.clear();
            const prevSubscriber = currentSubscriber;
            currentSubscriber = invalidate;
            try {
                cachedValue = fn();
            }
            finally {
                currentSubscriber = prevSubscriber;
            }
            isDirty = false;
        }
        // Assigned on the dirty path above. The slot is `T | undefined` only before that run.
        return cachedValue;
    }
    return {
        get: getter
    };
}
/**
 * Registers a function to automatically run whenever accessed signals change.
 *
 * The provided function is executed immediately, and any signals accessed during execution
 * will register this function as a subscriber. When those signals are updated via their setter,
 * this effect function will be re-executed.
 *
 * @param fn - The callback function to execute and track for reactive updates
 * @returns A disposer. Calling it unsubscribes the effect and runs the last cleanup.
 *
 * @example
 * effect(() => {
 *   console.log('Count is:', count.get());
 * });
 */
export function effect(fn) {
    const dependencies = new Set();
    let cleanup;
    let disposed = false;
    const subscriber = {
        addDependency(subscribers) {
            dependencies.add(subscribers);
        },
        notify() {
            if (disposed) {
                return;
            }
            run();
        },
        dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            for (const subscribers of dependencies) {
                subscribers.delete(subscriber);
            }
            dependencies.clear();
            runCleanup(cleanup);
            cleanup = undefined;
            pendingSubscribers.delete(subscriber);
        },
    };
    function run() {
        for (const subscribers of dependencies) {
            subscribers.delete(subscriber);
        }
        dependencies.clear();
        runCleanup(cleanup);
        cleanup = undefined;
        const prevSubscriber = currentSubscriber;
        currentSubscriber = subscriber;
        let maybeCleanup;
        try {
            maybeCleanup = fn();
        }
        finally {
            currentSubscriber = prevSubscriber;
        }
        if (typeof maybeCleanup === "function") {
            cleanup = maybeCleanup;
        }
    }
    run();
    const dispose = () => subscriber.dispose();
    registerCleanup(dispose);
    return dispose;
}
//# sourceMappingURL=signal.js.map