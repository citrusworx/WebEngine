// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

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
import {
  createDrawer,
  stopDrawerRuntime,
} from './drawer/drawer-runtime.js';
import {
  createModal,
  stopModalRuntime,
} from './modal/modal-runtime.js';
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
 * Escape / layering contract (highest owns Escape first):
 * 1. open [modal-overlay] / [drawer-overlay] — independently exclusive
 * 2. open [popover-root]
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
  stopComboboxRuntime();
  stopToastRuntime();
  stopTooltipRuntime();
  stopBannerRuntime();

  return {
    modal: createModal({ root: document.body }),
    drawer: createDrawer({ root: document.body }),
    popover: createPopover({ root: document.body }),
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
  controllers.combobox.destroy();
  controllers.toast.destroy();
  controllers.tooltip.destroy();
  controllers.banner.destroy();
};

afterEach(() => {
  stopModalRuntime();
  stopDrawerRuntime();
  stopPopoverRuntime();
  stopComboboxRuntime();
  stopToastRuntime();
  stopTooltipRuntime();
  stopBannerRuntime();
  stopAccordionRuntime();
  resetDom();
});

describe('Escape / layering contract', () => {
  it('keeps modal and drawer independently exclusive (both may be open)', () => {
    const controllers = mountStacked();

    expect(isHidden('stack-modal')).toBe(false);
    expect(isHidden('stack-drawer')).toBe(false);

    destroyStacked(controllers);
  });

  it('lets an open dialog overlay own Escape ahead of popover, combobox, toast, and tooltip', () => {
    const controllers = mountStacked();
    document.getElementById('stack-drawer')?.setAttribute('hidden', '');

    pressEscape();

    expect(isHidden('stack-modal')).toBe(true);
    expect(isHidden('stack-pop')).toBe(false);
    expect(isHidden('stack-combo-list')).toBe(false);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-tip')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    document.getElementById('stack-drawer')?.removeAttribute('hidden');
    pressEscape();

    expect(isHidden('stack-drawer')).toBe(true);
    expect(isHidden('stack-pop')).toBe(false);
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

    pressEscape();

    expect(isHidden('stack-pop')).toBe(true);
    expect(isHidden('stack-combo-list')).toBe(false);
    expect(isHidden('stack-toast')).toBe(false);
    expect(isHidden('stack-tip')).toBe(false);
    expect(isHidden('stack-banner')).toBe(false);

    destroyStacked(controllers);
  });

  it('lets an open combobox list own Escape after popover, ahead of toast and tooltip', () => {
    const controllers = mountStacked();
    document.getElementById('stack-modal')?.setAttribute('hidden', '');
    document.getElementById('stack-drawer')?.setAttribute('hidden', '');
    document.getElementById('stack-pop')?.setAttribute('hidden', '');

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
});
