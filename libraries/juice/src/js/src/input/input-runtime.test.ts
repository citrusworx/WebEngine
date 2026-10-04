// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createInput,
  initInput,
  startInputRuntime,
  stopInputRuntime,
} from './input-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const expectNativeInput = (input: HTMLElement | null) => {
  expect(input?.tagName).toBe('INPUT');
  expect(input?.hasAttribute('role')).toBe(false);
  expect(input?.hasAttribute('aria-expanded')).toBe(false);
  expect(input?.hasAttribute('aria-controls')).toBe(false);
  expect(input?.hasAttribute('aria-invalid')).toBe(false);
  expect(input?.hasAttribute('aria-required')).toBe(false);
  expect(input?.hasAttribute('tabindex')).toBe(false);
};

const expectUnnamed = (element: HTMLElement | null) => {
  expect(element?.hasAttribute('aria-label')).toBe(false);
  expect(element?.hasAttribute('aria-labelledby')).toBe(false);
};

afterEach(() => {
  stopInputRuntime();
  resetDom();
});

describe('createInput', () => {
  it('is the same function as initInput', () => {
    expect(initInput).toBe(createInput);
  });

  it('names an input from an associated label and leaves the control native', () => {
    document.body.innerHTML = `
      <label for="email">Email</label>
      <input input id="email" type="email" value="ada@example.com">
    `;
    stopInputRuntime();

    const controller = createInput({ root: document.body });
    const input = document.getElementById('email');
    const label = document.querySelector('label');

    expect(input?.getAttribute('aria-labelledby')).toBe(label?.id);
    expect(label?.id).toMatch(/^juice-input-label-/);
    expect(input?.hasAttribute('aria-label')).toBe(false);
    expect(input?.getAttribute('input')).toBe('');
    expect(input?.getAttribute('type')).toBe('email');
    expect((input as HTMLInputElement).value).toBe('ada@example.com');
    expectNativeInput(input);

    controller.destroy();
  });

  it('names every text-like type, including a missing or empty type', () => {
    document.body.innerHTML = `
      <label for="missing" id="missing-label">Missing</label>
      <input input id="missing">
      <label for="empty" id="empty-label">Empty</label>
      <input input id="empty" type="">
      <label for="text" id="text-label">Text</label>
      <input input id="text" type="text">
      <label for="email" id="email-label">Email</label>
      <input input id="email" type="EMAIL">
      <label for="password" id="password-label">Password</label>
      <input input id="password" type="password" value="s3cret">
      <label for="search" id="search-label">Search</label>
      <input input id="search" type="search">
      <label for="tel" id="tel-label">Phone</label>
      <input input id="tel" type="tel">
      <label for="url" id="url-label">Site</label>
      <input input id="url" type="url">
      <label for="number" id="number-label">Count</label>
      <input input id="number" type="number" value="12">
      <label for="valued" id="valued-label">Field</label>
      <input input="field" id="valued" type="Text">
    `;
    stopInputRuntime();

    const controller = createInput({ root: document.body });

    for (const id of [
      'missing',
      'empty',
      'text',
      'email',
      'password',
      'search',
      'tel',
      'url',
      'number',
      'valued',
    ]) {
      const input = document.getElementById(id);
      expect(input?.getAttribute('aria-labelledby'), id).toBe(`${id}-label`);
      expect(input?.hasAttribute('aria-label'), id).toBe(false);
      expectNativeInput(input);
    }

    expect(document.getElementById('password')?.getAttribute('aria-labelledby')).toBe(
      'password-label'
    );
    expect((document.getElementById('password') as HTMLInputElement).value).toBe(
      's3cret'
    );
    expect((document.getElementById('number') as HTMLInputElement).value).toBe('12');
    expect(document.getElementById('valued')?.getAttribute('input')).toBe('field');

    controller.destroy();
  });

  it('ignores non-text input types and hosts that are not a text input', () => {
    const ignored = [
      'checkbox',
      'radio',
      'range',
      'file',
      'date',
      'time',
      'datetime-local',
      'month',
      'week',
      'color',
      'hidden',
      'button',
      'submit',
      'reset',
      'image',
    ];
    document.body.innerHTML = ignored
      .map(
        (type) => `
          <label for="${type}" id="${type}-label">${type}</label>
          <input input id="${type}" type="${type}" value="kept">
        `
      )
      .join('');
    document.body.insertAdjacentHTML(
      'beforeend',
      `
        <label for="unknown" id="unknown-label">Unknown</label>
        <input input id="unknown" type="foo">
        <label for="plain" id="plain-label">Plain</label>
        <input id="plain" type="text">
        <div input id="fake">Not an input</div>
        <label for="city" id="city-label">City</label>
        <select select id="city"><option>Portland</option></select>
        <label for="agree" id="agree-label">Agree</label>
        <input checkbox id="agree" type="checkbox">
        <label for="yes" id="yes-label">Yes</label>
        <input radio id="yes" type="radio">
      `
    );
    stopInputRuntime();

    const controller = createInput({ root: document.body });

    for (const type of [...ignored, 'unknown', 'plain']) {
      const input = document.getElementById(type);
      expectUnnamed(input);
      if (input instanceof HTMLInputElement) expectNativeInput(input);
    }

    expect(document.getElementById('checkbox')?.getAttribute('type')).toBe('checkbox');
    expect((document.getElementById('checkbox') as HTMLInputElement).value).toBe(
      'kept'
    );
    expectUnnamed(document.getElementById('fake'));
    expect(document.getElementById('fake')?.hasAttribute('role')).toBe(false);
    expectUnnamed(document.getElementById('city'));
    expect(document.getElementById('city')?.hasAttribute('role')).toBe(false);
    expectUnnamed(document.getElementById('agree'));
    expect(document.getElementById('agree')?.hasAttribute('role')).toBe(false);
    expectUnnamed(document.getElementById('yes'));
    expect(document.getElementById('yes')?.hasAttribute('role')).toBe(false);
    expect(document.getElementById('checkbox-label')?.id).toBe('checkbox-label');

    controller.destroy();
  });

  it('keeps an author name and does not invent one when no label is visible', () => {
    document.body.innerHTML = `
      <label for="named">Email</label>
      <input input id="named" type="email" aria-label="Mail" aria-labelledby="elsewhere" title="Tooltip">
      <span id="elsewhere">Elsewhere</span>
      <input input id="bare" type="text" title="Choose">
      <input input id="empty" type="text" value="ada@example.com">
      <label for="covered" hidden id="covered-label">Email</label>
      <input input id="covered" type="text">
      <label for="blank" id="blank-label">   </label>
      <input input id="blank" type="text">
      <span input-label hidden id="hidden-attr">Hidden</span>
      <input input id="attr-hidden" type="text">
      <label for="quiet" id="quiet-label" aria-hidden="true">Quiet</label>
      <input input id="quiet" type="text">
      <label>
        <input input id="only" type="text" value="only-value">
      </label>
      <div aria-hidden="true">
        <label for="buried" id="buried-label">Buried</label>
      </div>
      <input input id="buried" type="text">
      <label for="spaces" id="spaces-label">Spaces</label>
      <input input id="spaces" type="text" aria-label="   " title="Hint">
    `;
    stopInputRuntime();

    const controller = initInput({ root: document.body });
    const named = document.getElementById('named');
    const bare = document.getElementById('bare');
    const spaces = document.getElementById('spaces');

    expect(named?.getAttribute('aria-label')).toBe('Mail');
    expect(named?.getAttribute('aria-labelledby')).toBe('elsewhere');
    expect(named?.getAttribute('title')).toBe('Tooltip');
    expect(document.querySelector('label[for="named"]')?.hasAttribute('id')).toBe(
      false
    );

    for (const id of [
      'bare',
      'empty',
      'covered',
      'blank',
      'attr-hidden',
      'quiet',
      'only',
      'buried',
    ]) {
      const input = document.getElementById(id);
      expectUnnamed(input);
      expectNativeInput(input);
    }

    expect(bare?.getAttribute('title')).toBe('Choose');
    expect(document.getElementById('covered-label')?.textContent).toBe('Email');
    expect(document.getElementById('covered-label')?.hasAttribute('hidden')).toBe(
      true
    );
    expect(spaces?.getAttribute('aria-labelledby')).toBe('spaces-label');
    expect(spaces?.getAttribute('aria-label')).toBe('   ');
    expect(spaces?.getAttribute('title')).toBe('Hint');
    expectNativeInput(spaces);

    controller.destroy();
  });

  it('names a wrapping label from its visible text and skips the input value', () => {
    document.body.innerHTML = `
      <label>
        Email
        <input input id="wrapped" type="email" value="ada@example.com">
      </label>
      <div input-label>
        Password
        <span hidden>secret</span>
        <input input id="wrapped-attr" type="password" value="s3cret">
      </div>
      <label>
        Count
        <input input id="count" type="number" value="12">
      </label>
    `;
    stopInputRuntime();

    const controller = createInput({ root: document.body });
    const wrapped = document.getElementById('wrapped');
    const wrappedAttr = document.getElementById('wrapped-attr');
    const count = document.getElementById('count');

    expect(wrapped?.getAttribute('aria-label')).toBe('Email');
    expect(wrapped?.getAttribute('aria-label')).not.toMatch(/ada@example\.com/);
    expect(wrapped?.hasAttribute('aria-labelledby')).toBe(false);
    expect(wrappedAttr?.getAttribute('aria-label')).toBe('Password');
    expect(wrappedAttr?.getAttribute('aria-label')).not.toMatch(/s3cret/);
    expect(wrappedAttr?.getAttribute('aria-label')).not.toMatch(/secret/);
    expect(wrappedAttr?.hasAttribute('aria-labelledby')).toBe(false);
    expect(count?.getAttribute('aria-label')).toBe('Count');
    expect(count?.getAttribute('aria-label')).not.toMatch(/12/);
    expectNativeInput(wrapped);
    expectNativeInput(wrappedAttr);
    expectNativeInput(count);

    controller.destroy();
  });

  it('names a preceding input-label and prefers an associated label over it', () => {
    document.body.innerHTML = `
      <span input-label>Flavor</span>
      <input input id="flavor" type="text" value="Lime">
      <label for="city" id="city-label">City</label>
      <span input-label id="city-attr">Other</span>
      <input input id="city" type="text">
      <div>
        <span input-label id="region-label">Region</span>
      </div>
      <input input id="region" type="search">
      <span input-label for="code" hidden id="code-hidden">Nope</span>
      <span input-label id="code-visible">Code</span>
      <input input id="code" type="text">
      <label for="note" hidden id="note-hidden">Hidden</label>
      <span input-label for="note" id="note-attr">Note</span>
      <input input id="note" type="text">
    `;
    stopInputRuntime();

    const controller = createInput({ root: document.body });
    const flavor = document.getElementById('flavor');
    const flavorLabel = document.querySelector('[input-label]');
    const city = document.getElementById('city');
    const region = document.getElementById('region');
    const code = document.getElementById('code');
    const note = document.getElementById('note');

    expect(flavor?.getAttribute('aria-labelledby')).toBe(flavorLabel?.id);
    expect(flavorLabel?.id).toMatch(/^juice-input-label-/);
    expect(flavor?.hasAttribute('aria-label')).toBe(false);
    expect(flavor?.getAttribute('aria-labelledby')).not.toBe('');
    expect(city?.getAttribute('aria-labelledby')).toBe('city-label');
    expect(document.getElementById('city-attr')?.id).toBe('city-attr');
    expect(region?.getAttribute('aria-labelledby')).toBe('region-label');
    expect(code?.getAttribute('aria-labelledby')).toBe('code-visible');
    expect(document.getElementById('code-hidden')?.id).toBe('code-hidden');
    expect(note?.getAttribute('aria-labelledby')).toBe('note-attr');
    expectNativeInput(flavor);

    controller.destroy();
  });

  it('leaves typing, change, and the keyboard on the platform control', () => {
    document.body.innerHTML = `
      <label for="email" id="email-label">Email</label>
      <input input id="email" type="email" value="ada@example.com">
    `;
    stopInputRuntime();

    const controller = createInput({ root: document.body });
    const input = document.getElementById('email') as HTMLInputElement;
    let inputs = 0;
    let changes = 0;
    const onInput = (event: Event) => {
      inputs += 1;
      expect(event.defaultPrevented).toBe(false);
    };
    const onChange = (event: Event) => {
      changes += 1;
      expect(event.defaultPrevented).toBe(false);
    };
    input.addEventListener('input', onInput);
    input.addEventListener('change', onChange);

    input.value = 'ada@citrus.dev';
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    input.dispatchEvent(inputEvent);
    const change = new Event('change', { bubbles: true, cancelable: true });
    input.dispatchEvent(change);

    expect(inputs).toBe(1);
    expect(changes).toBe(1);
    expect(inputEvent.defaultPrevented).toBe(false);
    expect(change.defaultPrevented).toBe(false);
    expect(input.value).toBe('ada@citrus.dev');
    expect(input.getAttribute('aria-labelledby')).toBe('email-label');

    for (const key of ['Escape', 'ArrowDown', 'ArrowUp', ' ', 'Enter', 'Tab']) {
      const keydown = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key,
      });
      input.dispatchEvent(keydown);
      expect(keydown.defaultPrevented).toBe(false);
    }

    expect(input.value).toBe('ada@citrus.dev');
    expectNativeInput(input);
    expect(document.body.hasAttribute('inert')).toBe(false);

    input.removeEventListener('input', onInput);
    input.removeEventListener('change', onChange);
    controller.destroy();
  });

  it('follows label edits and drops a name when the host is no longer text-like', async () => {
    document.body.innerHTML = `
      <label for="email" id="email-label" hidden>Email</label>
      <input input id="email" type="email">
      <label id="wrap">
        Password
        <input input id="pw" type="password" value="s3cret">
      </label>
    `;
    stopInputRuntime();

    const controller = createInput({ root: document.body });
    const email = document.getElementById('email') as HTMLInputElement;
    const emailLabel = document.getElementById('email-label');
    const pw = document.getElementById('pw');
    const wrap = document.getElementById('wrap');

    expect(email.hasAttribute('aria-labelledby')).toBe(false);

    emailLabel?.removeAttribute('hidden');
    await flushRuntime();
    expect(email.getAttribute('aria-labelledby')).toBe('email-label');

    emailLabel!.firstChild!.textContent = 'Mail';
    await flushRuntime();
    expect(email.getAttribute('aria-labelledby')).toBe('email-label');
    expect(email.hasAttribute('aria-label')).toBe(false);

    email.setAttribute('aria-label', 'Custom');
    await flushRuntime();
    expect(email.getAttribute('aria-label')).toBe('Custom');
    expect(email.hasAttribute('aria-labelledby')).toBe(false);

    wrap!.childNodes[0]!.textContent = 'Secret';
    await flushRuntime();
    expect(pw?.getAttribute('aria-label')).toBe('Secret');
    expect(pw?.getAttribute('aria-label')).not.toMatch(/s3cret/);

    emailLabel?.setAttribute('hidden', '');
    email.removeAttribute('aria-label');
    await flushRuntime();
    expectUnnamed(email);

    emailLabel?.removeAttribute('hidden');
    await flushRuntime();
    expect(email.getAttribute('aria-labelledby')).toBe('email-label');

    email.setAttribute('type', 'checkbox');
    await flushRuntime();
    expect(email.getAttribute('type')).toBe('checkbox');
    expectUnnamed(email);
    expect(email.hasAttribute('role')).toBe(false);

    email.setAttribute('type', 'email');
    await flushRuntime();
    expect(email.getAttribute('aria-labelledby')).toBe('email-label');

    email.removeAttribute('input');
    await flushRuntime();
    expectUnnamed(email);

    controller.destroy();
    document.body.innerHTML = `
      <label for="after" id="after-label">After</label>
      <input input id="after" type="text">
    `;
    await flushRuntime();
    expect(document.getElementById('after')?.hasAttribute('aria-labelledby')).toBe(
      false
    );
  });

  it('syncs an input rendered after init and stays inside its root', async () => {
    document.body.innerHTML = `
      <div id="scope"></div>
      <label for="outside" id="outside-label">Outside</label>
      <input input id="outside" type="text">
      <div combobox id="combo">
        <label for="combo-field" id="combo-label">Combo</label>
        <input input combobox-input id="combo-field" type="text" />
        <ul combobox-list hidden>
          <li combobox-option>Apple</li>
        </ul>
      </div>
      <input id="plain" type="text">
      <div input id="fake">Not an input</div>
      <select select id="plain-select"><option>Untagged</option></select>
    `;
    stopInputRuntime();

    const scope = document.getElementById('scope');
    const controller = createInput({ root: scope ?? document.body });

    scope?.insertAdjacentHTML(
      'beforeend',
      `
        <label for="inside" id="inside-label">Inside</label>
        <input input="field" id="inside" type="search">
      `
    );
    await flushRuntime();

    const inside = document.getElementById('inside');
    const outside = document.getElementById('outside');
    const plain = document.getElementById('plain');
    const fake = document.getElementById('fake');
    const combo = document.getElementById('combo');
    const comboField = document.getElementById('combo-field');
    const list = combo?.querySelector('ul');
    const plainSelect = document.getElementById('plain-select');

    expect(inside?.getAttribute('aria-labelledby')).toBe('inside-label');
    expect(inside?.getAttribute('input')).toBe('field');
    expectNativeInput(inside);
    expectUnnamed(outside);
    expectUnnamed(plain);
    expect(plain?.hasAttribute('role')).toBe(false);
    expectUnnamed(fake);
    expect(fake?.hasAttribute('role')).toBe(false);
    expectUnnamed(comboField);
    expect(comboField?.hasAttribute('role')).toBe(false);
    expect(comboField?.hasAttribute('aria-expanded')).toBe(false);
    expect(list?.hasAttribute('role')).toBe(false);
    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(combo?.querySelector('[combobox-option]')?.hasAttribute('role')).toBe(
      false
    );
    expectUnnamed(plainSelect);
    expect(plainSelect?.hasAttribute('role')).toBe(false);

    controller.sync();
    expect(inside?.getAttribute('aria-labelledby')).toBe('inside-label');

    controller.destroy();
  });

  it('does not name an input inside a combobox or reuse another field label', () => {
    document.body.innerHTML = `
      <div combobox>
        <label for="oops" id="oops-label">Nope</label>
        <input input id="oops" type="text" value="Apple">
      </div>
      <span input-label id="email-label">Email</span>
      <input input id="email" type="email">
      <input input id="next" type="text">
    `;
    stopInputRuntime();

    const controller = createInput({ root: document.body });
    const oops = document.getElementById('oops');
    const next = document.getElementById('next');

    expectUnnamed(oops);
    expectNativeInput(oops);
    expect(document.getElementById('email')?.getAttribute('aria-labelledby')).toBe(
      'email-label'
    );
    expectUnnamed(next);

    controller.destroy();
  });
});

describe('startInputRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = `
      <label for="auto" id="auto-label">Auto</label>
      <input input id="auto" type="text">
    `;
    stopInputRuntime();

    const first = startInputRuntime();
    const second = startInputRuntime();
    const input = document.getElementById('auto');

    expect(first).toBe(second);
    expect(input?.getAttribute('aria-labelledby')).toBe('auto-label');
    expectNativeInput(input);

    second?.sync();
    expect(input?.getAttribute('aria-labelledby')).toBe('auto-label');
  });

  it('does not auto-start on DOMContentLoaded after stopInputRuntime', async () => {
    stopInputRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./input-runtime.js');
      document.body.innerHTML = `
        <label for="held" id="held-label">Held</label>
        <input input id="held" type="text">
      `;
      mod.stopInputRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.getElementById('held')?.hasAttribute('aria-labelledby')).toBe(
        false
      );
      expect(document.getElementById('held')?.hasAttribute('aria-label')).toBe(false);

      mod.startInputRuntime();
      expect(document.getElementById('held')?.getAttribute('aria-labelledby')).toBe(
        'held-label'
      );
      mod.stopInputRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
