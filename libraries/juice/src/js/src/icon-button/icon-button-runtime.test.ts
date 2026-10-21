// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JUICE_CHANGE_EVENT } from '../shared/change.js';
import {
  createIconButton,
  initIconButton,
  startIconButtonRuntime,
  stopIconButtonRuntime,
} from './icon-button-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const toggleMarkup = `
  <button type="button" icon-button toggle aria-label="Bold" id="demo-icon"></button>
`;

afterEach(() => {
  stopIconButtonRuntime();
  resetDom();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('createIconButton', () => {
  it('is the same function as initIconButton', () => {
    expect(initIconButton).toBe(createIconButton);
  });

  it('warns once in development when an icon button has no accessible name', () => {
    document.body.innerHTML = `
      <button type="button" icon-button id="bare"></button>
      <button type="button" icon-button id="titled" title="Close"></button>
      <button type="button" icon-button id="icon-only"><i icon="xmark"></i></button>
      <button type="button" icon-button id="svg-only"><svg><title>Close</title></svg></button>
      <button type="button" icon-button id="blank" aria-label="  "></button>
      <button type="button" icon-button id="spaces">   </button>
      <button type="button" icon-button id="hidden-text"><span hidden>Close</span></button>
      <span id="empty-label"><svg><title>Nope</title></svg></span>
      <button type="button" icon-button id="missing-by" aria-labelledby="missing empty-label"></button>
    `;
    stopIconButtonRuntime();
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const controller = createIconButton({ root: document.body });
    const bare = document.getElementById('bare');

    expect(warn).toHaveBeenCalledTimes(8);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/icon-button/);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/accessible name/i);
    expect(warn.mock.calls.map((call) => call[1])).toEqual([
      document.getElementById('bare'),
      document.getElementById('titled'),
      document.getElementById('icon-only'),
      document.getElementById('svg-only'),
      document.getElementById('blank'),
      document.getElementById('spaces'),
      document.getElementById('hidden-text'),
      document.getElementById('missing-by'),
    ]);
    expect(bare?.hasAttribute('aria-label')).toBe(false);
    expect(bare?.getAttribute('title')).toBeNull();

    controller.sync();
    expect(warn).toHaveBeenCalledTimes(8);

    controller.destroy();
    const again = createIconButton({ root: document.body });
    expect(warn).toHaveBeenCalledTimes(8);

    document.body.insertAdjacentHTML(
      'beforeend',
      '<button type="button" icon-button id="late-bare"></button>'
    );
    again.sync();
    expect(warn).toHaveBeenCalledTimes(9);
    expect(warn.mock.calls[8]?.[1]).toBe(document.getElementById('late-bare'));

    again.destroy();
  });

  it('does not warn when aria-label, aria-labelledby, or visible text names the control', () => {
    document.body.innerHTML = `
      <button type="button" icon-button id="label" aria-label="Close"></button>
      <span id="name">Bold</span>
      <button type="button" icon-button id="by" aria-labelledby="name"></button>
      <button type="button" icon-button id="text"><i icon="plus"></i> Add</button>
      <button type="button" icon-button id="mixed" title="Ignored">Save</button>
    `;
    stopIconButtonRuntime();
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const controller = createIconButton({ root: document.body });

    expect(warn).not.toHaveBeenCalled();
    expect(controller.getState(document.getElementById('label'))).toMatchObject({
      named: true,
    });
    expect(controller.getState(document.getElementById('by'))).toMatchObject({
      named: true,
    });
    expect(controller.getState(document.getElementById('text'))).toMatchObject({
      named: true,
    });
    expect(document.getElementById('label')?.getAttribute('aria-label')).toBe(
      'Close'
    );
    expect(document.getElementById('by')?.getAttribute('aria-labelledby')).toBe(
      'name'
    );
    expect(document.getElementById('mixed')?.getAttribute('title')).toBe(
      'Ignored'
    );

    controller.destroy();
  });

  it('stays silent outside development', () => {
    document.body.innerHTML = `
      <button type="button" icon-button id="bare"></button>
    `;
    stopIconButtonRuntime();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const inTest = createIconButton({ root: document.body });
    expect(process.env.NODE_ENV).not.toBe('development');
    expect(warn).not.toHaveBeenCalled();
    expect(inTest.getState(document.getElementById('bare'))).toMatchObject({
      named: false,
    });
    inTest.destroy();

    vi.stubEnv('NODE_ENV', 'production');
    const inProduction = createIconButton({ root: document.body });
    expect(warn).not.toHaveBeenCalled();
    inProduction.destroy();
  });

  it('initializes toggle pressed state without adding aria-pressed to other icon buttons', () => {
    document.body.innerHTML = `
      <button type="button" icon-button toggle aria-label="Bold" id="off"></button>
      <button type="button" icon-button toggle pressed aria-label="Italic" id="on"></button>
      <button type="button" icon-button toggle aria-pressed="true" aria-label="Underline" id="aria"></button>
      <button type="button" icon-button toggle aria-pressed="false" pressed aria-label="Strike" id="both"></button>
      <button type="button" icon-button aria-label="Close" id="plain"></button>
      <button type="button" icon-button pressed aria-label="Pin" id="visual"></button>
    `;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const off = document.getElementById('off');
    const on = document.getElementById('on');
    const aria = document.getElementById('aria');
    const both = document.getElementById('both');
    const plain = document.getElementById('plain');
    const visual = document.getElementById('visual');

    expect(off?.getAttribute('aria-pressed')).toBe('false');
    expect(off?.hasAttribute('pressed')).toBe(false);
    expect(on?.getAttribute('aria-pressed')).toBe('true');
    expect(on?.hasAttribute('pressed')).toBe(true);
    expect(aria?.getAttribute('aria-pressed')).toBe('true');
    expect(aria?.hasAttribute('pressed')).toBe(true);
    expect(both?.getAttribute('aria-pressed')).toBe('true');
    expect(both?.hasAttribute('pressed')).toBe(true);
    expect(plain?.hasAttribute('aria-pressed')).toBe(false);
    expect(plain?.hasAttribute('pressed')).toBe(false);
    expect(visual?.hasAttribute('aria-pressed')).toBe(false);
    expect(visual?.hasAttribute('pressed')).toBe(true);
    expect(controller.getState(off)).toEqual({
      pressed: false,
      disabled: false,
      named: true,
    });
    expect(controller.getState(visual)).toEqual({
      pressed: true,
      disabled: false,
      named: true,
    });

    controller.destroy();
  });

  it('toggles on click and leaves native button keys to that click', () => {
    document.body.innerHTML = toggleMarkup;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const control = document.getElementById('demo-icon');

    control?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    );
    control?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })
    );
    expect(control?.getAttribute('aria-pressed')).toBe('false');
    expect(control?.hasAttribute('pressed')).toBe(false);

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-pressed')).toBe('true');
    expect(control?.hasAttribute('pressed')).toBe(true);
    expect(controller.getState(control)?.pressed).toBe(true);

    controller.toggle(control);
    expect(control?.getAttribute('aria-pressed')).toBe('false');
    expect(control?.hasAttribute('pressed')).toBe(false);

    controller.destroy();
  });

  it('toggles a non-button on click, Enter, and Space', () => {
    document.body.innerHTML = `
      <div icon-button toggle aria-label="Bold" id="div-icon"></div>
      <a href="#top" icon-button toggle aria-label="Link" id="link-icon"></a>
    `;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const control = document.getElementById('div-icon');
    const link = document.getElementById('link-icon');

    expect(control?.getAttribute('role')).toBe('button');
    expect(control?.getAttribute('tabindex')).toBe('0');
    expect(link?.hasAttribute('role')).toBe(false);
    expect(link?.hasAttribute('tabindex')).toBe(false);

    const space = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: ' ',
    });
    control?.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    expect(control?.getAttribute('aria-pressed')).toBe('true');
    expect(control?.hasAttribute('pressed')).toBe(true);

    control?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    );
    expect(control?.getAttribute('aria-pressed')).toBe('false');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-pressed')).toBe('true');

    link?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    );
    expect(link?.getAttribute('aria-pressed')).toBe('false');
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(link?.getAttribute('aria-pressed')).toBe('true');

    controller.destroy();
  });

  it('does not toggle disabled hosts', () => {
    document.body.innerHTML = `
      <button type="button" icon-button toggle disabled aria-label="Native" id="native-disabled"></button>
      <button type="button" icon-button toggle aria-disabled="true" aria-label="ARIA" id="aria-disabled"></button>
      <div icon-button toggle disabled aria-label="Div" id="div-disabled"></div>
      <button type="button" icon-button toggle pressed disabled aria-label="Held" id="held"></button>
    `;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const nativeDisabled = document.getElementById('native-disabled');
    const ariaDisabled = document.getElementById('aria-disabled');
    const divDisabled = document.getElementById('div-disabled');
    const held = document.getElementById('held');

    expect(nativeDisabled?.getAttribute('aria-pressed')).toBe('false');
    expect(held?.getAttribute('aria-pressed')).toBe('true');

    nativeDisabled?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    ariaDisabled?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    );
    divDisabled?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    divDisabled?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );
    controller.toggle(nativeDisabled);
    controller.toggle(ariaDisabled);
    controller.toggle(held);

    expect(nativeDisabled?.getAttribute('aria-pressed')).toBe('false');
    expect(ariaDisabled?.getAttribute('aria-pressed')).toBe('false');
    expect(divDisabled?.getAttribute('aria-pressed')).toBe('false');
    expect(held?.getAttribute('aria-pressed')).toBe('true');
    expect(held?.hasAttribute('pressed')).toBe(true);
    expect(controller.getState(nativeDisabled)?.disabled).toBe(true);
    expect(controller.getState(ariaDisabled)?.disabled).toBe(true);

    controller.destroy();
  });

  it('does not toggle or name a non icon-button, and ignores clicks on plain icon buttons', () => {
    document.body.innerHTML = `
      <button type="button" aria-label="Plain" id="plain"></button>
      <button type="button" icon-button aria-label="Close" id="icon"></button>
    `;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const plain = document.getElementById('plain');
    const icon = document.getElementById('icon');

    plain?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    icon?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    controller.toggle(icon);
    controller.toggle(plain);

    expect(plain?.hasAttribute('aria-pressed')).toBe(false);
    expect(icon?.hasAttribute('aria-pressed')).toBe(false);
    expect(controller.getState(plain)).toBeNull();
    expect(controller.getState(icon)?.pressed).toBe(false);
    expect(controller.getState()).toEqual({
      pressed: false,
      disabled: false,
      named: true,
    });

    controller.destroy();
  });

  it('dispatches juice:change when pressed, disabled, or named state changes', () => {
    document.body.innerHTML = toggleMarkup;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const control = document.getElementById('demo-icon')!;
    const events: Array<CustomEvent<{ runtime: string; state: unknown }>> = [];
    const onChange = (event: Event) => {
      events.push(event as CustomEvent<{ runtime: string; state: unknown }>);
    };
    document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);

    expect(events).toHaveLength(0);
    expect(controller.getState(control)).toEqual({
      pressed: false,
      disabled: false,
      named: true,
    });

    control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).toHaveLength(1);
    expect(events[0]?.bubbles).toBe(true);
    expect(events[0]?.target).toBe(control);
    expect(events[0]?.detail).toEqual({
      runtime: 'icon-button',
      state: { pressed: true, disabled: false, named: true },
    });

    control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).toHaveLength(2);
    expect(events[1]?.detail.state).toEqual({
      pressed: false,
      disabled: false,
      named: true,
    });

    controller.toggle(control);
    controller.toggle(control);
    expect(events).toHaveLength(4);
    expect(controller.getState(control)?.pressed).toBe(false);

    control.setAttribute('disabled', '');
    controller.sync();
    expect(events).toHaveLength(5);
    expect(events[4]?.detail.state).toEqual({
      pressed: false,
      disabled: true,
      named: true,
    });
    controller.toggle(control);
    expect(events).toHaveLength(5);
    expect(control.getAttribute('aria-pressed')).toBe('false');

    control.removeAttribute('disabled');
    control.removeAttribute('aria-label');
    controller.sync();
    expect(events).toHaveLength(6);
    expect(controller.getState(control)).toEqual({
      pressed: false,
      disabled: false,
      named: false,
    });

    controller.sync();
    expect(events).toHaveLength(6);

    document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange);
    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = toggleMarkup;
    startIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const control = document.getElementById('demo-icon');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-pressed')).toBe('true');
    expect(control?.hasAttribute('pressed')).toBe(true);

    controller.destroy();
  });

  it('stops handling after destroy', async () => {
    document.body.innerHTML = toggleMarkup;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const control = document.getElementById('demo-icon');

    expect(control?.getAttribute('aria-pressed')).toBe('false');
    controller.destroy();
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    controller.toggle(control);
    controller.sync();
    expect(control?.getAttribute('aria-pressed')).toBe('false');
    expect(control?.hasAttribute('pressed')).toBe(false);

    document.body.innerHTML = `
      <button type="button" icon-button toggle aria-label="Late" id="after"></button>
    `;
    await flushRuntime();
    expect(document.getElementById('after')?.hasAttribute('aria-pressed')).toBe(
      false
    );
  });

  it('syncs late-rendered icon buttons and cleans up when destroy runs first', async () => {
    stopIconButtonRuntime();
    const controller = createIconButton({ root: document.body });

    document.body.innerHTML = `
      <button type="button" icon-button toggle aria-label="Late" id="late-icon"></button>
    `;
    await flushRuntime();

    const control = document.getElementById('late-icon');
    expect(control?.getAttribute('aria-pressed')).toBe('false');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-pressed')).toBe('true');

    controller.destroy();
    document.body.innerHTML = `
      <button type="button" icon-button toggle aria-label="After" id="after-icon"></button>
    `;
    await flushRuntime();
    expect(document.getElementById('after-icon')?.hasAttribute('aria-pressed')).toBe(
      false
    );
  });

  it('keeps an author role and tabindex on a non-button toggle', () => {
    document.body.innerHTML = `
      <div icon-button toggle role="switch" tabindex="-1" aria-label="Keep" id="kept"></div>
    `;
    stopIconButtonRuntime();

    const controller = createIconButton({ root: document.body });
    const control = document.getElementById('kept');

    expect(control?.getAttribute('role')).toBe('switch');
    expect(control?.getAttribute('tabindex')).toBe('-1');
    expect(control?.getAttribute('aria-pressed')).toBe('false');

    controller.destroy();
  });
});

describe('startIconButtonRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = toggleMarkup;
    stopIconButtonRuntime();

    const first = startIconButtonRuntime();
    const second = startIconButtonRuntime();
    const control = document.getElementById('demo-icon');

    expect(first).toBe(second);
    expect(control?.getAttribute('aria-pressed')).toBe('false');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-pressed')).toBe('true');
    expect(second?.getState(control)).toEqual({
      pressed: true,
      disabled: false,
      named: true,
    });
  });

  it('does not auto-start on DOMContentLoaded after stopIconButtonRuntime', async () => {
    stopIconButtonRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./icon-button-runtime.js');
      document.body.innerHTML = toggleMarkup;
      mod.stopIconButtonRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const control = document.getElementById('demo-icon');
      control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(control?.hasAttribute('aria-pressed')).toBe(false);

      mod.startIconButtonRuntime();
      control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(control?.getAttribute('aria-pressed')).toBe('true');
      mod.stopIconButtonRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
