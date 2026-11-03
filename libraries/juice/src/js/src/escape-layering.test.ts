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
 * Modal, drawer, and sheet share one open-order stack. The last one
 * opened owns Escape and a backdrop press. Any of them may be open
 * together. Popover, menu, combobox, toast, and tooltip are not on
 * that stack yet. They still yield through the type rank below, and
 * any open dialog overlay still outranks them:
 * 1. open dialog overlay (modal / drawer / sheet), last opened first
 * 2. open [popover-root] ≈ open [menu] (dialog-adjacent band)
 * 3. open [combobox-list]
 * 4. most-recent visible [toast]
 * 5. open [tooltip-root] (toast does not block the tip)
 * 6. [banner] never steals Escape
 * 7. [accordion] Escape stays contextual; tabs / nav / wizard stay out of scope
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

  it('lets an open dialog overlay own Escape ahead of popover, menu, combobox, toast, and tooltip', () => {
    const controllers = mountStacked();
    document.getElementById('stack-drawer')?.setAttribute('hidden', '');

    pressEscape();

    expect(isHidden('stack-modal')).toBe(true);
    expect(isHidden('stack-pop')).toBe(false);
    expect(isHidden('stack-menu')).toBe(false);
    expect(isHidden('stack-combo-list')).toBe(false);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-tip')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    document.getElementById('stack-drawer')?.removeAttribute('hidden');
    pressEscape();

    expect(isHidden('stack-drawer')).toBe(true);
    expect(isHidden('stack-pop')).toBe(false);
    expect(isHidden('stack-menu')).toBe(false);
    expect(isHidden('stack-combo-list')).toBe(false);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-tip')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    destroyStacked(controllers);
  });

  it('lets an open popover own Escape after dialogs, ahead of combobox, toast, and tooltip', () => {
    const controllers = mountStacked();
    document.getElementById('stack-modal')?.setAttribute('hidden', '');
    document.getElementById('stack-drawer')?.setAttribute('hidden', '');
    document.getElementById('stack-menu')?.setAttribute('hidden', '');

    pressEscape();

    expect(isHidden('stack-pop')).toBe(true);
    expect(isHidden('stack-combo-list')).toBe(false);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-tip')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    destroyStacked(controllers);
  });

  it('lets an open menu own Escape after dialogs, same band as popover, ahead of combobox, toast, and tooltip', () => {
    const controllers = mountStacked();
    document.getElementById('stack-modal')?.setAttribute('hidden', '');
    document.getElementById('stack-drawer')?.setAttribute('hidden', '');
    document.getElementById('stack-pop')?.setAttribute('hidden', '');

    pressEscape();

    expect(isHidden('stack-menu')).toBe(true);
    expect(isHidden('stack-combo-list')).toBe(false);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-tip')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    destroyStacked(controllers);
  });

  it('lets an open combobox list own Escape after popover and menu, ahead of toast and tooltip', () => {
    const controllers = mountStacked();
    document.getElementById('stack-modal')?.setAttribute('hidden', '');
    document.getElementById('stack-drawer')?.setAttribute('hidden', '');
    document.getElementById('stack-pop')?.setAttribute('hidden', '');
    document.getElementById('stack-menu')?.setAttribute('hidden', '');

    const input = document.getElementById('stack-combo-input');
    input?.focus();
    pressEscape(input ?? document.body);

    expect(isHidden('stack-combo-list')).toBe(true);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-tip')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    destroyStacked(controllers);
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

  it('lets a non-modal sheet take Escape over a modal without trapping Tab itself', () => {
    document.body.innerHTML = `
      <button type="button" id="open-modal" aria-controls="host-modal">Modal</button>
      <div modal-overlay id="host-modal" hidden>
        <div modal>
          <h2>Modal</h2>
          <button type="button" id="modal-action">Save</button>
        </div>
      </div>
      <button type="button" id="open-sheet" aria-controls="host-sheet">Sheet</button>
      <div sheet-overlay="none" id="host-sheet" hidden>
        <div sheet>
          <h2>Sheet</h2>
          <button type="button" id="sheet-action">Done</button>
        </div>
      </div>
    `;
    const modal = createModal({ root: document.body });
    const sheet = createSheet({ root: document.body });
    const sheetAction = document.getElementById('sheet-action');

    modal.open(document.getElementById('open-modal'));
    sheet.open(document.getElementById('open-sheet'));

    sheetAction?.focus();
    sheetAction?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' })
    );

    expect(document.getElementById('host-modal')?.contains(document.activeElement)).toBe(
      true
    );
    expect(isHidden('host-sheet')).toBe(false);

    pressBackdrop(document.getElementById('host-modal') as HTMLElement);

    expect(isHidden('host-sheet')).toBe(false);
    expect(isHidden('host-modal')).toBe(false);

    pressEscape();

    expect(isHidden('host-sheet')).toBe(true);
    expect(isHidden('host-modal')).toBe(false);

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

  it('does not leave a nested popover visibly open after Escape closes its modal', () => {
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

    const popoverRoot = document.getElementById('host-pop');
    expect(isHidden('host-modal')).toBe(true);
    expect(popoverRoot?.closest('[hidden]')?.id).toBe('host-modal');

    pressEscape();

    expect(popoverRoot?.hasAttribute('hidden')).toBe(true);
    modal.destroy();
    popover.destroy();
  });
});
