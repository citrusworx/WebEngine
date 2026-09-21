// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createToast,
  startToastRuntime,
  stopToastRuntime,
} from './toast-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const toastMarkup = `
  <div toast-region>
    <div toast id="demo-toast">
      <div toast-title>Saved</div>
      <div toast-body>Your changes were written.</div>
      <button type="button" toast-close aria-label="Dismiss">×</button>
    </div>
  </div>
`;

afterEach(() => {
  vi.useRealTimers();
  stopToastRuntime();
  resetDom();
});

describe('createToast', () => {
  it('fills missing live-region ARIA and status role without becoming a dialog', () => {
    document.body.innerHTML = toastMarkup;
    stopToastRuntime();

    const controller = createToast({ root: document.body });
    const region = document.querySelector<HTMLElement>('[toast-region]');
    const toast = document.getElementById('demo-toast');

    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.getAttribute('aria-relevant')).toBe('additions');
    expect(toast?.getAttribute('role')).toBe('status');
    expect(toast?.getAttribute('aria-modal')).toBeNull();
    expect(toast?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('uses role="alert" for error status and assertive live opts-in', () => {
    document.body.innerHTML = `
      <div toast-region>
        <div toast="error" id="error-toast">
          <div toast-title>Failed</div>
          <div toast-body>Could not save.</div>
          <button type="button" toast-close></button>
        </div>
      </div>
      <div toast-region toast-live="assertive">
        <div toast="info" id="assertive-toast">
          <div toast-body>Urgent notice.</div>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({ root: document.body });
    const errorToast = document.getElementById('error-toast');
    const assertiveRegion = document.querySelector<HTMLElement>(
      '[toast-live="assertive"]'
    );
    const assertiveToast = document.getElementById('assertive-toast');
    const close = document.querySelector<HTMLElement>('[toast-close]');

    expect(errorToast?.getAttribute('role')).toBe('alert');
    expect(assertiveRegion?.getAttribute('aria-live')).toBe('assertive');
    expect(assertiveToast?.getAttribute('role')).toBe('alert');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss');

    controller.destroy();
  });

  it('does not enhance toasts outside a region', () => {
    document.body.innerHTML = `
      <div toast id="orphan-toast">
        <button type="button" toast-close>×</button>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({ root: document.body });
    const toast = document.getElementById('orphan-toast');
    const close = document.querySelector<HTMLElement>('[toast-close]');

    expect(toast?.getAttribute('role')).toBeNull();
    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toast?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('dismisses on close click and exposes show / dismiss', () => {
    document.body.innerHTML = `
      <div toast-region>
        <div toast id="demo-toast" hidden>
          <div toast-body>Saved.</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({ root: document.body });
    const toast = document.getElementById('demo-toast');

    controller.show(toast);
    expect(toast?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).not.toBe(
      document.querySelector('[toast-close]')
    );

    document
      .querySelector<HTMLElement>('[toast-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.show(toast);
    expect(toast?.hasAttribute('hidden')).toBe(false);
    controller.dismiss(toast);
    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('keeps stacked toasts visible together', () => {
    document.body.innerHTML = `
      <div toast-region>
        <div toast id="first-toast" hidden>
          <div toast-body>First</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
        <div toast id="second-toast" hidden>
          <div toast-body>Second</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({ root: document.body });
    const first = document.getElementById('first-toast');
    const second = document.getElementById('second-toast');

    controller.show(first);
    controller.show(second);

    expect(first?.hasAttribute('hidden')).toBe(false);
    expect(second?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('auto-dismisses after the default duration and honors toast-duration', () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div toast-region>
        <div toast id="timed-toast" hidden>
          <div toast-body>Timed</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
        <div toast id="custom-toast" toast-duration="3000" hidden>
          <div toast-body>Custom</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
        <div toast id="sticky-toast" toast-duration="0" hidden>
          <div toast-body>Sticky</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({
      root: document.body,
      defaultDuration: 5000,
    });
    const timed = document.getElementById('timed-toast');
    const custom = document.getElementById('custom-toast');
    const sticky = document.getElementById('sticky-toast');

    controller.show(timed);
    controller.show(custom);
    controller.show(sticky);

    vi.advanceTimersByTime(2999);
    expect(timed?.hasAttribute('hidden')).toBe(false);
    expect(custom?.hasAttribute('hidden')).toBe(false);
    expect(sticky?.hasAttribute('hidden')).toBe(false);

    vi.advanceTimersByTime(1);
    expect(custom?.hasAttribute('hidden')).toBe(true);
    expect(timed?.hasAttribute('hidden')).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(timed?.hasAttribute('hidden')).toBe(true);
    expect(sticky?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('pauses auto-dismiss while the toast is hovered or focused', () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div toast-region>
        <div toast id="hover-toast" hidden>
          <div toast-body>Hover me</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({
      root: document.body,
      defaultDuration: 5000,
    });
    const toast = document.getElementById('hover-toast');
    const close = document.querySelector<HTMLElement>('[toast-close]');

    controller.show(toast);
    toast?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(8000);
    expect(toast?.hasAttribute('hidden')).toBe(false);

    toast?.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })
    );
    vi.advanceTimersByTime(4999);
    expect(toast?.hasAttribute('hidden')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.show(toast);
    close?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.advanceTimersByTime(8000);
    expect(toast?.hasAttribute('hidden')).toBe(false);

    close?.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body })
    );
    vi.advanceTimersByTime(5000);
    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('dismisses the most recent visible toast on Escape', () => {
    document.body.innerHTML = `
      <div toast-region>
        <div toast id="first-toast" hidden>
          <div toast-body>First</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
        <div toast id="second-toast" hidden>
          <div toast-body>Second</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({ root: document.body, defaultDuration: 0 });
    const first = document.getElementById('first-toast');
    const second = document.getElementById('second-toast');

    controller.show(first);
    controller.show(second);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(first?.hasAttribute('hidden')).toBe(false);
    expect(second?.hasAttribute('hidden')).toBe(true);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(first?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('does not steal Escape from an open dialog, popover, menu, combobox, or tooltip', () => {
    document.body.innerHTML = `
      <div modal-overlay id="open-modal">
        <div modal><h2>Account</h2></div>
      </div>
      <div toast-region>
        <div toast id="demo-toast">
          <div toast-body>Saved.</div>
          <button type="button" toast-close aria-label="Dismiss">×</button>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({ root: document.body, defaultDuration: 0 });
    const toast = document.getElementById('demo-toast');
    const pressEscape = () => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
      );
    };

    pressEscape();
    expect(toast?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-modal')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div drawer-overlay id="open-drawer"><div drawer><h2>Filters</h2></div></div>`
    );

    pressEscape();
    expect(toast?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-drawer')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div popover-root id="open-pop"><div popover-panel>Help</div></div>`
    );

    pressEscape();
    expect(toast?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-pop')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div menu-root><div menu id="open-menu"><button type="button" menuitem>New</button></div></div>`
    );

    pressEscape();
    expect(toast?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-menu')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div combobox><ul combobox-list id="open-list"><li combobox-option>Apple</li></ul></div>`
    );

    pressEscape();
    expect(toast?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-list')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div tooltip-root id="open-tip"><div tooltip-panel role="tooltip">Saved</div></div>`
    );

    pressEscape();
    expect(toast?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-tip')?.setAttribute('hidden', '');
    pressEscape();
    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('supports keyboard activation for non-button close controls', () => {
    document.body.innerHTML = `
      <div toast-region>
        <div toast id="plain-toast">
          <div toast-body>Saved.</div>
          <div toast-close></div>
        </div>
      </div>
    `;
    stopToastRuntime();

    const controller = createToast({ root: document.body, defaultDuration: 0 });
    const toast = document.getElementById('plain-toast');
    const close = document.querySelector<HTMLElement>('[toast-close]');

    expect(close?.getAttribute('role')).toBe('button');
    expect(close?.getAttribute('tabindex')).toBe('0');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss');

    close?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );
    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('syncs late-rendered toast markup', async () => {
    stopToastRuntime();
    const controller = createToast({ root: document.body, defaultDuration: 0 });

    document.body.innerHTML = `
      <div toast-region>
        <div toast id="late-toast">
          <div toast-body>Late</div>
          <button type="button" toast-close></button>
        </div>
      </div>
    `;

    await flushRuntime();

    const region = document.querySelector<HTMLElement>('[toast-region]');
    const toast = document.getElementById('late-toast');
    const close = document.querySelector<HTMLElement>('[toast-close]');

    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(toast?.getAttribute('role')).toBe('status');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss');

    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('dismisses once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = toastMarkup;
    startToastRuntime();

    const controller = createToast({ root: document.body, defaultDuration: 0 });
    const toast = document.getElementById('demo-toast');

    document
      .querySelector<HTMLElement>('[toast-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(toast?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });
});

describe('startToastRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = toastMarkup;
    stopToastRuntime();

    const first = startToastRuntime();
    const second = startToastRuntime();
    const toast = document.getElementById('demo-toast');

    expect(first).toBe(second);
    expect(toast?.getAttribute('role')).toBe('status');

    document
      .querySelector<HTMLElement>('[toast-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toast?.hasAttribute('hidden')).toBe(true);
  });

  it('does not auto-start on DOMContentLoaded after stopToastRuntime', async () => {
    stopToastRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./toast-runtime.js');
    document.body.innerHTML = toastMarkup;
    mod.stopToastRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const close = document.querySelector<HTMLElement>('[toast-close]');
    const toast = document.getElementById('demo-toast');
    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toast?.hasAttribute('hidden')).toBe(false);

    mod.startToastRuntime();
    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toast?.hasAttribute('hidden')).toBe(true);
    mod.stopToastRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
