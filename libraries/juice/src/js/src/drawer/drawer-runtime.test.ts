// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createDrawer,
  startDrawerRuntime,
  stopDrawerRuntime,
} from './drawer-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const drawerMarkup = `
  <div drawer-overlay id="demo-drawer" hidden>
    <div drawer role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <button type="button" drawer-close aria-label="Close">×</button>
      <div drawer-header><h2 id="demo-title">Filters</h2></div>
      <div drawer-body>
        <p>Refine results</p>
        <button type="button" id="demo-action">Apply</button>
      </div>
    </div>
  </div>
  <button type="button" id="demo-open" aria-controls="demo-drawer">Open</button>
`;

afterEach(() => {
  stopDrawerRuntime();
  resetDom();
});

describe('createDrawer', () => {
  it('opens and closes through aria-controls and hidden overlay state', () => {
    document.body.innerHTML = drawerMarkup;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const overlay = document.getElementById('demo-drawer');
    const opener = document.getElementById('demo-open');
    const dialog = document.querySelector<HTMLElement>('[drawer]');

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
      .querySelector<HTMLElement>('[drawer-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('fills missing dialog role, aria-modal, and labelledby from the heading', () => {
    document.body.innerHTML = `
      <div drawer-overlay id="filters-drawer" hidden>
        <div drawer>
          <button type="button" drawer-close></button>
          <div drawer-header><h2>Filters</h2></div>
          <div drawer-body>Narrow the catalog.</div>
        </div>
      </div>
      <button type="button" aria-controls="filters-drawer">Open filters</button>
    `;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const dialog = document.querySelector<HTMLElement>('[drawer]');
    const heading = document.querySelector('h2');
    const close = document.querySelector<HTMLElement>('[drawer-close]');

    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(heading?.id).toBe('filters-drawer-title');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('filters-drawer-title');
    expect(close?.getAttribute('aria-label')).toBe('Close');

    controller.destroy();
  });

  it('does not enhance orphan aria-controls that do not target an overlay', () => {
    document.body.innerHTML = `
      <button type="button" aria-controls="missing-panel">Orphan</button>
      <div id="missing-panel" hidden>Not a drawer.</div>
    `;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
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
    document.body.innerHTML = drawerMarkup;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const overlay = document.getElementById('demo-drawer');
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
    document.body.innerHTML = drawerMarkup;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const overlay = document.getElementById('demo-drawer');
    const opener = document.getElementById('demo-open');
    const close = document.querySelector<HTMLElement>('[drawer-close]');

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

  it('keeps only one drawer open at a time', () => {
    document.body.innerHTML = `
      <div drawer-overlay id="first-drawer" hidden>
        <div drawer>
          <button type="button" drawer-close aria-label="Close">×</button>
          <div drawer-header><h2>First</h2></div>
        </div>
      </div>
      <div drawer-overlay id="second-drawer" hidden>
        <div drawer="left">
          <button type="button" drawer-close aria-label="Close">×</button>
          <div drawer-header><h2>Second</h2></div>
        </div>
      </div>
      <button type="button" id="open-first" aria-controls="first-drawer">First</button>
      <button type="button" id="open-second" aria-controls="second-drawer">Second</button>
    `;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const first = document.getElementById('first-drawer');
    const second = document.getElementById('second-drawer');

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

  it('does not close an open modal when a drawer opens', () => {
    document.body.innerHTML = `
      <div modal-overlay id="demo-modal">
        <div modal>
          <button type="button" modal-close aria-label="Close">×</button>
          <div modal-header><h2>Account</h2></div>
        </div>
      </div>
      <div drawer-overlay id="demo-drawer" hidden>
        <div drawer>
          <button type="button" drawer-close aria-label="Close">×</button>
          <div drawer-header><h2>Filters</h2></div>
        </div>
      </div>
      <button type="button" aria-controls="demo-drawer">Open drawer</button>
    `;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const modal = document.getElementById('demo-modal');
    const drawer = document.getElementById('demo-drawer');

    document
      .querySelector<HTMLElement>('[aria-controls="demo-drawer"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(drawer?.hasAttribute('hidden')).toBe(false);
    expect(modal?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('closes on backdrop click and ignores static overlays', () => {
    document.body.innerHTML = `
      <div drawer-overlay id="plain-drawer" hidden>
        <div drawer><h2>Plain</h2><button type="button" drawer-close aria-label="Close">×</button></div>
      </div>
      <div drawer-overlay="static" id="static-drawer" hidden>
        <div drawer><h2>Static</h2><button type="button" drawer-close aria-label="Close">×</button></div>
      </div>
      <button type="button" aria-controls="plain-drawer">Open plain</button>
      <button type="button" aria-controls="static-drawer">Open static</button>
    `;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const plain = document.getElementById('plain-drawer');
    const locked = document.getElementById('static-drawer');

    document
      .querySelector<HTMLElement>('[aria-controls="plain-drawer"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    plain?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(plain?.hasAttribute('hidden')).toBe(true);

    document
      .querySelector<HTMLElement>('[aria-controls="static-drawer"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    locked?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(locked?.hasAttribute('hidden')).toBe(false);

    document
      .querySelector<HTMLElement>('#static-drawer [drawer]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(locked?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('traps Tab focus inside the open dialog', () => {
    document.body.innerHTML = drawerMarkup;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const close = document.querySelector<HTMLElement>('[drawer-close]');
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
      <div drawer-overlay id="plain-drawer" hidden>
        <div drawer>
          <div drawer-close></div>
          <div drawer-header><h2>Plain</h2></div>
        </div>
      </div>
      <div aria-controls="plain-drawer">Open me</div>
    `;
    stopDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const opener = document.querySelector<HTMLElement>('[aria-controls]');
    const overlay = document.getElementById('plain-drawer');

    expect(opener?.getAttribute('role')).toBe('button');
    expect(opener?.getAttribute('tabindex')).toBe('0');

    opener?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(overlay?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('syncs late-rendered drawer markup', async () => {
    stopDrawerRuntime();
    const controller = createDrawer({ root: document.body });

    document.body.innerHTML = `
      <div drawer-overlay id="late-drawer" hidden>
        <div drawer>
          <button type="button" drawer-close></button>
          <div drawer-header><h2>Late</h2></div>
        </div>
      </div>
      <button type="button" aria-controls="late-drawer">Open late</button>
    `;

    await flushRuntime();

    const overlay = document.getElementById('late-drawer');
    const dialog = document.querySelector<HTMLElement>('[drawer]');
    const opener = document.querySelector<HTMLElement>('[aria-controls]');

    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('late-drawer-title');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = drawerMarkup;
    startDrawerRuntime();

    const controller = createDrawer({ root: document.body });
    const overlay = document.getElementById('demo-drawer');
    const opener = document.getElementById('demo-open');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    controller.destroy();
  });
});

describe('startDrawerRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = drawerMarkup;
    stopDrawerRuntime();

    const first = startDrawerRuntime();
    const second = startDrawerRuntime();
    const overlay = document.getElementById('demo-drawer');
    const opener = document.getElementById('demo-open');

    expect(first).toBe(second);

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopDrawerRuntime', async () => {
    stopDrawerRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./drawer-runtime.js');
    document.body.innerHTML = drawerMarkup;
    mod.stopDrawerRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const opener = document.getElementById('demo-open');
    const overlay = document.getElementById('demo-drawer');
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(true);

    mod.startDrawerRuntime();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    mod.stopDrawerRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
