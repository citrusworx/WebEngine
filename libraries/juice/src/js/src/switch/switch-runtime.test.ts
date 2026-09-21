// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSwitch,
  startSwitchRuntime,
  stopSwitchRuntime,
} from './switch-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const switchMarkup = `
  <button switch aria-label="Notifications" id="demo-switch"></button>
`;

afterEach(() => {
  stopSwitchRuntime();
  resetDom();
});

describe('createSwitch', () => {
  it('syncs APG switch ARIA without inventing a name', () => {
    document.body.innerHTML = `
      <button switch id="demo-switch">Alerts</button>
      <button switch aria-label="Quiet hours" id="named-switch"></button>
    `;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const unlabeled = document.getElementById('demo-switch');
    const named = document.getElementById('named-switch');

    expect(unlabeled?.getAttribute('role')).toBe('switch');
    expect(unlabeled?.getAttribute('aria-checked')).toBe('false');
    expect(unlabeled?.getAttribute('type')).toBe('button');
    expect(unlabeled?.hasAttribute('aria-label')).toBe(false);
    expect(unlabeled?.textContent?.trim()).toBe('Alerts');

    expect(named?.getAttribute('role')).toBe('switch');
    expect(named?.getAttribute('aria-label')).toBe('Quiet hours');
    expect(named?.getAttribute('aria-checked')).toBe('false');

    controller.destroy();
  });

  it('keeps author aria-checked="true" and coerces mixed to false', () => {
    document.body.innerHTML = `
      <button type="button" switch aria-checked="true" aria-label="On" id="on-switch"></button>
      <button type="button" switch aria-checked="mixed" aria-label="Mixed" id="mixed-switch"></button>
    `;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });

    expect(document.getElementById('on-switch')?.getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(
      document.getElementById('mixed-switch')?.getAttribute('aria-checked')
    ).toBe('false');
    expect(controller.isChecked(document.getElementById('on-switch'))).toBe(
      true
    );
    expect(controller.isChecked(document.getElementById('mixed-switch'))).toBe(
      false
    );

    controller.destroy();
  });

  it('toggles on click and exposes check / uncheck / setChecked', () => {
    document.body.innerHTML = switchMarkup;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const control = document.getElementById('demo-switch');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');
    expect(controller.isChecked(control)).toBe(true);

    controller.uncheck(control);
    expect(control?.getAttribute('aria-checked')).toBe('false');

    controller.check(control);
    expect(control?.getAttribute('aria-checked')).toBe('true');

    controller.setChecked(false, control);
    expect(control?.getAttribute('aria-checked')).toBe('false');

    controller.toggle(control);
    expect(control?.getAttribute('aria-checked')).toBe('true');

    controller.destroy();
  });

  it('toggles on Enter and Space', () => {
    document.body.innerHTML = switchMarkup;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const control = document.getElementById('demo-switch');

    control?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );
    expect(control?.getAttribute('aria-checked')).toBe('true');

    control?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    );
    expect(control?.getAttribute('aria-checked')).toBe('false');

    controller.destroy();
  });

  it('does not toggle on Escape', () => {
    document.body.innerHTML = `
      <button type="button" switch aria-checked="true" aria-label="Notifications" id="demo-switch"></button>
    `;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const control = document.getElementById('demo-switch');

    control?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(control?.getAttribute('aria-checked')).toBe('true');

    controller.destroy();
  });

  it('ignores disabled and aria-disabled hosts', () => {
    document.body.innerHTML = `
      <button type="button" switch disabled aria-label="Native" id="native-disabled"></button>
      <button type="button" switch aria-disabled="true" aria-label="ARIA" id="aria-disabled"></button>
    `;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const nativeDisabled = document.getElementById('native-disabled');
    const ariaDisabled = document.getElementById('aria-disabled');

    nativeDisabled?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    ariaDisabled?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    );
    controller.toggle(nativeDisabled);
    controller.check(ariaDisabled);

    expect(nativeDisabled?.getAttribute('aria-checked')).toBe('false');
    expect(ariaDisabled?.getAttribute('aria-checked')).toBe('false');

    controller.destroy();
  });

  it('keeps checkbox hosts honest with aria-checked and :checked', () => {
    document.body.innerHTML = `
      <input type="checkbox" switch aria-label="Backup" id="box-switch" />
      <input type="checkbox" switch aria-checked="true" aria-label="Already on" id="painted-box" />
    `;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const box = document.getElementById('box-switch') as HTMLInputElement | null;
    const painted = document.getElementById(
      'painted-box'
    ) as HTMLInputElement | null;

    expect(box?.getAttribute('role')).toBe('switch');
    expect(box?.getAttribute('aria-checked')).toBe('false');
    expect(box?.checked).toBe(false);

    expect(painted?.getAttribute('aria-checked')).toBe('true');
    expect(painted?.checked).toBe(true);

    box?.click();
    expect(box?.checked).toBe(true);
    expect(box?.getAttribute('aria-checked')).toBe('true');

    painted?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );
    expect(painted?.checked).toBe(false);
    expect(painted?.getAttribute('aria-checked')).toBe('false');

    controller.destroy();
  });

  it('does not enhance non-button, non-checkbox hosts', () => {
    document.body.innerHTML = `
      <div switch aria-label="Invalid" id="div-switch"></div>
      <input type="text" switch aria-label="Text" id="text-switch" />
    `;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const div = document.getElementById('div-switch');
    const text = document.getElementById('text-switch');

    expect(div?.getAttribute('role')).toBeNull();
    expect(div?.getAttribute('aria-checked')).toBeNull();
    expect(text?.getAttribute('role')).toBeNull();

    div?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(div?.getAttribute('aria-checked')).toBeNull();

    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = switchMarkup;
    startSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const control = document.getElementById('demo-switch');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');

    controller.destroy();
  });

  it('stops handling after destroy', () => {
    document.body.innerHTML = switchMarkup;
    stopSwitchRuntime();

    const controller = createSwitch({ root: document.body });
    const control = document.getElementById('demo-switch');

    controller.destroy();
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('false');
  });

  it('syncs late-rendered switch markup', async () => {
    stopSwitchRuntime();
    const controller = createSwitch({ root: document.body });

    document.body.innerHTML = `
      <button switch aria-label="Late" id="late-switch"></button>
    `;

    await flushRuntime();

    const control = document.getElementById('late-switch');
    expect(control?.getAttribute('role')).toBe('switch');
    expect(control?.getAttribute('aria-checked')).toBe('false');
    expect(control?.getAttribute('type')).toBe('button');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');

    controller.destroy();
  });
});

describe('startSwitchRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = switchMarkup;
    stopSwitchRuntime();

    const first = startSwitchRuntime();
    const second = startSwitchRuntime();
    const control = document.getElementById('demo-switch');

    expect(first).toBe(second);
    expect(control?.getAttribute('role')).toBe('switch');
    expect(control?.getAttribute('aria-checked')).toBe('false');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');
  });

  it('does not auto-start on DOMContentLoaded after stopSwitchRuntime', async () => {
    stopSwitchRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./switch-runtime.js');
    document.body.innerHTML = switchMarkup;
    mod.stopSwitchRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const control = document.getElementById('demo-switch');
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBeNull();

    mod.startSwitchRuntime();
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');
    mod.stopSwitchRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
