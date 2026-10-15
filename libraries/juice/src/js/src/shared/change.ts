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

export const JUICE_CHANGE_EVENT = 'juice:change';

export type JuiceChangeDetail<TState> = {
  runtime: string;
  state: TState;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const juiceStatesEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    return left.every((item, index) => juiceStatesEqual(item, right[index]));
  }

  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        juiceStatesEqual(left[key], right[key])
    );
  }

  return false;
};

const cloneState = <TState>(state: TState): TState => {
  if (Array.isArray(state)) {
    return state.map((item) => cloneState(item)) as TState;
  }

  if (isRecord(state)) {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(state)) {
      copy[key] = cloneState(state[key]);
    }
    return copy as TState;
  }

  return state;
};

export const dispatchJuiceChange = <TState>(
  host: EventTarget,
  runtime: string,
  state: TState
) => {
  host.dispatchEvent(
    new CustomEvent<JuiceChangeDetail<TState>>(JUICE_CHANGE_EVENT, {
      bubbles: true,
      composed: true,
      detail: {
        runtime,
        state: cloneState(state),
      },
    })
  );
};

export type JuiceChangeNoteOptions<TState> = {
  /**
   * State from before this mutation. Used only when the host has not
   * been observed yet, so the first real change still dispatches.
   */
  baseline?: TState;
};

export const createJuiceChanges = <TState>(runtime: string) => {
  const known = new WeakMap<EventTarget, TState>();

  const has = (host: EventTarget) => known.has(host);

  const prime = (host: EventTarget, state: TState) => {
    if (!known.has(host)) known.set(host, cloneState(state));
  };

  const note = (
    host: EventTarget,
    state: TState,
    options?: JuiceChangeNoteOptions<TState>
  ) => {
    const next = cloneState(state);

    if (!known.has(host)) {
      const baseline = options?.baseline;
      if (baseline !== undefined && !juiceStatesEqual(baseline, next)) {
        known.set(host, next);
        dispatchJuiceChange(host, runtime, next);
        return;
      }

      known.set(host, next);
      return;
    }

    const previous = known.get(host) as TState;
    if (juiceStatesEqual(previous, next)) return;
    known.set(host, next);
    dispatchJuiceChange(host, runtime, next);
  };

  return { has, prime, note };
};
