// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createTooltip,
  startTooltipRuntime,
  stopTooltipRuntime,
} from './tooltip-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const tooltipMarkup = `
  <button type="button" id="demo-save" aria-describedby="tip-1">Save</button>
  <div tooltip-root id="tip-1" hidden>
    <div tooltip-panel role="tooltip">Saves your draft</div>
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
  vi.useRealTimers();
  stopTooltipRuntime();
  resetDom();
  vi.restoreAllMocks();
});

describe('createTooltip', () => {
  it('fills missing tooltip role, root id, and trigger aria-describedby', () => {
    document.body.innerHTML = `
      <button type="button" id="save" aria-describedby="draft-tip">Save</button>
      <div tooltip-root id="draft-tip" hidden>
        <div tooltip-panel>Saves your draft</div>
      </div>
    `;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const panel = document.querySelector<HTMLElement>('[tooltip-panel]');
    const trigger = document.getElementById('save');
    const root = document.getElementById('draft-tip');

    expect(panel?.getAttribute('role')).toBe('tooltip');
    expect(root?.hasAttribute('hidden')).toBe(true);
    expect(trigger?.getAttribute('aria-describedby')).toBe('draft-tip');
    expect(document.activeElement).not.toBe(panel);

    controller.destroy();
  });

  it('pairs aria-controls triggers and writes aria-describedby on sync', () => {
    document.body.innerHTML = `
      <button type="button" id="save" aria-controls="draft-tip">Save</button>
      <div tooltip-root id="draft-tip" hidden>
        <div tooltip-panel>Saves your draft</div>
      </div>
    `;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const trigger = document.getElementById('save');
    const panel = document.querySelector<HTMLElement>('[tooltip-panel]');

    expect(panel?.getAttribute('role')).toBe('tooltip');
    expect(trigger?.getAttribute('aria-controls')).toBe('draft-tip');
    expect(trigger?.getAttribute('aria-describedby')).toBe('draft-tip');

    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(document.getElementById('draft-tip')?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('does not enhance orphan describedby that does not target a tooltip-root', () => {
    document.body.innerHTML = `
      <button type="button" aria-describedby="missing-tip">Orphan</button>
      <div id="missing-tip" hidden>Not a tooltip.</div>
    `;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const trigger = document.querySelector<HTMLElement>('[aria-describedby]');
    const panel = document.getElementById('missing-tip');

    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('role')).toBeNull();

    controller.destroy();
  });

  it('shows on pointer enter / focus and hides on leave / blur', () => {
    document.body.innerHTML = tooltipMarkup;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');
    const panel = document.querySelector<HTMLElement>('[tooltip-panel]');
    const outside = document.createElement('button');
    outside.id = 'outside';
    document.body.append(outside);

    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).not.toBe(panel);

    trigger?.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: outside })
    );
    expect(root?.hasAttribute('hidden')).toBe(true);

    trigger?.focus();
    trigger?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger?.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: outside })
    );
    expect(root?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('keeps the tip open when the trigger stays focused after pointer leave', () => {
    document.body.innerHTML = tooltipMarkup;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');
    const outside = document.createElement('button');
    document.body.append(outside);

    trigger?.focus();
    trigger?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);

    trigger?.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: outside })
    );
    expect(root?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('hides after the configured leave delay', () => {
    vi.useFakeTimers();
    document.body.innerHTML = tooltipMarkup;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 150 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');
    const outside = document.createElement('button');
    document.body.append(outside);

    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);

    trigger?.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: outside })
    );
    expect(root?.hasAttribute('hidden')).toBe(false);

    vi.advanceTimersByTime(149);
    expect(root?.hasAttribute('hidden')).toBe(false);

    vi.advanceTimersByTime(1);
    expect(root?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('exposes show and hide on the controller without moving focus', () => {
    document.body.innerHTML = tooltipMarkup;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');
    const panel = document.querySelector<HTMLElement>('[tooltip-panel]');

    trigger?.focus();
    controller.show(trigger);
    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.activeElement).not.toBe(panel);
    expect(panel?.hasAttribute('tabindex')).toBe(false);

    controller.hide(root);
    expect(root?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(trigger);

    controller.destroy();
  });

  it('closes on Escape and yields to modal, drawer, popover, and combobox', () => {
    document.body.innerHTML = `
      <div modal-overlay id="open-modal">
        <div modal><h2>Account</h2></div>
      </div>
      <button type="button" id="demo-save" aria-describedby="tip-1">Save</button>
      <div tooltip-root id="tip-1">
        <div tooltip-panel role="tooltip">Saves your draft</div>
      </div>
    `;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const tip = document.getElementById('tip-1');
    const pressEscape = () => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
      );
    };

    pressEscape();
    expect(tip?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-modal')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div drawer-overlay id="open-drawer"><div drawer><h2>Filters</h2></div></div>`
    );

    pressEscape();
    expect(tip?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-drawer')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div popover-root id="open-pop"><div popover-panel>Help</div></div>`
    );

    pressEscape();
    expect(tip?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-pop')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div combobox><ul combobox-list id="open-list"><li combobox-option>Apple</li></ul></div>`
    );

    pressEscape();
    expect(tip?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-list')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div toast-region><div toast id="open-toast">Saved.</div></div>`
    );

    pressEscape();
    expect(tip?.hasAttribute('hidden')).toBe(true);
    expect(document.getElementById('open-toast')?.hasAttribute('hidden')).toBe(
      false
    );

    controller.destroy();
  });

  it('keeps only one tooltip open at a time', () => {
    document.body.innerHTML = `
      <button type="button" id="first-trigger" aria-describedby="first-tip">First</button>
      <div tooltip-root id="first-tip" hidden>
        <div tooltip-panel role="tooltip">First tip</div>
      </div>
      <button type="button" id="second-trigger" aria-describedby="second-tip">Second</button>
      <div tooltip-root="bottom" id="second-tip" hidden>
        <div tooltip-panel role="tooltip">Second tip</div>
      </div>
    `;
    stopTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const first = document.getElementById('first-tip');
    const second = document.getElementById('second-tip');

    document
      .getElementById('first-trigger')
      ?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(first?.hasAttribute('hidden')).toBe(false);

    document
      .getElementById('second-trigger')
      ?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(first?.hasAttribute('hidden')).toBe(true);
    expect(second?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('positions above the trigger by default and flips to bottom when it overflows', () => {
    document.body.innerHTML = tooltipMarkup;
    stopTooltipRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    const controller = createTooltip({ root: document.body, gap: 8, hideDelay: 0 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');

    mockRect(trigger, { top: 200, left: 120, width: 64, height: 24 });
    mockRect(root, { top: 0, left: 0, width: 200, height: 80 });

    controller.show(trigger);
    expect(root?.style.position).toBe('fixed');
    expect(root?.style.top).toBe('112px');
    expect(root?.style.left).toBe('120px');

    controller.hide(root);
    mockRect(trigger, { top: 20, left: 120, width: 64, height: 24 });
    mockRect(root, { top: 0, left: 0, width: 200, height: 80 });
    controller.show(trigger);

    expect(root?.style.top).toBe('52px');
    expect(root?.style.left).toBe('120px');

    controller.destroy();
  });

  it('honors left / right placement and flips once on the preferred axis', () => {
    document.body.innerHTML = `
      <button type="button" id="open-left" aria-describedby="left-tip">Left</button>
      <div tooltip-root="left" id="left-tip" hidden>
        <div tooltip-panel role="tooltip">Left</div>
      </div>
      <button type="button" id="open-right" aria-describedby="right-tip">Right</button>
      <div tooltip-root="right" id="right-tip" hidden>
        <div tooltip-panel role="tooltip">Right</div>
      </div>
    `;
    stopTooltipRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    const controller = createTooltip({ root: document.body, gap: 8, hideDelay: 0 });
    const leftRoot = document.getElementById('left-tip');
    const rightRoot = document.getElementById('right-tip');
    const openLeft = document.getElementById('open-left');
    const openRight = document.getElementById('open-right');

    mockRect(openLeft, { top: 80, left: 20, width: 64, height: 24 });
    mockRect(leftRoot, { top: 0, left: 0, width: 200, height: 80 });
    controller.show(openLeft);
    expect(leftRoot?.style.left).toBe('92px');
    expect(leftRoot?.style.top).toBe('80px');

    controller.hide(leftRoot);
    mockRect(openRight, { top: 80, left: 700, width: 64, height: 24 });
    mockRect(rightRoot, { top: 0, left: 0, width: 200, height: 80 });
    controller.show(openRight);
    expect(rightRoot?.style.left).toBe('492px');
    expect(rightRoot?.style.top).toBe('80px');

    controller.destroy();
  });

  it('offsets fixed placement for a transformed containing block', () => {
    document.body.innerHTML = `
      <div id="card" style="transform: translate(80px, 40px)">
        <button type="button" id="demo-save" aria-describedby="tip-1">Save</button>
        <div tooltip-root id="tip-1" hidden>
          <div tooltip-panel role="tooltip">Saves your draft</div>
        </div>
      </div>
    `;
    stopTooltipRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    const card = document.getElementById('card');
    const nativeComputed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const style = nativeComputed(element);
      if (element !== card) return style;
      return new Proxy(style, {
        get: (target, prop, receiver) => {
          if (prop === 'transform') return 'matrix(1, 0, 0, 1, 80, 40)';
          return Reflect.get(target, prop, receiver);
        },
      }) as CSSStyleDeclaration;
    });

    const controller = createTooltip({ root: document.body, gap: 8, hideDelay: 0 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');

    mockRect(trigger, { top: 200, left: 160, width: 64, height: 24 });
    mockRect(root, { top: 0, left: 0, width: 200, height: 80 });
    mockRect(card, { top: 80, left: 40, width: 400, height: 300 });

    controller.show(trigger);

    expect(root?.style.top).toBe('32px');
    expect(root?.style.left).toBe('120px');

    controller.destroy();
  });

  it('repositions on window resize and capture scroll', async () => {
    document.body.innerHTML = tooltipMarkup;
    stopTooltipRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

    const controller = createTooltip({ root: document.body, gap: 8, hideDelay: 0 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');

    mockRect(trigger, { top: 200, left: 120, width: 64, height: 24 });
    mockRect(root, { top: 0, left: 0, width: 200, height: 80 });
    controller.show(trigger);
    expect(root?.style.top).toBe('112px');

    mockRect(trigger, { top: 280, left: 200, width: 64, height: 24 });
    window.dispatchEvent(new Event('resize'));
    await flushRuntime();
    expect(root?.style.top).toBe('192px');
    expect(root?.style.left).toBe('200px');

    mockRect(trigger, { top: 160, left: 40, width: 64, height: 24 });
    window.dispatchEvent(new Event('scroll'));
    await flushRuntime();
    expect(root?.style.top).toBe('72px');
    expect(root?.style.left).toBe('40px');

    controller.destroy();
  });

  it('syncs late-rendered tooltip markup', async () => {
    stopTooltipRuntime();
    const controller = createTooltip({ root: document.body, hideDelay: 0 });

    document.body.innerHTML = `
      <button type="button" aria-describedby="late-tip">Save late</button>
      <div tooltip-root id="late-tip" hidden>
        <div tooltip-panel>Late tip</div>
      </div>
    `;

    await flushRuntime();

    const root = document.getElementById('late-tip');
    const panel = document.querySelector<HTMLElement>('[tooltip-panel]');
    const trigger = document.querySelector<HTMLElement>('[aria-describedby]');

    expect(panel?.getAttribute('role')).toBe('tooltip');
    expect(trigger?.getAttribute('aria-describedby')).toBe('late-tip');

    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('shows once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = tooltipMarkup;
    startTooltipRuntime();

    const controller = createTooltip({ root: document.body, hideDelay: 0 });
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');

    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(trigger?.getAttribute('aria-describedby')).toBe('tip-1');

    controller.destroy();
  });
});

describe('startTooltipRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = tooltipMarkup;
    stopTooltipRuntime();

    const first = startTooltipRuntime();
    const second = startTooltipRuntime();
    const root = document.getElementById('tip-1');
    const trigger = document.getElementById('demo-save');

    expect(first).toBe(second);

    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopTooltipRuntime', async () => {
    stopTooltipRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./tooltip-runtime.js');
    document.body.innerHTML = tooltipMarkup;
    mod.stopTooltipRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const trigger = document.getElementById('demo-save');
    const root = document.getElementById('tip-1');
    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(true);

    mod.startTooltipRuntime();
    trigger?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(root?.hasAttribute('hidden')).toBe(false);
    mod.stopTooltipRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
