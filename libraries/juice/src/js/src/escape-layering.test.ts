// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAccordion,
  stopAccordionRuntime,
} from './accordion/accordion-runtime.js';
import {
  createBanner,
  stopBannerRuntime,
} from './banner/banner-runtime.js';
import {
  createCombobox,
  stopComboboxRuntime,
} from './combobox/combobox-runtime.js';
import { JUICE_CHANGE_EVENT } from './shared/change.js';
import { __resetDialogLayersForTests } from './shared/dialog-layer.js';
import {
  __resetLayerStackForTests,
  topLayer,
} from './shared/layer-stack.js';
import { __resetLightLayersForTests } from './shared/light-layer.js';
import { flushMotion, stubMotionDuration } from './shared/motion-test-utils.js';
import {
  createDrawer,
  stopDrawerRuntime,
} from './drawer/drawer-runtime.js';
import {
  createMenu,
  stopMenuRuntime,
} from './menu/menu-runtime.js';
import {
  createModal,
  startModalRuntime,
  stopModalRuntime,
} from './modal/modal-runtime.js';
import {
  createSheet,
  stopSheetRuntime,
} from './sheet/sheet-runtime.js';
import {
  createPopover,
  stopPopoverRuntime,
} from './popover/popover-runtime.js';
import {
  createToast,
  stopToastRuntime,
} from './toast/toast-runtime.js';
import {
  createTooltip,
  stopTooltipRuntime,
} from './tooltip/tooltip-runtime.js';

/**
 * Escape / layering contract.
 *
 * Modal, drawer, sheet, popover, menu, and combobox share one open-order
 * stack. The last one opened owns Escape and outside pointerdown. A
 * backdrop press closes only the top dialog. Presses on openers and the
 * rest of the page do not dismiss a dialog. An outside pointer closes
 * only the top light layer and leaves the layer under it open. Tab and
 * focus-in trap only when the top of the stack is itself modal. A
 * non-modal sheet on top suspends that trap until it closes. Popping a
 * layer dismisses layers above it with reason 'cascade'. A dialog
 * dismissed that way does not return focus. The dialog that was popped
 * still does. Tooltip and toast stay off the stack. An open tooltip
 * consumes Escape and closes only itself. A toast never takes Escape
 * while a stack layer is open.
 * [banner] never steals Escape. [accordion] Escape stays contextual.
 */

const resetDom = () => {
  document.body.innerHTML = '';
};

const pressEscape = (target: EventTarget = document.body) => {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    })
  );
};

const isHidden = (id: string) =>
  Boolean(document.getElementById(id)?.hasAttribute('hidden'));

const stackedMarkup = `
  <div modal-overlay id="stack-modal">
    <div modal>
      <button type="button" modal-close aria-label="Close">×</button>
      <div modal-header><h2>Account</h2></div>
    </div>
  </div>
  <div drawer-overlay id="stack-drawer">
    <div drawer>
      <button type="button" drawer-close aria-label="Close">×</button>
      <h2>Filters</h2>
    </div>
  </div>
  <button type="button" id="stack-pop-open" aria-controls="stack-pop">Help</button>
  <div popover-root id="stack-pop">
    <div popover-panel>
      <button type="button" popover-close aria-label="Close">×</button>
      <div popover-body>Help</div>
    </div>
  </div>
  <div menu-root>
    <button type="button" menu-button id="stack-menu-open" aria-haspopup="menu" aria-controls="stack-menu">File</button>
    <div menu id="stack-menu">
      <button type="button" menuitem>New</button>
    </div>
  </div>
  <div combobox id="stack-combo">
    <input combobox-input id="stack-combo-input" type="text" />
    <ul combobox-list id="stack-combo-list">
      <li combobox-option>Apple</li>
    </ul>
  </div>
  <div toast-region>
    <div toast id="stack-toast">Saved.</div>
  </div>
  <button type="button" id="stack-tip-trigger" aria-describedby="stack-tip">Save</button>
  <div tooltip-root id="stack-tip">
    <div tooltip-panel role="tooltip">Saves your draft</div>
  </div>
  <div banner id="stack-banner">
    <div banner-body>Scheduled maintenance tonight.</div>
    <button type="button" banner-close aria-label="Dismiss">×</button>
  </div>
`;

const mountStacked = () => {
  document.body.innerHTML = stackedMarkup;
  stopModalRuntime();
  stopDrawerRuntime();
  stopPopoverRuntime();
  stopMenuRuntime();
  stopComboboxRuntime();
  stopToastRuntime();
  stopTooltipRuntime();
  stopBannerRuntime();

  return {
    modal: createModal({ root: document.body }),
    drawer: createDrawer({ root: document.body }),
    popover: createPopover({ root: document.body }),
    menu: createMenu({ root: document.body }),
    combobox: createCombobox({ root: document.body }),
    toast: createToast({ root: document.body, defaultDuration: 0 }),
    tooltip: createTooltip({ root: document.body, hideDelay: 0 }),
    banner: createBanner({ root: document.body }),
  };
};

const destroyStacked = (controllers: ReturnType<typeof mountStacked>) => {
  controllers.modal.destroy();
  controllers.drawer.destroy();
  controllers.popover.destroy();
  controllers.menu.destroy();
  controllers.combobox.destroy();
  controllers.toast.destroy();
  controllers.tooltip.destroy();
  controllers.banner.destroy();
};

afterEach(() => {
  stopModalRuntime();
  stopDrawerRuntime();
  stopPopoverRuntime();
  stopMenuRuntime();
  stopComboboxRuntime();
  stopToastRuntime();
  stopTooltipRuntime();
  stopBannerRuntime();
  stopAccordionRuntime();
  stopSheetRuntime();
  __resetDialogLayersForTests();
  __resetLightLayersForTests();
  __resetLayerStackForTests();
  resetDom();
});

describe('Escape / layering contract', () => {
  it('keeps modal and drawer independently exclusive (both may be open)', () => {
    const controllers = mountStacked();

    expect(isHidden('stack-modal')).toBe(false);
    expect(isHidden('stack-drawer')).toBe(false);

    destroyStacked(controllers);
  });

  it('closes a popover opened inside a dialog before the dialog', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Account</h2>
          <button type="button" id="open-pop" aria-controls="host-pop">Help</button>
          <div popover-root id="host-pop" hidden>
            <div popover-panel><div popover-body>Help</div></div>
          </div>
        </div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const popover = createPopover({ root: document.body });

    modal.open(document.getElementById('open-modal'));
    popover.open(document.getElementById('open-pop'));
    pressEscape();

    expect(isHidden('host-pop')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);
    expect(topLayer()?.el.id).toBe('host-modal');

    pressEscape();

    expect(isHidden('host-modal')).toBe(true);
    expect(topLayer()).toBeNull();
    popover.destroy();
    modal.destroy();
  });

  it('closes a menu opened inside a dialog before the dialog', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Account</h2>
          <div menu-root>
            <button type="button" menu-button id="open-menu">File</button>
            <div menu id="host-menu" hidden>
              <button type="button" menuitem>New</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const menu = createMenu({ root: document.body });

    modal.open(document.getElementById('open-modal'));
    menu.open(document.getElementById('open-menu'));
    pressEscape();

    expect(isHidden('host-menu')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);

    pressEscape();

    expect(isHidden('host-modal')).toBe(true);
    menu.destroy();
    modal.destroy();
  });

  it('closes a combobox list inside a popover inside a dialog from the inside out', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Account</h2>
          <button type="button" id="open-pop" aria-controls="host-pop">Help</button>
          <div popover-root id="host-pop" hidden>
            <div popover-panel>
              <div combobox id="host-combo">
                <input combobox-input id="combo-input" type="text" />
                <ul combobox-list id="host-list" hidden>
                  <li combobox-option>Apple</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const popover = createPopover({ root: document.body });
    const combobox = createCombobox({ root: document.body });
    const input = document.getElementById('combo-input');

    modal.open(document.getElementById('open-modal'));
    popover.open(document.getElementById('open-pop'));
    input?.focus();
    expect(isHidden('host-list')).toBe(false);
    expect(topLayer()?.kind).toBe('combobox');

    pressEscape(input ?? document.body);
    expect(isHidden('host-list')).toBe(true);
    expect(isHidden('host-pop')).toBe(false);
    expect(isHidden('host-modal')).toBe(false);

    pressEscape();
    expect(isHidden('host-pop')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);

    pressEscape();
    expect(isHidden('host-modal')).toBe(true);
    expect(topLayer()).toBeNull();

    combobox.destroy();
    popover.destroy();
    modal.destroy();
  });

  it('hides the open tooltip on Escape while toasts remain, then dismisses the toast', () => {
    const controllers = mountStacked();
    document.getElementById('stack-modal')?.setAttribute('hidden', '');
    document.getElementById('stack-drawer')?.setAttribute('hidden', '');
    document.getElementById('stack-pop')?.setAttribute('hidden', '');
    document.getElementById('stack-menu')?.setAttribute('hidden', '');
    document.getElementById('stack-combo-list')?.setAttribute('hidden', '');

    pressEscape();

    expect(isHidden('stack-tip')).toBe(true);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    pressEscape();

    expect(isHidden('stack-toast')).toBe(true);
    expect(isHidden('stack-banner')).toBe(false);

    destroyStacked(controllers);
  });

  it('never lets a visible banner steal Escape', () => {
    document.body.innerHTML = `
      <div banner id="stack-banner">
        <div banner-body>Scheduled maintenance tonight.</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
    `;
    stopBannerRuntime();
    const banner = createBanner({ root: document.body });
    const close = document.querySelector<HTMLElement>('[banner-close]');

    pressEscape();
    expect(isHidden('stack-banner')).toBe(false);

    close?.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
      })
    );
    expect(isHidden('stack-banner')).toBe(false);

    banner.destroy();
  });

  it('keeps accordion Escape contextual and does not invent a global handler', () => {
    document.body.innerHTML = `
      <section accordion name="faq-account">
        <button type="button" id="faq-trigger" accordion-item aria-expanded="false" aria-controls="faq-panel">
          How do I update billing?
        </button>
        <div id="faq-panel" role="region" aria-labelledby="faq-trigger" hidden>
          Update billing from the account dashboard.
        </div>
      </section>
      <div banner id="stack-banner">
        <div banner-body>Notice</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
    `;
    stopAccordionRuntime();
    stopBannerRuntime();

    const accordion = createAccordion({ root: document.body });
    const banner = createBanner({ root: document.body });
    const trigger = document.getElementById('faq-trigger');
    const panel = document.getElementById('faq-panel');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);

    panel?.setAttribute('tabindex', '-1');
    panel?.focus();
    pressEscape(panel ?? document.body);

    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(isHidden('stack-banner')).toBe(false);

    accordion.destroy();
    banner.destroy();
  });

  const pressBackdrop = (target: HTMLElement) => {
    target.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    );
    target.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );
  };

  it('closes a modal opened from a drawer before the drawer', () => {
    document.body.innerHTML = `
      <button type="button" id="open-drawer" aria-controls="host-drawer">Filters</button>
      <div drawer-overlay id="host-drawer" hidden>
        <div drawer>
          <h2>Filters</h2>
          <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
          <div modal-overlay id="host-modal" hidden>
            <div modal><h2>Account</h2></div>
          </div>
        </div>
      </div>
    `;
    const drawer = createDrawer({ root: document.body });
    const modal = createModal({ root: document.body });

    drawer.open(document.getElementById('open-drawer'));
    modal.open(document.getElementById('open-modal'));
    pressEscape();

    expect(isHidden('host-modal')).toBe(true);
    expect(isHidden('host-drawer')).toBe(false);

    pressEscape();

    expect(isHidden('host-drawer')).toBe(true);
    modal.destroy();
    drawer.destroy();
  });

  it('closes a drawer opened from a modal before the modal', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Account</h2>
          <button type="button" id="open-drawer" aria-controls="host-drawer">Filters</button>
          <div drawer-overlay id="host-drawer" hidden>
            <div drawer><h2>Filters</h2></div>
          </div>
        </div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const drawer = createDrawer({ root: document.body });

    modal.open(document.getElementById('open-modal'));
    drawer.open(document.getElementById('open-drawer'));
    pressEscape();

    expect(isHidden('host-drawer')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);

    pressEscape();

    expect(isHidden('host-modal')).toBe(true);
    drawer.destroy();
    modal.destroy();
  });

  it('lets the last opened dialog own Escape between a modal sheet and a modal', () => {
    document.body.innerHTML = `
      <button type="button" id="open-sheet" aria-controls="host-sheet">Sheet</button>
      <div sheet-overlay id="host-sheet" hidden>
        <div sheet><h2>Sheet</h2></div>
      </div>
      <button type="button" id="open-modal" aria-controls="host-modal">Modal</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal><h2>Modal</h2></div>
      </div>
    `;
    const sheet = createSheet({ root: document.body });
    const modal = createModal({ root: document.body });

    sheet.open(document.getElementById('open-sheet'));
    modal.open(document.getElementById('open-modal'));
    pressEscape();

    expect(isHidden('host-modal')).toBe(true);
    expect(isHidden('host-sheet')).toBe(false);

    sheet.close(document.getElementById('host-sheet'));
    modal.open(document.getElementById('open-modal'));
    sheet.open(document.getElementById('open-sheet'));
    pressEscape();

    expect(isHidden('host-sheet')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);

    sheet.destroy();
    modal.destroy();
  });

  it('suspends the modal focus trap while a non-modal sheet is the top layer', () => {
    document.body.innerHTML = `
      <button type="button" id="outside">Elsewhere</button>
      <button type="button" id="open-modal" aria-controls="host-modal">Modal</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Modal</h2>
          <button type="button" id="modal-first">Save</button>
          <button type="button" id="modal-last">Done</button>
        </div>
      </div>
      <button type="button" id="open-sheet" aria-controls="host-sheet">Sheet</button>
      <div sheet-overlay="none" id="host-sheet" hidden>
        <div sheet>
          <h2>Sheet</h2>
          <button type="button" id="sheet-action">Keep</button>
        </div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const sheet = createSheet({ root: document.body });
    const sheetAction = document.getElementById('sheet-action');
    const outside = document.getElementById('outside');
    const modalHost = document.getElementById('host-modal');
    const modalFirst = document.getElementById('modal-first');
    const modalLast = document.getElementById('modal-last');

    modal.open(document.getElementById('open-modal'));
    sheet.open(document.getElementById('open-sheet'));

    sheetAction?.focus();
    expect(document.activeElement).toBe(sheetAction);
    const tab = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    });
    sheetAction?.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(sheetAction);
    expect(modalHost?.contains(document.activeElement)).toBe(false);

    outside?.focus();
    expect(document.activeElement).toBe(outside);
    expect(isHidden('host-sheet')).toBe(false);
    expect(isHidden('host-modal')).toBe(false);

    pressEscape();

    expect(isHidden('host-sheet')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);

    modalFirst?.focus();
    outside?.focus();
    expect(modalHost?.contains(document.activeElement)).toBe(true);

    modalLast?.focus();
    const resume = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    });
    modalLast?.dispatchEvent(resume);
    expect(resume.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(modalFirst);

    pressEscape();
    expect(isHidden('host-modal')).toBe(true);
    sheet.destroy();
    modal.destroy();
  });

  it('closes only the top dialog when a lower backdrop is pressed', () => {
    document.body.innerHTML = `
      <button type="button" id="open-drawer" aria-controls="host-drawer">Filters</button>
      <div drawer-overlay id="host-drawer" hidden>
        <div drawer><h2>Filters</h2></div>
      </div>
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal><h2>Account</h2></div>
      </div>
    `;
    const drawer = createDrawer({ root: document.body });
    const modal = createModal({ root: document.body });

    drawer.open(document.getElementById('open-drawer'));
    modal.open(document.getElementById('open-modal'));
    pressBackdrop(document.getElementById('host-drawer') as HTMLElement);

    expect(isHidden('host-modal')).toBe(true);
    expect(isHidden('host-drawer')).toBe(false);

    pressBackdrop(document.getElementById('host-drawer') as HTMLElement);

    expect(isHidden('host-drawer')).toBe(true);
    modal.destroy();
    drawer.destroy();
  });

  it('emits juice:change top-down when a lower dialog pop cascades', () => {
    document.body.innerHTML = `
      <button type="button" id="open-drawer" aria-controls="host-drawer">Filters</button>
      <div drawer-overlay id="host-drawer" hidden>
        <div drawer><h2>Filters</h2></div>
      </div>
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal><h2>Account</h2></div>
      </div>
    `;
    const seen: Array<{ id: string; runtime: string; open: boolean }> = [];
    const onChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as {
        runtime?: string;
        state?: { open?: boolean };
      };
      const target = event.target;
      if (!(target instanceof HTMLElement) || !detail.runtime) return;
      if (typeof detail.state?.open !== 'boolean') return;
      seen.push({
        id: target.id,
        runtime: detail.runtime,
        open: detail.state.open,
      });
    };
    document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);

    const drawer = createDrawer({ root: document.body });
    const modal = createModal({ root: document.body });
    drawer.open(document.getElementById('open-drawer'));
    modal.open(document.getElementById('open-modal'));
    seen.length = 0;

    drawer.close(document.getElementById('host-drawer'));

    expect(seen).toEqual([
      { id: 'host-modal', runtime: 'modal', open: false },
      { id: 'host-drawer', runtime: 'drawer', open: false },
    ]);
    expect(isHidden('host-modal')).toBe(true);
    expect(isHidden('host-drawer')).toBe(true);

    document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange);
    modal.destroy();
    drawer.destroy();
  });

  it('cascades layers above a modal when a later modal replaces it', () => {
    document.body.innerHTML = `
      <button type="button" id="open-a" aria-controls="modal-a">A</button>
      <div modal-overlay id="modal-a" hidden>
        <div modal><h2>A</h2></div>
      </div>
      <button type="button" id="open-drawer" aria-controls="host-drawer">Filters</button>
      <div drawer-overlay id="host-drawer" hidden>
        <div drawer><h2>Filters</h2></div>
      </div>
      <button type="button" id="open-b" aria-controls="modal-b">B</button>
      <div modal-overlay id="modal-b" hidden>
        <div modal><h2>B</h2></div>
      </div>
    `;
    const seen: Array<{ id: string; runtime: string; open: boolean }> = [];
    const onChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as {
        runtime?: string;
        state?: { open?: boolean };
      };
      const target = event.target;
      if (!(target instanceof HTMLElement) || !detail.runtime) return;
      if (typeof detail.state?.open !== 'boolean') return;
      seen.push({
        id: target.id,
        runtime: detail.runtime,
        open: detail.state.open,
      });
    };
    document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);

    const modal = createModal({ root: document.body });
    const drawer = createDrawer({ root: document.body });
    modal.open(document.getElementById('open-a'));
    drawer.open(document.getElementById('open-drawer'));
    seen.length = 0;

    modal.open(document.getElementById('open-b'));

    expect(seen).toEqual([
      { id: 'host-drawer', runtime: 'drawer', open: false },
      { id: 'modal-a', runtime: 'modal', open: false },
      { id: 'modal-b', runtime: 'modal', open: true },
    ]);
    expect(isHidden('host-drawer')).toBe(true);
    expect(isHidden('modal-a')).toBe(true);
    expect(isHidden('modal-b')).toBe(false);
    expect(topLayer()?.el.id).toBe('modal-b');
    expect(topLayer()?.kind).toBe('modal');

    document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange);
    drawer.destroy();
    modal.destroy();
  });

  it('restores the original body overflow after two modal sheets close', () => {
    document.body.innerHTML = `
      <div sheet-overlay id="sheet-a" hidden><div sheet><h2>A</h2></div></div>
      <div sheet-overlay id="sheet-b" hidden><div sheet><h2>B</h2></div></div>
    `;
    document.body.style.overflow = 'scroll';
    const sheet = createSheet({ root: document.body });
    const first = document.getElementById('sheet-a');
    const second = document.getElementById('sheet-b');

    sheet.open(first);
    sheet.open(second);
    expect(document.body.style.overflow).toBe('hidden');

    sheet.close(second);
    expect(document.body.style.overflow).toBe('hidden');
    sheet.close(first);
    expect(document.body.style.overflow).toBe('scroll');

    sheet.destroy();
  });

  it('drops stack listeners when a dialog host is destroyed while another is open', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal><h2>Account</h2></div>
      </div>
      <button type="button" id="open-drawer" aria-controls="host-drawer">Filters</button>
      <div drawer-overlay id="host-drawer" hidden>
        <div drawer><h2>Filters</h2></div>
      </div>
    `;
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const modal = createModal({ root: document.body });
    const drawer = createDrawer({ root: document.body });

    modal.open(document.getElementById('open-modal'));
    drawer.open(document.getElementById('open-drawer'));

    const stackAdds = add.mock.calls.filter(
      (call) => call[0] === 'keydown' && call[2] === true
    );
    expect(stackAdds).toHaveLength(1);
    expect(topLayer()?.el.id).toBe('host-drawer');

    modal.destroy();
    drawer.destroy();

    const stackRemoves = remove.mock.calls.filter(
      (call) => call[0] === 'keydown' && call[2] === true
    );
    expect(stackRemoves).toHaveLength(1);
    expect(topLayer()).toBeNull();

    document.body.innerHTML = `
      <button type="button" id="open-fresh" aria-controls="fresh-modal">Again</button>
      <div modal-overlay id="fresh-modal" hidden>
        <div modal><h2>Again</h2></div>
      </div>
    `;
    const fresh = createModal({ root: document.body });
    fresh.open(document.getElementById('open-fresh'));
    pressEscape();

    expect(isHidden('fresh-modal')).toBe(true);
    expect(topLayer()).toBeNull();
    pressEscape();
    fresh.destroy();
  });

  it('does not attach a second listener when the modal runtime starts twice', () => {
    stopModalRuntime();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const captureAdds = (type: string) =>
      add.mock.calls.filter((call) => call[0] === type && call[2] === true).length;

    startModalRuntime();
    expect(captureAdds('keydown')).toBe(1);
    expect(captureAdds('pointerdown')).toBe(1);

    startModalRuntime();
    expect(captureAdds('keydown')).toBe(1);
    expect(captureAdds('pointerdown')).toBe(1);

    stopModalRuntime();
    expect(
      remove.mock.calls.filter((call) => call[0] === 'keydown' && call[2] === true)
    ).toHaveLength(1);

    add.mockClear();
    startModalRuntime();
    expect(captureAdds('keydown')).toBe(1);
    expect(captureAdds('pointerdown')).toBe(1);
    stopModalRuntime();
  });

  it('ignores a defaultPrevented Escape on the top dialog', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal><h2>Account</h2></div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    modal.open(document.getElementById('open-modal'));
    const consume = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', consume, true);

    pressEscape();
    expect(isHidden('host-modal')).toBe(false);

    window.removeEventListener('keydown', consume, true);
    pressEscape();
    expect(isHidden('host-modal')).toBe(true);
    modal.destroy();
  });

  it('gives an open tooltip Escape without closing the popover or the toast under it', () => {
    document.body.innerHTML = `
      <button type="button" id="open-pop" aria-controls="host-pop">Help</button>
      <div popover-root id="host-pop" hidden>
        <div popover-panel>
          <button type="button" id="tip-trigger" aria-describedby="host-tip">Save</button>
          <div popover-body>Help</div>
        </div>
      </div>
      <div tooltip-root id="host-tip" hidden>
        <div tooltip-panel role="tooltip">Saves your draft</div>
      </div>
      <div toast-region>
        <div toast id="host-toast">Saved.</div>
      </div>
    `;
    const popover = createPopover({ root: document.body });
    const tooltip = createTooltip({ root: document.body, hideDelay: 0 });
    const toast = createToast({ root: document.body, defaultDuration: 0 });

    popover.open(document.getElementById('open-pop'));
    tooltip.show(document.getElementById('tip-trigger'));
    pressEscape();

    expect(isHidden('host-tip')).toBe(true);
    expect(isHidden('host-pop')).toBe(false);
    expect(isHidden('host-toast')).toBe(false);
    expect(topLayer()?.kind).toBe('popover');

    pressEscape();

    expect(isHidden('host-pop')).toBe(true);
    expect(isHidden('host-toast')).toBe(false);
    expect(topLayer()).toBeNull();

    toast.destroy();
    tooltip.destroy();
    popover.destroy();
  });

  it('lets a dialog own Escape while a toast is visible', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal><h2>Account</h2></div>
      </div>
      <div toast-region>
        <div toast id="host-toast">Saved.</div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const toast = createToast({ root: document.body, defaultDuration: 0 });
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });

    modal.open(document.getElementById('open-modal'));
    document.body.dispatchEvent(event);

    expect(isHidden('host-modal')).toBe(true);
    expect(isHidden('host-toast')).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(topLayer()).toBeNull();

    pressEscape();
    expect(isHidden('host-toast')).toBe(true);

    toast.destroy();
    modal.destroy();
  });

  it('cascades an open popover and listbox when their dialog closes', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Account</h2>
          <button type="button" id="open-pop" aria-controls="host-pop">Help</button>
          <div popover-root id="host-pop" hidden>
            <div popover-panel>
              <div combobox id="host-combo">
                <input combobox-input id="combo-input" type="text" />
                <ul combobox-list id="host-list" hidden>
                  <li combobox-option>Apple</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const seen: Array<{ id: string; runtime: string; open: boolean }> = [];
    const onChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as {
        runtime?: string;
        state?: { open?: boolean };
      };
      const target = event.target;
      if (!(target instanceof HTMLElement) || !detail.runtime) return;
      if (typeof detail.state?.open !== 'boolean') return;
      seen.push({
        id: target.id,
        runtime: detail.runtime,
        open: detail.state.open,
      });
    };
    document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);

    const modal = createModal({ root: document.body });
    const popover = createPopover({ root: document.body });
    const combobox = createCombobox({ root: document.body });

    modal.open(document.getElementById('open-modal'));
    popover.open(document.getElementById('open-pop'));
    document.getElementById('combo-input')?.focus();
    seen.length = 0;

    modal.close(document.getElementById('host-modal'));

    expect(seen).toEqual([
      { id: 'host-combo', runtime: 'combobox', open: false },
      { id: 'host-pop', runtime: 'popover', open: false },
      { id: 'host-modal', runtime: 'modal', open: false },
    ]);
    expect(isHidden('host-list')).toBe(true);
    expect(isHidden('host-pop')).toBe(true);
    expect(isHidden('host-modal')).toBe(true);
    expect(topLayer()).toBeNull();

    document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange);
    combobox.destroy();
    popover.destroy();
    modal.destroy();
  });

  it('closes only the top layer on an outside pointerdown', async () => {
    document.body.innerHTML = `
      <button type="button" id="outside">Elsewhere</button>
      <button type="button" id="open-modal" aria-controls="host-modal">Account</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Account</h2>
          <button type="button" id="open-pop" aria-controls="host-pop">Help</button>
          <div popover-root id="host-pop" hidden>
            <div popover-panel>
              <div combobox id="host-combo">
                <input combobox-input id="combo-input" type="text" />
                <ul combobox-list id="host-list" hidden>
                  <li combobox-option>Apple</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const popover = createPopover({ root: document.body });
    const combobox = createCombobox({ root: document.body });
    const outside = document.getElementById('outside') as HTMLElement;

    modal.open(document.getElementById('open-modal'));
    popover.open(document.getElementById('open-pop'));
    document.getElementById('combo-input')?.focus();

    outside.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    );
    await Promise.resolve();
    outside.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );

    expect(isHidden('host-list')).toBe(true);
    expect(isHidden('host-pop')).toBe(false);
    expect(isHidden('host-modal')).toBe(false);
    expect(topLayer()?.kind).toBe('popover');

    outside.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    );
    await Promise.resolve();
    outside.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );

    expect(isHidden('host-pop')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);
    expect(topLayer()?.kind).toBe('modal');

    combobox.destroy();
    popover.destroy();
    modal.destroy();
  });
});

describe('cascade dialog focus', () => {
  type Kind = 'modal' | 'drawer' | 'sheet';

  const pairs: Array<{ label: string; lower: Kind; upper: Kind }> = [
    { label: 'modal then modal', lower: 'modal', upper: 'modal' },
    { label: 'modal then drawer', lower: 'modal', upper: 'drawer' },
    { label: 'modal then sheet', lower: 'modal', upper: 'sheet' },
  ];

  const markup = (kind: Kind, id: string, openerId: string) => {
    const opener = `<button type="button" id="${openerId}" aria-controls="${id}">Open ${id}</button>`;
    if (kind === 'drawer') {
      return `${opener}
        <div drawer-overlay id="${id}" hidden>
          <div drawer>
            <h2>${id}</h2>
            <button type="button">Keep</button>
          </div>
        </div>`;
    }
    if (kind === 'sheet') {
      return `${opener}
        <div sheet-overlay id="${id}" hidden>
          <div sheet>
            <h2>${id}</h2>
            <button type="button">Keep</button>
          </div>
        </div>`;
    }
    return `${opener}
      <div modal-overlay id="${id}" hidden>
        <div modal>
          <h2>${id}</h2>
          <button type="button">Keep</button>
        </div>
      </div>`;
  };

  const createDialog = (kind: Kind, selector?: string) => {
    const root = document.body;
    if (kind === 'drawer') {
      return createDrawer(
        selector ? { root, overlaySelector: selector } : { root }
      );
    }
    if (kind === 'sheet') {
      return createSheet(
        selector ? { root, overlaySelector: selector } : { root }
      );
    }
    return createModal(
      selector ? { root, overlaySelector: selector } : { root }
    );
  };

  /**
   * Modals that share a selector close each other on open. Two modals stay
   * on the stack together when each controller owns its own overlay.
   */
  const mountPair = (lowerKind: Kind, upperKind: Kind) => {
    document.body.innerHTML =
      markup(lowerKind, 'lower', 'open-lower') +
      markup(upperKind, 'upper', 'open-upper');

    const separateModals = lowerKind === 'modal' && upperKind === 'modal';
    const lower = createDialog(
      lowerKind,
      separateModals ? '#lower' : undefined
    );
    const upper = createDialog(
      upperKind,
      separateModals ? '#upper' : undefined
    );
    const lowerOpener = document.getElementById('open-lower') as HTMLElement;
    const upperOpener = document.getElementById('open-upper') as HTMLElement;
    const lowerOverlay = document.getElementById('lower') as HTMLElement;
    const upperOverlay = document.getElementById('upper') as HTMLElement;

    lowerOpener.focus();
    lower.open(lowerOpener);
    upperOpener.focus();
    upper.open(upperOpener);

    return {
      lower,
      upper,
      lowerOpener,
      upperOpener,
      lowerOverlay,
      upperOverlay,
      destroy: () => {
        upper.destroy();
        lower.destroy();
      },
    };
  };

  const recordFocus = () => {
    const focused: HTMLElement[] = [];
    const original = HTMLElement.prototype.focus;
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
      this: HTMLElement,
      options?: FocusOptions
    ) {
      focused.push(this);
      original.call(this, options);
    });
    return focused;
  };

  const finishExit = async (overlay: HTMLElement) => {
    overlay.dispatchEvent(new Event('animationend', { bubbles: true }));
    await flushMotion();
  };

  const assertLowerOpener = (
    focused: readonly HTMLElement[],
    lowerOpener: HTMLElement,
    upperOpener: HTMLElement
  ) => {
    expect(document.activeElement).toBe(lowerOpener);
    expect(focused).toContain(lowerOpener);
    expect(focused).not.toContain(upperOpener);
  };

  for (const pair of pairs) {
    it(`returns focus to the lower opener when a nested ${pair.label} closes instantly`, () => {
      const mounted = mountPair(pair.lower, pair.upper);
      const focused = recordFocus();

      try {
        mounted.lower.close(mounted.lowerOverlay);

        expect(mounted.lowerOverlay.hasAttribute('hidden')).toBe(true);
        expect(mounted.upperOverlay.hasAttribute('hidden')).toBe(true);
        assertLowerOpener(focused, mounted.lowerOpener, mounted.upperOpener);
      } finally {
        vi.restoreAllMocks();
        mounted.destroy();
      }
    });

    it(`returns focus to the lower opener when a nested ${pair.label} closes after a timed exit`, async () => {
      const mounted = mountPair(pair.lower, pair.upper);
      stubMotionDuration('120ms');
      const focused = recordFocus();

      try {
        mounted.lower.close(mounted.lowerOverlay);

        expect(mounted.lowerOverlay.hasAttribute('hidden')).toBe(false);
        expect(mounted.upperOverlay.hasAttribute('hidden')).toBe(false);
        expect(mounted.lowerOverlay.getAttribute('data-motion-state')).toBe(
          'exiting'
        );

        await finishExit(mounted.lowerOverlay);

        expect(mounted.lowerOverlay.hasAttribute('hidden')).toBe(true);
        expect(mounted.upperOverlay.hasAttribute('hidden')).toBe(false);
        expect(mounted.upperOverlay.getAttribute('data-motion-state')).toBe(
          'exiting'
        );
        assertLowerOpener(focused, mounted.lowerOpener, mounted.upperOpener);

        await finishExit(mounted.upperOverlay);

        expect(mounted.upperOverlay.hasAttribute('hidden')).toBe(true);
        assertLowerOpener(focused, mounted.lowerOpener, mounted.upperOpener);
      } finally {
        vi.restoreAllMocks();
        mounted.destroy();
      }
    });
  }
});
