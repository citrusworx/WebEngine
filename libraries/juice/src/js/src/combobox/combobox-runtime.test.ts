// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createCombobox,
  startComboboxRuntime,
  stopComboboxRuntime,
} from './combobox-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const comboboxMarkup = `
  <div combobox name="fruit">
    <input combobox-input type="text" />
    <button type="button" combobox-trigger aria-label="Show fruits"></button>
    <ul combobox-list hidden>
      <li combobox-option>Apple</li>
      <li combobox-option>Banana</li>
      <li combobox-option>Apricot</li>
    </ul>
  </div>
`;

afterEach(() => {
  stopComboboxRuntime();
  resetDom();
  vi.restoreAllMocks();
});

describe('createCombobox', () => {
  it('fills roles, ids, and expanded state on sync', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const trigger = document.querySelector<HTMLElement>('[combobox-trigger]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const options = document.querySelectorAll<HTMLElement>('[combobox-option]');

    expect(input?.getAttribute('role')).toBe('combobox');
    expect(input?.getAttribute('aria-autocomplete')).toBe('list');
    expect(input?.getAttribute('aria-expanded')).toBe('false');
    expect(input?.getAttribute('aria-controls')).toBe('fruit-list');
    expect(list?.id).toBe('fruit-list');
    expect(list?.getAttribute('role')).toBe('listbox');
    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.getAttribute('aria-controls')).toBe('fruit-list');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('listbox');
    expect(options[0]?.id).toBe('fruit-option-1');
    expect(options[0]?.getAttribute('role')).toBe('option');
    expect(options[1]?.id).toBe('fruit-option-2');
    expect(options[2]?.id).toBe('fruit-option-3');

    controller.destroy();
  });

  it('exposes open, close, toggle, and select on the controller', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const root = document.querySelector<HTMLElement>('[combobox]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const option = document.querySelector<HTMLElement>('[combobox-option]');

    controller.open(root);
    expect(list?.hasAttribute('hidden')).toBe(false);
    expect(input?.getAttribute('aria-expanded')).toBe('true');

    controller.close(root);
    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(input?.getAttribute('aria-expanded')).toBe('false');

    controller.toggle(root);
    expect(list?.hasAttribute('hidden')).toBe(false);
    controller.toggle(root);
    expect(list?.hasAttribute('hidden')).toBe(true);

    controller.select(option);
    expect(input?.value).toBe('Apple');
    expect(option?.getAttribute('aria-selected')).toBe('true');
    expect(list?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('opens the list on input focus and typing', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');

    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);
    expect(input?.getAttribute('aria-expanded')).toBe('true');

    controller.close();
    expect(list?.hasAttribute('hidden')).toBe(true);

    if (input) input.value = 'a';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    expect(list?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('toggles the list from the trigger and writes aria-expanded on both', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[combobox-trigger]');
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(list?.hasAttribute('hidden')).toBe(false);
    expect(input?.getAttribute('aria-expanded')).toBe('true');
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(input?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('filters options with a case-insensitive substring and hides non-matches', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const options = document.querySelectorAll<HTMLElement>('[combobox-option]');

    if (input) input.value = 'ap';
    input?.dispatchEvent(new Event('input', { bubbles: true }));

    expect(list?.hasAttribute('hidden')).toBe(false);
    expect(options[0]?.hasAttribute('hidden')).toBe(false);
    expect(options[1]?.hasAttribute('hidden')).toBe(true);
    expect(options[2]?.hasAttribute('hidden')).toBe(false);

    if (input) input.value = 'BAN';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    expect(options[0]?.hasAttribute('hidden')).toBe(true);
    expect(options[1]?.hasAttribute('hidden')).toBe(false);
    expect(options[2]?.hasAttribute('hidden')).toBe(true);

    if (input) input.value = 'xyz';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    expect(list?.hasAttribute('hidden')).toBe(false);
    expect(options[0]?.hasAttribute('hidden')).toBe(true);
    expect(options[1]?.hasAttribute('hidden')).toBe(true);
    expect(options[2]?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('matches data-value when filtering', () => {
    document.body.innerHTML = `
      <div combobox>
        <input combobox-input type="text" />
        <ul combobox-list hidden>
          <li combobox-option data-value="us">United States</li>
          <li combobox-option data-value="ca">Canada</li>
        </ul>
      </div>
    `;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const options = document.querySelectorAll<HTMLElement>('[combobox-option]');

    if (input) input.value = 'us';
    input?.dispatchEvent(new Event('input', { bubbles: true }));

    expect(options[0]?.hasAttribute('hidden')).toBe(false);
    expect(options[1]?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('moves active option with arrows, Home, and End and sets aria-activedescendant', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const options = document.querySelectorAll<HTMLElement>('[combobox-option]');

    input?.focus();
    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );

    expect(options[0]?.getAttribute('combobox-option')).toBe('active');
    expect(input?.getAttribute('aria-activedescendant')).toBe('fruit-option-1');

    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    expect(options[1]?.getAttribute('combobox-option')).toBe('active');
    expect(options[0]?.getAttribute('combobox-option')).toBe('');
    expect(input?.getAttribute('aria-activedescendant')).toBe('fruit-option-2');

    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'End' })
    );
    expect(options[2]?.getAttribute('combobox-option')).toBe('active');
    expect(input?.getAttribute('aria-activedescendant')).toBe('fruit-option-3');

    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Home' })
    );
    expect(options[0]?.getAttribute('combobox-option')).toBe('active');
    expect(input?.getAttribute('aria-activedescendant')).toBe('fruit-option-1');

    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' })
    );
    expect(options[0]?.getAttribute('combobox-option')).toBe('active');

    controller.destroy();
  });

  it('selects the active option on Enter and writes single-select state', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const options = document.querySelectorAll<HTMLElement>('[combobox-option]');

    input?.focus();
    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(input?.value).toBe('Banana');
    expect(options[1]?.getAttribute('aria-selected')).toBe('true');
    expect(options[1]?.getAttribute('combobox-option')).toBe('active');
    expect(options[0]?.getAttribute('aria-selected')).toBe('false');
    expect(options[2]?.getAttribute('aria-selected')).toBe('false');
    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(input?.getAttribute('aria-expanded')).toBe('false');
    expect(input?.hasAttribute('aria-activedescendant')).toBe(false);

    controller.destroy();
  });

  it('uses data-value as the input value when selecting', () => {
    document.body.innerHTML = `
      <div combobox>
        <input combobox-input type="text" />
        <ul combobox-list hidden>
          <li combobox-option data-value="us">United States</li>
        </ul>
      </div>
    `;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const option = document.querySelector<HTMLElement>('[combobox-option]');
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');

    controller.select(option);
    expect(input?.value).toBe('us');
    expect(option?.getAttribute('aria-selected')).toBe('true');

    controller.destroy();
  });

  it('closes on Escape without changing the input value', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');

    if (input) input.value = 'Ap';
    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);

    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(input?.value).toBe('Ap');
    expect(input?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('closes on Tab without committing the active option', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const options = document.querySelectorAll<HTMLElement>('[combobox-option]');

    input?.focus();
    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    input?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' })
    );

    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(input?.value).toBe('');
    expect(options[0]?.getAttribute('aria-selected')).not.toBe('true');

    controller.destroy();
  });

  it('selects an option on click and keeps input focus through mousedown', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const option = document.querySelector<HTMLElement>('[combobox-option]');

    input?.focus();
    const mouseDown = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    option?.dispatchEvent(mouseDown);
    expect(mouseDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);

    option?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(input?.value).toBe('Apple');
    expect(option?.getAttribute('aria-selected')).toBe('true');
    expect(list?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('closes on outside click and on blur away from the widget', () => {
    document.body.innerHTML = `
      ${comboboxMarkup}
      <button type="button" id="outside">Outside</button>
    `;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const outside = document.getElementById('outside');

    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);

    outside?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(list?.hasAttribute('hidden')).toBe(true);

    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);

    input?.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: outside })
    );
    expect(list?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('does not close when focus moves to the trigger', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const trigger = document.querySelector<HTMLElement>('[combobox-trigger]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');

    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);

    input?.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: trigger })
    );
    expect(list?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('closes other open comboboxes when one opens', () => {
    document.body.innerHTML = `
      <div combobox id="one">
        <input combobox-input type="text" />
        <ul combobox-list hidden>
          <li combobox-option>Alpha</li>
        </ul>
      </div>
      <div combobox id="two">
        <input combobox-input type="text" />
        <ul combobox-list hidden>
          <li combobox-option>Beta</li>
        </ul>
      </div>
    `;
    stopComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const first = document.getElementById('one');
    const second = document.getElementById('two');
    const firstList = first?.querySelector<HTMLElement>('[combobox-list]');
    const secondList = second?.querySelector<HTMLElement>('[combobox-list]');
    const firstInput = first?.querySelector<HTMLInputElement>('[combobox-input]');
    const secondInput = second?.querySelector<HTMLInputElement>(
      '[combobox-input]'
    );

    firstInput?.focus();
    expect(firstList?.hasAttribute('hidden')).toBe(false);

    secondInput?.focus();
    expect(secondList?.hasAttribute('hidden')).toBe(false);
    expect(firstList?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('syncs late-rendered combobox markup', async () => {
    stopComboboxRuntime();
    const controller = createCombobox({ root: document.body });

    document.body.innerHTML = `
      <div combobox name="late">
        <input combobox-input type="text" />
        <ul combobox-list hidden>
          <li combobox-option>Later</li>
        </ul>
      </div>
    `;

    await flushRuntime();

    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const option = document.querySelector<HTMLElement>('[combobox-option]');

    expect(input?.getAttribute('role')).toBe('combobox');
    expect(list?.id).toBe('late-list');
    expect(option?.id).toBe('late-option-1');

    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('opens once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = comboboxMarkup;
    startComboboxRuntime();

    const controller = createCombobox({ root: document.body });
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    const option = document.querySelector<HTMLElement>('[combobox-option]');

    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);

    option?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(input?.value).toBe('Apple');
    expect(list?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });
});

describe('startComboboxRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = comboboxMarkup;
    stopComboboxRuntime();

    const first = startComboboxRuntime();
    const second = startComboboxRuntime();
    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');

    expect(first).toBe(second);

    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopComboboxRuntime', async () => {
    stopComboboxRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./combobox-runtime.js');
    document.body.innerHTML = comboboxMarkup;
    mod.stopComboboxRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const input = document.querySelector<HTMLInputElement>('[combobox-input]');
    const list = document.querySelector<HTMLElement>('[combobox-list]');
    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(true);

    input?.blur();
    mod.startComboboxRuntime();
    input?.focus();
    expect(list?.hasAttribute('hidden')).toBe(false);
    mod.stopComboboxRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
