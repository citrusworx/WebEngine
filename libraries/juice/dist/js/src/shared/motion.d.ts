/**
 * Shared enter/exit motion for Juice runtimes.
 *
 * `prefersReducedMotion` reads `matchMedia('(prefers-reduced-motion: reduce)')`.
 * It returns false when `matchMedia` is missing (SSR, jsdom) or throws.
 * `subscribeReducedMotion` reports later changes and returns an unsubscribe
 * function. The unsubscribe is a no-op in those same environments.
 *
 * `runMotion` drives one element:
 *   enter → data-motion-state="entering", then "entered"
 *   exit  → data-motion-state="exiting", then "exited"
 * It resolves on `transitionend` or `animationend` whose target is that
 * element. Events that bubble from children are ignored. If the event never
 * arrives, a timeout fires after the computed transition and animation
 * duration plus delay (the longer of the two). Duration 0, or reduced
 * motion, finishes in the same turn (`immediate: true`) so callers can set
 * `hidden` or restore focus before they return. A resolved promise alone
 * would wait a microtask and miss that contract.
 *
 * Pass a `MotionCancelToken` to abandon an in-flight enter or exit. Cancelling
 * does not apply the terminal state. `createElementMotion` keeps one token
 * per element so a later enter or exit replaces the previous one.
 */
export type MotionState = 'entering' | 'entered' | 'exiting' | 'exited';
export type MotionDirection = 'enter' | 'exit';
export type MotionCancelToken = {
    readonly cancelled: boolean;
    cancel: () => void;
};
export type MotionResult = {
    /** True when the terminal state was applied before `runMotion` returned. */
    immediate: boolean;
    /** Resolves when the motion finishes or is cancelled. */
    finished: Promise<{
        completed: boolean;
    }>;
};
export type MotionPlayer = {
    enter: (element: HTMLElement, onComplete?: () => void, afterStart?: () => void) => void;
    exit: (element: HTMLElement, onComplete?: () => void, afterStart?: () => void) => void;
    cancel: (element: HTMLElement) => void;
    destroy: () => void;
};
export declare const prefersReducedMotion: () => boolean;
export declare const subscribeReducedMotion: (listener: (reduced: boolean) => void) => (() => void);
export declare const createMotionCancelToken: () => MotionCancelToken;
export declare const runMotion: (element: HTMLElement, direction: MotionDirection, token?: MotionCancelToken) => MotionResult;
export declare const createElementMotion: () => MotionPlayer;
