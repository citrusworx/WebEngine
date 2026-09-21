// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { createEventClaim } from './events.js';

describe('createEventClaim', () => {
  it('claims an event once per factory instance', () => {
    const claimEvent = createEventClaim();
    const event = new Event('click');

    expect(claimEvent(event)).toBe(true);
    expect(claimEvent(event)).toBe(false);
  });

  it('keeps WeakSets isolated across factory calls', () => {
    const first = createEventClaim();
    const second = createEventClaim();
    const event = new Event('keydown');

    expect(first(event)).toBe(true);
    expect(second(event)).toBe(true);
    expect(first(event)).toBe(false);
    expect(second(event)).toBe(false);
  });
});
