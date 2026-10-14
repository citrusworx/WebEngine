/**
 * Observable state for Juice runtimes.
 *
 * A runtime dispatches `juice:change` from the widget host when its
 * observable state actually changes. The event bubbles. Detail is
 * `{ runtime, state }`. The first observation of a host is recorded
 * and does not dispatch, so init can normalize ARIA without looking
 * like a change. Pass `baseline` when this note is the first look and
 * it follows a real mutation.
 *
 * Select, input, and textarea do not use this event. Their value
 * changes stay on the native `input` and `change` events.
 */
export declare const JUICE_CHANGE_EVENT = "juice:change";
export type JuiceChangeDetail<TState> = {
    runtime: string;
    state: TState;
};
export declare const juiceStatesEqual: (left: unknown, right: unknown) => boolean;
export declare const dispatchJuiceChange: <TState>(host: EventTarget, runtime: string, state: TState) => void;
export type JuiceChangeNoteOptions<TState> = {
    /**
     * State from before this mutation. Used only when the host has not
     * been observed yet, so the first real change still dispatches.
     */
    baseline?: TState;
};
export declare const createJuiceChanges: <TState>(runtime: string) => {
    has: (host: EventTarget) => boolean;
    prime: (host: EventTarget, state: TState) => void;
    note: (host: EventTarget, state: TState, options?: JuiceChangeNoteOptions<TState>) => void;
};
