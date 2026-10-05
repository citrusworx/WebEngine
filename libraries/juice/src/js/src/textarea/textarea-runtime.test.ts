// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createTextarea,
  initTextarea,
  startTextareaRuntime,
  stopTextareaRuntime,
} from './textarea-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const expectNativeTextarea = (textarea: HTMLElement | null) => {
  expect(textarea?.tagName).toBe('TEXTAREA');
  expect(textarea?.hasAttribute('role')).toBe(false);
  expect(textarea?.hasAttribute('aria-expanded')).toBe(false);
  expect(textarea?.hasAttribute('aria-controls')).toBe(false);
  expect(textarea?.hasAttribute('aria-invalid')).toBe(false);
  expect(textarea?.hasAttribute('aria-required')).toBe(false);
  expect(textarea?.hasAttribute('tabindex')).toBe(false);
};

const expectUnnamed = (element: HTMLElement | null) => {
  expect(element?.hasAttribute('aria-label')).toBe(false);
  expect(element?.hasAttribute('aria-labelledby')).toBe(false);
};

afterEach(() => {
  stopTextareaRuntime();
  resetDom();
});

describe('createTextarea', () => {
  it('is the same function as initTextarea', () => {
    expect(initTextarea).toBe(createTextarea);
  });

  it('names a textarea from an associated label and leaves the control native', () => {
    document.body.innerHTML = `
      <label for="note">Note</label>
      <textarea textarea id="note">ada@example.com</textarea>
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });
    const textarea = document.getElementById('note');
    const label = document.querySelector('label');

    expect(textarea?.getAttribute('aria-labelledby')).toBe(label?.id);
    expect(label?.id).toMatch(/^juice-textarea-label-/);
    expect(textarea?.hasAttribute('aria-label')).toBe(false);
    expect(textarea?.getAttribute('textarea')).toBe('');
    expect((textarea as HTMLTextAreaElement).value).toBe('ada@example.com');
    expectNativeTextarea(textarea);

    controller.destroy();
  });

  it('names a textarea with any attribute value and keeps the native value', () => {
    document.body.innerHTML = `
      <label for="plain" id="plain-label">Plain</label>
      <textarea textarea id="plain"></textarea>
      <label for="empty" id="empty-label">Empty</label>
      <textarea textarea="" id="empty"></textarea>
      <label for="note" id="note-label">Note</label>
      <textarea textarea="note" id="note" rows="6" cols="40">kept</textarea>
      <label for="bio" id="bio-label">Bio</label>
      <textarea TEXTAREA id="bio">line</textarea>
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });

    for (const id of ['plain', 'empty', 'note', 'bio']) {
      const textarea = document.getElementById(id);
      expect(textarea?.getAttribute('aria-labelledby'), id).toBe(`${id}-label`);
      expect(textarea?.hasAttribute('aria-label'), id).toBe(false);
      expectNativeTextarea(textarea);
    }

    const note = document.getElementById('note') as HTMLTextAreaElement;
    expect(note.value).toBe('kept');
    expect(note.getAttribute('textarea')).toBe('note');
    expect(note.getAttribute('rows')).toBe('6');
    expect(note.getAttribute('cols')).toBe('40');
    expect((document.getElementById('bio') as HTMLTextAreaElement).value).toBe(
      'line'
    );
    expect(document.getElementById('empty')?.hasAttribute('textarea')).toBe(true);

    controller.destroy();
  });

  it('ignores hosts that are not a textarea with [textarea]', () => {
    document.body.innerHTML = `
      <label for="bare" id="bare-label">Bare</label>
      <textarea id="bare">kept</textarea>
      <label for="fake" id="fake-label">Fake</label>
      <div textarea id="fake">Not a textarea</div>
      <label for="field" id="field-label">Field</label>
      <input textarea id="field" type="text" value="kept">
      <label for="email" id="email-label">Email</label>
      <input input id="email" type="email" value="ada@example.com">
      <label for="city" id="city-label">City</label>
      <select select id="city"><option>Portland</option></select>
      <label for="agree" id="agree-label">Agree</label>
      <input checkbox id="agree" type="checkbox">
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });

    for (const id of ['bare', 'fake', 'field', 'email', 'city', 'agree']) {
      const host = document.getElementById(id);
      expectUnnamed(host);
      expect(host?.hasAttribute('role')).toBe(false);
    }

    expect((document.getElementById('bare') as HTMLTextAreaElement).value).toBe(
      'kept'
    );
    expect(document.getElementById('bare')?.hasAttribute('textarea')).toBe(false);
    expect(document.getElementById('fake')?.getAttribute('textarea')).toBe('');
    expect((document.getElementById('field') as HTMLInputElement).value).toBe('kept');
    expect(document.getElementById('email')?.getAttribute('input')).toBe('');
    expect(document.getElementById('city')?.hasAttribute('aria-expanded')).toBe(false);
    expect(document.getElementById('agree')?.hasAttribute('role')).toBe(false);
    expect(document.getElementById('bare-label')?.id).toBe('bare-label');

    controller.destroy();
  });

  it('keeps an author name and does not invent one when no label is visible', () => {
    document.body.innerHTML = `
      <label for="named">Note</label>
      <textarea textarea id="named" aria-label="Mail" aria-labelledby="elsewhere" title="Tooltip">ada@example.com</textarea>
      <span id="elsewhere">Elsewhere</span>
      <textarea textarea id="bare" title="Choose"></textarea>
      <textarea textarea id="empty">ada@example.com</textarea>
      <label for="covered" hidden id="covered-label">Note</label>
      <textarea textarea id="covered"></textarea>
      <label for="blank" id="blank-label">   </label>
      <textarea textarea id="blank"></textarea>
      <span textarea-label hidden id="hidden-attr">Hidden</span>
      <textarea textarea id="attr-hidden"></textarea>
      <label for="quiet" id="quiet-label" aria-hidden="true">Quiet</label>
      <textarea textarea id="quiet"></textarea>
      <label>
        <textarea textarea id="only">only-value</textarea>
      </label>
      <div aria-hidden="true">
        <label for="buried" id="buried-label">Buried</label>
      </div>
      <textarea textarea id="buried"></textarea>
      <label for="spaces" id="spaces-label">Spaces</label>
      <textarea textarea id="spaces" aria-label="   " title="Hint"></textarea>
    `;
    stopTextareaRuntime();

    const controller = initTextarea({ root: document.body });
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
      const textarea = document.getElementById(id);
      expectUnnamed(textarea);
      expectNativeTextarea(textarea);
    }

    expect(bare?.getAttribute('title')).toBe('Choose');
    expect((document.getElementById('empty') as HTMLTextAreaElement).value).toBe(
      'ada@example.com'
    );
    expect((document.getElementById('only') as HTMLTextAreaElement).value).toBe(
      'only-value'
    );
    expect(document.getElementById('covered-label')?.textContent).toBe('Note');
    expect(document.getElementById('covered-label')?.hasAttribute('hidden')).toBe(
      true
    );
    expect(spaces?.getAttribute('aria-labelledby')).toBe('spaces-label');
    expect(spaces?.getAttribute('aria-label')).toBe('   ');
    expect(spaces?.getAttribute('title')).toBe('Hint');
    expectNativeTextarea(spaces);

    controller.destroy();
  });

  it('names a wrapping label from its visible text and skips the textarea value', () => {
    document.body.innerHTML = `
      <label>
        Note
        <textarea textarea id="wrapped">ada@example.com</textarea>
      </label>
      <div textarea-label>
        Password
        <span hidden>secret</span>
        <textarea textarea id="wrapped-attr">s3cret</textarea>
      </div>
      <label>
        Count
        <textarea textarea id="count">12</textarea>
      </label>
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });
    const wrapped = document.getElementById('wrapped');
    const wrappedAttr = document.getElementById('wrapped-attr');
    const count = document.getElementById('count');

    expect(wrapped?.getAttribute('aria-label')).toBe('Note');
    expect(wrapped?.getAttribute('aria-label')).not.toMatch(/ada@example\.com/);
    expect(wrapped?.hasAttribute('aria-labelledby')).toBe(false);
    expect(wrappedAttr?.getAttribute('aria-label')).toBe('Password');
    expect(wrappedAttr?.getAttribute('aria-label')).not.toMatch(/s3cret/);
    expect(wrappedAttr?.getAttribute('aria-label')).not.toMatch(/secret/);
    expect(wrappedAttr?.hasAttribute('aria-labelledby')).toBe(false);
    expect(count?.getAttribute('aria-label')).toBe('Count');
    expect(count?.getAttribute('aria-label')).not.toMatch(/12/);
    expect((wrapped as HTMLTextAreaElement).value).toBe('ada@example.com');
    expect((wrappedAttr as HTMLTextAreaElement).value).toBe('s3cret');
    expect((count as HTMLTextAreaElement).value).toBe('12');
    expectNativeTextarea(wrapped);
    expectNativeTextarea(wrappedAttr);
    expectNativeTextarea(count);

    controller.destroy();
  });

  it('names a preceding textarea-label and prefers an associated label over it', () => {
    document.body.innerHTML = `
      <span textarea-label>Flavor</span>
      <textarea textarea id="flavor">Lime</textarea>
      <label for="city" id="city-label">City</label>
      <span textarea-label id="city-attr">Other</span>
      <textarea textarea id="city"></textarea>
      <div>
        <span textarea-label id="region-label">Region</span>
      </div>
      <textarea textarea id="region"></textarea>
      <span textarea-label for="code" hidden id="code-hidden">Nope</span>
      <span textarea-label id="code-visible">Code</span>
      <textarea textarea id="code"></textarea>
      <label for="note" hidden id="note-hidden">Hidden</label>
      <span textarea-label for="note" id="note-attr">Note</span>
      <textarea textarea id="note"></textarea>
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });
    const flavor = document.getElementById('flavor');
    const flavorLabel = document.querySelector('[textarea-label]');
    const city = document.getElementById('city');
    const region = document.getElementById('region');
    const code = document.getElementById('code');
    const note = document.getElementById('note');

    expect(flavor?.getAttribute('aria-labelledby')).toBe(flavorLabel?.id);
    expect(flavorLabel?.id).toMatch(/^juice-textarea-label-/);
    expect(flavor?.hasAttribute('aria-label')).toBe(false);
    expect(flavor?.getAttribute('aria-labelledby')).not.toBe('');
    expect((flavor as HTMLTextAreaElement).value).toBe('Lime');
    expect(city?.getAttribute('aria-labelledby')).toBe('city-label');
    expect(document.getElementById('city-attr')?.id).toBe('city-attr');
    expect(region?.getAttribute('aria-labelledby')).toBe('region-label');
    expect(code?.getAttribute('aria-labelledby')).toBe('code-visible');
    expect(document.getElementById('code-hidden')?.id).toBe('code-hidden');
    expect(note?.getAttribute('aria-labelledby')).toBe('note-attr');
    expectNativeTextarea(flavor);

    controller.destroy();
  });

  it('leaves typing, change, and the keyboard on the platform control', () => {
    document.body.innerHTML = `
      <label for="note" id="note-label">Note</label>
      <textarea textarea id="note">ada@example.com</textarea>
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });
    const textarea = document.getElementById('note') as HTMLTextAreaElement;
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
    textarea.addEventListener('input', onInput);
    textarea.addEventListener('change', onChange);

    textarea.value = 'ada@citrus.dev';
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    textarea.dispatchEvent(inputEvent);
    const change = new Event('change', { bubbles: true, cancelable: true });
    textarea.dispatchEvent(change);

    expect(inputs).toBe(1);
    expect(changes).toBe(1);
    expect(inputEvent.defaultPrevented).toBe(false);
    expect(change.defaultPrevented).toBe(false);
    expect(textarea.value).toBe('ada@citrus.dev');
    expect(textarea.getAttribute('aria-labelledby')).toBe('note-label');

    for (const key of ['Escape', 'ArrowDown', 'ArrowUp', ' ', 'Enter', 'Tab']) {
      const keydown = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key,
      });
      textarea.dispatchEvent(keydown);
      expect(keydown.defaultPrevented).toBe(false);
    }

    expect(textarea.value).toBe('ada@citrus.dev');
    expectNativeTextarea(textarea);
    expect(document.body.hasAttribute('inert')).toBe(false);

    textarea.removeEventListener('input', onInput);
    textarea.removeEventListener('change', onChange);
    controller.destroy();
  });

  it('follows label edits and drops a name when the host is no longer a textarea', async () => {
    document.body.innerHTML = `
      <label for="note" id="note-label" hidden>Note</label>
      <textarea textarea id="note"></textarea>
      <label id="wrap">
        Password
        <textarea textarea id="pw">s3cret</textarea>
      </label>
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });
    const note = document.getElementById('note') as HTMLTextAreaElement;
    const noteLabel = document.getElementById('note-label');
    const pw = document.getElementById('pw');
    const wrap = document.getElementById('wrap');

    expect(note.hasAttribute('aria-labelledby')).toBe(false);

    noteLabel?.removeAttribute('hidden');
    await flushRuntime();
    expect(note.getAttribute('aria-labelledby')).toBe('note-label');

    noteLabel!.firstChild!.textContent = 'Mail';
    await flushRuntime();
    expect(note.getAttribute('aria-labelledby')).toBe('note-label');
    expect(note.hasAttribute('aria-label')).toBe(false);

    note.setAttribute('aria-label', 'Custom');
    await flushRuntime();
    expect(note.getAttribute('aria-label')).toBe('Custom');
    expect(note.hasAttribute('aria-labelledby')).toBe(false);

    wrap!.childNodes[0]!.textContent = 'Secret';
    await flushRuntime();
    expect(pw?.getAttribute('aria-label')).toBe('Secret');
    expect(pw?.getAttribute('aria-label')).not.toMatch(/s3cret/);

    noteLabel?.setAttribute('hidden', '');
    note.removeAttribute('aria-label');
    await flushRuntime();
    expectUnnamed(note);

    noteLabel?.removeAttribute('hidden');
    await flushRuntime();
    expect(note.getAttribute('aria-labelledby')).toBe('note-label');

    const combo = document.createElement('div');
    combo.setAttribute('combobox', '');
    note.parentElement?.insertBefore(combo, note);
    combo.append(note);
    await flushRuntime();
    expect(note.getAttribute('textarea')).toBe('');
    expectUnnamed(note);
    expect(note.hasAttribute('role')).toBe(false);

    combo.parentElement?.insertBefore(note, combo);
    combo.remove();
    await flushRuntime();
    expect(note.getAttribute('aria-labelledby')).toBe('note-label');

    note.removeAttribute('textarea');
    await flushRuntime();
    expectUnnamed(note);

    controller.destroy();
    document.body.innerHTML = `
      <label for="after" id="after-label">After</label>
      <textarea textarea id="after"></textarea>
    `;
    await flushRuntime();
    expect(document.getElementById('after')?.hasAttribute('aria-labelledby')).toBe(
      false
    );
  });

  it('syncs a textarea rendered after init and stays inside its root', async () => {
    document.body.innerHTML = `
      <div id="scope"></div>
      <label for="outside" id="outside-label">Outside</label>
      <textarea textarea id="outside"></textarea>
      <div combobox id="combo">
        <label for="combo-field" id="combo-label">Combo</label>
        <textarea textarea combobox-input id="combo-field"></textarea>
        <ul combobox-list hidden>
          <li combobox-option>Apple</li>
        </ul>
      </div>
      <textarea id="plain"></textarea>
      <div textarea id="fake">Not a textarea</div>
      <input input id="plain-input" type="text">
      <select select id="plain-select"><option>Untagged</option></select>
    `;
    stopTextareaRuntime();

    const scope = document.getElementById('scope');
    const controller = createTextarea({ root: scope ?? document.body });

    scope?.insertAdjacentHTML(
      'beforeend',
      `
        <label for="inside" id="inside-label">Inside</label>
        <textarea textarea="note" id="inside"></textarea>
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
    const plainInput = document.getElementById('plain-input');
    const plainSelect = document.getElementById('plain-select');

    expect(inside?.getAttribute('aria-labelledby')).toBe('inside-label');
    expect(inside?.getAttribute('textarea')).toBe('note');
    expectNativeTextarea(inside);
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
    expectUnnamed(plainInput);
    expect(plainInput?.hasAttribute('role')).toBe(false);
    expectUnnamed(plainSelect);
    expect(plainSelect?.hasAttribute('role')).toBe(false);

    controller.sync();
    expect(inside?.getAttribute('aria-labelledby')).toBe('inside-label');

    controller.destroy();
  });

  it('does not name a textarea inside a combobox or reuse another field label', () => {
    document.body.innerHTML = `
      <div combobox>
        <label for="oops" id="oops-label">Nope</label>
        <textarea textarea id="oops">Apple</textarea>
      </div>
      <span textarea-label id="note-label">Note</span>
      <textarea textarea id="note"></textarea>
      <textarea textarea id="next"></textarea>
    `;
    stopTextareaRuntime();

    const controller = createTextarea({ root: document.body });
    const oops = document.getElementById('oops');
    const next = document.getElementById('next');

    expectUnnamed(oops);
    expectNativeTextarea(oops);
    expect((oops as HTMLTextAreaElement).value).toBe('Apple');
    expect(document.getElementById('note')?.getAttribute('aria-labelledby')).toBe(
      'note-label'
    );
    expectUnnamed(next);

    controller.destroy();
  });
});

describe('startTextareaRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = `
      <label for="auto" id="auto-label">Auto</label>
      <textarea textarea id="auto"></textarea>
    `;
    stopTextareaRuntime();

    const first = startTextareaRuntime();
    const second = startTextareaRuntime();
    const textarea = document.getElementById('auto');

    expect(first).toBe(second);
    expect(textarea?.getAttribute('aria-labelledby')).toBe('auto-label');
    expectNativeTextarea(textarea);

    second?.sync();
    expect(textarea?.getAttribute('aria-labelledby')).toBe('auto-label');
  });

  it('does not auto-start on DOMContentLoaded after stopTextareaRuntime', async () => {
    stopTextareaRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./textarea-runtime.js');
      document.body.innerHTML = `
        <label for="held" id="held-label">Held</label>
        <textarea textarea id="held"></textarea>
      `;
      mod.stopTextareaRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.getElementById('held')?.hasAttribute('aria-labelledby')).toBe(
        false
      );
      expect(document.getElementById('held')?.hasAttribute('aria-label')).toBe(false);

      mod.startTextareaRuntime();
      expect(document.getElementById('held')?.getAttribute('aria-labelledby')).toBe(
        'held-label'
      );
      mod.stopTextareaRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
