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
export function effect(fn) {
    currentSubscriber = fn;
    fn();
    currentSubscriber = null;
}
//# sourceMappingURL=signal.js.map