// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JUICE_CHANGE_EVENT } from '../shared/change.js';
import {
  createIconButton,
  stopIconButtonRuntime,
} from '../icon-button/icon-button-runtime.js';
import {
  createPressable,
  initPressable,
  startPressableRuntime,
  stopPressableRuntime,
} from './pressable-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushObservers = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

type JuiceChange = CustomEvent<{
  runtime: string;
  state: { pressed: boolean; longPressed: boolean };
}>;

const pointer = (type: string, init: PointerEventInit = {}) =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: 1,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    clientX: 0,
    clientY: 0,
    ...init,
  });

const press = (host: Element, init: PointerEventInit = {}) => {
  host.dispatchEvent(pointer('pointerdown', init));
};

const release = (host: Element, init: PointerEventInit = {}) => {
  host.dispatchEvent(pointer('pointerup', init));
};

afterEach(() => {
  stopPressableRuntime();
  stopIconButtonRuntime();
  resetDom();
  vi.useRealTimers();
});

describe('createPressable', () => {
  it('is the same function as initPressable', () => {
    expect(initPressable).toBe(createPressable);
  });

  it('sets [pressed] on primary pointerdown and clears it on pointerup', () => {
    document.body.innerHTML = '<button type="button" pressable id="go">Go</button>';
    stopPressableRuntime();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('go')!;
    const heard: JuiceChange[] = [];
    host.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });

    expect(controller.getState(host)).toEqual({ pressed: false, longPressed: false });
    expect(heard).toHaveLength(0);

    const down = pointer('pointerdown');
    host.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(false);
    expect(host.hasAttribute('pressed')).toBe(true);
    expect(controller.getState()).toEqual({ pressed: true, longPressed: false });
    expect(heard).toHaveLength(1);
    expect(heard[0]?.bubbles).toBe(true);
    expect(heard[0]?.target).toBe(host);
    expect(heard[0]?.detail).toEqual({
      runtime: 'pressable',
      state: { pressed: true, longPressed: false },
    });

    const up = pointer('pointerup', { buttons: 0 });
    host.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(false);
    expect(host.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(host)).toEqual({ pressed: false, longPressed: false });
    expect(heard[1]?.detail).toEqual({
      runtime: 'pressable',
      state: { pressed: false, longPressed: false },
    });

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const clicks: Event[] = [];
    host.addEventListener('click', (event) => clicks.push(event));
    host.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    expect(clicks).toHaveLength(1);

    controller.destroy();
  });

  it('clears [pressed] on pointercancel, pointerleave, and lostpointercapture', () => {
    document.body.innerHTML = `
      <div pressable id="cancel">Cancel</div>
      <div pressable id="leave">Leave</div>
      <div pressable id="capture">Capture</div>
    `;
    stopPressableRuntime();
    const controller = createPressable({ root: document.body });

    const cancel = document.getElementById('cancel')!;
    press(cancel);
    expect(cancel.hasAttribute('pressed')).toBe(true);
    cancel.dispatchEvent(pointer('pointercancel'));
    expect(cancel.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(cancel)?.pressed).toBe(false);

    const leave = document.getElementById('leave')!;
    press(leave);
    leave.dispatchEvent(pointer('pointerleave'));
    expect(leave.hasAttribute('pressed')).toBe(false);

    const capture = document.getElementById('capture')!;
    press(capture);
    capture.dispatchEvent(pointer('lostpointercapture'));
    expect(capture.hasAttribute('pressed')).toBe(false);

    controller.destroy();
  });

  it('clears [pressed] when the pointer moves outside the host', () => {
    document.body.innerHTML = '<div pressable id="host"><span id="label">Label</span></div>';
    stopPressableRuntime();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('host')!;
    const label = document.getElementById('label')!;

    label.dispatchEvent(pointer('pointerdown', { clientX: 2, clientY: 2 }));
    expect(host.hasAttribute('pressed')).toBe(true);

    label.dispatchEvent(
      pointer('pointerout', { clientX: 4, clientY: 4, relatedTarget: host })
    );
    expect(host.hasAttribute('pressed')).toBe(true);

    host.dispatchEvent(
      pointer('pointerout', { clientX: 4, clientY: 4, relatedTarget: document.body })
    );
    expect(host.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(host)?.pressed).toBe(false);

    controller.destroy();
  });

  it('cancels the press after the pointer moves past the slop and does not prevent the move', () => {
    document.body.innerHTML = `
      <div pressable id="host" pressable-longpress>Drag</div>
      <div pressable id="wide" pressable-slop="4">Wide</div>
    `;
    stopPressableRuntime();
    vi.useFakeTimers();
    const controller = createPressable({ root: document.body, moveSlop: 10 });
    const host = document.getElementById('host')!;
    const wide = document.getElementById('wide')!;
    const longPresses: Event[] = [];
    host.addEventListener('juice:longpress', (event) => longPresses.push(event));

    press(host, { clientX: 0, clientY: 0 });
    const inside = pointer('pointermove', { clientX: 10, clientY: 0 });
    host.dispatchEvent(inside);
    expect(inside.defaultPrevented).toBe(false);
    expect(host.hasAttribute('pressed')).toBe(true);

    const past = pointer('pointermove', { clientX: 11, clientY: 0 });
    host.dispatchEvent(past);
    expect(past.defaultPrevented).toBe(false);
    expect(host.hasAttribute('pressed')).toBe(false);
    vi.advanceTimersByTime(500);
    expect(longPresses).toHaveLength(0);
    expect(controller.getState(host)).toEqual({ pressed: false, longPressed: false });

    press(wide, { clientX: 0, clientY: 0 });
    wide.dispatchEvent(pointer('pointermove', { clientX: 4, clientY: 0 }));
    expect(wide.hasAttribute('pressed')).toBe(true);
    expect(controller.getState(wide)?.pressed).toBe(true);
    wide.dispatchEvent(pointer('pointermove', { clientX: 5, clientY: 0 }));
    expect(wide.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(wide)?.pressed).toBe(false);

    controller.destroy();
  });

  it('cancels the press when an ancestor scrolls and ignores an unrelated scroll', () => {
    document.body.innerHTML = `
      <div id="scroller">
        <button type="button" pressable id="host" pressable-longpress>Go</button>
      </div>
      <div id="other"></div>
    `;
    stopPressableRuntime();
    vi.useFakeTimers();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('host')!;
    const longPresses: Event[] = [];
    host.addEventListener('juice:longpress', (event) => longPresses.push(event));

    press(host);
    document.getElementById('other')!.dispatchEvent(new Event('scroll'));
    expect(host.hasAttribute('pressed')).toBe(true);

    document.getElementById('scroller')!.dispatchEvent(new Event('scroll'));
    expect(host.hasAttribute('pressed')).toBe(false);
    vi.advanceTimersByTime(500);
    expect(longPresses).toHaveLength(0);

    controller.destroy();
  });

  it('fires juice:longpress after the delay and suppresses the following click once', () => {
    document.body.innerHTML = `
      <button type="button" pressable pressable-longpress id="hold">Hold</button>
      <button type="button" pressable id="plain">Plain</button>
    `;
    stopPressableRuntime();
    vi.useFakeTimers();
    const controller = createPressable({ root: document.body, longPressDelay: 500 });
    const host = document.getElementById('hold')!;
    const plain = document.getElementById('plain')!;
    const heard: JuiceChange[] = [];
    const longPresses: CustomEvent<{ pressed: boolean; longPressed: boolean }>[] = [];
    const clicks: Event[] = [];
    host.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });
    host.addEventListener('juice:longpress', (event) => {
      longPresses.push(event as CustomEvent<{ pressed: boolean; longPressed: boolean }>);
    });
    host.addEventListener('click', (event) => clicks.push(event));

    press(host);
    vi.advanceTimersByTime(499);
    expect(longPresses).toHaveLength(0);
    expect(controller.getState(host)?.longPressed).toBe(false);

    vi.advanceTimersByTime(1);
    expect(longPresses).toHaveLength(1);
    expect(longPresses[0]?.bubbles).toBe(true);
    expect(longPresses[0]?.cancelable).toBe(true);
    expect(longPresses[0]?.detail).toEqual({ pressed: true, longPressed: true });
    expect(heard.at(-1)?.detail).toEqual({
      runtime: 'pressable',
      state: { pressed: true, longPressed: true },
    });

    release(host);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    host.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(clicks).toHaveLength(0);
    expect(host.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(host)).toEqual({ pressed: false, longPressed: false });

    press(host);
    release(host);
    const later = new MouseEvent('click', { bubbles: true, cancelable: true });
    host.dispatchEvent(later);
    expect(later.defaultPrevented).toBe(false);

    press(plain);
    vi.advanceTimersByTime(1000);
    expect(plain.hasAttribute('pressed')).toBe(true);
    release(plain);

    controller.destroy();
  });

  it('leaves the click alone when juice:longpress is canceled', () => {
    document.body.innerHTML =
      '<button type="button" pressable pressable-longpress="120" id="hold">Hold</button>';
    stopPressableRuntime();
    vi.useFakeTimers();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('hold')!;
    const clicks: Event[] = [];
    host.addEventListener('juice:longpress', (event) => event.preventDefault());
    host.addEventListener('click', (event) => clicks.push(event));

    press(host);
    vi.advanceTimersByTime(120);
    expect(controller.getState(host)?.longPressed).toBe(true);
    release(host);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    host.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    expect(clicks).toHaveLength(1);

    controller.destroy();
  });

  it('does not arm a long-press for keyboard holds or pressable-longpress="false"', () => {
    document.body.innerHTML = `
      <div pressable pressable-longpress tabindex="0" id="key">Key</div>
      <button type="button" pressable pressable-longpress="false" id="off">Off</button>
    `;
    stopPressableRuntime();
    vi.useFakeTimers();
    const controller = createPressable({ root: document.body });
    const key = document.getElementById('key')!;
    const off = document.getElementById('off')!;
    const longPresses: Event[] = [];
    key.addEventListener('juice:longpress', (event) => longPresses.push(event));
    off.addEventListener('juice:longpress', (event) => longPresses.push(event));

    const down = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' });
    key.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(false);
    expect(key.hasAttribute('pressed')).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(longPresses).toHaveLength(0);
    key.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
    expect(key.hasAttribute('pressed')).toBe(false);

    press(off);
    vi.advanceTimersByTime(1000);
    expect(longPresses).toHaveLength(0);
    expect(off.hasAttribute('pressed')).toBe(true);
    release(off);

    controller.destroy();
  });

  it('sets [pressed] for Enter and Space on any host, including a native button, and clears on keyup', () => {
    document.body.innerHTML = `
      <div pressable tabindex="0" id="plain">Plain</div>
      <button type="button" pressable id="native">Native</button>
      <div pressable id="wrap"><input id="field"></div>
    `;
    stopPressableRuntime();
    const controller = createPressable({ root: document.body });
    const plain = document.getElementById('plain')!;
    const native = document.getElementById('native')!;
    const field = document.getElementById('field')!;
    const heard: JuiceChange[] = [];
    plain.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });

    const enter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    });
    plain.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(plain.hasAttribute('pressed')).toBe(true);
    plain.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', repeat: true })
    );
    expect(heard).toHaveLength(1);
    plain.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
    expect(plain.hasAttribute('pressed')).toBe(false);
    expect(heard).toHaveLength(2);

    const space = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' });
    native.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
    expect(native.hasAttribute('pressed')).toBe(true);
    expect(controller.getState(native)?.pressed).toBe(true);
    native.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
    expect(native.hasAttribute('pressed')).toBe(false);

    field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    expect(document.getElementById('wrap')?.hasAttribute('pressed')).toBe(false);

    controller.destroy();
  });

  it('ignores a disabled host and clears a press that becomes disabled', async () => {
    document.body.innerHTML = `
      <button type="button" pressable disabled id="native">Native</button>
      <div pressable disabled id="attr">Attr</div>
      <div pressable aria-disabled="true" id="aria">Aria</div>
      <button type="button" pressable pressable-longpress id="later">Later</button>
    `;
    stopPressableRuntime();
    vi.useFakeTimers();
    const controller = createPressable({ root: document.body });
    const native = document.getElementById('native')!;
    const attr = document.getElementById('attr')!;
    const aria = document.getElementById('aria')!;
    const later = document.getElementById('later')!;
    const longPresses: Event[] = [];
    later.addEventListener('juice:longpress', (event) => longPresses.push(event));

    press(native);
    press(attr);
    press(aria);
    expect(native.hasAttribute('pressed')).toBe(false);
    expect(attr.hasAttribute('pressed')).toBe(false);
    expect(aria.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(native)?.pressed).toBe(false);

    press(later);
    expect(later.hasAttribute('pressed')).toBe(true);
    later.setAttribute('disabled', '');
    await flushObservers();
    expect(later.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(later)?.pressed).toBe(false);
    vi.advanceTimersByTime(500);
    expect(longPresses).toHaveLength(0);

    later.removeAttribute('disabled');
    controller.sync();
    press(later);
    later.setAttribute('aria-disabled', 'true');
    controller.sync();
    expect(later.hasAttribute('pressed')).toBe(false);

    controller.destroy();
  });

  it('does not clobber a latched icon-button toggle or an author [pressed]', () => {
    document.body.innerHTML = `
      <button type="button" icon-button toggle pressable aria-label="Bold" id="off"></button>
      <button type="button" icon-button toggle pressable pressed aria-label="Italic" id="on"></button>
      <div pressable pressed id="author">Pinned</div>
      <button type="button" icon-button pressable aria-label="Close" id="plain"></button>
    `;
    stopPressableRuntime();
    stopIconButtonRuntime();
    const icons = createIconButton({ root: document.body });
    const controller = createPressable({ root: document.body });
    const off = document.getElementById('off')!;
    const on = document.getElementById('on')!;
    const author = document.getElementById('author')!;
    const plain = document.getElementById('plain')!;

    expect(off.getAttribute('aria-pressed')).toBe('false');
    expect(off.hasAttribute('pressed')).toBe(false);
    expect(on.getAttribute('aria-pressed')).toBe('true');
    expect(on.hasAttribute('pressed')).toBe(true);

    press(off);
    expect(controller.getState(off)?.pressed).toBe(true);
    expect(off.hasAttribute('pressed')).toBe(false);
    expect(off.getAttribute('aria-pressed')).toBe('false');
    release(off);
    expect(off.hasAttribute('pressed')).toBe(false);
    expect(off.getAttribute('aria-pressed')).toBe('false');
    off.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(off.getAttribute('aria-pressed')).toBe('true');
    expect(off.hasAttribute('pressed')).toBe(true);

    press(on);
    release(on);
    expect(on.hasAttribute('pressed')).toBe(true);
    expect(on.getAttribute('aria-pressed')).toBe('true');
    on.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(on.getAttribute('aria-pressed')).toBe('false');
    expect(on.hasAttribute('pressed')).toBe(false);

    press(author);
    release(author);
    expect(author.hasAttribute('pressed')).toBe(true);
    expect(controller.getState(author)).toEqual({ pressed: false, longPressed: false });

    press(plain);
    expect(plain.hasAttribute('pressed')).toBe(true);
    expect(plain.hasAttribute('aria-pressed')).toBe(false);
    release(plain);
    expect(plain.hasAttribute('pressed')).toBe(false);

    icons.destroy();
    controller.destroy();
  });

  it('clears a keyboard press on blur', () => {
    document.body.innerHTML = '<div pressable tabindex="0" id="host">Host</div>';
    stopPressableRuntime();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('host')!;

    host.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    expect(host.hasAttribute('pressed')).toBe(true);
    host.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(host.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(host)?.pressed).toBe(false);

    controller.destroy();
  });

  it('ignores a secondary button and reports null for a non-pressable', () => {
    document.body.innerHTML = `
      <button type="button" pressable id="host">Host</button>
      <button type="button" id="other">Other</button>
    `;
    stopPressableRuntime();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('host')!;

    host.dispatchEvent(pointer('pointerdown', { button: 2, buttons: 2 }));
    expect(host.hasAttribute('pressed')).toBe(false);
    expect(controller.getState(document.getElementById('other'))).toBeNull();

    controller.destroy();
    expect(controller.getState(host)).toBeNull();
  });

  it('stops handling after destroy, including a pending long-press', () => {
    document.body.innerHTML =
      '<button type="button" pressable pressable-longpress id="host">Host</button>';
    stopPressableRuntime();
    vi.useFakeTimers();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('host')!;
    const longPresses: Event[] = [];
    host.addEventListener('juice:longpress', (event) => longPresses.push(event));

    press(host);
    expect(host.hasAttribute('pressed')).toBe(true);
    controller.destroy();
    expect(host.hasAttribute('pressed')).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(longPresses).toHaveLength(0);

    press(host);
    host.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
    expect(host.hasAttribute('pressed')).toBe(false);
    expect(controller.sync()).toBeUndefined();
    expect(controller.destroy()).toBeUndefined();
  });

  it('presses once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = '<button type="button" pressable id="host">Host</button>';
    const auto = startPressableRuntime();
    const manual = createPressable({ root: document.body });
    const host = document.getElementById('host')!;
    const heard: JuiceChange[] = [];
    host.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });

    press(host);
    expect(host.hasAttribute('pressed')).toBe(true);
    expect(heard).toHaveLength(1);
    expect(manual.getState(host)?.pressed).toBe(true);
    expect(auto?.getState(host)?.pressed).toBe(false);

    release(host);
    manual.destroy();
    expect(host.hasAttribute('pressed')).toBe(false);
  });
});

describe('startPressableRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = '<div pressable id="host">Host</div>';
    stopPressableRuntime();

    const first = startPressableRuntime();
    const second = startPressableRuntime();
    const host = document.getElementById('host')!;

    expect(first).toBe(second);
    press(host);
    expect(host.hasAttribute('pressed')).toBe(true);
    expect(second?.getState(host)).toEqual({ pressed: true, longPressed: false });
    release(host);

    stopPressableRuntime();
    press(host);
    expect(host.hasAttribute('pressed')).toBe(false);

    startPressableRuntime();
    press(host);
    expect(host.hasAttribute('pressed')).toBe(true);
    release(host);
  });

  it('does not auto-start on DOMContentLoaded after stopPressableRuntime', async () => {
    stopPressableRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./pressable-runtime.js');
      document.body.innerHTML = '<div pressable id="host">Host</div>';
      mod.stopPressableRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const host = document.getElementById('host')!;
      host.dispatchEvent(pointer('pointerdown'));
      expect(host.hasAttribute('pressed')).toBe(false);

      mod.startPressableRuntime();
      host.dispatchEvent(pointer('pointerdown'));
      expect(host.hasAttribute('pressed')).toBe(true);
      host.dispatchEvent(pointer('pointerup', { buttons: 0 }));
      expect(host.hasAttribute('pressed')).toBe(false);
      mod.stopPressableRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
