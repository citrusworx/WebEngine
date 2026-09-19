// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createPopover,
  startPopoverRuntime,
  stopPopoverRuntime,
} from './popover-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const popoverMarkup = `
  <button type="button" id="demo-open" aria-controls="demo-pop">Open</button>
  <div popover-root id="demo-pop" hidden>
    <div popover-panel role="dialog">
      <button type="button" popover-close aria-label="Close">×</button>
      <div popover-header><h2 id="demo-title">Help</h2></div>
      <div popover-body>
        <p>Account details</p>
        <button type="button" id="demo-action">Got it</button>
      </div>
    </div>
  </div>
`;

type RectInit = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const rect = ({ top, left, width, height }: RectInit): DOMRect =>
  ({
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
    toJSON: () => ({}),
  }) as DOMRect;

const mockRect = (element: HTMLElement | null, value: RectInit) => {
  if (!element) return;
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect(value));
};

afterEach(() => {
  stopPopoverRuntime();
  resetDom();
  vi.restoreAllMocks();
});

describe('createPopover', () => {
  it('opens and closes through aria-controls and hidden root state', () => {
    document.body.innerHTML = popoverMarkup;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');
    const panel = document.querySelector<HTMLElement>('[popover-panel]');

    expect(root?.hasAttribute('hidden')).toBe(true);
    expect(root?.hasAttribute('popover')).toBe(false);
    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-modal')).toBeNull();
    expect(panel?.getAttribute('aria-labelledby')).toBe('demo-title');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');
    expect(opener?.getAttribute('aria-haspopup')).toBe('dialog');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    document
      .querySelector<HTMLElement>('[popover-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(root?.hasAttribute('hidden')).toBe(true);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('fills missing dialog role and labelledby from the heading without aria-modal', () => {
    document.body.innerHTML = `
      <button type="button" aria-controls="seats-pop">Open seats</button>
      <div popover-root id="seats-pop" hidden>
        <div popover-panel>
          <button type="button" popover-close></button>
          <div popover-header><h2>Add seats</h2></div>
          <div popover-body>Yes. New seats are prorated.</div>
        </div>
      </div>
    `;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const panel = document.querySelector<HTMLElement>('[popover-panel]');
    const heading = document.querySelector('h2');
    const close = document.querySelector<HTMLElement>('[popover-close]');

    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-modal')).toBeNull();
    expect(heading?.id).toBe('seats-pop-title');
    expect(panel?.getAttribute('aria-labelledby')).toBe('seats-pop-title');
    expect(close?.getAttribute('aria-label')).toBe('Close');
    expect(document.getElementById('seats-pop')?.hasAttribute('popover')).toBe(
      false
    );

    controller.destroy();
  });

  it('does not enhance orphan aria-controls that do not target a popover-root', () => {
    document.body.innerHTML = `
      <button type="button" aria-controls="missing-panel">Orphan</button>
      <div id="missing-panel" hidden>Not a popover.</div>
    `;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
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
    document.body.innerHTML = popoverMarkup;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');

    controller.open(opener);
    expect(root?.hasAttribute('hidden')).toBe(false);

    controller.close(root);
    expect(root?.hasAttribute('hidden')).toBe(true);

    controller.toggle(opener);
    expect(root?.hasAttribute('hidden')).toBe(false);
    controller.toggle(opener);
    expect(root?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('closes on Escape and restores focus to the opener', () => {
    document.body.innerHTML = popoverMarkup;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');
    const close = document.querySelector<HTMLElement>('[popover-close]');

    opener?.focus();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(root?.contains(document.activeElement)).toBe(true);

    close?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(root?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(opener);

    controller.destroy();
  });

  it('does not steal Escape from an open modal or drawer overlay', () => {
    document.body.innerHTML = `
      <div modal-overlay id="open-modal">
        <div modal><h2>Account</h2></div>
      </div>
      <button type="button" id="demo-open" aria-controls="demo-pop">Open</button>
      <div popover-root id="demo-pop">
        <div popover-panel>
          <button type="button" popover-close aria-label="Close">×</button>
          <div popover-body>Help</div>
        </div>
      </div>
    `;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const popover = document.getElementById('demo-pop');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(popover?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-modal')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div drawer-overlay id="open-drawer"><div drawer><h2>Filters</h2></div></div>`
    );

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(popover?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-drawer')?.setAttribute('hidden', '');
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(popover?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('keeps only one popover open at a time and does not close a modal', () => {
    document.body.innerHTML = `
      <div modal-overlay id="demo-modal">
        <div modal>
          <button type="button" modal-close aria-label="Close">×</button>
          <div modal-header><h2>Account</h2></div>
        </div>
      </div>
      <button type="button" id="open-first" aria-controls="first-pop">First</button>
      <div popover-root id="first-pop" hidden>
        <div popover-panel>
          <button type="button" popover-close aria-label="Close">×</button>
          <div popover-header><h2>First</h2></div>
        </div>
      </div>
      <button type="button" id="open-second" aria-controls="second-pop">Second</button>
      <div popover-root="top" id="second-pop" hidden>
        <div popover-panel>
          <button type="button" popover-close aria-label="Close">×</button>
          <div popover-header><h2>Second</h2></div>
        </div>
      </div>
    `;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const first = document.getElementById('first-pop');
    const second = document.getElementById('second-pop');
    const modal = document.getElementById('demo-modal');

    document
      .getElementById('open-first')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(first?.hasAttribute('hidden')).toBe(false);
    expect(modal?.hasAttribute('hidden')).toBe(false);

    document
      .getElementById('open-second')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(first?.hasAttribute('hidden')).toBe(true);
    expect(second?.hasAttribute('hidden')).toBe(false);
    expect(modal?.hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('open-first')?.getAttribute('aria-expanded')).toBe(
      'false'
    );
    expect(document.getElementById('open-second')?.getAttribute('aria-expanded')).toBe(
      'true'
    );

    controller.destroy();
  });

  it('dismisses on outside click and stays open for clicks inside', () => {
    document.body.innerHTML = `
      ${popoverMarkup}
      <button type="button" id="outside">Outside</button>
    `;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');
    const action = document.getElementById('demo-action');
    const outside = document.getElementById('outside');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);

    action?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);

    root?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);

    outside?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('traps Tab focus inside the open panel', () => {
    document.body.innerHTML = popoverMarkup;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const close = document.querySelector<HTMLElement>('[popover-close]');
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
      <div aria-controls="plain-pop">Open me</div>
      <div popover-root id="plain-pop" hidden>
        <div popover-panel>
          <div popover-close></div>
          <div popover-header><h2>Plain</h2></div>
        </div>
      </div>
    `;
    stopPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const opener = document.querySelector<HTMLElement>('[aria-controls]');
    const root = document.getElementById('plain-pop');

    expect(opener?.getAttribute('role')).toBe('button');
    expect(opener?.getAttribute('tabindex')).toBe('0');

    opener?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(root?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('positions below the opener by default and flips to top when it overflows', () => {
    document.body.innerHTML = popoverMarkup;
    stopPopoverRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    const controller = createPopover({ root: document.body, gap: 8 });
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');

    mockRect(opener, { top: 80, left: 120, width: 64, height: 24 });
    mockRect(root, { top: 0, left: 0, width: 200, height: 80 });

    controller.open(opener);
    expect(root?.style.position).toBe('fixed');
    expect(root?.style.top).toBe('112px');
    expect(root?.style.left).toBe('120px');

    controller.close(root);
    mockRect(opener, { top: 540, left: 120, width: 64, height: 24 });
    mockRect(root, { top: 0, left: 0, width: 200, height: 80 });
    controller.open(opener);

    expect(root?.style.top).toBe('452px');
    expect(root?.style.left).toBe('120px');

    controller.destroy();
  });

  it('honors left / right placement and flips once on the preferred axis', () => {
    document.body.innerHTML = `
      <button type="button" id="open-left" aria-controls="left-pop">Left</button>
      <div popover-root="left" id="left-pop" hidden>
        <div popover-panel><div popover-body>Left</div></div>
      </div>
      <button type="button" id="open-right" aria-controls="right-pop">Right</button>
      <div popover-root="right" id="right-pop" hidden>
        <div popover-panel><div popover-body>Right</div></div>
      </div>
    `;
    stopPopoverRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    const controller = createPopover({ root: document.body, gap: 8 });
    const leftRoot = document.getElementById('left-pop');
    const rightRoot = document.getElementById('right-pop');
    const openLeft = document.getElementById('open-left');
    const openRight = document.getElementById('open-right');

    mockRect(openLeft, { top: 80, left: 20, width: 64, height: 24 });
    mockRect(leftRoot, { top: 0, left: 0, width: 200, height: 80 });
    controller.open(openLeft);
    expect(leftRoot?.style.left).toBe('92px');
    expect(leftRoot?.style.top).toBe('80px');

    controller.close(leftRoot);
    mockRect(openRight, { top: 80, left: 700, width: 64, height: 24 });
    mockRect(rightRoot, { top: 0, left: 0, width: 200, height: 80 });
    controller.open(openRight);
    expect(rightRoot?.style.left).toBe('492px');
    expect(rightRoot?.style.top).toBe('80px');

    controller.destroy();
  });

  it('repositions on window resize and capture scroll', async () => {
    document.body.innerHTML = popoverMarkup;
    stopPopoverRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    const controller = createPopover({ root: document.body, gap: 8 });
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');

    mockRect(opener, { top: 80, left: 120, width: 64, height: 24 });
    mockRect(root, { top: 0, left: 0, width: 200, height: 80 });
    controller.open(opener);
    expect(root?.style.top).toBe('112px');

    mockRect(opener, { top: 160, left: 200, width: 64, height: 24 });
    window.dispatchEvent(new Event('resize'));
    await flushRuntime();
    expect(root?.style.top).toBe('192px');
    expect(root?.style.left).toBe('200px');

    mockRect(opener, { top: 40, left: 40, width: 64, height: 24 });
    window.dispatchEvent(new Event('scroll'));
    await flushRuntime();
    expect(root?.style.top).toBe('72px');
    expect(root?.style.left).toBe('40px');

    controller.destroy();
  });

  it('syncs late-rendered popover markup', async () => {
    stopPopoverRuntime();
    const controller = createPopover({ root: document.body });

    document.body.innerHTML = `
      <button type="button" aria-controls="late-pop">Open late</button>
      <div popover-root id="late-pop" hidden>
        <div popover-panel>
          <button type="button" popover-close></button>
          <div popover-header><h2>Late</h2></div>
        </div>
      </div>
    `;

    await flushRuntime();

    const root = document.getElementById('late-pop');
    const panel = document.querySelector<HTMLElement>('[popover-panel]');
    const opener = document.querySelector<HTMLElement>('[aria-controls]');

    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-modal')).toBeNull();
    expect(panel?.getAttribute('aria-labelledby')).toBe('late-pop-title');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = popoverMarkup;
    startPopoverRuntime();

    const controller = createPopover({ root: document.body });
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    controller.destroy();
  });
});

describe('startPopoverRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = popoverMarkup;
    stopPopoverRuntime();

    const first = startPopoverRuntime();
    const second = startPopoverRuntime();
    const root = document.getElementById('demo-pop');
    const opener = document.getElementById('demo-open');

    expect(first).toBe(second);

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopPopoverRuntime', async () => {
    stopPopoverRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./popover-runtime.js');
    document.body.innerHTML = popoverMarkup;
    mod.stopPopoverRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const opener = document.getElementById('demo-open');
    const root = document.getElementById('demo-pop');
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(true);

    mod.startPopoverRuntime();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);
    mod.stopPopoverRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
