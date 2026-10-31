// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JUICE_CHANGE_EVENT } from '../shared/change.js';
import {
  flushMotion,
  stubMotionDuration,
  stubReducedMotion,
} from '../shared/motion-test-utils.js';
import { hasOpenDialogOverlay } from '../shared/overlays.js';
import {
  createSheet,
  initSheet,
  startSheetRuntime,
  stopSheetRuntime,
  type SheetState,
} from './sheet-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.documentElement.removeAttribute('keyboard-open');
  document.documentElement.style.removeProperty('--juice-sheet-peek');
  document.documentElement.style.removeProperty('--juice-sheet-half');
  document.documentElement.style.removeProperty('--juice-sheet-full');
  document.documentElement.style.removeProperty('--juice-sheet-offset');
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const installDetents = () => {
  const root = document.documentElement;
  root.style.setProperty('--juice-sheet-peek', '100px');
  root.style.setProperty('--juice-sheet-half', '200px');
  root.style.setProperty('--juice-sheet-full', '400px');
  root.style.setProperty('--juice-sheet-offset', '24px');
};

const sheetMarkup = `
  <div sheet-overlay id="demo-sheet" hidden>
    <div sheet role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <div sheet-handle></div>
      <button type="button" sheet-close aria-label="Close">×</button>
      <div sheet-header><h2 id="demo-title">Details</h2></div>
      <div sheet-body>
        <p>Order summary</p>
        <button type="button" id="demo-action">Save</button>
      </div>
      <div sheet-footer>Done</div>
    </div>
  </div>
  <button type="button" id="demo-open" aria-controls="demo-sheet">Open</button>
`;

type JuiceChange = CustomEvent<{ runtime: string; state: SheetState }>;

const listen = (target: EventTarget = document.body) => {
  const events: JuiceChange[] = [];
  const onChange = (event: Event) => {
    events.push(event as JuiceChange);
  };
  target.addEventListener(JUICE_CHANGE_EVENT, onChange);
  return {
    events,
    stop: () => target.removeEventListener(JUICE_CHANGE_EVENT, onChange),
  };
};

const point = (target: EventTarget, type: string, clientY: number) => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX: 40,
      clientY,
    })
  );
};

const useClock = () => {
  let time = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => time);
  return {
    set(ms: number) {
      time = ms;
    },
    advance(ms: number) {
      time += ms;
    },
  };
};

afterEach(() => {
  stopSheetRuntime();
  resetDom();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createSheet', () => {
  it('opens and closes through aria-controls and writes the default detent', () => {
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet');
    const opener = document.getElementById('demo-open');
    const dialog = document.querySelector<HTMLElement>('[sheet]');

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('demo-title');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');
    expect(opener?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(controller.getState(overlay)).toEqual({
      open: false,
      detent: 'half',
      dragging: false,
      modal: true,
    });

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');
    expect(dialog?.getAttribute('detent')).toBe('half');
    expect(controller.getState()).toEqual({
      open: true,
      detent: 'half',
      dragging: false,
      modal: true,
    });

    document
      .querySelector<HTMLElement>('[sheet-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');
    expect(controller.isOpen(overlay)).toBe(false);

    controller.destroy();
  });

  it('parses sheet-detents and rests on the ranked default', () => {
    document.body.innerHTML = `
      <div sheet-overlay id="peek-only" hidden>
        <div sheet sheet-detents="peek"><h2>Peek</h2></div>
      </div>
      <div sheet-overlay id="full-only" hidden>
        <div sheet sheet-detents="full"><h2>Full</h2></div>
      </div>
      <div sheet-overlay id="peek-full" hidden>
        <div sheet sheet-detents="peek full"><h2>No half</h2></div>
      </div>
      <div sheet-overlay id="all" hidden>
        <div sheet sheet-detents="full peek half"><h2>All</h2></div>
      </div>
      <div sheet-overlay id="bogus" hidden>
        <div sheet sheet-detents="tall"><h2>Fallback</h2></div>
      </div>
    `;
    stopSheetRuntime();
    const controller = createSheet({ root: document.body });

    controller.open(document.getElementById('peek-only'));
    expect(document.querySelector('#peek-only [sheet]')?.getAttribute('detent')).toBe(
      'peek'
    );

    controller.open(document.getElementById('full-only'));
    expect(document.querySelector('#full-only [sheet]')?.getAttribute('detent')).toBe(
      'full'
    );

    controller.open(document.getElementById('peek-full'));
    expect(document.querySelector('#peek-full [sheet]')?.getAttribute('detent')).toBe(
      'full'
    );

    controller.open(document.getElementById('all'));
    expect(document.querySelector('#all [sheet]')?.getAttribute('detent')).toBe('half');

    controller.open(document.getElementById('bogus'));
    expect(document.querySelector('#bogus [sheet]')?.getAttribute('detent')).toBe(
      'half'
    );
    expect(controller.getState(document.getElementById('bogus'))).toMatchObject({
      open: true,
      detent: 'half',
    });

    controller.destroy();
  });

  it('fills missing dialog role, aria-modal, and labelledby from the heading', () => {
    document.body.innerHTML = `
      <div sheet-overlay id="filters-sheet" hidden>
        <div sheet>
          <button type="button" sheet-close></button>
          <div sheet-header><h2>Filters</h2></div>
          <div sheet-body>Narrow the catalog.</div>
        </div>
      </div>
      <button type="button" aria-controls="filters-sheet">Open filters</button>
    `;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const dialog = document.querySelector<HTMLElement>('[sheet]');
    const heading = document.querySelector('h2');
    const close = document.querySelector<HTMLElement>('[sheet-close]');

    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(heading?.id).toBe('filters-sheet-title');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('filters-sheet-title');
    expect(close?.getAttribute('aria-label')).toBe('Close');
    const alias = initSheet({ root: document.body });
    expect(alias.getState(document.getElementById('filters-sheet'))?.open).toBe(false);
    alias.destroy();

    controller.destroy();
  });

  it('ignores an overlay with no sheet and a disabled host', () => {
    document.body.innerHTML = `
      <div sheet-overlay id="empty" hidden></div>
      <button type="button" aria-controls="empty">Empty</button>
      <div sheet-overlay id="off" hidden disabled>
        <div sheet><h2>Off</h2></div>
      </div>
      <button type="button" aria-controls="off">Off</button>
    `;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const empty = document.getElementById('empty');
    const off = document.getElementById('off');

    expect(controller.getState(empty)).toBeNull();
    document
      .querySelector<HTMLElement>('[aria-controls="empty"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(empty?.hasAttribute('hidden')).toBe(true);
    expect(empty?.getAttribute('role')).toBeNull();

    document
      .querySelector<HTMLElement>('[aria-controls="off"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(off?.hasAttribute('hidden')).toBe(true);
    expect(controller.getState(off)).toEqual({
      open: false,
      detent: 'half',
      dragging: false,
      modal: true,
    });

    controller.destroy();
  });

  it('closes on Escape and restores focus to the opener', () => {
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet');
    const opener = document.getElementById('demo-open');
    const close = document.querySelector<HTMLElement>('[sheet-close]');

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

  it('closes on backdrop click, and not for static or none', () => {
    document.body.innerHTML = `
      <div sheet-overlay id="plain-sheet" hidden>
        <div sheet><h2>Plain</h2><button type="button" sheet-close aria-label="Close">×</button></div>
      </div>
      <div sheet-overlay="static" id="static-sheet" hidden>
        <div sheet><h2>Static</h2><button type="button" id="static-action">Stay</button></div>
      </div>
      <div sheet-overlay="none" id="none-sheet" hidden>
        <div sheet><h2>None</h2><button type="button" id="none-action">Page</button></div>
      </div>
      <button type="button" id="open-plain" aria-controls="plain-sheet">Open plain</button>
      <button type="button" id="open-static" aria-controls="static-sheet">Open static</button>
      <button type="button" id="open-none" aria-controls="none-sheet">Open none</button>
    `;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const plain = document.getElementById('plain-sheet');
    const locked = document.getElementById('static-sheet');
    const floating = document.getElementById('none-sheet');

    try {
      document.getElementById('open-plain')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      plain?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(plain?.hasAttribute('hidden')).toBe(true);

      document.getElementById('open-static')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      locked?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(locked?.hasAttribute('hidden')).toBe(false);
      expect(controller.getState(locked)?.modal).toBe(true);
      document
        .querySelector<HTMLElement>('#static-sheet [sheet]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(locked?.hasAttribute('hidden')).toBe(false);

      controller.close(locked);
      document.getElementById('open-none')?.focus();
      document.getElementById('open-none')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      floating?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(floating?.hasAttribute('hidden')).toBe(false);
      expect(document.querySelector('#none-sheet [sheet]')?.getAttribute('aria-modal')).toBe(
        'false'
      );
      expect(controller.getState(floating)).toMatchObject({ modal: false, open: true });
      expect(document.activeElement).toBe(document.getElementById('open-none'));

      document.getElementById('open-none')?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
      );
      expect(floating?.hasAttribute('hidden')).toBe(true);
    } finally {
      controller.destroy();
    }
  });

  it('traps Tab inside a modal sheet and does not trap a non-modal sheet', () => {
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const close = document.querySelector<HTMLElement>('[sheet-close]');
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

    document.body.innerHTML = `
      <div sheet-overlay="none" id="none-sheet" hidden>
        <div sheet>
          <button type="button" id="inside">Inside</button>
          <button type="button" id="inside-last">Last</button>
        </div>
      </div>
      <button type="button" id="outside">Outside</button>
      <button type="button" id="open-none" aria-controls="none-sheet">Open</button>
    `;
    const none = createSheet({ root: document.body });
    document.getElementById('open-none')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const last = document.getElementById('inside-last');
    last?.focus();
    last?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
    expect(document.activeElement).toBe(last);
    none.destroy();
  });

  it('keeps a scroll-lock counter across nested modal sheets and skips non-modal', () => {
    document.body.innerHTML = `
      <div sheet-overlay id="outer" hidden>
        <div sheet>
          <h2>Outer</h2>
          <div sheet-overlay id="inner" hidden>
            <div sheet><h2>Inner</h2></div>
          </div>
        </div>
      </div>
      <div sheet-overlay="none" id="floating" hidden>
        <div sheet><h2>Floating</h2></div>
      </div>
    `;
    stopSheetRuntime();
    document.body.style.overflow = 'scroll';
    const controller = createSheet({ root: document.body });
    const outer = document.getElementById('outer');
    const inner = document.getElementById('inner');
    const floating = document.getElementById('floating');

    controller.open(outer);
    expect(document.body.style.overflow).toBe('hidden');
    controller.open(floating);
    expect(document.body.style.overflow).toBe('hidden');
    controller.open(inner);
    expect(document.body.style.overflow).toBe('hidden');

    controller.close(inner);
    expect(document.body.style.overflow).toBe('hidden');
    expect(outer?.hasAttribute('hidden')).toBe(false);
    controller.close(floating);
    expect(document.body.style.overflow).toBe('hidden');
    controller.close(outer);
    expect(document.body.style.overflow).toBe('scroll');

    controller.open(outer);
    expect(document.body.style.overflow).toBe('hidden');
    controller.destroy();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('counts an open sheet in hasOpenDialogOverlay', () => {
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();
    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet');

    expect(hasOpenDialogOverlay()).toBe(false);
    controller.open(overlay);
    expect(hasOpenDialogOverlay()).toBe(true);
    controller.close(overlay);
    expect(hasOpenDialogOverlay()).toBe(false);

    controller.destroy();
  });

  it('supports keyboard activation for non-button openers', () => {
    document.body.innerHTML = `
      <div sheet-overlay id="plain-sheet" hidden>
        <div sheet>
          <div sheet-close></div>
          <div sheet-header><h2>Plain</h2></div>
        </div>
      </div>
      <div aria-controls="plain-sheet">Open me</div>
    `;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const opener = document.querySelector<HTMLElement>('[aria-controls]');
    const overlay = document.getElementById('plain-sheet');

    expect(opener?.getAttribute('role')).toBe('button');
    expect(opener?.getAttribute('tabindex')).toBe('0');

    opener?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(document.querySelector('[sheet]')?.getAttribute('detent')).toBe('half');

    controller.destroy();
  });

  it('syncs late-rendered sheet markup', async () => {
    stopSheetRuntime();
    const controller = createSheet({ root: document.body });

    document.body.innerHTML = `
      <div sheet-overlay id="late-sheet" hidden>
        <div sheet>
          <button type="button" sheet-close></button>
          <div sheet-header><h2>Late</h2></div>
        </div>
      </div>
      <button type="button" aria-controls="late-sheet">Open late</button>
    `;

    await flushRuntime();

    const overlay = document.getElementById('late-sheet');
    const dialog = document.querySelector<HTMLElement>('[sheet]');
    const opener = document.querySelector<HTMLElement>('[aria-controls]');

    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('late-sheet-title');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(dialog?.getAttribute('detent')).toBe('half');

    controller.destroy();
  });

  it('publishes juice:change for open and keeps the first observation silent', () => {
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();
    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet')!;
    const heard = listen();

    controller.open(overlay);
    controller.open(overlay);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.bubbles).toBe(true);
    expect(heard.events[0]?.target).toBe(overlay);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'sheet',
      state: { open: true, detent: 'half', dragging: false, modal: true },
    });

    controller.close(overlay);
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail.state).toMatchObject({ open: false, dragging: false });

    heard.stop();
    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = sheetMarkup;
    startSheetRuntime();

    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet');
    const opener = document.getElementById('demo-open');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    controller.destroy();
  });

  it('does not close an open drawer when a sheet opens', () => {
    document.body.innerHTML = `
      <div drawer-overlay id="demo-drawer">
        <div drawer><h2>Filters</h2></div>
      </div>
      ${sheetMarkup}
    `;
    stopSheetRuntime();
    const controller = createSheet({ root: document.body });
    controller.open(document.getElementById('demo-open'));
    expect(document.getElementById('demo-sheet')?.hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('demo-drawer')?.hasAttribute('hidden')).toBe(false);
    controller.destroy();
  });
});

describe('sheet drag', () => {
  it('snaps to the nearest detent from distance and to the next from a flick', async () => {
    installDetents();
    document.body.innerHTML = `
      <div sheet-overlay id="sheet" hidden>
        <div sheet sheet-detents="peek half full">
          <div sheet-handle id="handle"></div>
          <div sheet-header><h2>Drag</h2></div>
          <div sheet-body id="body">Body</div>
        </div>
      </div>
    `;
    stopSheetRuntime();
    const clock = useClock();
    const controller = createSheet({ root: document.body });
    const sheet = document.querySelector<HTMLElement>('[sheet]')!;
    const handle = document.getElementById('handle')!;
    const heard = listen();

    controller.open(document.getElementById('sheet'));
    expect(sheet.getAttribute('detent')).toBe('half');

    clock.set(0);
    point(handle, 'pointerdown', 300);
    clock.advance(1000);
    point(document, 'pointermove', 150);
    point(document, 'pointerup', 150);
    expect(sheet.getAttribute('detent')).toBe('full');
    expect(sheet.hasAttribute('dragging')).toBe(false);
    expect(controller.getState()?.dragging).toBe(false);

    await flushRuntime();
    expect(sheet.style.height).toBe('');

    await flushRuntime();
    clock.set(2000);
    point(handle, 'pointerdown', 300);
    clock.advance(30);
    point(document, 'pointermove', 320);
    point(document, 'pointerup', 320);
    expect(sheet.getAttribute('detent')).toBe('half');

    const dragEvents = heard.events.filter(
      (event) =>
        event.detail.runtime === 'sheet' &&
        (event.detail.state.dragging || event.detail.state.detent === 'full')
    );
    expect(dragEvents.some((event) => event.detail.state.dragging)).toBe(true);
    expect(dragEvents.some((event) => event.detail.state.detent === 'full' && event.detail.state.dragging === false)).toBe(true);

    heard.stop();
    controller.destroy();
  });

  it('rubber-bands past the ends and closes when dragged below the lowest detent', async () => {
    installDetents();
    document.body.innerHTML = `
      <div sheet-overlay id="sheet" hidden>
        <div sheet sheet-detents="half full">
          <div sheet-header id="header"><h2>Drag</h2></div>
        </div>
      </div>
    `;
    stopSheetRuntime();
    const clock = useClock();
    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('sheet')!;
    const sheet = overlay.querySelector<HTMLElement>('[sheet]')!;
    const header = document.getElementById('header')!;

    controller.open(overlay);
    clock.set(0);
    point(header, 'pointerdown', 400);
    clock.advance(40);
    point(document, 'pointermove', 100);
    expect(sheet.hasAttribute('dragging')).toBe(true);
    expect(overlay.getAttribute('data-motion-state')).toBe('entered');
    expect(sheet.style.height).toBe('400px');
    expect(sheet.style.transform).toBe('translateY(-35px)');

    point(document, 'pointerup', 100);
    expect(sheet.getAttribute('detent')).toBe('full');

    await flushRuntime();
    clock.set(500);
    point(header, 'pointerdown', 200);
    clock.advance(800);
    point(document, 'pointermove', 500);
    expect(sheet.style.height).toBe('200px');
    expect(sheet.style.transform).toBe('translateY(35px)');
    point(document, 'pointerup', 500);
    expect(overlay.hasAttribute('hidden')).toBe(true);
    expect(controller.getState(overlay)?.open).toBe(false);

    controller.destroy();
  });

  it('closes from a downward flick at the lowest detent without a long drag', () => {
    installDetents();
    document.body.innerHTML = `
      <div sheet-overlay id="sheet" hidden>
        <div sheet sheet-detents="half full">
          <div sheet-handle id="handle"></div>
        </div>
      </div>
    `;
    stopSheetRuntime();
    const clock = useClock();
    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('sheet')!;
    const handle = document.getElementById('handle')!;

    controller.open(overlay);
    clock.set(0);
    point(handle, 'pointerdown', 200);
    clock.advance(20);
    point(document, 'pointermove', 230);
    point(document, 'pointerup', 230);
    expect(overlay.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('hands body scrolling to the sheet only at the top while dragging down', () => {
    installDetents();
    document.body.innerHTML = `
      <div sheet-overlay id="sheet" hidden>
        <div sheet sheet-detents="peek half full">
          <div sheet-body id="body">Body</div>
        </div>
      </div>
    `;
    stopSheetRuntime();
    const clock = useClock();
    const controller = createSheet({ root: document.body });
    const sheet = document.querySelector<HTMLElement>('[sheet]')!;
    const body = document.getElementById('body')!;
    Object.defineProperty(body, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 40,
    });

    controller.open(document.getElementById('sheet'));
    clock.set(0);
    point(body, 'pointerdown', 200);
    clock.advance(30);
    point(document, 'pointermove', 260);
    expect(sheet.hasAttribute('dragging')).toBe(false);

    body.scrollTop = 0;
    clock.set(100);
    point(body, 'pointerdown', 200);
    clock.advance(30);
    point(document, 'pointermove', 160);
    expect(sheet.hasAttribute('dragging')).toBe(false);
    point(document, 'pointerup', 160);

    clock.set(200);
    point(body, 'pointerdown', 200);
    clock.advance(30);
    point(document, 'pointermove', 240);
    expect(sheet.hasAttribute('dragging')).toBe(true);
    point(document, 'pointercancel', 240);
    expect(sheet.hasAttribute('dragging')).toBe(false);
    expect(sheet.getAttribute('detent')).toBe('half');
    expect(sheet.style.height).toBe('');
    expect(document.getElementById('sheet')?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('clamps the drag instead of rubber-banding when reduced motion is set', () => {
    stubReducedMotion(true);
    installDetents();
    document.body.innerHTML = `
      <div sheet-overlay id="sheet" hidden>
        <div sheet sheet-detents="half full">
          <div sheet-handle id="handle"></div>
        </div>
      </div>
    `;
    stopSheetRuntime();
    const clock = useClock();
    const controller = createSheet({ root: document.body });
    const sheet = document.querySelector<HTMLElement>('[sheet]')!;
    const handle = document.getElementById('handle')!;

    controller.open(document.getElementById('sheet'));
    clock.set(0);
    point(handle, 'pointerdown', 400);
    clock.advance(40);
    point(document, 'pointermove', 100);
    expect(sheet.style.height).toBe('400px');
    expect(sheet.style.transform).toBe('');
    point(document, 'pointerup', 100);
    expect(sheet.getAttribute('detent')).toBe('full');
    expect(sheet.style.height).toBe('');

    controller.destroy();
  });
});

describe('sheet keyboard', () => {
  it('snaps an open sheet to full when html gains keyboard-open', async () => {
    document.body.innerHTML = `
      <div sheet-overlay id="sheet" hidden>
        <div sheet sheet-detents="peek half full"><h2>Keys</h2></div>
      </div>
      <div sheet-overlay id="peek" hidden>
        <div sheet sheet-detents="peek"><h2>Peek</h2></div>
      </div>
    `;
    stopSheetRuntime();
    const controller = createSheet({ root: document.body });
    const sheet = document.querySelector<HTMLElement>('#sheet [sheet]')!;
    const peek = document.querySelector<HTMLElement>('#peek [sheet]')!;
    const heard = listen(document.getElementById('sheet')!);

    controller.open(document.getElementById('sheet'));
    controller.open(document.getElementById('peek'));
    expect(sheet.getAttribute('detent')).toBe('half');
    heard.events.length = 0;

    document.documentElement.setAttribute('keyboard-open', '');
    await flushRuntime();

    expect(sheet.getAttribute('detent')).toBe('full');
    expect(peek.getAttribute('detent')).toBe('peek');
    expect(heard.events.some((event) => event.detail.state.detent === 'full')).toBe(true);
    expect(controller.getState(document.getElementById('sheet'))).toMatchObject({
      open: true,
      detent: 'full',
      modal: true,
    });

    document.documentElement.setAttribute('keyboard-open', '');
    await flushRuntime();
    const fullEvents = heard.events.filter((event) => event.detail.state.detent === 'full');
    expect(fullEvents).toHaveLength(1);

    controller.destroy();
    heard.stop();
  });

  it('opens at full when the keyboard is already open', () => {
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();
    document.documentElement.setAttribute('keyboard-open', '');
    const controller = createSheet({ root: document.body });
    controller.open(document.getElementById('demo-open'));
    expect(document.querySelector('[sheet]')?.getAttribute('detent')).toBe('full');
    controller.destroy();
  });
});

describe('startSheetRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();

    const first = startSheetRuntime();
    const second = startSheetRuntime();
    const overlay = document.getElementById('demo-sheet');
    const opener = document.getElementById('demo-open');

    expect(first).toBe(second);

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopSheetRuntime', async () => {
    stopSheetRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./sheet-runtime.js');
    document.body.innerHTML = sheetMarkup;
    mod.stopSheetRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const opener = document.getElementById('demo-open');
    const overlay = document.getElementById('demo-sheet');
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(true);

    mod.startSheetRuntime();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    mod.stopSheetRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});

describe('sheet motion', () => {
  it('removes hidden before enter and sets it only after the exit ends', async () => {
    stubMotionDuration('120ms');
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet');
    const opener = document.getElementById('demo-open');
    const panel = overlay?.querySelector('[sheet]');

    opener?.focus();
    controller.open(opener);
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(overlay?.getAttribute('data-motion-state')).toBe('entering');
    expect(panel?.getAttribute('detent')).toBe('half');
    expect(overlay?.contains(document.activeElement)).toBe(true);

    controller.close(overlay);
    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(overlay?.getAttribute('data-motion-state')).toBe('exiting');
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    panel?.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(overlay?.hasAttribute('hidden')).toBe(false);

    overlay?.dispatchEvent(new Event('animationend', { bubbles: true }));
    await flushMotion();

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(opener);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('reopening mid-exit leaves the sheet open and not hidden', async () => {
    stubMotionDuration('120ms');
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet');
    const opener = document.getElementById('demo-open');

    controller.open(opener);
    controller.close(overlay);
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(overlay?.getAttribute('data-motion-state')).toBe('entering');

    overlay?.dispatchEvent(new Event('animationend', { bubbles: true }));
    await flushMotion();

    expect(overlay?.hasAttribute('hidden')).toBe(false);
    expect(overlay?.getAttribute('data-motion-state')).toBe('entered');

    controller.destroy();
  });

  it('closes immediately when reduced motion is preferred', () => {
    stubReducedMotion(true);
    stubMotionDuration('120ms');
    document.body.innerHTML = sheetMarkup;
    stopSheetRuntime();

    const controller = createSheet({ root: document.body });
    const overlay = document.getElementById('demo-sheet');
    const opener = document.getElementById('demo-open');

    opener?.focus();
    controller.open(opener);
    controller.close(overlay);

    expect(overlay?.hasAttribute('hidden')).toBe(true);
    expect(overlay?.getAttribute('data-motion-state')).toBe('exited');
    expect(document.activeElement).toBe(opener);

    controller.destroy();
  });
});
