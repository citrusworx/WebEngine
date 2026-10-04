// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSelect,
  initSelect,
  startSelectRuntime,
  stopSelectRuntime,
} from './select-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const expectNativeSelect = (select: HTMLElement | null) => {
  expect(select?.tagName).toBe('SELECT');
  expect(select?.hasAttribute('role')).toBe(false);
  expect(select?.hasAttribute('aria-expanded')).toBe(false);
  expect(select?.hasAttribute('aria-controls')).toBe(false);
  expect(select?.hasAttribute('aria-haspopup')).toBe(false);
  expect(select?.hasAttribute('aria-activedescendant')).toBe(false);
  expect(select?.hasAttribute('aria-multiselectable')).toBe(false);
  expect(select?.hasAttribute('tabindex')).toBe(false);
  expect(select?.querySelector('[role="listbox"], [role="option"], [select-list], [select-option]')).toBeNull();
};

afterEach(() => {
  stopSelectRuntime();
  resetDom();
});

describe('createSelect', () => {
  it('names a select from an associated label without building a listbox', () => {
    document.body.innerHTML = `
      <label for="city">City</label>
      <select select id="city">
        <option>Portland</option>
        <option>Salem</option>
      </select>
    `;
    stopSelectRuntime();

    const controller = createSelect({ root: document.body });
    const select = document.getElementById('city');
    const label = document.querySelector('label');

    expect(select?.getAttribute('aria-labelledby')).toBe(label?.id);
    expect(label?.id).toMatch(/^juice-select-label-/);
    expect(select?.hasAttribute('aria-label')).toBe(false);
    expect(select?.getAttribute('select')).toBe('');
    expectNativeSelect(select);
    expect(select?.querySelectorAll('option')).toHaveLength(2);

    controller.destroy();
  });

  it('keeps an author name and does not invent one when no label is visible', () => {
    document.body.innerHTML = `
      <label for="named">City</label>
      <select select id="named" aria-label="Town" aria-labelledby="elsewhere" title="Tooltip"></select>
      <span id="elsewhere">Elsewhere</span>
      <select select id="bare" title="Choose"></select>
      <select select id="empty">
        <option>Portland</option>
      </select>
      <label for="covered" hidden id="covered-label">City</label>
      <select select id="covered"></select>
      <label for="blank" id="blank-label">   </label>
      <select select id="blank"></select>
      <span select-label hidden id="hidden-attr">Hidden</span>
      <select select id="attr-hidden"></select>
      <label for="quiet" id="quiet-label" aria-hidden="true">Quiet</label>
      <select select id="quiet"></select>
      <label>
        <select select id="only">
          <option>Portland</option>
        </select>
      </label>
    `;
    stopSelectRuntime();

    const controller = initSelect({ root: document.body });
    const named = document.getElementById('named');
    const bare = document.getElementById('bare');

    expect(named?.getAttribute('aria-label')).toBe('Town');
    expect(named?.getAttribute('aria-labelledby')).toBe('elsewhere');
    expect(named?.getAttribute('title')).toBe('Tooltip');
    expect(document.querySelector('label[for="named"]')?.hasAttribute('id')).toBe(
      false
    );

    for (const id of ['bare', 'empty', 'covered', 'blank', 'attr-hidden', 'quiet', 'only']) {
      const select = document.getElementById(id);
      expect(select?.hasAttribute('aria-label')).toBe(false);
      expect(select?.hasAttribute('aria-labelledby')).toBe(false);
      expectNativeSelect(select);
    }

    expect(bare?.getAttribute('title')).toBe('Choose');
    expect(document.getElementById('covered-label')?.textContent).toBe('City');
    expect(document.getElementById('covered-label')?.hasAttribute('hidden')).toBe(
      true
    );

    controller.destroy();
  });

  it('names a wrapping label from its visible text and skips the option', () => {
    document.body.innerHTML = `
      <label>
        City
        <select select id="wrapped">
          <option>Portland</option>
        </select>
      </label>
      <div select-label>
        Fruit
        <select select id="wrapped-attr">
          <option selected>Lime</option>
        </select>
      </div>
    `;
    stopSelectRuntime();

    const controller = createSelect({ root: document.body });
    const wrapped = document.getElementById('wrapped');
    const wrappedAttr = document.getElementById('wrapped-attr');

    expect(wrapped?.getAttribute('aria-label')).toBe('City');
    expect(wrapped?.getAttribute('aria-label')).not.toMatch(/Portland/);
    expect(wrapped?.hasAttribute('aria-labelledby')).toBe(false);
    expect(wrappedAttr?.getAttribute('aria-label')).toBe('Fruit');
    expect(wrappedAttr?.getAttribute('aria-label')).not.toMatch(/Lime/);
    expect(wrappedAttr?.hasAttribute('aria-labelledby')).toBe(false);
    expectNativeSelect(wrapped);
    expectNativeSelect(wrappedAttr);

    controller.destroy();
  });

  it('names a preceding select-label and prefers an associated label over it', () => {
    document.body.innerHTML = `
      <span select-label>Flavor</span>
      <select select id="flavor">
        <option>Lime</option>
      </select>
      <label for="city" id="city-label">City</label>
      <span select-label id="city-attr">Other</span>
      <select select id="city"></select>
      <div>
        <span select-label id="region-label">Region</span>
      </div>
      <select select id="region"></select>
    `;
    stopSelectRuntime();

    const controller = createSelect({ root: document.body });
    const flavor = document.getElementById('flavor');
    const flavorLabel = document.querySelector('[select-label]');
    const city = document.getElementById('city');
    const region = document.getElementById('region');

    expect(flavor?.getAttribute('aria-labelledby')).toBe(flavorLabel?.id);
    expect(flavorLabel?.id).toMatch(/^juice-select-label-/);
    expect(flavor?.hasAttribute('aria-label')).toBe(false);
    expect(city?.getAttribute('aria-labelledby')).toBe('city-label');
    expect(document.getElementById('city-attr')?.id).toBe('city-attr');
    expect(region?.getAttribute('aria-labelledby')).toBe('region-label');
    expectNativeSelect(flavor);

    controller.destroy();
  });

  it('keeps multiple and size selects native', () => {
    document.body.innerHTML = `
      <label for="toppings" id="toppings-label">Toppings</label>
      <select select id="toppings" multiple>
        <option>Lime</option>
        <option selected>Mint</option>
      </select>
      <label>
        Lines
        <select select id="lines" size="4">
          <option selected>One</option>
          <option>Two</option>
          <option>Three</option>
          <option>Four</option>
        </select>
      </label>
      <label for="single" id="single-label">Single</label>
      <select select id="single" size="1"></select>
    `;
    stopSelectRuntime();

    const controller = createSelect({ root: document.body });
    const toppings = document.getElementById('toppings') as HTMLSelectElement | null;
    const lines = document.getElementById('lines') as HTMLSelectElement | null;
    const single = document.getElementById('single');

    expect(toppings?.getAttribute('aria-labelledby')).toBe('toppings-label');
    expect(toppings?.hasAttribute('multiple')).toBe(true);
    expect(toppings?.selectedOptions[0]?.textContent).toBe('Mint');
    expectNativeSelect(toppings);

    expect(lines?.getAttribute('aria-label')).toBe('Lines');
    expect(lines?.getAttribute('aria-label')).not.toMatch(/One/);
    expect(lines?.getAttribute('size')).toBe('4');
    expect(lines?.selectedIndex).toBe(0);
    expectNativeSelect(lines);

    expect(single?.getAttribute('aria-labelledby')).toBe('single-label');
    expect(single?.getAttribute('size')).toBe('1');
    expectNativeSelect(single);

    controller.destroy();
  });

  it('leaves change and keyboard on the platform control', () => {
    document.body.innerHTML = `
      <label for="city" id="city-label">City</label>
      <select select id="city">
        <option value="pdx">Portland</option>
        <option value="slm">Salem</option>
      </select>
    `;
    stopSelectRuntime();

    const controller = createSelect({ root: document.body });
    const select = document.getElementById('city') as HTMLSelectElement;
    let changes = 0;
    const onChange = (event: Event) => {
      changes += 1;
      expect(event.defaultPrevented).toBe(false);
    };
    select.addEventListener('change', onChange);

    select.value = 'slm';
    const change = new Event('change', { bubbles: true, cancelable: true });
    select.dispatchEvent(change);

    expect(changes).toBe(1);
    expect(change.defaultPrevented).toBe(false);
    expect(select.value).toBe('slm');
    expect(select.getAttribute('aria-labelledby')).toBe('city-label');

    for (const key of ['Escape', 'ArrowDown', 'ArrowUp', ' ', 'Enter', 'Tab']) {
      const keydown = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key,
      });
      select.dispatchEvent(keydown);
      expect(keydown.defaultPrevented).toBe(false);
    }

    expect(select.value).toBe('slm');
    expect(select.selectedIndex).toBe(1);
    expectNativeSelect(select);
    expect(document.body.hasAttribute('inert')).toBe(false);

    select.removeEventListener('change', onChange);
    controller.destroy();
  });

  it('follows label edits and ignores markup after destroy', async () => {
    document.body.innerHTML = `
      <label for="city" id="city-label" hidden>City</label>
      <select select id="city"></select>
      <label id="wrap">
        Fruit
        <select select id="fruit">
          <option>Lime</option>
        </select>
      </label>
    `;
    stopSelectRuntime();

    const controller = createSelect({ root: document.body });
    const city = document.getElementById('city');
    const cityLabel = document.getElementById('city-label');
    const fruit = document.getElementById('fruit');
    const wrap = document.getElementById('wrap');

    expect(city?.hasAttribute('aria-labelledby')).toBe(false);

    cityLabel?.removeAttribute('hidden');
    await flushRuntime();
    expect(city?.getAttribute('aria-labelledby')).toBe('city-label');

    cityLabel!.firstChild!.textContent = 'Town';
    await flushRuntime();
    expect(city?.getAttribute('aria-labelledby')).toBe('city-label');
    expect(city?.hasAttribute('aria-label')).toBe(false);

    city?.setAttribute('aria-label', 'Custom');
    await flushRuntime();
    expect(city?.getAttribute('aria-label')).toBe('Custom');
    expect(city?.hasAttribute('aria-labelledby')).toBe(false);

    wrap!.childNodes[0]!.textContent = 'Citrus';
    await flushRuntime();
    expect(fruit?.getAttribute('aria-label')).toBe('Citrus');

    cityLabel?.setAttribute('hidden', '');
    city?.removeAttribute('aria-label');
    await flushRuntime();
    expect(city?.hasAttribute('aria-label')).toBe(false);
    expect(city?.hasAttribute('aria-labelledby')).toBe(false);

    controller.destroy();
    document.body.innerHTML = `
      <label for="after" id="after-label">After</label>
      <select select id="after"></select>
    `;
    await flushRuntime();
    expect(document.getElementById('after')?.hasAttribute('aria-labelledby')).toBe(
      false
    );
  });

  it('syncs a select rendered after init and stays inside its root', async () => {
    document.body.innerHTML = `
      <div id="scope"></div>
      <label for="outside" id="outside-label">Outside</label>
      <select select id="outside"></select>
      <div combobox id="combo">
        <input combobox-input type="text" />
        <ul combobox-list hidden>
          <li combobox-option>Apple</li>
        </ul>
      </div>
      <select id="plain">
        <option>Untagged</option>
      </select>
      <div select id="fake">Not a select</div>
    `;
    stopSelectRuntime();

    const scope = document.getElementById('scope');
    const controller = createSelect({ root: scope ?? document.body });

    scope?.insertAdjacentHTML(
      'beforeend',
      `
        <label for="inside" id="inside-label">Inside</label>
        <select select="list" id="inside"></select>
      `
    );
    await flushRuntime();

    const inside = document.getElementById('inside');
    const outside = document.getElementById('outside');
    const plain = document.getElementById('plain');
    const fake = document.getElementById('fake');
    const combo = document.getElementById('combo');
    const input = combo?.querySelector('input');
    const list = combo?.querySelector('ul');

    expect(inside?.getAttribute('aria-labelledby')).toBe('inside-label');
    expect(inside?.getAttribute('select')).toBe('list');
    expectNativeSelect(inside);
    expect(outside?.hasAttribute('aria-labelledby')).toBe(false);
    expect(outside?.hasAttribute('aria-label')).toBe(false);
    expect(plain?.hasAttribute('aria-label')).toBe(false);
    expect(plain?.hasAttribute('aria-labelledby')).toBe(false);
    expect(plain?.hasAttribute('role')).toBe(false);
    expect(fake?.hasAttribute('role')).toBe(false);
    expect(fake?.hasAttribute('aria-label')).toBe(false);
    expect(input?.hasAttribute('role')).toBe(false);
    expect(input?.hasAttribute('aria-expanded')).toBe(false);
    expect(list?.hasAttribute('role')).toBe(false);
    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(combo?.querySelector('[combobox-option]')?.hasAttribute('role')).toBe(
      false
    );

    controller.sync();
    expect(inside?.getAttribute('aria-labelledby')).toBe('inside-label');

    controller.destroy();
  });

  it('does not name a select inside a combobox or reuse another field label', () => {
    document.body.innerHTML = `
      <div combobox>
        <label for="oops" id="oops-label">Nope</label>
        <select select id="oops">
          <option>Apple</option>
        </select>
      </div>
      <span select-label id="city-label">City</span>
      <select select id="city"></select>
      <select select id="state"></select>
    `;
    stopSelectRuntime();

    const controller = createSelect({ root: document.body });
    const oops = document.getElementById('oops');
    const state = document.getElementById('state');

    expect(oops?.hasAttribute('aria-labelledby')).toBe(false);
    expect(oops?.hasAttribute('aria-label')).toBe(false);
    expectNativeSelect(oops);
    expect(document.getElementById('city')?.getAttribute('aria-labelledby')).toBe(
      'city-label'
    );
    expect(state?.hasAttribute('aria-labelledby')).toBe(false);
    expect(state?.hasAttribute('aria-label')).toBe(false);

    controller.destroy();
  });
});

describe('startSelectRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = `
      <label for="auto" id="auto-label">Auto</label>
      <select select id="auto"></select>
    `;
    stopSelectRuntime();

    const first = startSelectRuntime();
    const second = startSelectRuntime();
    const select = document.getElementById('auto');

    expect(first).toBe(second);
    expect(select?.getAttribute('aria-labelledby')).toBe('auto-label');
    expectNativeSelect(select);

    second?.sync();
    expect(select?.getAttribute('aria-labelledby')).toBe('auto-label');
  });

  it('does not auto-start on DOMContentLoaded after stopSelectRuntime', async () => {
    stopSelectRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./select-runtime.js');
      document.body.innerHTML = `
        <label for="held" id="held-label">Held</label>
        <select select id="held"></select>
      `;
      mod.stopSelectRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.getElementById('held')?.hasAttribute('aria-labelledby')).toBe(
        false
      );
      expect(document.getElementById('held')?.hasAttribute('aria-label')).toBe(
        false
      );

      mod.startSelectRuntime();
      expect(document.getElementById('held')?.getAttribute('aria-labelledby')).toBe(
        'held-label'
      );
      mod.stopSelectRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
