// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createField,
  initField,
  startFieldRuntime,
  stopFieldRuntime,
} from './field-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const expectNativeControl = (control: HTMLElement | null) => {
  expect(control?.hasAttribute('role')).toBe(false);
  expect(control?.hasAttribute('aria-expanded')).toBe(false);
  expect(control?.hasAttribute('aria-controls')).toBe(false);
  expect(control?.hasAttribute('aria-required')).toBe(false);
  expect(control?.hasAttribute('tabindex')).toBe(false);
  expect(control?.hasAttribute('aria-label')).toBe(false);
  expect(control?.hasAttribute('aria-labelledby')).toBe(false);
};

const expectUndescribed = (control: HTMLElement | null) => {
  expect(control?.hasAttribute('aria-describedby')).toBe(false);
  expect(control?.hasAttribute('aria-invalid')).toBe(false);
};

afterEach(() => {
  stopFieldRuntime();
  resetDom();
});

describe('createField', () => {
  it('is the same function as initField', () => {
    expect(initField).toBe(createField);
  });

  it('points the control at visible help and error text and leaves it native', () => {
    document.body.innerHTML = `
      <form>
        <div field id="email-field">
          <span field-label>Email</span>
          <input id="email" type="email" value="ada@example.com">
          <p field-help>Use a work address.</p>
          <p field-error>Enter an email.</p>
        </div>
      </form>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
    const input = document.getElementById('email');
    const field = document.getElementById('email-field');
    const help = document.querySelector('[field-help]');
    const error = document.querySelector('[field-error]');

    expect(input?.getAttribute('aria-describedby')).toBe(`${help?.id} ${error?.id}`);
    expect(help?.id).toMatch(/^juice-field-desc-/);
    expect(error?.id).toMatch(/^juice-field-desc-/);
    expect(help?.id).not.toBe(error?.id);
    expect(input?.hasAttribute('aria-invalid')).toBe(false);
    expect(input?.getAttribute('type')).toBe('email');
    expect((input as HTMLInputElement).value).toBe('ada@example.com');
    expect(field?.getAttribute('field')).toBe('');
    expect(field?.hasAttribute('role')).toBe(false);
    expect(field?.hasAttribute('aria-invalid')).toBe(false);
    expectNativeControl(input);

    controller.destroy();
    expectUndescribed(input);
    expect(help?.hasAttribute('id')).toBe(false);
    expect(error?.hasAttribute('id')).toBe(false);
  });

  it('describes an input, a textarea, and a select without rewriting the host', () => {
    document.body.innerHTML = `
      <div field="group" id="text-field">
        <textarea id="note">hello</textarea>
        <p field-help id="note-help">Plain language.</p>
      </div>
      <div field id="city-field" invalid>
        <select id="city">
          <option>Portland</option>
        </select>
        <p field-error id="city-error">Pick a city.</p>
      </div>
      <div field id="check-field">
        <input id="agree" type="checkbox" value="yes">
        <p field-help id="agree-help">Required to continue.</p>
      </div>
    `;
    stopFieldRuntime();

    const controller = initField({ root: document.body });
    const note = document.getElementById('note');
    const city = document.getElementById('city');
    const agree = document.getElementById('agree');

    expect(note?.getAttribute('aria-describedby')).toBe('note-help');
    expect(note?.hasAttribute('aria-invalid')).toBe(false);
    expect((note as HTMLTextAreaElement).value).toBe('hello');
    expect(document.getElementById('text-field')?.getAttribute('field')).toBe(
      'group'
    );

    expect(city?.getAttribute('aria-describedby')).toBe('city-error');
    expect(city?.getAttribute('aria-invalid')).toBe('true');
    expect(city?.hasAttribute('role')).toBe(false);

    expect(agree?.getAttribute('aria-describedby')).toBe('agree-help');
    expect(agree?.getAttribute('type')).toBe('checkbox');
    expect((agree as HTMLInputElement).value).toBe('yes');
    expectNativeControl(agree);

    controller.destroy();
    expectUndescribed(note);
    expectUndescribed(city);
    expectUndescribed(agree);
    expect(document.getElementById('note-help')?.id).toBe('note-help');
    expect(document.getElementById('city-error')?.id).toBe('city-error');
  });

  it('keeps an author description and an author invalid state', () => {
    document.body.innerHTML = `
      <div field id="named-field" invalid>
        <input id="named" type="text" aria-describedby="keep" aria-invalid="false" aria-labelledby="label" title="Hint">
        <p field-help>Ignored while the author description stands.</p>
        <span id="label">Search</span>
      </div>
      <div field id="blank-field">
        <input id="blank" type="text" aria-describedby="   ">
        <p field-help id="blank-help">Visible help.</p>
      </div>
      <div field id="grammar-field" invalid>
        <input id="grammar" type="text" aria-invalid="grammar">
        <p field-error id="grammar-error">Check the spelling.</p>
      </div>
      <div field id="author-true" invalid>
        <input id="already" type="text" aria-invalid="true">
        <p field-error id="already-error">Required.</p>
      </div>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
    const named = document.getElementById('named');
    const blank = document.getElementById('blank');
    const grammar = document.getElementById('grammar');
    const already = document.getElementById('already');
    const ignored = document.querySelector('#named-field [field-help]');

    expect(named?.getAttribute('aria-describedby')).toBe('keep');
    expect(named?.getAttribute('aria-invalid')).toBe('false');
    expect(named?.getAttribute('aria-labelledby')).toBe('label');
    expect(named?.getAttribute('title')).toBe('Hint');
    expect(ignored?.hasAttribute('id')).toBe(false);

    expect(blank?.getAttribute('aria-describedby')).toBe('blank-help');
    expect(grammar?.getAttribute('aria-invalid')).toBe('grammar');
    expect(grammar?.getAttribute('aria-describedby')).toBe('grammar-error');
    expect(already?.getAttribute('aria-invalid')).toBe('true');
    expect(already?.getAttribute('aria-describedby')).toBe('already-error');

    document.getElementById('named-field')?.removeAttribute('invalid');
    document.getElementById('author-true')?.removeAttribute('invalid');
    controller.sync();

    expect(named?.getAttribute('aria-invalid')).toBe('false');
    expect(already?.getAttribute('aria-invalid')).toBe('true');
    expect(named?.getAttribute('aria-describedby')).toBe('keep');

    controller.destroy();
    expect(named?.getAttribute('aria-describedby')).toBe('keep');
    expect(named?.getAttribute('aria-invalid')).toBe('false');
    expect(named?.getAttribute('aria-labelledby')).toBe('label');
    expect(grammar?.getAttribute('aria-invalid')).toBe('grammar');
    expect(already?.getAttribute('aria-invalid')).toBe('true');
    expect(blank?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('skips hidden and empty help and error text', () => {
    document.body.innerHTML = `
      <div field id="email-field">
        <input id="email" type="email">
        <p field-help hidden id="hidden-help">Hidden help.</p>
        <p field-error aria-hidden="true" id="quiet-error">Quiet error.</p>
        <div hidden>
          <p field-help id="buried-help">Buried help.</p>
        </div>
        <div aria-hidden="true">
          <p field-error id="buried-error">Buried error.</p>
        </div>
        <p field-help id="empty-help">   </p>
        <p field-error id="empty-error"><span hidden>Nope</span></p>
        <p field-help id="visible-help">Visible <span hidden>secret</span></p>
      </div>
      <p field-help id="outside-help">Outside the field.</p>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
    const email = document.getElementById('email');

    expect(email?.getAttribute('aria-describedby')).toBe('visible-help');
    expect(email?.hasAttribute('aria-invalid')).toBe(false);
    for (const id of [
      'hidden-help',
      'quiet-error',
      'buried-help',
      'buried-error',
      'empty-help',
      'empty-error',
      'outside-help',
    ]) {
      expect(document.getElementById(id)?.id, id).toBe(id);
      expect(email?.getAttribute('aria-describedby')).not.toContain(id);
    }
    expectNativeControl(email);

    controller.destroy();
  });

  it('sets aria-invalid from [invalid] and removes only the value it wrote', () => {
    document.body.innerHTML = `
      <div field id="email-field">
        <input id="email" type="email" value="ada@example.com">
        <p field-help id="email-help">Work address.</p>
        <p field-error hidden id="email-error">Required.</p>
      </div>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
    const email = document.getElementById('email') as HTMLInputElement;
    const field = document.getElementById('email-field');
    const error = document.getElementById('email-error');

    expect(email.getAttribute('aria-describedby')).toBe('email-help');
    expect(email.hasAttribute('aria-invalid')).toBe(false);
    expect(error?.id).toBe('email-error');

    field?.setAttribute('invalid', '');
    controller.sync();
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('email-help');
    expect(field?.hasAttribute('aria-invalid')).toBe(false);

    error?.removeAttribute('hidden');
    controller.sync();
    expect(email.getAttribute('aria-describedby')).toBe('email-help email-error');
    expect(email.getAttribute('aria-invalid')).toBe('true');

    email.setAttribute('aria-invalid', 'false');
    controller.sync();
    expect(email.getAttribute('aria-invalid')).toBe('false');

    field?.removeAttribute('invalid');
    controller.sync();
    expect(email.getAttribute('aria-invalid')).toBe('false');
    expect(email.getAttribute('aria-describedby')).toBe('email-help email-error');

    field?.setAttribute('invalid', 'false');
    email.removeAttribute('aria-invalid');
    controller.sync();
    expect(email.getAttribute('aria-invalid')).toBe('true');

    field?.removeAttribute('invalid');
    controller.sync();
    expect(email.hasAttribute('aria-invalid')).toBe(false);
    expect(email.value).toBe('ada@example.com');
    expectNativeControl(email);

    controller.destroy();
  });

  it('drops runtime state when the source goes away and on destroy', async () => {
    document.body.innerHTML = `
      <div field id="a" invalid>
        <input id="control" type="text" value="kept">
        <p field-help>Alpha</p>
      </div>
      <div field id="b">
        <p field-help id="help-b">Beta</p>
      </div>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
    const control = document.getElementById('control') as HTMLInputElement;
    const helpA = document.querySelector('#a [field-help]') as HTMLElement;
    const helpB = document.getElementById('help-b');
    const fieldA = document.getElementById('a');

    expect(control.getAttribute('aria-describedby')).toBe(helpA.id);
    expect(helpA.id).toMatch(/^juice-field-desc-/);
    expect(control.getAttribute('aria-invalid')).toBe('true');

    helpA.textContent = '   ';
    await flushRuntime();
    expect(control.hasAttribute('aria-describedby')).toBe(false);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(helpA.hasAttribute('id')).toBe(false);
    expect(control.value).toBe('kept');

    helpA.textContent = 'Alpha again';
    await flushRuntime();
    expect(control.getAttribute('aria-describedby')).toBe(helpA.id);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    const generatedId = helpA.id;

    fieldA?.removeAttribute('invalid');
    await flushRuntime();
    expect(control.hasAttribute('aria-invalid')).toBe(false);
    expect(control.getAttribute('aria-describedby')).toBe(generatedId);

    document.getElementById('b')?.prepend(control);
    await flushRuntime();
    expect(control.getAttribute('aria-describedby')).toBe('help-b');
    expect(helpA.hasAttribute('id')).toBe(false);
    expect(control.hasAttribute('aria-invalid')).toBe(false);

    fieldA?.insertBefore(control, helpA);
    await flushRuntime();
    expect(control.getAttribute('aria-describedby')).toBe(helpA.id);
    expect(helpB?.id).toBe('help-b');

    helpA.setAttribute('hidden', '');
    await flushRuntime();
    expectUndescribed(control);
    expect(helpA.hasAttribute('id')).toBe(false);

    helpA.removeAttribute('hidden');
    await flushRuntime();
    expect(control.getAttribute('aria-describedby')).toBe(helpA.id);

    helpA.removeAttribute('field-help');
    await flushRuntime();
    expectUndescribed(control);
    expect(helpA.hasAttribute('id')).toBe(false);

    helpA.setAttribute('field-help', '');
    await flushRuntime();
    const restoredId = helpA.id;
    expect(control.getAttribute('aria-describedby')).toBe(restoredId);

    fieldA?.removeAttribute('field');
    await flushRuntime();
    expectUndescribed(control);
    expect(helpA.hasAttribute('id')).toBe(false);
    expect(control.getAttribute('type')).toBe('text');

    fieldA?.setAttribute('field', '');
    await flushRuntime();
    expect(control.getAttribute('aria-describedby')).toBe(helpA.id);

    const described = helpA.id;
    controller.destroy();
    expectUndescribed(control);
    expect(helpA.hasAttribute('id')).toBe(false);
    expect(helpA.id).not.toBe(described);

    document.body.innerHTML = `
      <div field id="after">
        <input id="after-input" type="text">
        <p field-help>After</p>
      </div>
    `;
    await flushRuntime();
    expectUndescribed(document.getElementById('after-input'));
    expect(document.querySelector('#after [field-help]')?.hasAttribute('id')).toBe(
      false
    );
  });

  it('syncs a field rendered after init and stays inside its root', async () => {
    document.body.innerHTML = `
      <div id="scope"></div>
      <div field id="outside">
        <input id="outside-input" type="text">
        <p field-help>Outside</p>
      </div>
      <input id="plain" type="text">
      <div combobox id="combo">
        <input combobox-input id="combo-field" type="text">
        <ul combobox-list hidden>
          <li combobox-option>Apple</li>
        </ul>
      </div>
    `;
    stopFieldRuntime();

    const scope = document.getElementById('scope');
    const controller = createField({ root: scope ?? document.body });

    scope?.insertAdjacentHTML(
      'beforeend',
      `
        <div field id="inside">
          <button type="button" id="go">Go</button>
          <input id="inside-input" type="search" value="lime">
          <textarea id="inside-note"></textarea>
          <p field-help>Inside help</p>
        </div>
      `
    );
    await flushRuntime();

    const inside = document.getElementById('inside-input');
    const note = document.getElementById('inside-note');
    const help = document.querySelector('#inside [field-help]');
    const outside = document.getElementById('outside-input');
    const plain = document.getElementById('plain');
    const combo = document.getElementById('combo-field');
    const list = document.querySelector('[combobox-list]');
    const button = document.getElementById('go');

    expect(inside?.getAttribute('aria-describedby')).toBe(help?.id);
    expect(help?.id).toMatch(/^juice-field-desc-/);
    expect(inside?.getAttribute('type')).toBe('search');
    expect((inside as HTMLInputElement).value).toBe('lime');
    expectNativeControl(inside);
    expectUndescribed(note);
    expectUndescribed(outside);
    expect(document.querySelector('#outside [field-help]')?.hasAttribute('id')).toBe(
      false
    );
    expectUndescribed(plain);
    expectUndescribed(combo);
    expect(combo?.hasAttribute('role')).toBe(false);
    expect(combo?.hasAttribute('aria-expanded')).toBe(false);
    expect(list?.hasAttribute('role')).toBe(false);
    expect(list?.hasAttribute('hidden')).toBe(true);
    expect(button?.hasAttribute('aria-describedby')).toBe(false);
    expect(button?.hasAttribute('role')).toBe(false);

    controller.sync();
    expect(inside?.getAttribute('aria-describedby')).toBe(help?.id);

    const host = document.createElement('div');
    host.setAttribute('field', 'hosted');
    host.innerHTML = `
      <select id="hosted"><option>Salem</option></select>
      <p field-error>Hosted error</p>
    `;
    document.body.append(host);
    const hosted = createField({ root: host });
    const select = document.getElementById('hosted');
    const hostedError = host.querySelector('[field-error]');

    expect(select?.getAttribute('aria-describedby')).toBe(hostedError?.id);
    expect(hostedError?.id).toMatch(/^juice-field-desc-/);
    expect(select?.hasAttribute('role')).toBe(false);
    expect(host.getAttribute('field')).toBe('hosted');
    expectUndescribed(outside);

    hosted.destroy();
    expectUndescribed(select);
    expect(hostedError?.hasAttribute('id')).toBe(false);
    expect(inside?.getAttribute('aria-describedby')).toBe(help?.id);

    controller.destroy();
    expectUndescribed(inside);
  });

  it('wires only the first control and keeps nested fields apart', () => {
    document.body.innerHTML = `
      <div field id="outer" invalid>
        <input id="outer-input" type="text">
        <p field-help id="outer-help">Outer help</p>
        <div field id="inner">
          <p field-error id="inner-error">Inner error</p>
          <select id="inner-select">
            <option>Portland</option>
          </select>
        </div>
        <textarea id="second"></textarea>
        <div field>
          <p field-help id="nested-only">Nested only</p>
        </div>
      </div>
      <div field id="solo">
        <p field-help>No control</p>
        <button type="button" id="solo-button">Save</button>
      </div>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
    const outerInput = document.getElementById('outer-input');
    const innerSelect = document.getElementById('inner-select');
    const second = document.getElementById('second');
    const nestedOnly = document.getElementById('nested-only');
    const soloHelp = document.querySelector('#solo [field-help]');
    const soloButton = document.getElementById('solo-button');

    expect(outerInput?.getAttribute('aria-describedby')).toBe('outer-help');
    expect(outerInput?.getAttribute('aria-invalid')).toBe('true');
    expect(innerSelect?.getAttribute('aria-describedby')).toBe('inner-error');
    expect(innerSelect?.hasAttribute('aria-invalid')).toBe(false);
    expectUndescribed(second);
    expect(nestedOnly?.hasAttribute('id')).toBe(true);
    expect(nestedOnly?.id).toBe('nested-only');
    expect(outerInput?.getAttribute('aria-describedby')).not.toContain('nested-only');
    expect(outerInput?.getAttribute('aria-describedby')).not.toContain('inner-error');
    expect(soloHelp?.hasAttribute('id')).toBe(false);
    expect(soloButton?.hasAttribute('aria-describedby')).toBe(false);
    expectNativeControl(outerInput);
    expect(innerSelect?.hasAttribute('role')).toBe(false);

    const inner = document.getElementById('inner');
    inner?.setAttribute('invalid', '');
    controller.sync();
    expect(innerSelect?.getAttribute('aria-invalid')).toBe('true');
    expect(outerInput?.getAttribute('aria-invalid')).toBe('true');
    expect(second?.hasAttribute('aria-invalid')).toBe(false);

    document.getElementById('outer-input')?.remove();
    controller.sync();
    expect(second?.getAttribute('aria-describedby')).toBe('outer-help');
    expect(second?.getAttribute('aria-invalid')).toBe('true');
    expect(innerSelect?.getAttribute('aria-describedby')).toBe('inner-error');

    controller.destroy();
    expectUndescribed(second);
    expectUndescribed(innerSelect);
  });

  it('does not name the control from field-label', () => {
    document.body.innerHTML = `
      <div field>
        <span field-label id="keep">Email</span>
        <label field-label>City</label>
        <input id="email" type="email" value="ada@example.com">
        <p field-help>Use a work address.</p>
      </div>
      <div field>
        <label field-label for="note" id="note-label">Note</label>
        <textarea id="note">kept</textarea>
        <p field-error id="note-error">Too short.</p>
      </div>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
    const email = document.getElementById('email');
    const note = document.getElementById('note');
    const help = document.querySelector('[field-help]');
    const cityLabel = document.querySelector('label[field-label]');

    expect(email?.getAttribute('aria-describedby')).toBe(help?.id);
    expect(email?.hasAttribute('aria-label')).toBe(false);
    expect(email?.hasAttribute('aria-labelledby')).toBe(false);
    expect(document.getElementById('keep')?.id).toBe('keep');
    expect(cityLabel?.hasAttribute('id')).toBe(false);
    expect(note?.getAttribute('aria-describedby')).toBe('note-error');
    expect(note?.hasAttribute('aria-labelledby')).toBe(false);
    expect(note?.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById('note-label')?.id).toBe('note-label');
    expect((note as HTMLTextAreaElement).value).toBe('kept');
    expectNativeControl(email);

    controller.destroy();
  });

  it('leaves typing, change, and the keyboard on the platform control', () => {
    document.body.innerHTML = `
      <div field invalid>
        <label field-label for="email">Email</label>
        <input id="email" type="email" value="ada@example.com">
        <p field-help id="email-help">Work address.</p>
      </div>
    `;
    stopFieldRuntime();

    const controller = createField({ root: document.body });
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
    expect(input.getAttribute('aria-describedby')).toBe('email-help');
    expect(input.getAttribute('aria-invalid')).toBe('true');

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
    expectNativeControl(input);
    expect(document.body.hasAttribute('inert')).toBe(false);

    input.removeEventListener('input', onInput);
    input.removeEventListener('change', onChange);
    controller.destroy();
  });
});

describe('startFieldRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = `
      <div field invalid>
        <input id="auto" type="text" value="kept">
        <p field-help id="auto-help">Auto help</p>
      </div>
    `;
    stopFieldRuntime();

    const first = startFieldRuntime();
    const second = startFieldRuntime();
    const input = document.getElementById('auto');

    expect(first).toBe(second);
    expect(input?.getAttribute('aria-describedby')).toBe('auto-help');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expectNativeControl(input);
    expect((input as HTMLInputElement).value).toBe('kept');

    second?.sync();
    expect(input?.getAttribute('aria-describedby')).toBe('auto-help');
  });

  it('does not auto-start on DOMContentLoaded after stopFieldRuntime', async () => {
    stopFieldRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./field-runtime.js');
      document.body.innerHTML = `
        <div field>
          <input id="held" type="text">
          <p field-help id="held-help">Held</p>
        </div>
      `;
      mod.stopFieldRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.getElementById('held')?.hasAttribute('aria-describedby')).toBe(
        false
      );
      expect(document.getElementById('held')?.hasAttribute('aria-invalid')).toBe(
        false
      );

      mod.startFieldRuntime();
      expect(document.getElementById('held')?.getAttribute('aria-describedby')).toBe(
        'held-help'
      );
      mod.stopFieldRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
