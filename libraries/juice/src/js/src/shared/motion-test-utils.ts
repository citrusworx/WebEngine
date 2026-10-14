import { vi } from 'vitest';

export const flushMotion = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

export const stubMotionDuration = (
  duration: string,
  delay = '0s',
  animationDuration = duration,
  animationDelay = delay
) => {
  const original = window.getComputedStyle.bind(window);

  vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) => {
    const style = original(element);

    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'transitionDuration') return duration;
        if (prop === 'transitionDelay') return delay;
        if (prop === 'animationDuration') return animationDuration;
        if (prop === 'animationDelay') return animationDelay;

        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  });
};

export const stubReducedMotion = (matches: boolean) => {
  const listeners = new Set<() => void>();
  const query = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: () => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: () => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => false,
  };

  vi.stubGlobal('matchMedia', () => query);

  return {
    setMatches(next: boolean) {
      query.matches = next;
      listeners.forEach((listener) => listener());
    },
  };
};
