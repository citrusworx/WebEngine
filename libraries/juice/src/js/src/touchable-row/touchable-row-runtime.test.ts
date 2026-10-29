// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JUICE_CHANGE_EVENT } from '../shared/change.js';
import {
  createPressable,
  stopPressableRuntime,
} from '../pressable/pressable-runtime.js';
import {
  createTouchableRow,
  initTouchableRow,
  startTouchableRowRuntime,
  stopTouchableRowRuntime,
} from './touchable-row-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

type JuiceChange = CustomEvent<{
  runtime: string;
  state: { selected: boolean; disabled: boolean };
}>;

const keydown = (target: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};

const click = (target: Element) => {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  target.dispatchEvent(event);
  return event;
};

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

afterEach(() => {
  stopTouchableRowRuntime();
  stopPressableRuntime();
  resetDom();
  vi.useRealTimers();
});

describe('createTouchableRow', () => {
  it('is the same function as initTouchableRow', () => {
    expect(initTouchableRow).toBe(createTouchableRow);
  });

  it('activates a non-native host from Enter and Space and leaves native hosts to the platform', () => {
    document.body.innerHTML = `
      <div touchable-row id="row">Row</div>
      <li touchable-row id="item">Item</li>
      <button type="button" touchable-row id="button">Button</button>
      <a href="#next" touchable-row id="link">Link</a>
    `;
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const row = document.getElementById('row')!;
    const item = document.getElementById('item')!;
    const button = document.getElementById('button')!;
    const link = document.getElementById('link')!;
    const clicks: EventTarget[] = [];
    const hear = (host: HTMLElement) => {
      host.addEventListener('click', (event) => clicks.push(event.target!));
    };
    hear(row);
    hear(item);
    hear(button);
    hear(link);

    const enter = keydown(row, 'Enter');
    expect(enter.defaultPrevented).toBe(false);
    expect(clicks).toEqual([row]);

    const repeat = keydown(row, 'Enter', { repeat: true });
    expect(repeat.defaultPrevented).toBe(false);
    expect(clicks).toEqual([row]);

    const space = keydown(row, ' ');
    expect(space.defaultPrevented).toBe(true);
    expect(clicks).toEqual([row, row]);

    const legacy = keydown(item, 'Spacebar');
    expect(legacy.defaultPrevented).toBe(true);
    expect(clicks).toEqual([row, row, item]);

    const buttonSpace = keydown(button, ' ');
    expect(buttonSpace.defaultPrevented).toBe(false);
    const buttonEnter = keydown(button, 'Enter');
    expect(buttonEnter.defaultPrevented).toBe(false);

    const linkSpace = keydown(link, ' ');
    expect(linkSpace.defaultPrevented).toBe(false);
    const linkEnter = keydown(link, 'Enter');
    expect(linkEnter.defaultPrevented).toBe(false);
    expect(clicks).toEqual([row, row, item]);

    expect(row.getAttribute('role')).toBeNull();
    expect(row.getAttribute('tabindex')).toBeNull();
    expect(item.getAttribute('role')).toBeNull();
    expect(controller.getState(row)).toEqual({ selected: false, disabled: false });

    controller.destroy();
  });

  it('adds role and tabindex only when the row is interactive', () => {
    document.body.innerHTML = `
      <div touchable-row id="plain">Plain</div>
      <div touchable-row="dense chevron" id="dense">Dense</div>
      <div touchable-row="select" id="select">Select</div>
      <div touchable-row="activate" id="activate">Activate</div>
      <div touchable-row pressable id="press">Press</div>
      <div touchable-row="select" role="link" tabindex="2" id="author">Author</div>
      <a href="#n" touchable-row="select" id="link">Link</a>
      <button type="button" touchable-row="select" id="button">Button</button>
      <div touchable-row="select" disabled id="off">Off</div>
      <div touchable-row="select" menuitem id="menu">Menu</div>
    `;
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });

    expect(document.getElementById('plain')?.getAttribute('role')).toBeNull();
    expect(document.getElementById('plain')?.hasAttribute('tabindex')).toBe(false);
    expect(document.getElementById('dense')?.getAttribute('role')).toBeNull();
    expect(document.getElementById('dense')?.hasAttribute('tabindex')).toBe(false);

    expect(document.getElementById('select')?.getAttribute('role')).toBe('button');
    expect(document.getElementById('select')?.getAttribute('tabindex')).toBe('0');
    expect(document.getElementById('activate')?.getAttribute('role')).toBe('button');
    expect(document.getElementById('activate')?.getAttribute('tabindex')).toBe('0');
    expect(document.getElementById('press')?.getAttribute('role')).toBe('button');
    expect(document.getElementById('press')?.getAttribute('tabindex')).toBe('0');

    expect(document.getElementById('author')?.getAttribute('role')).toBe('link');
    expect(document.getElementById('author')?.getAttribute('tabindex')).toBe('2');
    expect(document.getElementById('link')?.getAttribute('role')).toBeNull();
    expect(document.getElementById('link')?.hasAttribute('tabindex')).toBe(false);
    expect(document.getElementById('button')?.getAttribute('role')).toBeNull();
    expect(document.getElementById('button')?.hasAttribute('tabindex')).toBe(false);
    expect(document.getElementById('off')?.getAttribute('role')).toBeNull();
    expect(document.getElementById('off')?.hasAttribute('tabindex')).toBe(false);
    expect(document.getElementById('menu')?.getAttribute('role')).toBeNull();
    expect(document.getElementById('menu')?.hasAttribute('tabindex')).toBe(false);

    controller.destroy();
    expect(document.getElementById('select')?.getAttribute('role')).toBe('button');
  });

  it('ignores keys and clicks from interactive descendants', () => {
    document.body.innerHTML = `
      <div touchable-row="select" id="row">
        <span touchable-row-title id="title">Title</span>
        <span touchable-row-trailing>
          <button type="button" id="button">Go</button>
          <a href="#x" id="link">Link</a>
          <input id="field" value="a">
          <textarea id="note"></textarea>
          <button type="button" switch id="sw" aria-label="On"></button>
          <button type="button" icon-button id="ib" aria-label="More"></button>
        </span>
      </div>
    `;
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const row = document.getElementById('row')!;
    const title = document.getElementById('title')!;
    const heard: JuiceChange[] = [];
    row.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });

    for (const id of ['button', 'link', 'field', 'note', 'sw', 'ib']) {
      const control = document.getElementById(id)!;
      const space = keydown(control, ' ');
      const enter = keydown(control, 'Enter');
      expect(space.defaultPrevented).toBe(false);
      expect(enter.defaultPrevented).toBe(false);
      click(control);
    }

    expect(row.hasAttribute('selected')).toBe(false);
    expect(heard).toHaveLength(0);
    expect(controller.getState(title)).toEqual({ selected: false, disabled: false });

    const titleKey = keydown(title, 'Enter');
    expect(titleKey.defaultPrevented).toBe(false);
    expect(row.hasAttribute('selected')).toBe(true);
    expect(row.getAttribute('aria-selected')).toBe('true');
    expect(heard).toHaveLength(1);

    click(title);
    expect(row.hasAttribute('selected')).toBe(false);
    expect(heard).toHaveLength(2);

    controller.destroy();
  });

  it('toggles selection on activation and publishes juice:change', () => {
    document.body.innerHTML = `
      <div touchable-row="select" id="one">One</div>
      <li touchable-row="dense select" id="two">Two</li>
      <div touchable-row id="plain">Plain</div>
      <div touchable-row="select" selected aria-selected="true" id="already">Already</div>
    `;
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const one = document.getElementById('one')!;
    const two = document.getElementById('two')!;
    const plain = document.getElementById('plain')!;
    const already = document.getElementById('already')!;
    const heard: JuiceChange[] = [];
    document.body.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });

    expect(controller.getState()).toEqual({ selected: false, disabled: false });
    expect(controller.getState(already)).toEqual({ selected: true, disabled: false });
    expect(heard).toHaveLength(0);

    click(one);
    expect(one.hasAttribute('selected')).toBe(true);
    expect(one.getAttribute('aria-selected')).toBe('true');
    expect(one.hasAttribute('aria-current')).toBe(false);
    expect(two.hasAttribute('selected')).toBe(false);
    expect(heard).toHaveLength(1);
    expect(heard[0]?.bubbles).toBe(true);
    expect(heard[0]?.target).toBe(one);
    expect(heard[0]?.detail).toEqual({
      runtime: 'touchable-row',
      state: { selected: true, disabled: false },
    });
    expect(controller.getState(one)).toEqual({ selected: true, disabled: false });

    keydown(one, ' ');
    expect(one.hasAttribute('selected')).toBe(false);
    expect(one.getAttribute('aria-selected')).toBe('false');
    expect(heard[1]?.detail).toEqual({
      runtime: 'touchable-row',
      state: { selected: false, disabled: false },
    });

    click(two);
    expect(two.hasAttribute('selected')).toBe(true);
    expect(two.getAttribute('aria-selected')).toBe('true');
    expect(one.hasAttribute('selected')).toBe(false);
    expect(heard).toHaveLength(3);

    click(plain);
    keydown(plain, 'Enter');
    expect(plain.hasAttribute('selected')).toBe(false);
    expect(plain.hasAttribute('aria-selected')).toBe(false);
    expect(heard).toHaveLength(3);

    click(already);
    expect(already.hasAttribute('selected')).toBe(false);
    expect(already.getAttribute('aria-selected')).toBe('false');
    expect(heard.at(-1)?.detail.state).toEqual({ selected: false, disabled: false });

    expect(controller.getState(document.createElement('div'))).toBeNull();

    controller.destroy();
  });

  it('writes aria-current on links and keeps sibling rows selected', () => {
    document.body.innerHTML = `
      <a href="#a" touchable-row="select" id="link">Link</a>
      <div touchable-row="select" role="link" id="role">Role</div>
      <div touchable-row="select" id="other">Other</div>
    `;
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const link = document.getElementById('link')!;
    const role = document.getElementById('role')!;
    const other = document.getElementById('other')!;

    click(link);
    expect(link.hasAttribute('selected')).toBe(true);
    expect(link.getAttribute('aria-current')).toBe('true');
    expect(link.hasAttribute('aria-selected')).toBe(false);
    expect(link.getAttribute('role')).toBeNull();

    click(other);
    expect(other.getAttribute('aria-selected')).toBe('true');
    expect(link.hasAttribute('selected')).toBe(true);

    click(link);
    expect(link.hasAttribute('selected')).toBe(false);
    expect(link.getAttribute('aria-current')).toBe('false');
    expect(other.hasAttribute('selected')).toBe(true);

    click(role);
    expect(role.getAttribute('role')).toBe('link');
    expect(role.getAttribute('aria-current')).toBe('true');
    expect(role.hasAttribute('aria-selected')).toBe(false);
    expect(role.getAttribute('tabindex')).toBe('0');

    controller.destroy();
  });

  it('ignores a disabled host', () => {
    document.body.innerHTML = `
      <div touchable-row="select" disabled id="attr">Attr</div>
      <div touchable-row="select" aria-disabled="true" id="aria">Aria</div>
      <button type="button" touchable-row="select" disabled id="button">Button</button>
    `;
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const heard: JuiceChange[] = [];
    document.body.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });

    for (const id of ['attr', 'aria', 'button']) {
      const host = document.getElementById(id)!;
      const space = keydown(host, ' ');
      const enter = keydown(host, 'Enter');
      const pressed = click(host);
      expect(space.defaultPrevented).toBe(false);
      expect(enter.defaultPrevented).toBe(false);
      expect(pressed.defaultPrevented).toBe(false);
      expect(host.hasAttribute('selected')).toBe(false);
      expect(controller.getState(host)).toEqual({ selected: false, disabled: true });
    }

    expect(heard).toHaveLength(0);
    controller.destroy();
  });

  it('does not select when Pressable suppresses the click after a long-press', () => {
    document.body.innerHTML = `
      <div touchable-row="select" pressable pressable-longpress id="hold">Hold</div>
      <div touchable-row="select" pressable id="tap">Tap</div>
    `;
    stopTouchableRowRuntime();
    stopPressableRuntime();
    vi.useFakeTimers();
    const rows = createTouchableRow({ root: document.body });
    const presses = createPressable({ root: document.body, longPressDelay: 500 });
    const hold = document.getElementById('hold')!;
    const tap = document.getElementById('tap')!;
    const heard: JuiceChange[] = [];
    hold.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      const change = event as JuiceChange;
      if (change.detail.runtime === 'touchable-row') heard.push(change);
    });

    hold.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(500);
    hold.dispatchEvent(pointer('pointerup', { buttons: 0 }));
    const suppressed = click(hold);
    expect(suppressed.defaultPrevented).toBe(true);
    expect(hold.hasAttribute('selected')).toBe(false);
    expect(hold.getAttribute('aria-selected')).toBeNull();
    expect(heard).toHaveLength(0);
    expect(rows.getState(hold)).toEqual({ selected: false, disabled: false });

    hold.dispatchEvent(pointer('pointerdown'));
    hold.dispatchEvent(pointer('pointerup', { buttons: 0 }));
    const later = click(hold);
    expect(later.defaultPrevented).toBe(false);
    expect(hold.hasAttribute('selected')).toBe(true);
    expect(heard).toHaveLength(1);
    expect(heard[0]?.detail).toEqual({
      runtime: 'touchable-row',
      state: { selected: true, disabled: false },
    });

    click(tap);
    expect(tap.hasAttribute('selected')).toBe(true);

    presses.destroy();
    rows.destroy();
  });

  it('selects when juice:longpress is canceled', () => {
    document.body.innerHTML =
      '<div touchable-row="select" pressable pressable-longpress="120" id="hold">Hold</div>';
    stopTouchableRowRuntime();
    stopPressableRuntime();
    vi.useFakeTimers();
    const rows = createTouchableRow({ root: document.body });
    const presses = createPressable({ root: document.body });
    const hold = document.getElementById('hold')!;
    hold.addEventListener('juice:longpress', (event) => event.preventDefault());

    hold.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(120);
    hold.dispatchEvent(pointer('pointerup', { buttons: 0 }));
    const pressed = click(hold);
    expect(pressed.defaultPrevented).toBe(false);
    expect(hold.hasAttribute('selected')).toBe(true);
    expect(rows.getState(hold)?.selected).toBe(true);

    presses.destroy();
    rows.destroy();
  });

  it('does not synthesize a click for a menuitem row', () => {
    document.body.innerHTML =
      '<div touchable-row="select" menuitem id="item">Item</div>';
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const item = document.getElementById('item')!;
    const clicks: Event[] = [];
    item.addEventListener('click', (event) => clicks.push(event));

    const enter = keydown(item, 'Enter');
    const space = keydown(item, ' ');
    expect(enter.defaultPrevented).toBe(false);
    expect(space.defaultPrevented).toBe(false);
    expect(clicks).toHaveLength(0);
    expect(item.getAttribute('role')).toBeNull();

    click(item);
    expect(item.hasAttribute('selected')).toBe(true);
    expect(item.getAttribute('aria-selected')).toBe('true');

    controller.destroy();
  });

  it('stops handling after destroy', () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const row = document.getElementById('row')!;
    const clicks: Event[] = [];
    row.addEventListener('click', (event) => clicks.push(event));

    controller.destroy();

    const space = keydown(row, ' ');
    expect(space.defaultPrevented).toBe(false);
    expect(clicks).toHaveLength(0);
    click(row);
    expect(row.hasAttribute('selected')).toBe(false);
    expect(controller.getState(row)).toBeNull();
    expect(controller.sync()).toBeUndefined();
    expect(controller.destroy()).toBeUndefined();
  });

  it('presses selection once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    const auto = startTouchableRowRuntime();
    const manual = createTouchableRow({ root: document.body });
    const row = document.getElementById('row')!;
    const heard: JuiceChange[] = [];
    row.addEventListener(JUICE_CHANGE_EVENT, (event) => {
      heard.push(event as JuiceChange);
    });

    click(row);
    expect(row.hasAttribute('selected')).toBe(true);
    expect(heard).toHaveLength(1);
    expect(manual.getState(row)?.selected).toBe(true);
    expect(auto?.getState(row)?.selected).toBe(true);

    manual.destroy();
    click(row);
    expect(row.hasAttribute('selected')).toBe(false);
    expect(heard).toHaveLength(2);
  });
});

describe('startTouchableRowRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    stopTouchableRowRuntime();

    const first = startTouchableRowRuntime();
    const second = startTouchableRowRuntime();
    const row = document.getElementById('row')!;

    expect(first).toBe(second);
    expect(row.getAttribute('role')).toBe('button');
    click(row);
    expect(second?.getState(row)).toEqual({ selected: true, disabled: false });

    stopTouchableRowRuntime();
    click(row);
    expect(row.hasAttribute('selected')).toBe(true);

    startTouchableRowRuntime();
    click(row);
    expect(row.hasAttribute('selected')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopTouchableRowRuntime', async () => {
    stopTouchableRowRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./touchable-row-runtime.js');
      document.body.innerHTML = '<div touchable-row="activate" id="row">Row</div>';
      mod.stopTouchableRowRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const row = document.getElementById('row')!;
      keydown(row, 'Enter');
      expect(row.getAttribute('role')).toBeNull();

      mod.startTouchableRowRuntime();
      expect(row.getAttribute('role')).toBe('button');
      keydown(row, ' ');
      expect(row.getAttribute('tabindex')).toBe('0');
      mod.stopTouchableRowRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
