// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createCheckbox,
  startCheckboxRuntime,
  stopCheckboxRuntime,
} from './checkbox-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const checkboxMarkup = `
  <button checkbox aria-label="Accept terms" id="demo-checkbox"></button>
`;

afterEach(() => {
  stopCheckboxRuntime();
  resetDom();
});

describe('createCheckbox', () => {
  it('syncs APG checkbox ARIA without inventing a name', () => {
    document.body.innerHTML = `
      <button checkbox id="demo-checkbox">Accept terms</button>
      <button checkbox aria-label="Subscribe" id="named-checkbox"></button>
    `;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const unlabeled = document.getElementById('demo-checkbox');
    const named = document.getElementById('named-checkbox');

    expect(unlabeled?.getAttribute('role')).toBe('checkbox');
    expect(unlabeled?.getAttribute('aria-checked')).toBe('false');
    expect(unlabeled?.getAttribute('type')).toBe('button');
    expect(unlabeled?.hasAttribute('aria-label')).toBe(false);
    expect(unlabeled?.textContent?.trim()).toBe('Accept terms');

    expect(named?.getAttribute('role')).toBe('checkbox');
    expect(named?.getAttribute('aria-label')).toBe('Subscribe');
    expect(named?.getAttribute('aria-checked')).toBe('false');
    expect(named?.getAttribute('aria-modal')).toBeNull();

    controller.destroy();
  });

  it('keeps author aria-checked="true" and coerces mixed to false', () => {
    document.body.innerHTML = `
      <button type="button" checkbox aria-checked="true" aria-label="On" id="on-checkbox"></button>
      <button type="button" checkbox aria-checked="mixed" aria-label="Mixed" id="mixed-checkbox"></button>
    `;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });

    expect(
      document.getElementById('on-checkbox')?.getAttribute('aria-checked')
    ).toBe('true');
    expect(
      document.getElementById('mixed-checkbox')?.getAttribute('aria-checked')
    ).toBe('false');
    expect(controller.isChecked(document.getElementById('on-checkbox'))).toBe(
      true
    );
    expect(
      controller.isChecked(document.getElementById('mixed-checkbox'))
    ).toBe(false);

    controller.destroy();
  });

  it('toggles on click and exposes check / uncheck / setChecked', () => {
    document.body.innerHTML = checkboxMarkup;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const control = document.getElementById('demo-checkbox');

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
    document.body.innerHTML = checkboxMarkup;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const control = document.getElementById('demo-checkbox');

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
      <button type="button" checkbox aria-checked="true" aria-label="Accept terms" id="demo-checkbox"></button>
    `;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const control = document.getElementById('demo-checkbox');

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
      <button type="button" checkbox disabled aria-label="Native" id="native-disabled"></button>
      <button type="button" checkbox aria-disabled="true" aria-label="ARIA" id="aria-disabled"></button>
    `;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
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

  it('keeps native checkbox hosts honest with aria-checked and :checked', () => {
    document.body.innerHTML = `
      <input type="checkbox" checkbox aria-label="Backup" id="box" />
      <input type="checkbox" checkbox aria-checked="true" aria-label="Already on" id="painted-box" />
    `;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const box = document.getElementById('box') as HTMLInputElement | null;
    const painted = document.getElementById(
      'painted-box'
    ) as HTMLInputElement | null;

    expect(box?.getAttribute('role')).toBe('checkbox');
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
      <div checkbox aria-label="Invalid" id="div-checkbox"></div>
      <input type="text" checkbox aria-label="Text" id="text-checkbox" />
      <input type="radio" checkbox aria-label="Radio" id="radio-checkbox" />
    `;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const div = document.getElementById('div-checkbox');
    const text = document.getElementById('text-checkbox');
    const radio = document.getElementById('radio-checkbox');

    expect(div?.getAttribute('role')).toBeNull();
    expect(div?.getAttribute('aria-checked')).toBeNull();
    expect(text?.getAttribute('role')).toBeNull();
    expect(radio?.getAttribute('role')).toBeNull();

    div?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(div?.getAttribute('aria-checked')).toBeNull();

    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = checkboxMarkup;
    startCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const control = document.getElementById('demo-checkbox');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');

    controller.destroy();
  });

  it('stops handling after destroy', () => {
    document.body.innerHTML = checkboxMarkup;
    stopCheckboxRuntime();

    const controller = createCheckbox({ root: document.body });
    const control = document.getElementById('demo-checkbox');

    controller.destroy();
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('false');
  });

  it('syncs late-rendered checkbox markup', async () => {
    stopCheckboxRuntime();
    const controller = createCheckbox({ root: document.body });

    document.body.innerHTML = `
      <button checkbox aria-label="Late" id="late-checkbox"></button>
    `;

    await flushRuntime();

    const control = document.getElementById('late-checkbox');
    expect(control?.getAttribute('role')).toBe('checkbox');
    expect(control?.getAttribute('aria-checked')).toBe('false');
    expect(control?.getAttribute('type')).toBe('button');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');

    controller.destroy();
  });
});

describe('startCheckboxRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = checkboxMarkup;
    stopCheckboxRuntime();

    const first = startCheckboxRuntime();
    const second = startCheckboxRuntime();
    const control = document.getElementById('demo-checkbox');

    expect(first).toBe(second);
    expect(control?.getAttribute('role')).toBe('checkbox');
    expect(control?.getAttribute('aria-checked')).toBe('false');

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');
  });

  it('does not auto-start on DOMContentLoaded after stopCheckboxRuntime', async () => {
    stopCheckboxRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./checkbox-runtime.js');
    document.body.innerHTML = checkboxMarkup;
    mod.stopCheckboxRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const control = document.getElementById('demo-checkbox');
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBeNull();

    mod.startCheckboxRuntime();
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(control?.getAttribute('aria-checked')).toBe('true');
    mod.stopCheckboxRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
