// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSpinner,
  initSpinner,
  startSpinnerRuntime,
  stopSpinnerRuntime,
} from './spinner-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

afterEach(() => {
  stopSpinnerRuntime();
  resetDom();
});

describe('createSpinner', () => {
  it('marks a shown spinner as a busy status and does not invent a name', () => {
    document.body.innerHTML = `
      <div spinner id="load">
        <span spinner-label id="load-label">Saving</span>
      </div>
    `;
    stopSpinnerRuntime();

    const controller = createSpinner({ root: document.body });
    const host = document.getElementById('load');
    const label = document.getElementById('load-label');

    expect(host?.getAttribute('role')).toBe('status');
    expect(host?.getAttribute('aria-busy')).toBe('true');
    expect(host?.hasAttribute('hidden')).toBe(false);
    expect(host?.hasAttribute('tabindex')).toBe(false);
    expect(host?.hasAttribute('aria-label')).toBe(false);
    expect(host?.hasAttribute('aria-labelledby')).toBe(false);
    expect(host?.hasAttribute('aria-live')).toBe(false);
    expect(host?.hasAttribute('aria-valuenow')).toBe(false);
    expect(host?.hasAttribute('aria-valuemin')).toBe(false);
    expect(host?.hasAttribute('aria-valuemax')).toBe(false);
    expect(host?.hasAttribute('aria-valuetext')).toBe(false);
    expect(host?.style.getPropertyValue('--juice-progress-ratio').trim()).toBe('');
    expect(host?.getAttribute('spinner')).toBe('');
    expect(controller.isShown(host)).toBe(true);
    expect(label?.textContent).toBe('Saving');
    expect(label?.hasAttribute('aria-hidden')).toBe(false);
    expect(label?.getAttribute('role')).toBeNull();

    controller.destroy();
  });

  it('keeps an author name and does not copy a visible label into it', () => {
    document.body.innerHTML = `
      <div spinner id="named" aria-label="Working" aria-labelledby="elsewhere">
        <span spinner-label id="named-label">Working</span>
      </div>
      <span id="elsewhere">Elsewhere</span>
    `;
    stopSpinnerRuntime();

    const controller = initSpinner({ root: document.body });
    const host = document.getElementById('named');

    expect(host?.getAttribute('role')).toBe('status');
    expect(host?.getAttribute('aria-busy')).toBe('true');
    expect(host?.getAttribute('aria-label')).toBe('Working');
    expect(host?.getAttribute('aria-labelledby')).toBe('elsewhere');
    expect(document.getElementById('named-label')?.textContent).toBe('Working');

    controller.destroy();
  });

  it('does not invent a name when the label is missing or not visible', () => {
    document.body.innerHTML = `
      <div spinner id="bare"></div>
      <div spinner id="empty"><span spinner-label id="empty-label">   </span></div>
      <div spinner id="covered">
        <span spinner-label hidden id="covered-label">Please wait</span>
      </div>
    `;
    stopSpinnerRuntime();

    const controller = createSpinner({ root: document.body });

    for (const id of ['bare', 'empty', 'covered']) {
      const host = document.getElementById(id);
      expect(host?.getAttribute('role')).toBe('status');
      expect(host?.getAttribute('aria-busy')).toBe('true');
      expect(host?.hasAttribute('aria-label')).toBe(false);
      expect(host?.hasAttribute('aria-labelledby')).toBe(false);
      expect(host?.textContent).not.toMatch(/loading/i);
    }

    expect(document.getElementById('covered-label')?.textContent).toBe(
      'Please wait'
    );
    expect(document.getElementById('covered-label')?.hasAttribute('hidden')).toBe(
      true
    );

    controller.destroy();
  });

  it('hides without announcing busy and shows again without hiding siblings', () => {
    document.body.innerHTML = `
      <div spinner id="one" aria-label="One">
        <span spinner-label>One</span>
      </div>
      <div spinner id="two" aria-label="Two"></div>
    `;
    stopSpinnerRuntime();

    const controller = createSpinner({ root: document.body });
    const one = document.getElementById('one');
    const two = document.getElementById('two');

    controller.hide(one);
    expect(one?.hasAttribute('hidden')).toBe(true);
    expect(one?.hasAttribute('role')).toBe(false);
    expect(one?.hasAttribute('aria-busy')).toBe(false);
    expect(one?.getAttribute('aria-label')).toBe('One');
    expect(one?.querySelector('[spinner-label]')?.textContent).toBe('One');
    expect(controller.isShown(one)).toBe(false);
    expect(two?.getAttribute('role')).toBe('status');
    expect(two?.getAttribute('aria-busy')).toBe('true');
    expect(two?.hasAttribute('hidden')).toBe(false);
    expect(controller.isShown(two)).toBe(true);

    controller.show(one);
    expect(one?.hasAttribute('hidden')).toBe(false);
    expect(one?.getAttribute('role')).toBe('status');
    expect(one?.getAttribute('aria-busy')).toBe('true');
    expect(one?.getAttribute('aria-label')).toBe('One');
    expect(controller.isShown(one)).toBe(true);
    expect(two?.hasAttribute('hidden')).toBe(false);

    controller.hide();
    expect(one?.hasAttribute('hidden')).toBe(true);
    expect(one?.hasAttribute('aria-busy')).toBe(false);
    expect(two?.getAttribute('aria-busy')).toBe('true');

    controller.show(document.getElementById('one')?.querySelector('span'));
    expect(one?.getAttribute('role')).toBe('status');
    expect(one?.getAttribute('aria-busy')).toBe('true');

    controller.destroy();
  });

  it('clears busy state on markup that starts hidden and leaves other values alone', () => {
    document.body.innerHTML = `
      <div spinner hidden id="held" role="status" aria-busy="true" aria-label="Held"></div>
      <div spinner="busy" id="other" role="alert" aria-label="Other"></div>
      <div id="plain" role="status" aria-busy="true">Plain</div>
    `;
    stopSpinnerRuntime();

    const controller = createSpinner({ root: document.body });
    const held = document.getElementById('held');
    const other = document.getElementById('other');
    const plain = document.getElementById('plain');

    expect(held?.hasAttribute('hidden')).toBe(true);
    expect(held?.hasAttribute('role')).toBe(false);
    expect(held?.hasAttribute('aria-busy')).toBe(false);
    expect(held?.getAttribute('aria-label')).toBe('Held');
    expect(controller.isShown(held)).toBe(false);

    expect(other?.getAttribute('spinner')).toBe('busy');
    expect(other?.getAttribute('role')).toBe('status');
    expect(other?.getAttribute('aria-busy')).toBe('true');
    expect(other?.getAttribute('aria-label')).toBe('Other');

    expect(plain?.getAttribute('role')).toBe('status');
    expect(plain?.getAttribute('aria-busy')).toBe('true');
    expect(plain?.hasAttribute('spinner')).toBe(false);

    controller.show(held);
    expect(held?.getAttribute('role')).toBe('status');
    expect(held?.getAttribute('aria-busy')).toBe('true');
    expect(held?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('follows attribute edits and ignores markup after destroy', async () => {
    document.body.innerHTML = `
      <div spinner id="live" aria-label="Live"></div>
    `;
    stopSpinnerRuntime();

    const controller = createSpinner({ root: document.body });
    const host = document.getElementById('live');

    host?.setAttribute('hidden', '');
    await flushRuntime();
    expect(host?.hasAttribute('role')).toBe(false);
    expect(host?.hasAttribute('aria-busy')).toBe(false);
    expect(controller.isShown(host)).toBe(false);

    host?.removeAttribute('hidden');
    await flushRuntime();
    expect(host?.getAttribute('role')).toBe('status');
    expect(host?.getAttribute('aria-busy')).toBe('true');

    host?.setAttribute('role', 'alert');
    host?.setAttribute('aria-busy', 'false');
    await flushRuntime();
    expect(host?.getAttribute('role')).toBe('status');
    expect(host?.getAttribute('aria-busy')).toBe('true');
    expect(host?.getAttribute('aria-label')).toBe('Live');

    controller.destroy();
    document.body.innerHTML = `
      <div spinner id="after" aria-label="After"></div>
    `;
    await flushRuntime();

    const after = document.getElementById('after');
    expect(after?.hasAttribute('role')).toBe(false);
    expect(after?.hasAttribute('aria-busy')).toBe(false);
  });

  it('syncs a spinner rendered after init', async () => {
    stopSpinnerRuntime();
    const controller = createSpinner({ root: document.body });

    document.body.innerHTML = `
      <div spinner id="late" hidden aria-busy="true" role="status"></div>
    `;
    await flushRuntime();

    const late = document.getElementById('late');
    expect(late?.hasAttribute('hidden')).toBe(true);
    expect(late?.hasAttribute('role')).toBe(false);
    expect(late?.hasAttribute('aria-busy')).toBe(false);

    late?.removeAttribute('hidden');
    await flushRuntime();
    expect(late?.getAttribute('role')).toBe('status');
    expect(late?.getAttribute('aria-busy')).toBe('true');

    controller.destroy();
  });

  it('stays inside its root and does not move state from the keyboard', () => {
    document.body.innerHTML = `
      <div id="scope">
        <div spinner id="inside" aria-label="Inside"></div>
      </div>
      <div spinner id="outside" aria-label="Outside"></div>
      <div progress id="bar" aria-valuenow="40" aria-label="Upload">
        <span progress-fill></span>
      </div>
      <section disclosure id="notes">
        <button type="button" disclosure-trigger aria-expanded="false">Notes</button>
        <div disclosure-panel hidden>Body</div>
      </section>
    `;
    stopSpinnerRuntime();

    const scope = document.getElementById('scope');
    const controller = createSpinner({ root: scope ?? document.body });
    const inside = document.getElementById('inside');
    const outside = document.getElementById('outside');
    const bar = document.getElementById('bar');
    const trigger = document.querySelector('[disclosure-trigger]');
    const panel = document.querySelector('[disclosure-panel]');

    expect(inside?.getAttribute('role')).toBe('status');
    expect(inside?.getAttribute('aria-busy')).toBe('true');
    expect(outside?.hasAttribute('role')).toBe(false);
    expect(outside?.hasAttribute('aria-busy')).toBe(false);

    inside?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    inside?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    );
    inside?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );
    expect(inside?.hasAttribute('hidden')).toBe(false);
    expect(inside?.getAttribute('aria-busy')).toBe('true');
    expect(controller.isShown(inside)).toBe(true);

    controller.hide(inside);
    expect(outside?.hasAttribute('hidden')).toBe(false);
    expect(outside?.hasAttribute('aria-busy')).toBe(false);

    expect(bar?.hasAttribute('role')).toBe(false);
    expect(bar?.getAttribute('aria-valuenow')).toBe('40');
    expect(bar?.hasAttribute('aria-busy')).toBe(false);
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });
});

describe('startSpinnerRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = `
      <div spinner id="auto" aria-label="Auto"></div>
    `;
    stopSpinnerRuntime();

    const first = startSpinnerRuntime();
    const second = startSpinnerRuntime();
    const host = document.getElementById('auto');

    expect(first).toBe(second);
    expect(host?.getAttribute('role')).toBe('status');
    expect(host?.getAttribute('aria-busy')).toBe('true');

    second?.hide(host);
    expect(host?.hasAttribute('hidden')).toBe(true);
    expect(host?.hasAttribute('aria-busy')).toBe(false);
    expect(first?.isShown(host)).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopSpinnerRuntime', async () => {
    stopSpinnerRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./spinner-runtime.js');
      document.body.innerHTML = `
        <div spinner id="held" aria-label="Held"></div>
      `;
      mod.stopSpinnerRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.getElementById('held')?.hasAttribute('role')).toBe(false);
      expect(document.getElementById('held')?.hasAttribute('aria-busy')).toBe(
        false
      );

      mod.startSpinnerRuntime();
      expect(document.getElementById('held')?.getAttribute('role')).toBe('status');
      expect(document.getElementById('held')?.getAttribute('aria-busy')).toBe(
        'true'
      );
      mod.stopSpinnerRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
