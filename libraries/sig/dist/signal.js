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
export function Signal(value) {
    const subscribers = new Set();
    function getter() {
        if (currentSubscriber) {
            subscribers.add(currentSubscriber);
        }
        return value;
    }
    function setter(newValue) {
        value = newValue;
        subscribers.forEach(fn => fn());
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
    pendingSubscribers.forEach(fn => fn());
    pendingSubscribers.clear();
}
export function memo(fn) {
    let cachedValue;
    let isDirty = true;
    const subscribers = new Set();
    const invalidate = () => {
        isDirty = true;
        subscribers.forEach(fn => fn());
    };
    function getter() {
        if (currentSubscriber) {
            subscribers.add(currentSubscriber);
        }
        if (isDirty) {
            const prevSubscriber = currentSubscriber;
            currentSubscriber = invalidate;
            cachedValue = fn();
            currentSubscriber = prevSubscriber;
            isDirty = false;
        }
        return cachedValue;
    }
    return {
        get: getter
    };
}
export function effect(fn) {
    currentSubscriber = fn;
    fn();
    currentSubscriber = null;
    return () => { };
}
//# sourceMappingURL=signal.js.map