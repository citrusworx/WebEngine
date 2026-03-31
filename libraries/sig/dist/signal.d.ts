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
/**
 * Registers a function to automatically run whenever accessed signals change.
 *
 * The provided function is executed immediately, and any signals accessed during execution
 * will register this function as a subscriber. When those signals are updated via their setter,
 * this effect function will be re-executed.
 *
 * @param fn - The callback function to execute and track for reactive updates
 *
 * @example
 * effect(() => {
 *   console.log('Count is:', count.get());
 * });
 */
type Subscriber = () => void;
export declare function Signal<T>(value: T): {
    get: () => T;
    set: (newValue: T) => void;
};
export declare function batch(fn: () => void): void;
export declare function memo<T>(fn: () => T): {
    get: () => T | undefined;
};
export declare function effect(fn: Subscriber): () => void;
export {};
