// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createModal,
  startModalRuntime,
  stopModalRuntime,
} from './modal-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const modalMarkup = `
  <div modal-overlay id="demo-modal" hidden>
    <div modal role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <button type="button" modal-close aria-label="Close">×</button>
      <div modal-header><h2 id="demo-title">Account</h2></div>
      <div modal-body>
        <p>Billing details</p>
        <button type="button" id="demo-action">Save</button>
      </div>
    </div>
  </div>
  <button type="button" id="demo-open" aria-controls="demo-modal">Open</button>
`;

afterEach(() => {
  stopModalRuntime();
  resetDom();
});

describe('createModal', () => {
  it('opens and closes through aria-controls and hidden overlay state', () => {
    document.body.innerHTML = modalMarkup;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const overlay = document.getElementById('demo-modal');
    const opener = document.getElementById('demo-open');
    const dialog = document.querySelector<HTMLElement>('[modal]');

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('demo-title');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');
    expect(opener?.getAttribute('aria-haspopup')).toBe('dialog');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    document
      .querySelector<HTMLElement>('[modal-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('fills missing dialog role, aria-modal, and labelledby from the heading', () => {
    document.body.innerHTML = `
      <div modal-overlay id="seats-modal" hidden>
        <div modal>
          <button type="button" modal-close></button>
          <div modal-header><h2>Add seats</h2></div>
          <div modal-body>Yes. New seats are prorated.</div>
        </div>
      </div>
      <button type="button" aria-controls="seats-modal">Open seats</button>
    `;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const dialog = document.querySelector<HTMLElement>('[modal]');
    const heading = document.querySelector('h2');
    const close = document.querySelector<HTMLElement>('[modal-close]');

    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(heading?.id).toBe('seats-modal-title');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('seats-modal-title');
    expect(close?.getAttribute('aria-label')).toBe('Close');

    controller.destroy();
  });

  it('does not enhance orphan aria-controls that do not target an overlay', () => {
    document.body.innerHTML = `
      <button type="button" aria-controls="missing-panel">Orphan</button>
      <div id="missing-panel" hidden>Not a modal.</div>
    `;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[aria-controls]');
    const panel = document.getElementById('missing-panel');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.getAttribute('aria-expanded')).toBeNull();
    expect(trigger?.getAttribute('aria-haspopup')).toBeNull();
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('role')).toBeNull();

    controller.destroy();
  });

  it('exposes open, close, and toggle on the controller', () => {
    document.body.innerHTML = modalMarkup;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const overlay = document.getElementById('demo-modal');
    const opener = document.getElementById('demo-open');

    controller.open(opener);
    expect(overlay?.hasAttribute('hidden')).toBe(false);

    controller.close(overlay);
    expect(overlay?.hasAttribute('hidden')).toBe(true);

    controller.toggle(opener);
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    controller.toggle(opener);
    expect(overlay?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('closes on Escape and restores focus to the opener', () => {
    document.body.innerHTML = modalMarkup;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const overlay = document.getElementById('demo-modal');
    const opener = document.getElementById('demo-open');
    const close = document.querySelector<HTMLElement>('[modal-close]');

    opener?.focus();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(overlay?.contains(document.activeElement)).toBe(true);

    close?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(opener);

    controller.destroy();
  });

  it('keeps only one dialog open at a time', () => {
    document.body.innerHTML = `
      <div modal-overlay id="first-modal" hidden>
        <div modal>
          <button type="button" modal-close aria-label="Close">×</button>
          <div modal-header><h2>First</h2></div>
        </div>
      </div>
      <div modal-overlay id="second-modal" hidden>
        <div modal>
          <button type="button" modal-close aria-label="Close">×</button>
          <div modal-header><h2>Second</h2></div>
        </div>
      </div>
      <button type="button" id="open-first" aria-controls="first-modal">First</button>
      <button type="button" id="open-second" aria-controls="second-modal">Second</button>
    `;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const first = document.getElementById('first-modal');
    const second = document.getElementById('second-modal');

    document
      .getElementById('open-first')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(first?.hasAttribute('hidden')).toBe(false);

    document
      .getElementById('open-second')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(first?.hasAttribute('hidden')).toBe(true);
    expect(second?.hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('open-first')?.getAttribute('aria-expanded')).toBe(
      'false'
    );
    expect(document.getElementById('open-second')?.getAttribute('aria-expanded')).toBe(
      'true'
    );

    controller.destroy();
  });

  it('closes on backdrop click and ignores static overlays', () => {
    document.body.innerHTML = `
      <div modal-overlay id="plain-modal" hidden>
        <div modal><h2>Plain</h2><button type="button" modal-close aria-label="Close">×</button></div>
      </div>
      <div modal-overlay="static" id="static-modal" hidden>
        <div modal><h2>Static</h2><button type="button" modal-close aria-label="Close">×</button></div>
      </div>
      <button type="button" aria-controls="plain-modal">Open plain</button>
      <button type="button" aria-controls="static-modal">Open static</button>
    `;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const plain = document.getElementById('plain-modal');
    const locked = document.getElementById('static-modal');

    document
      .querySelector<HTMLElement>('[aria-controls="plain-modal"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    plain?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(plain?.hasAttribute('hidden')).toBe(true);

    document
      .querySelector<HTMLElement>('[aria-controls="static-modal"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    locked?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(locked?.hasAttribute('hidden')).toBe(false);

    document
      .querySelector<HTMLElement>('#static-modal [modal]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(locked?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('traps Tab focus inside the open dialog', () => {
    document.body.innerHTML = modalMarkup;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const close = document.querySelector<HTMLElement>('[modal-close]');
    const action = document.getElementById('demo-action');

    document
      .getElementById('demo-open')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    action?.focus();
    action?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' })
    );
    expect(document.activeElement).toBe(close);

    close?.focus();
    close?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Tab', shiftKey: true })
    );
    expect(document.activeElement).toBe(action);

    controller.destroy();
  });

  it('supports keyboard activation for non-button openers', () => {
    document.body.innerHTML = `
      <div modal-overlay id="plain-modal" hidden>
        <div modal>
          <div modal-close></div>
          <div modal-header><h2>Plain</h2></div>
        </div>
      </div>
      <div aria-controls="plain-modal">Open me</div>
    `;
    stopModalRuntime();

    const controller = createModal({ root: document.body });
    const opener = document.querySelector<HTMLElement>('[aria-controls]');
    const overlay = document.getElementById('plain-modal');

    expect(opener?.getAttribute('role')).toBe('button');
    expect(opener?.getAttribute('tabindex')).toBe('0');

    opener?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(overlay?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('syncs late-rendered modal markup', async () => {
    stopModalRuntime();
    const controller = createModal({ root: document.body });

    document.body.innerHTML = `
      <div modal-overlay id="late-modal" hidden>
        <div modal>
          <button type="button" modal-close></button>
          <div modal-header><h2>Late</h2></div>
        </div>
      </div>
      <button type="button" aria-controls="late-modal">Open late</button>
    `;

    await flushRuntime();

    const overlay = document.getElementById('late-modal');
    const dialog = document.querySelector<HTMLElement>('[modal]');
    const opener = document.querySelector<HTMLElement>('[aria-controls]');

    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('late-modal-title');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = modalMarkup;
    startModalRuntime();

    const controller = createModal({ root: document.body });
    const overlay = document.getElementById('demo-modal');
    const opener = document.getElementById('demo-open');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    controller.destroy();
  });
});

describe('startModalRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = modalMarkup;
    stopModalRuntime();

    const first = startModalRuntime();
    const second = startModalRuntime();
    const overlay = document.getElementById('demo-modal');
    const opener = document.getElementById('demo-open');

    expect(first).toBe(second);

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopModalRuntime', async () => {
    stopModalRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./modal-runtime.js');
    document.body.innerHTML = modalMarkup;
    mod.stopModalRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const opener = document.getElementById('demo-open');
    const overlay = document.getElementById('demo-modal');
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(true);

    mod.startModalRuntime();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    mod.stopModalRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
