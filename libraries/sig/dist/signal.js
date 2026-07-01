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
let isBatching = false;
const pendingSubscribers = new Set();
let currentSubscriber = null;
let currentCleanupScope = null;
function runCleanup(cleanup) {
    cleanup?.();
}
function scheduleSubscriber(subscriber) {
    if (isBatching) {
        pendingSubscribers.add(subscriber);
        return;
    }
    subscriber.notify();
}
function registerCleanup(cleanup) {
    currentCleanupScope?.cleanups.add(cleanup);
}
export function captureCleanupScope(fn) {
    const parentScope = currentCleanupScope;
    const scope = { cleanups: new Set() };
    currentCleanupScope = scope;
    try {
        const value = fn();
        let disposed = false;
        return {
            value,
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                for (const cleanup of scope.cleanups) {
                    runCleanup(cleanup);
                }
                scope.cleanups.clear();
            },
        };
    }
    finally {
        currentCleanupScope = parentScope;
    }
}
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
    isBatching = true;
    fn();
    isBatching = false;
    pendingSubscribers.forEach(subscriber => subscriber.notify());
    pendingSubscribers.clear();
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
        return cachedValue;
    }
    return {
        get: getter
    };
}
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