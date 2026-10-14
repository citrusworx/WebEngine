// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createElementMotion,
  createMotionCancelToken,
  prefersReducedMotion,
  runMotion,
  subscribeReducedMotion,
} from './motion.js';
import { stubMotionDuration, stubReducedMotion } from './motion-test-utils.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetDom();
});

describe('prefersReducedMotion', () => {
  it('is false when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);

    const seen: boolean[] = [];
    const unsubscribe = subscribeReducedMotion((reduced) => seen.push(reduced));
    unsubscribe();
    expect(seen).toEqual([]);
  });

  it('reports the current match and later changes', () => {
    const reduced = stubReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);

    const seen: boolean[] = [];
    const unsubscribe = subscribeReducedMotion((next) => seen.push(next));
    reduced.setMatches(true);
    expect(seen).toEqual([true]);
    expect(prefersReducedMotion()).toBe(true);

    unsubscribe();
    reduced.setMatches(false);
    expect(seen).toEqual([true]);
  });
});

describe('runMotion', () => {
  it('completes on the element event and ignores bubbled child events', async () => {
    document.body.innerHTML = `<div id="panel"><span id="child"></span></div>`;
    const panel = document.getElementById('panel');
    const child = document.getElementById('child');
    if (!panel || !child) throw new Error('missing motion fixture');

    stubMotionDuration('300ms');
    const result = runMotion(panel, 'enter');

    expect(result.immediate).toBe(false);
    expect(panel.getAttribute('data-motion-state')).toBe('entering');

    child.dispatchEvent(new Event('transitionend', { bubbles: true }));
    child.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(panel.getAttribute('data-motion-state')).toBe('entering');

    panel.dispatchEvent(new Event('transitionend', { bubbles: true }));
    await result.finished;

    expect(panel.getAttribute('data-motion-state')).toBe('entered');
  });

  it('also completes on animationend', async () => {
    const panel = document.createElement('div');
    document.body.appendChild(panel);
    stubMotionDuration('300ms');

    const result = runMotion(panel, 'exit');
    expect(panel.getAttribute('data-motion-state')).toBe('exiting');

    panel.dispatchEvent(new Event('animationend', { bubbles: true }));
    await result.finished;

    expect(panel.getAttribute('data-motion-state')).toBe('exited');
  });

  it('falls back to the computed duration plus delay when no event arrives', async () => {
    vi.useFakeTimers();
    const panel = document.createElement('div');
    document.body.appendChild(panel);
    stubMotionDuration('20ms', '10ms', '5ms', '0s');

    const result = runMotion(panel, 'exit');
    expect(result.immediate).toBe(false);
    expect(panel.getAttribute('data-motion-state')).toBe('exiting');

    await vi.advanceTimersByTimeAsync(29);
    expect(panel.getAttribute('data-motion-state')).toBe('exiting');

    await vi.advanceTimersByTimeAsync(1);
    expect(panel.getAttribute('data-motion-state')).toBe('exited');
  });

  it('is synchronous when the computed duration is 0', () => {
    const panel = document.createElement('div');
    document.body.appendChild(panel);
    stubMotionDuration('0s');

    const result = runMotion(panel, 'exit');

    expect(result.immediate).toBe(true);
    expect(panel.getAttribute('data-motion-state')).toBe('exited');
  });

  it('is synchronous under reduced motion even when a duration is computed', () => {
    stubReducedMotion(true);
    stubMotionDuration('300ms');
    const panel = document.createElement('div');
    document.body.appendChild(panel);

    const result = runMotion(panel, 'enter');

    expect(result.immediate).toBe(true);
    expect(panel.getAttribute('data-motion-state')).toBe('entered');
  });

  it('snaps an in-flight motion when reduced motion turns on', async () => {
    vi.useFakeTimers();
    const reduced = stubReducedMotion(false);
    stubMotionDuration('300ms');
    const panel = document.createElement('div');
    document.body.appendChild(panel);

    const result = runMotion(panel, 'exit');
    expect(panel.getAttribute('data-motion-state')).toBe('exiting');

    reduced.setMatches(true);
    await result.finished;

    expect(panel.getAttribute('data-motion-state')).toBe('exited');
  });

  it('cancels an exit so a reopen cannot be hidden by the stale completion', async () => {
    vi.useFakeTimers();
    stubMotionDuration('200ms');
    const panel = document.createElement('div');
    document.body.appendChild(panel);

    const token = createMotionCancelToken();
    const exiting = runMotion(panel, 'exit', token);
    expect(panel.getAttribute('data-motion-state')).toBe('exiting');
    token.cancel();
    await exiting.finished;
    expect(panel.getAttribute('data-motion-state')).toBe('exiting');

    const motion = createElementMotion();
    let hidden = false;
    motion.exit(panel, () => {
      hidden = true;
    });
    motion.enter(panel);
    expect(hidden).toBe(false);
    expect(panel.getAttribute('data-motion-state')).toBe('entering');

    await vi.advanceTimersByTimeAsync(200);
    expect(hidden).toBe(false);
    expect(panel.getAttribute('data-motion-state')).toBe('entered');
    motion.destroy();
  });

  it('lets a close cancel an in-flight enter', async () => {
    vi.useFakeTimers();
    stubMotionDuration('150ms');
    const panel = document.createElement('div');
    document.body.appendChild(panel);
    const motion = createElementMotion();
    let hidden = false;

    motion.enter(panel);
    expect(panel.getAttribute('data-motion-state')).toBe('entering');

    motion.exit(panel, () => {
      hidden = true;
    });
    expect(hidden).toBe(false);
    expect(panel.getAttribute('data-motion-state')).toBe('exiting');

    await vi.advanceTimersByTimeAsync(150);
    expect(hidden).toBe(true);
    expect(panel.getAttribute('data-motion-state')).toBe('exited');
    motion.destroy();
  });
});
