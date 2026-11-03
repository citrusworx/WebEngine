// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  __resetLayerStackForTests,
  acquireScrollLock,
  isTopLayer,
  pushLayer,
  removeLayer,
  topLayer,
  topModalLayer,
  type LayerDismissReason,
  type LayerEntry,
  type PopLayer,
} from './layer-stack.js';

const here = dirname(fileURLToPath(import.meta.url));

const dismissals: Array<{ id: string; reason: LayerDismissReason }> = [];

const resetDom = () => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
};

afterEach(() => {
  __resetLayerStackForTests();
  dismissals.length = 0;
  resetDom();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const mount = (
  id: string,
  overrides: Partial<LayerEntry> = {}
): { el: HTMLElement; pop: PopLayer } => {
  const el = document.createElement('div');
  el.id = id;
  document.body.append(el);

  let pop: PopLayer = () => {};
  const dismiss =
    overrides.dismiss ??
    ((reason: LayerDismissReason) => {
      dismissals.push({ id, reason });
      pop();
    });

  pop = pushLayer({
    kind: 'modal',
    modal: true,
    ...overrides,
    el,
    dismiss,
  });

  return { el, pop };
};

const pressEscape = (init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
    ...init,
  });
  document.body.dispatchEvent(event);
  return event;
};

const pointerDown = (target: EventTarget) => {
  target.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
  );
};

describe('layer stack', () => {
  it('orders pushes by open time and reports the top and top modal layer', () => {
    expect(topLayer()).toBeNull();
    expect(topModalLayer()).toBeNull();
    expect(isTopLayer(document.body)).toBe(false);

    const modal = mount('modal', { kind: 'modal', modal: true });
    const popover = mount('popover', { kind: 'popover', modal: false });

    expect(topLayer()?.el).toBe(popover.el);
    expect(topLayer()?.kind).toBe('popover');
    expect(isTopLayer(popover.el)).toBe(true);
    expect(isTopLayer(modal.el)).toBe(false);
    expect(topModalLayer()?.el).toBe(modal.el);

    const sheet = mount('sheet', { kind: 'sheet', modal: true });

    expect(topLayer()?.el).toBe(sheet.el);
    expect(topModalLayer()?.el).toBe(sheet.el);
    expect(topModalLayer()?.kind).toBe('sheet');

    sheet.pop();
    expect(dismissals).toEqual([]);
    expect(topLayer()?.el).toBe(popover.el);
    expect(topModalLayer()?.el).toBe(modal.el);
    expect(isTopLayer(popover.el)).toBe(true);
  });

  it('treats a second pop as a no-op and does not dismiss the popped layer', () => {
    const modal = mount('modal');

    modal.pop();
    modal.pop();

    expect(dismissals).toEqual([]);
    expect(topLayer()).toBeNull();
    expect(isTopLayer(modal.el)).toBe(false);
  });

  it('refreshes a re-pushed element in place instead of moving or duplicating it', () => {
    const el = document.createElement('div');
    el.id = 'same';
    document.body.append(el);

    const seen: string[] = [];
    const first = pushLayer({
      el,
      kind: 'modal',
      modal: true,
      dismiss: () => seen.push('first'),
    });
    const other = mount('other', {
      kind: 'menu',
      modal: false,
      dismiss: () => seen.push('other'),
    });
    const second = pushLayer({
      el,
      kind: 'drawer',
      modal: false,
      dismiss: () => seen.push('second'),
    });

    expect(topLayer()?.el).toBe(other.el);
    expect(isTopLayer(el)).toBe(false);

    other.pop({ cascade: false });

    expect(topLayer()?.el).toBe(el);
    expect(topLayer()?.kind).toBe('drawer');
    expect(topLayer()?.modal).toBe(false);
    expect(dismissals).toEqual([]);

    topLayer()?.dismiss('escape');
    expect(seen).toEqual(['second']);

    first();
    expect(topLayer()).toBeNull();
    second();
    expect(topLayer()).toBeNull();
    expect(seen).toEqual(['second']);
  });

  it('dismisses layers above a popped entry top-down with reason cascade', () => {
    const bottom = mount('bottom');
    mount('middle');
    mount('top');

    bottom.pop();

    expect(dismissals).toEqual([
      { id: 'top', reason: 'cascade' },
      { id: 'middle', reason: 'cascade' },
    ]);
    expect(topLayer()).toBeNull();

    bottom.pop();
    expect(dismissals).toEqual([
      { id: 'top', reason: 'cascade' },
      { id: 'middle', reason: 'cascade' },
    ]);
  });

  it('removes one entry without dismiss or focus return', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();

    const bottom = mount('bottom');
    const middle = mount('middle', { restoreFocus: opener });
    const top = mount('top', { restoreFocus: opener });
    middle.el.tabIndex = -1;
    middle.el.focus();

    removeLayer(middle.el);

    expect(dismissals).toEqual([]);
    expect(document.activeElement).toBe(middle.el);
    expect(topLayer()?.el).toBe(top.el);
    expect(isTopLayer(bottom.el)).toBe(false);

    bottom.pop({ cascade: false });

    expect(dismissals).toEqual([]);
    expect(topLayer()?.el).toBe(top.el);
    expect(document.activeElement).toBe(middle.el);
  });

  it('dismisses only the top layer on Escape, then the next top', () => {
    mount('bottom');
    mount('top');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
    );
    expect(dismissals).toEqual([]);

    let reachedTarget = false;
    const onTarget = () => {
      reachedTarget = true;
    };
    document.body.addEventListener('keydown', onTarget);

    const event = pressEscape();

    expect(dismissals).toEqual([{ id: 'top', reason: 'escape' }]);
    expect(event.defaultPrevented).toBe(true);
    expect(reachedTarget).toBe(false);
    expect(topLayer()?.el.id).toBe('bottom');

    pressEscape();

    expect(dismissals).toEqual([
      { id: 'top', reason: 'escape' },
      { id: 'bottom', reason: 'escape' },
    ]);
    expect(topLayer()).toBeNull();

    pressEscape();
    expect(dismissals).toHaveLength(2);
    document.body.removeEventListener('keydown', onTarget);
  });

  it('ignores Escape when it is already defaultPrevented or composing', () => {
    const preventEscape = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', preventEscape, true);

    mount('top');
    const prevented = pressEscape();

    expect(prevented.defaultPrevented).toBe(true);
    expect(dismissals).toEqual([]);
    expect(isTopLayer(document.getElementById('top') as HTMLElement)).toBe(
      true
    );

    document.removeEventListener('keydown', preventEscape, true);

    const composing = pressEscape({ isComposing: true });

    expect(composing.defaultPrevented).toBe(false);
    expect(dismissals).toEqual([]);
    expect(topLayer()?.el.id).toBe('top');
  });

  it('attaches capture listeners on the first push and detaches when the stack is empty', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');

    const first = mount('first');
    const keydown = add.mock.calls.find((call) => call[0] === 'keydown')?.[1];
    const pointerdown = add.mock.calls.find(
      (call) => call[0] === 'pointerdown'
    )?.[1];

    expect(add).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenNthCalledWith(1, 'keydown', keydown, true);
    expect(add).toHaveBeenNthCalledWith(2, 'pointerdown', pointerdown, true);
    expect(remove).not.toHaveBeenCalled();

    const second = mount('second');
    expect(add).toHaveBeenCalledTimes(2);

    second.pop();
    expect(remove).not.toHaveBeenCalled();
    expect(topLayer()?.el).toBe(first.el);

    first.pop();
    expect(remove).toHaveBeenCalledWith('keydown', keydown, true);
    expect(remove).toHaveBeenCalledWith('pointerdown', pointerdown, true);

    add.mockClear();
    mount('third');
    expect(add).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenNthCalledWith(1, 'keydown', keydown, true);
    expect(add).toHaveBeenNthCalledWith(2, 'pointerdown', pointerdown, true);
  });

  it('dismisses only the layers above the one that contains the pointer target', () => {
    const bottom = mount('bottom');
    const middle = mount('middle');
    const top = mount('top');
    const insideMiddle = document.createElement('span');
    middle.el.append(insideMiddle);

    pointerDown(insideMiddle);

    expect(dismissals).toEqual([{ id: 'top', reason: 'outside' }]);
    expect(topLayer()?.el).toBe(middle.el);
    expect(isTopLayer(bottom.el)).toBe(false);

    pointerDown(document.body);

    expect(dismissals).toEqual([
      { id: 'top', reason: 'outside' },
      { id: 'middle', reason: 'outside' },
      { id: 'bottom', reason: 'outside' },
    ]);
    expect(topLayer()).toBeNull();
    expect(top.el.isConnected).toBe(true);
  });

  it('ignores a pointerdown inside the top layer', () => {
    mount('bottom');
    const top = mount('top');
    const inside = document.createElement('button');
    top.el.append(inside);

    pointerDown(inside);
    pointerDown(top.el);

    expect(dismissals).toEqual([]);
    expect(isTopLayer(top.el)).toBe(true);
  });

  it('lets containsTarget count a node outside el as inside', () => {
    const portal = document.createElement('div');
    const menuEl = document.createElement('div');
    menuEl.id = 'menu';
    document.body.append(portal, menuEl);

    let pop: PopLayer = () => {};
    pop = pushLayer({
      el: menuEl,
      kind: 'menu',
      modal: false,
      dismiss: (reason) => {
        dismissals.push({ id: 'menu', reason });
        pop();
      },
      containsTarget: (target) =>
        target instanceof Node &&
        (menuEl.contains(target) || portal.contains(target)),
    });

    pointerDown(portal);
    expect(dismissals).toEqual([]);
    expect(isTopLayer(menuEl)).toBe(true);

    pointerDown(document.body);
    expect(dismissals).toEqual([{ id: 'menu', reason: 'outside' }]);
  });

  it('ref-counts body overflow and restores the previous inline value', () => {
    document.body.style.overflow = 'scroll';

    const first = acquireScrollLock();
    const second = acquireScrollLock();
    const third = acquireScrollLock();

    expect(document.body.style.overflow).toBe('hidden');

    second();
    expect(document.body.style.overflow).toBe('hidden');
    second();
    expect(document.body.style.overflow).toBe('hidden');

    first();
    expect(document.body.style.overflow).toBe('hidden');

    third();
    expect(document.body.style.overflow).toBe('scroll');

    third();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('returns focus to the opener when restoreFocus is set', () => {
    const modal = document.createElement('div');
    const opener = document.createElement('button');
    modal.append(opener);
    document.body.append(modal);

    pushLayer({
      el: modal,
      kind: 'modal',
      modal: true,
      dismiss: () => {},
    });

    const popover = document.createElement('div');
    popover.tabIndex = -1;
    document.body.append(popover);
    const pop = pushLayer({
      el: popover,
      kind: 'popover',
      modal: false,
      dismiss: () => {},
      restoreFocus: opener,
    });

    popover.focus();
    expect(document.activeElement).toBe(popover);

    pop();

    expect(document.activeElement).toBe(opener);
    expect(topLayer()?.el).toBe(modal);
  });

  it('falls back when the opener is disconnected or inside a closed layer', () => {
    const under = document.createElement('div');
    document.body.append(under);
    pushLayer({
      el: under,
      kind: 'drawer',
      modal: true,
      dismiss: () => {},
    });

    const opener = document.createElement('button');
    document.body.append(opener);
    const upper = document.createElement('div');
    document.body.append(upper);
    const pop = pushLayer({
      el: upper,
      kind: 'sheet',
      modal: true,
      dismiss: () => {},
      restoreFocus: opener,
    });

    opener.remove();
    expect(under.hasAttribute('tabindex')).toBe(false);

    pop();

    expect(under.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(under);

    const marked = document.createElement('div');
    marked.tabIndex = 0;
    document.body.append(marked);
    pushLayer({
      el: marked,
      kind: 'modal',
      modal: true,
      dismiss: () => {},
    });

    const gone = document.createElement('button');
    const cover = document.createElement('div');
    document.body.append(cover);
    const coverPop = pushLayer({
      el: cover,
      kind: 'popover',
      modal: false,
      dismiss: () => {},
      restoreFocus: gone,
    });

    coverPop();

    expect(marked.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(marked);

    const host = document.createElement('div');
    const nestedOpener = document.createElement('button');
    host.append(nestedOpener);
    document.body.append(host);
    const nestedPop = pushLayer({
      el: host,
      kind: 'menu',
      modal: false,
      dismiss: () => {},
      restoreFocus: nestedOpener,
    });

    nestedOpener.focus();
    nestedPop();

    expect(document.activeElement).toBe(marked);
    expect(marked.getAttribute('tabindex')).toBe('0');
  });

  it('skips focus return unless restoreFocus is present', () => {
    const under = document.createElement('div');
    document.body.append(under);
    pushLayer({
      el: under,
      kind: 'modal',
      modal: true,
      dismiss: () => {},
    });

    const inner = document.createElement('button');
    const layer = document.createElement('div');
    layer.append(inner);
    document.body.append(layer);
    const pop = pushLayer({
      el: layer,
      kind: 'popover',
      modal: false,
      dismiss: () => {},
    });

    inner.focus();
    pop();

    expect(document.activeElement).toBe(inner);
    expect(under.hasAttribute('tabindex')).toBe(false);

    const optedOut = document.createElement('button');
    document.body.append(optedOut);
    const again = document.createElement('div');
    document.body.append(again);
    const nullPop = pushLayer({
      el: again,
      kind: 'combobox',
      modal: false,
      dismiss: () => {},
      restoreFocus: null,
    });

    optedOut.focus();
    nullPop();

    expect(under.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(under);
  });

  it('no-ops when document is undefined', () => {
    const realDocument = globalThis.document;
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
    expect(
      descriptor?.configurable,
      'document can be hidden for the SSR guard'
    ).toBe(true);

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      expect(typeof document).toBe('undefined');

      const el = realDocument.createElement('div');
      const pop = pushLayer({
        el,
        kind: 'modal',
        modal: true,
        dismiss: () => {
          throw new Error('dismiss should not run without document');
        },
        restoreFocus: el,
      });

      expect(topLayer()).toBeNull();
      expect(topModalLayer()).toBeNull();
      expect(isTopLayer(el)).toBe(false);

      const release = acquireScrollLock();
      release();
      release();
      pop();
      removeLayer(el);
      expect(() => __resetLayerStackForTests()).not.toThrow();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'document', descriptor);
    }

    expect(typeof document).toBe('object');
    expect(topLayer()).toBeNull();
  });

  it('stays off the public entry and package exports', () => {
    const sources = [
      join(here, '../../../index.ts'),
      join(here, '../../juice.ts'),
      join(here, '../../../../index.ts'),
    ];

    for (const source of sources) {
      const text = readFileSync(source, 'utf8');
      expect(text).not.toContain('layer-stack');
      expect(text).not.toContain('dialog-layer');
      expect(text).not.toContain('pushLayer');
      expect(text).not.toContain('createDialogLayers');
      expect(text).not.toContain('__resetLayerStackForTests');
    }

    const pkg = JSON.parse(
      readFileSync(join(here, '../../../../package.json'), 'utf8')
    ) as { exports?: Record<string, unknown> };

    expect(Object.keys(pkg.exports ?? {}).join('\n')).not.toContain('layer');
    expect(JSON.stringify(pkg.exports)).not.toContain('layer-stack');
  });
});
