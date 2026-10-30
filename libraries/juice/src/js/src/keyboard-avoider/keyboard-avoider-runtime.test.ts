// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { JUICE_CHANGE_EVENT } from '../shared/change.js';
import { stubReducedMotion } from '../shared/motion-test-utils.js';
import {
  createKeyboardAvoider,
  initKeyboardAvoider,
  startKeyboardAvoiderRuntime,
  stopKeyboardAvoiderRuntime,
  type KeyboardAvoiderController,
  type KeyboardAvoiderOptions,
  type KeyboardAvoiderState,
} from './keyboard-avoider-runtime.js';

type JuiceChange = CustomEvent<{ runtime: string; state: KeyboardAvoiderState }>;

class MockViewport extends EventTarget {
  height = 800;
  width = 400;
  offsetTop = 0;
  offsetLeft = 0;
  pageTop = 0;
  pageLeft = 0;
  scale = 1;
}

type Frame = { id: number; cb: FrameRequestCallback };

const originalViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport');
const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
const originalRequest = window.requestAnimationFrame.bind(window);
const originalCancel = window.cancelAnimationFrame.bind(window);

let viewport: MockViewport;
let queue: Frame[] = [];
let nextFrameId = 0;
const controllers: KeyboardAvoiderController[] = [];

const installViewport = () => {
  viewport = new MockViewport();
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    writable: true,
    value: viewport,
  });
};

const installInnerHeight = (value: number) => {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value,
  });
};

const installRaf = () => {
  nextFrameId = 0;
  queue = [];
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = ++nextFrameId;
    queue.push({ id, cb });
    return id;
  };
  window.cancelAnimationFrame = (id: number) => {
    queue = queue.filter((frame) => frame.id !== id);
  };
};

const flushRaf = (times = 1) => {
  for (let i = 0; i < times; i += 1) {
    const batch = queue;
    queue = [];
    for (const frame of batch) frame.cb(0);
  }
};

const restoreGlobals = () => {
  window.requestAnimationFrame = originalRequest;
  window.cancelAnimationFrame = originalCancel;
  if (originalViewport) {
    Object.defineProperty(window, 'visualViewport', originalViewport);
  } else {
    delete (window as { visualViewport?: VisualViewport | null }).visualViewport;
  }
  if (originalInnerHeight) {
    Object.defineProperty(window, 'innerHeight', originalInnerHeight);
  }
};

const clearKeyboardChrome = () => {
  document.documentElement.removeAttribute('keyboard-open');
  document.documentElement.style.removeProperty('--juice-keyboard-inset');
};

const insetVar = () =>
  document.documentElement.style.getPropertyValue('--juice-keyboard-inset');

const mount = (html: string) => {
  document.body.innerHTML = html;
};

const track = (controller: KeyboardAvoiderController) => {
  controllers.push(controller);
  return controller;
};

const create = (options: KeyboardAvoiderOptions = { root: document.body }) =>
  track(createKeyboardAvoider(options));

const field = () => document.getElementById('field') as HTMLInputElement;

const host = () => document.getElementById('host') as HTMLElement;

const listen = (target: Element = document.body) => {
  const events: JuiceChange[] = [];
  const onChange = (event: Event) => {
    events.push(event as JuiceChange);
  };
  target.addEventListener(JUICE_CHANGE_EVENT, onChange);
  return {
    events,
    stop: () => target.removeEventListener(JUICE_CHANGE_EVENT, onChange),
  };
};

const focus = (element: HTMLElement) => {
  element.focus();
};

const geometry = (height: number, offsetTop = 0, innerHeight = 800) => {
  installInnerHeight(innerHeight);
  viewport.height = height;
  viewport.offsetTop = offsetTop;
};

const openKeyboard = (height = 500, offsetTop = 0, innerHeight = 800) => {
  geometry(height, offsetTop, innerHeight);
  viewport.dispatchEvent(new Event('resize'));
  flushRaf();
};

beforeEach(() => {
  stopKeyboardAvoiderRuntime();
  clearKeyboardChrome();
  document.body.innerHTML = '';
  installViewport();
  installInnerHeight(800);
  installRaf();
});

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  stopKeyboardAvoiderRuntime();
  document.body.innerHTML = '';
  clearKeyboardChrome();
  restoreGlobals();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createKeyboardAvoider', () => {
  it('is the same function as initKeyboardAvoider', () => {
    expect(initKeyboardAvoider).toBe(createKeyboardAvoider);
  });

  it('is a no-op without a window or a visualViewport', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    document.documentElement.style.setProperty('--juice-keyboard-inset', '12px');
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const controller = create();
    focus(field());
    controller.sync();

    expect(controller.getState()).toEqual({ open: false, inset: 0 });
    expect(controller.getState(host())).toEqual({ open: false, inset: 0 });
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);
    expect(host().hasAttribute('keyboard-open')).toBe(false);
    // A no-op did not install the property, so destroy leaves an author value.
    expect(insetVar()).toBe('12px');
    controller.destroy();
    expect(insetVar()).toBe('12px');
    expect(controller.sync()).toBeUndefined();

    installViewport();
    const view = window;
    vi.stubGlobal('window', undefined);
    try {
      const missing = createKeyboardAvoider();
      expect(missing.getState()).toEqual({ open: false, inset: 0 });
      expect(missing.sync()).toBeUndefined();
      expect(startKeyboardAvoiderRuntime()).toBeNull();
      missing.destroy();
    } finally {
      vi.stubGlobal('window', view);
    }
  });

  it('writes --juice-keyboard-inset on html while open and clears it when closed', () => {
    mount(`
      <div keyboard-avoider id="host"><input id="field"></div>
      <div keyboard-avoider="footer" id="bar"></div>
    `);
    const heard = listen();
    const controller = create();
    const bar = document.getElementById('bar')!;

    expect(heard.events).toHaveLength(0);
    expect(controller.getState(host())).toEqual({ open: false, inset: 0 });
    expect(controller.getState()).toEqual({ open: false, inset: 0 });
    expect(controller.getState(document.createElement('div'))).toBeNull();
    expect(insetVar()).toBe('');

    focus(field());
    openKeyboard();

    expect(controller.getState(field())).toEqual({ open: true, inset: 300 });
    expect(insetVar()).toBe('300px');
    expect(host().style.getPropertyValue('--juice-keyboard-inset')).toBe('');
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(true);
    expect(host().hasAttribute('keyboard-open')).toBe(true);
    expect(bar.hasAttribute('keyboard-open')).toBe(true);

    field().blur();
    flushRaf();

    // Focus left, so the inline length is removed even while the overlap
    // is still measured. The 0px role and the env() fallback can apply.
    expect(controller.getState(host())).toEqual({ open: false, inset: 300 });
    expect(insetVar()).toBe('');
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain(
      '--juice-keyboard-inset'
    );
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);
    expect(host().hasAttribute('keyboard-open')).toBe(false);
    expect(bar.hasAttribute('keyboard-open')).toBe(false);

    heard.stop();
  });

  it('stays closed at the threshold, under a hardware keyboard, and above a custom threshold', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const controller = create();
    focus(field());

    geometry(720);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(controller.getState(host())).toEqual({ open: false, inset: 80 });
    expect(insetVar()).toBe('');
    expect(host().hasAttribute('keyboard-open')).toBe(false);

    geometry(719);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(controller.getState(host())).toEqual({ open: true, inset: 81 });
    expect(insetVar()).toBe('81px');

    geometry(800);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(controller.getState(host())).toEqual({ open: false, inset: 0 });
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);
    expect(insetVar()).toBe('');

    controller.destroy();
    const raised = create({ root: document.body, threshold: 120 });
    focus(field());
    openKeyboard(700);
    expect(raised.getState(host())).toEqual({ open: false, inset: 100 });
    expect(insetVar()).toBe('');
    openKeyboard(679);
    expect(raised.getState(host())).toEqual({ open: true, inset: 121 });
    expect(insetVar()).toBe('121px');
  });

  it('subtracts visualViewport.offsetTop on the iOS overlap', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const controller = create();
    focus(field());

    // 812 - (500 + 100) = 212. Dropping offsetTop would report 312.
    geometry(500, 100, 812);
    viewport.dispatchEvent(new Event('scroll'));
    flushRaf();

    expect(controller.getState(host())).toEqual({ open: true, inset: 212 });
    expect(insetVar()).toBe('212px');
  });

  it('does not pad again when Android resizes the layout viewport', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const controller = create();
    focus(field());

    // interactive-widget=resizes-content shrinks innerHeight with the
    // keyboard. The overlap is ~0, so the inline var stays unset.
    geometry(480, 0, 480);
    window.dispatchEvent(new Event('resize'));
    flushRaf();

    expect(controller.getState(host())).toEqual({ open: false, inset: 0 });
    expect(insetVar()).toBe('');
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);

    geometry(500, 0, 800);
    window.dispatchEvent(new Event('orientationchange'));
    flushRaf();
    expect(controller.getState(host())).toEqual({ open: true, inset: 300 });
    expect(insetVar()).toBe('300px');
  });

  it('rounds the overlap and clamps a negative inset to 0', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const controller = create();
    focus(field());

    geometry(500.4, 0.4);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(controller.getState(host())?.inset).toBe(299);

    geometry(900);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(controller.getState(host())).toEqual({ open: false, inset: 0 });
    expect(insetVar()).toBe('');
  });

  it('ignores updates while the visual viewport is pinched', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const controller = create();
    focus(field());
    openKeyboard();
    expect(controller.getState(host())).toEqual({ open: true, inset: 300 });

    viewport.scale = 1.5;
    geometry(200);
    viewport.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    flushRaf(3);

    expect(controller.getState(host())).toEqual({ open: true, inset: 300 });
    expect(insetVar()).toBe('300px');
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(true);

    viewport.scale = 1;
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(controller.getState(host())).toEqual({ open: true, inset: 600 });
    expect(insetVar()).toBe('600px');
  });

  it('fires juice:change once when open flips, and the first observation is silent', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const hostEl = host();
    const heard = listen(hostEl);
    const controller = create();

    expect(heard.events).toHaveLength(0);
    expect(controller.getState(hostEl)).toEqual({ open: false, inset: 0 });

    focus(field());
    openKeyboard();

    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.bubbles).toBe(true);
    expect(heard.events[0]?.target).toBe(hostEl);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'keyboard-avoider',
      state: { open: true, inset: 300 },
    });

    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(heard.events).toHaveLength(1);

    field().blur();
    flushRaf();
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail).toEqual({
      runtime: 'keyboard-avoider',
      state: { open: false, inset: 300 },
    });

    field().blur();
    flushRaf();
    expect(heard.events).toHaveLength(2);

    heard.stop();
  });

  it('publishes an inset move of at least the threshold while open', () => {
    mount(`
      <div keyboard-avoider id="host"><input id="field"></div>
      <div keyboard-avoider id="other"></div>
    `);
    const heard = listen();
    create();
    focus(field());
    openKeyboard(600);
    expect(heard.events.map((event) => event.target)).toEqual([
      host(),
      document.getElementById('other'),
    ]);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'keyboard-avoider',
      state: { open: true, inset: 200 },
    });
    expect(heard.events[1]?.detail.state).toEqual({ open: true, inset: 200 });

    geometry(570);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(insetVar()).toBe('230px');
    expect(heard.events).toHaveLength(2);

    geometry(540);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(insetVar()).toBe('260px');
    expect(heard.events).toHaveLength(2);

    geometry(510);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(insetVar()).toBe('290px');
    expect(heard.events).toHaveLength(4);
    expect(heard.events[2]?.detail.state).toEqual({ open: true, inset: 290 });
    expect(heard.events[3]?.detail.state).toEqual({ open: true, inset: 290 });

    geometry(800);
    field().blur();
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(heard.events).toHaveLength(6);
    expect(heard.events[4]?.detail.state).toEqual({ open: false, inset: 0 });

    geometry(400);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(heard.events).toHaveLength(6);

    heard.stop();
  });

  it('treats a text-like input, textarea, select, and contenteditable as editable', () => {
    mount(`
      <div keyboard-avoider id="host">
        <input id="bare">
        <input id="email" type="email">
        <input id="date" type="date">
        <input id="box" type="checkbox">
        <textarea id="note"></textarea>
        <select id="pick"><option>A</option></select>
        <div id="editor" contenteditable="true"></div>
        <div id="locked" contenteditable="false"></div>
        <button id="go" type="button">Go</button>
      </div>
    `);
    const controller = create();
    openKeyboard();

    const expectOpen = (id: string, open: boolean) => {
      const element = document.getElementById(id)!;
      focus(element);
      flushRaf();
      expect(controller.getState(host())?.open).toBe(open);
      element.blur();
      flushRaf();
    };

    expectOpen('bare', true);
    expectOpen('email', true);
    expectOpen('note', true);
    expectOpen('pick', true);
    expectOpen('editor', true);
    expectOpen('date', false);
    expectOpen('box', false);
    expectOpen('locked', false);
    expectOpen('go', false);
    expect(insetVar()).toBe('');
  });

  it('scrolls a focused element inside a host into view after geometry settles', () => {
    stubReducedMotion(false);
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const scrolled: unknown[] = [];
    field().scrollIntoView = (options) => {
      scrolled.push(options);
    };
    create();

    focus(field());
    geometry(500);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(scrolled).toHaveLength(0);
    expect(insetVar()).toBe('300px');

    flushRaf();
    expect(scrolled).toEqual([{ block: 'nearest', behavior: 'smooth' }]);

    geometry(480);
    viewport.dispatchEvent(new Event('resize'));
    flushRaf(2);
    expect(scrolled).toHaveLength(1);
  });

  it('does not scroll a noscroll host, an opted-out controller, a focus outside, or after destroy', () => {
    mount(`
      <input id="outside">
      <div keyboard-avoider="footer noscroll" id="bar"><input id="field"></div>
      <div keyboard-avoider id="host"><input id="plain"></div>
    `);
    const calls: Element[] = [];
    const watch = (element: HTMLElement | null) => {
      if (!element) return;
      element.scrollIntoView = () => {
        calls.push(element);
      };
    };
    watch(field());
    watch(document.getElementById('plain'));
    watch(document.getElementById('outside'));

    const noscroll = create();
    focus(field());
    openKeyboard();
    flushRaf(2);
    expect(calls).toEqual([]);
    expect(document.getElementById('bar')!.hasAttribute('keyboard-open')).toBe(true);
    noscroll.destroy();

    const optedOut = create({ root: document.body, scrollIntoView: false });
    focus(document.getElementById('plain')!);
    openKeyboard();
    flushRaf(2);
    expect(calls).toEqual([]);
    expect(host().hasAttribute('keyboard-open')).toBe(true);
    optedOut.destroy();

    const outside = create();
    focus(document.getElementById('outside')!);
    openKeyboard();
    flushRaf(2);
    expect(calls).toEqual([]);
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(true);
    outside.destroy();

    const pending = create();
    focus(document.getElementById('plain')!);
    geometry(500);
    viewport.dispatchEvent(new Event('resize'));
    pending.destroy();
    flushRaf(3);
    expect(calls).toEqual([]);
    expect(insetVar()).toBe('');
    expect(host().hasAttribute('keyboard-open')).toBe(false);
    expect(pending.getState(host())).toBeNull();
    pending.destroy();
  });

  it('uses behavior auto when the user prefers reduced motion', () => {
    stubReducedMotion(true);
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const scrolled: unknown[] = [];
    field().scrollIntoView = (options) => {
      scrolled.push(options);
    };
    create();
    focus(field());
    openKeyboard();
    flushRaf(2);
    expect(scrolled).toEqual([{ block: 'nearest', behavior: 'auto' }]);
  });

  it('does not set navigator.virtualKeyboard.overlaysContent', () => {
    const virtualKeyboard = { overlaysContent: false };
    Object.defineProperty(navigator, 'virtualKeyboard', {
      configurable: true,
      value: virtualKeyboard,
    });

    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    create();
    focus(field());
    openKeyboard();
    field().blur();
    flushRaf();

    expect(virtualKeyboard.overlaysContent).toBe(false);
    expect(Object.keys(virtualKeyboard)).toEqual(['overlaysContent']);
  });
});

describe('startKeyboardAvoiderRuntime', () => {
  it('is an idempotent singleton and stop removes listeners', () => {
    mount('<div keyboard-avoider id="host"><input id="field"></div>');
    const heard = listen();

    const first = startKeyboardAvoiderRuntime();
    const second = startKeyboardAvoiderRuntime();
    expect(first).toBe(second);

    focus(field());
    openKeyboard();
    expect(heard.events).toHaveLength(1);
    expect(second?.getState(host())).toEqual({ open: true, inset: 300 });

    viewport.dispatchEvent(new Event('resize'));
    flushRaf();
    expect(heard.events).toHaveLength(1);

    stopKeyboardAvoiderRuntime();
    geometry(400);
    focus(field());
    viewport.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    viewport.dispatchEvent(new Event('scroll'));
    flushRaf(3);
    expect(heard.events).toHaveLength(1);
    expect(insetVar()).toBe('');
    expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);

    const restarted = startKeyboardAvoiderRuntime();
    expect(restarted).not.toBe(first);
    // The new controller's first look is silent, then a real close publishes.
    expect(restarted?.getState(host())).toEqual({ open: true, inset: 400 });
    expect(insetVar()).toBe('400px');
    expect(heard.events).toHaveLength(1);

    field().blur();
    flushRaf();
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail).toEqual({
      runtime: 'keyboard-avoider',
      state: { open: false, inset: 400 },
    });

    heard.stop();
  });

  it('auto-starts on DOMContentLoaded', async () => {
    stopKeyboardAvoiderRuntime();
    vi.resetModules();
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    let mod: typeof import('./keyboard-avoider-runtime.js') | null = null;
    try {
      mod = await import('./keyboard-avoider-runtime.js');
      mount('<div keyboard-avoider id="host"><input id="field"></div>');
      focus(field());
      geometry(500);
      expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);
      expect(insetVar()).toBe('');

      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.documentElement.hasAttribute('keyboard-open')).toBe(true);
      expect(host().hasAttribute('keyboard-open')).toBe(true);
      expect(insetVar()).toBe('300px');
      expect(mod.startKeyboardAvoiderRuntime()?.getState(host())).toEqual({
        open: true,
        inset: 300,
      });
    } finally {
      mod?.stopKeyboardAvoiderRuntime();
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });

  it('does not auto-start on DOMContentLoaded after stopKeyboardAvoiderRuntime', async () => {
    stopKeyboardAvoiderRuntime();
    vi.resetModules();
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    let mod: typeof import('./keyboard-avoider-runtime.js') | null = null;
    try {
      mod = await import('./keyboard-avoider-runtime.js');
      mount('<div keyboard-avoider id="host"><input id="field"></div>');
      focus(field());
      geometry(500);
      mod.stopKeyboardAvoiderRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);
      expect(insetVar()).toBe('');

      mod.startKeyboardAvoiderRuntime();
      expect(host().hasAttribute('keyboard-open')).toBe(true);
      expect(insetVar()).toBe('300px');
      mod.stopKeyboardAvoiderRuntime();
      expect(document.documentElement.hasAttribute('keyboard-open')).toBe(false);
    } finally {
      mod?.stopKeyboardAvoiderRuntime();
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
