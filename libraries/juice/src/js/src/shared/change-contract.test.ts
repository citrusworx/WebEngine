// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { createAccordion, stopAccordionRuntime } from '../accordion/accordion-runtime.js';
import { createAvatar, stopAvatarRuntime } from '../avatar/avatar-runtime.js';
import { createTable, stopTableRuntime } from '../table/table-runtime.js';
import { createPressable, stopPressableRuntime } from '../pressable/pressable-runtime.js';
import {
  createTouchableRow,
  stopTouchableRowRuntime,
} from '../touchable-row/touchable-row-runtime.js';
import { createBanner, stopBannerRuntime } from '../banner/banner-runtime.js';
import {
  createBreadcrumb,
  stopBreadcrumbRuntime,
} from '../breadcrumb/breadcrumb-runtime.js';
import { createCheckbox, stopCheckboxRuntime } from '../checkbox/checkbox-runtime.js';
import { createCombobox, stopComboboxRuntime } from '../combobox/combobox-runtime.js';
import {
  createDisclosure,
  stopDisclosureRuntime,
} from '../disclosure/disclosure-runtime.js';
import { createDrawer, stopDrawerRuntime } from '../drawer/drawer-runtime.js';
import { createField, stopFieldRuntime } from '../field/field-runtime.js';
import {
  createIconButton,
  stopIconButtonRuntime,
} from '../icon-button/icon-button-runtime.js';
import { createInput, stopInputRuntime } from '../input/input-runtime.js';
import { createMenu, stopMenuRuntime } from '../menu/menu-runtime.js';
import { createModal, stopModalRuntime } from '../modal/modal-runtime.js';
import { createNavigation, stopNavigationRuntime } from '../nav/navigation.js';
import {
  createPagination,
  stopPaginationRuntime,
} from '../pagination/pagination-runtime.js';
import { createPopover, stopPopoverRuntime } from '../popover/popover-runtime.js';
import { createProgress, stopProgressRuntime } from '../progress/progress-runtime.js';
import { createRadio, stopRadioRuntime } from '../radio/radio-runtime.js';
import { createSelect, stopSelectRuntime } from '../select/select-runtime.js';
import { createSlider, stopSliderRuntime } from '../slider/slider-runtime.js';
import { createSpinner, stopSpinnerRuntime } from '../spinner/spinner-runtime.js';
import { createSwitch, stopSwitchRuntime } from '../switch/switch-runtime.js';
import { createTabs, stopTabsRuntime } from '../tabs/tabs-runtime.js';
import { createTextarea, stopTextareaRuntime } from '../textarea/textarea-runtime.js';
import { createToast, stopToastRuntime } from '../toast/toast-runtime.js';
import { createTooltip, stopTooltipRuntime } from '../tooltip/tooltip-runtime.js';
import { createWizard, stopWizardRuntime } from '../wizard/wizard-runtime.js';
import { JUICE_CHANGE_EVENT } from './change.js';

type JuiceChange = CustomEvent<{ runtime: string; state: unknown }>;

const resetDom = () => {
  document.body.innerHTML = '';
};

const stopAll = () => {
  stopAccordionRuntime();
  stopAvatarRuntime();
  stopTableRuntime();
  stopPressableRuntime();
  stopTouchableRowRuntime();
  stopBannerRuntime();
  stopBreadcrumbRuntime();
  stopCheckboxRuntime();
  stopComboboxRuntime();
  stopDisclosureRuntime();
  stopDrawerRuntime();
  stopFieldRuntime();
  stopIconButtonRuntime();
  stopInputRuntime();
  stopMenuRuntime();
  stopModalRuntime();
  stopNavigationRuntime();
  stopPaginationRuntime();
  stopPopoverRuntime();
  stopProgressRuntime();
  stopRadioRuntime();
  stopSelectRuntime();
  stopSliderRuntime();
  stopSpinnerRuntime();
  stopSwitchRuntime();
  stopTabsRuntime();
  stopTextareaRuntime();
  stopToastRuntime();
  stopTooltipRuntime();
  stopWizardRuntime();
};

const listen = () => {
  const events: JuiceChange[] = [];
  const onChange = (event: Event) => {
    events.push(event as JuiceChange);
  };
  document.body.addEventListener(JUICE_CHANGE_EVENT, onChange);
  return {
    events,
    stop: () => document.body.removeEventListener(JUICE_CHANGE_EVENT, onChange),
  };
};

afterEach(() => {
  stopAll();
  resetDom();
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1024,
  });
});

describe('juice:change', () => {
  it('dispatches one switch event per real change, including clicks', () => {
    document.body.innerHTML =
      '<button type="button" switch id="s" aria-label="Alerts"></button>';
    stopSwitchRuntime();
    const controller = createSwitch({ root: document.body });
    const host = document.getElementById('s')!;
    const heard = listen();

    expect(controller.isChecked(host)).toBe(false);
    expect(controller.getState(host)).toEqual({ checked: false });

    controller.check(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.bubbles).toBe(true);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'switch',
      state: { checked: true },
    });
    expect(controller.isChecked(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ checked: true });

    controller.check(host);
    expect(heard.events).toHaveLength(1);

    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail.state).toEqual({ checked: false });
    expect(controller.getState()).toEqual({ checked: false });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one checkbox event per real change', () => {
    document.body.innerHTML =
      '<button type="button" checkbox id="c" aria-label="Agree"></button>';
    stopCheckboxRuntime();
    const controller = createCheckbox({ root: document.body });
    const host = document.getElementById('c')!;
    const heard = listen();

    controller.toggle(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'checkbox',
      state: { checked: true },
    });
    expect(controller.isChecked(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ checked: true });

    controller.setChecked(true, host);
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one disclosure event per real expand', () => {
    document.body.innerHTML = `
      <section disclosure id="d">
        <button type="button" disclosure-trigger id="t">Notes</button>
        <div disclosure-panel hidden>Body</div>
      </section>
    `;
    stopDisclosureRuntime();
    const controller = createDisclosure({ root: document.body });
    const host = document.getElementById('d')!;
    const heard = listen();

    expect(controller.isExpanded()).toBe(false);
    expect(controller.getState(host)).toEqual({ expanded: false });

    controller.expand();
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'disclosure',
      state: { expanded: true },
    });
    expect(controller.isExpanded()).toBe(true);

    controller.expand();
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one accordion event per real expand', () => {
    document.body.innerHTML = `
      <section accordion id="a">
        <button type="button" accordion-item id="t">Q</button>
        <div hidden>A</div>
      </section>
    `;
    stopAccordionRuntime();
    const controller = createAccordion({ root: document.body });
    const host = document.getElementById('a')!;
    const heard = listen();

    expect(controller.isExpanded()).toBe(false);
    expect(controller.getState(host)).toEqual({ expanded: [false] });

    controller.expand();
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'accordion',
      state: { expanded: [true] },
    });
    expect(controller.isExpanded()).toBe(true);

    controller.expand();
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one modal event per real open or close', () => {
    document.body.innerHTML = `
      <div modal-overlay id="m" hidden>
        <div modal><h2>Account</h2></div>
      </div>
    `;
    stopModalRuntime();
    const controller = createModal({ root: document.body });
    const host = document.getElementById('m')!;
    const heard = listen();

    expect(controller.isOpen(host)).toBe(false);
    expect(controller.getState(host)).toEqual({ open: false });

    controller.open(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'modal',
      state: { open: true },
    });
    expect(controller.isOpen()).toBe(true);

    controller.open(host);
    expect(heard.events).toHaveLength(1);

    controller.close(host);
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail.state).toEqual({ open: false });

    controller.close(host);
    expect(heard.events).toHaveLength(2);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one drawer event per real open or close', () => {
    document.body.innerHTML = `
      <div drawer-overlay id="d" hidden>
        <div drawer><h2>Filters</h2></div>
      </div>
    `;
    stopDrawerRuntime();
    const controller = createDrawer({ root: document.body });
    const host = document.getElementById('d')!;
    const heard = listen();

    controller.open(host);
    controller.open(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'drawer',
      state: { open: true },
    });
    expect(controller.isOpen(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ open: true });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one popover event per real open or close', () => {
    document.body.innerHTML = `
      <div popover-root id="p" hidden>
        <div popover-panel>Hi</div>
      </div>
    `;
    stopPopoverRuntime();
    const controller = createPopover({ root: document.body });
    const host = document.getElementById('p')!;
    const heard = listen();

    controller.open(host);
    controller.open(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'popover',
      state: { open: true },
    });
    expect(controller.isOpen(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ open: true });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one slider event per real value change', () => {
    document.body.innerHTML = `
      <div slider id="volume">
        <div slider-thumb aria-label="Volume"></div>
      </div>
    `;
    stopSliderRuntime();
    const controller = createSlider({ root: document.body });
    const host = document.getElementById('volume')!;
    const heard = listen();

    controller.setValue(40, host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'slider',
      state: { value: 40 },
    });
    expect(controller.getValue(host)).toBe(40);
    expect(controller.getState(host)).toEqual({ value: 40 });

    controller.setValue(40, host);
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one progress event per real value or mode change', () => {
    document.body.innerHTML = '<div progress id="bar"></div>';
    stopProgressRuntime();
    const controller = createProgress({ root: document.body });
    const host = document.getElementById('bar')!;
    const heard = listen();

    controller.setValue(25, host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'progress',
      state: { value: 25, indeterminate: false },
    });
    expect(controller.getValue(host)).toBe(25);
    expect(controller.isIndeterminate(host)).toBe(false);
    expect(controller.getState(host)).toEqual({
      value: 25,
      indeterminate: false,
    });

    controller.setValue(25, host);
    expect(heard.events).toHaveLength(1);

    controller.setIndeterminate(true, host);
    expect(heard.events).toHaveLength(2);
    expect(controller.isIndeterminate(host)).toBe(true);
    expect(controller.getState(host)?.indeterminate).toBe(true);

    controller.setIndeterminate(true, host);
    expect(heard.events).toHaveLength(2);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one radio event per real selection', () => {
    document.body.innerHTML = `
      <div radiogroup id="g" aria-label="Ship">
        <button radio value="ground" id="ground"></button>
        <button radio value="air" id="air"></button>
      </div>
    `;
    stopRadioRuntime();
    const controller = createRadio({ root: document.body });
    const host = document.getElementById('g')!;
    const air = document.getElementById('air')!;
    const heard = listen();

    controller.select(air);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'radio',
      state: { value: 'air', index: 1 },
    });
    expect(controller.getChecked(host)).toBe(air);
    expect(controller.getState(host)).toEqual({ value: 'air', index: 1 });

    controller.select(air);
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one tabs event per real selection', () => {
    document.body.innerHTML = `
      <div tabs id="settings">
        <div tabs-list>
          <button type="button" tab id="account" active>Account</button>
          <button type="button" tab id="billing">Billing</button>
        </div>
        <div tab-panel>Account panel</div>
        <div tab-panel hidden>Billing panel</div>
      </div>
    `;
    stopTabsRuntime();
    const controller = createTabs({ root: document.body });
    const host = document.getElementById('settings')!;
    const billing = document.getElementById('billing')!;
    const heard = listen();

    expect(controller.selected(host)?.id).toBe('account');
    expect(controller.getState(host)).toEqual({ selected: 0 });

    controller.select(billing);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'tabs',
      state: { selected: 1 },
    });
    expect(controller.selected(host)).toBe(billing);

    controller.select(billing);
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one pagination event per real page change', () => {
    document.body.innerHTML = `
      <nav pagination id="pages">
        <a pagination-prev href="?p=1">Prev</a>
        <a href="?p=1" id="p1">1</a>
        <a href="?p=2" id="p2">2</a>
        <a pagination-next href="?p=2">Next</a>
      </nav>
    `;
    stopPaginationRuntime();
    const controller = createPagination({ root: document.body });
    const host = document.getElementById('pages')!;
    const heard = listen();

    expect(controller.getCurrent(host)).toBe(0);
    expect(controller.getState(host)).toEqual({ current: 0 });

    controller.setCurrent(1, host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'pagination',
      state: { current: 1 },
    });
    expect(controller.getCurrent(host)).toBe(1);

    controller.setCurrent(1, host);
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one breadcrumb event per real current change', () => {
    document.body.innerHTML = `
      <nav breadcrumb id="trail">
        <span breadcrumb-item><a href="/" id="home">Home</a></span>
        <span breadcrumb-item><a href="/docs" id="docs">Docs</a></span>
      </nav>
    `;
    stopBreadcrumbRuntime();
    const controller = createBreadcrumb({ root: document.body });
    const host = document.getElementById('trail')!;
    const heard = listen();

    expect(controller.getCurrent(host)).toBe(1);
    expect(controller.getState(host)).toEqual({ current: 1 });

    controller.setCurrent(0, host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'breadcrumb',
      state: { current: 0 },
    });
    expect(controller.getCurrent(host)).toBe(0);

    controller.setCurrent(0, host);
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one wizard event per real step change', () => {
    document.body.innerHTML = `
      <div wizard-shell id="wiz">
        <ol steps>
          <li step="active" data-step="welcome">Welcome</li>
          <li step="pending" data-step="domain">Domain</li>
        </ol>
        <section step-page="welcome">Welcome</section>
        <section step-page="domain" hidden>Domain</section>
      </div>
    `;
    stopWizardRuntime();
    const controller = createWizard({ root: document.body });
    const host = document.getElementById('wiz')!;
    const heard = listen();

    expect(controller.current(host)).toBe(0);
    expect(controller.getState(host)).toEqual({ current: 0 });

    controller.goTo(1, host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'wizard',
      state: { current: 1 },
    });
    expect(controller.current(host)).toBe(1);

    controller.goTo(1, host);
    expect(heard.events).toHaveLength(1);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one combobox event per real open or value change', () => {
    document.body.innerHTML = `
      <div combobox id="fruit">
        <input combobox-input type="text" />
        <button type="button" combobox-trigger aria-label="Show fruits"></button>
        <ul combobox-list hidden>
          <li combobox-option id="apple">Apple</li>
          <li combobox-option>Banana</li>
        </ul>
      </div>
    `;
    stopComboboxRuntime();
    const controller = createCombobox({ root: document.body });
    const host = document.getElementById('fruit')!;
    const heard = listen();

    expect(controller.isOpen(host)).toBe(false);
    expect(controller.getState(host)).toEqual({ open: false, value: '' });

    controller.open(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'combobox',
      state: { open: true, value: '' },
    });

    controller.open(host);
    expect(heard.events).toHaveLength(1);

    controller.select(document.getElementById('apple'));
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail.state).toEqual({
      open: false,
      value: 'Apple',
    });
    expect(controller.isOpen(host)).toBe(false);
    expect(controller.getState(host)).toEqual({ open: false, value: 'Apple' });

    controller.select(document.getElementById('apple'));
    expect(heard.events).toHaveLength(2);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one menu event per real open or close', () => {
    document.body.innerHTML = `
      <div menu-root id="file">
        <button type="button" menu-button>File</button>
        <div menu hidden>
          <button type="button" menuitem>New</button>
        </div>
      </div>
    `;
    stopMenuRuntime();
    const controller = createMenu({ root: document.body });
    const host = document.getElementById('file')!;
    const heard = listen();

    controller.open(host);
    controller.open(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'menu',
      state: { open: true },
    });
    expect(controller.isOpen(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ open: true });

    controller.close(host);
    controller.close(host);
    expect(heard.events).toHaveLength(2);
    expect(controller.isOpen(host)).toBe(false);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one toast event per real show or dismiss', () => {
    document.body.innerHTML = `
      <div toast-region>
        <div toast id="saved" toast-duration="0" hidden>Saved</div>
      </div>
    `;
    stopToastRuntime();
    const controller = createToast({ root: document.body });
    const host = document.getElementById('saved')!;
    const heard = listen();

    expect(controller.isShown(host)).toBe(false);
    expect(controller.getState(host)).toEqual({ shown: false });

    controller.show(host);
    controller.show(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'toast',
      state: { shown: true },
    });
    expect(controller.isShown(host)).toBe(true);

    controller.dismiss(host);
    expect(heard.events).toHaveLength(2);
    expect(controller.getState(host)).toEqual({ shown: false });

    controller.dismiss(host);
    expect(heard.events).toHaveLength(2);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one banner event per real dismiss or show', () => {
    document.body.innerHTML = `
      <div banner id="b">
        <div banner-body>Maintenance</div>
        <button type="button" banner-close>Dismiss</button>
      </div>
    `;
    stopBannerRuntime();
    const controller = createBanner({ root: document.body });
    const host = document.getElementById('b')!;
    const heard = listen();

    expect(controller.isShown(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ shown: true });

    controller.dismiss(host);
    controller.dismiss(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'banner',
      state: { shown: false },
    });
    expect(controller.isShown(host)).toBe(false);

    controller.show(host);
    controller.show(host);
    expect(heard.events).toHaveLength(2);
    expect(controller.getState(host)).toEqual({ shown: true });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one tooltip event per real show or hide', () => {
    document.body.innerHTML = `
      <button type="button" id="save" aria-describedby="tip">Save</button>
      <div tooltip-root id="tip" hidden>
        <div tooltip-panel>Saves</div>
      </div>
    `;
    stopTooltipRuntime();
    const controller = createTooltip({ root: document.body });
    const host = document.getElementById('tip')!;
    const heard = listen();

    controller.show(host);
    controller.show(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'tooltip',
      state: { shown: true },
    });
    expect(controller.isShown(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ shown: true });

    controller.hide(host);
    controller.hide(host);
    expect(heard.events).toHaveLength(2);
    expect(controller.isShown(host)).toBe(false);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one spinner event per real show or hide', () => {
    document.body.innerHTML = '<div spinner id="busy">Loading</div>';
    stopSpinnerRuntime();
    const controller = createSpinner({ root: document.body });
    const host = document.getElementById('busy')!;
    const heard = listen();

    expect(controller.isShown(host)).toBe(true);
    expect(controller.getState(host)).toEqual({ shown: true });

    controller.hide(host);
    controller.hide(host);
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'spinner',
      state: { shown: false },
    });
    expect(controller.isShown(host)).toBe(false);

    controller.show(host);
    controller.show(host);
    expect(heard.events).toHaveLength(2);
    expect(controller.getState(host)).toEqual({ shown: true });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one nav event per real sidebar open or close', () => {
    document.body.innerHTML = `
      <nav type="mobile" id="toggle"></nav>
      <nav type="sidebar" id="side" hidden></nav>
    `;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 480,
    });
    stopNavigationRuntime();
    const controller = createNavigation({ root: document.body });
    const host = document.getElementById('side')!;
    const heard = listen();

    expect(controller.isOpen(host)).toBe(false);
    expect(controller.getState(host)).toEqual({ open: false });

    controller.openSidebar();
    controller.openSidebar();
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'nav',
      state: { open: true },
    });
    expect(controller.isOpen(host)).toBe(true);

    controller.closeSidebar();
    controller.closeSidebar();
    expect(heard.events).toHaveLength(2);
    expect(controller.getState(host)).toEqual({ open: false });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one field event per real invalid change', () => {
    document.body.innerHTML = `
      <div field id="name">
        <input />
      </div>
    `;
    stopFieldRuntime();
    const controller = createField({ root: document.body });
    const host = document.getElementById('name')!;
    const heard = listen();

    expect(controller.isInvalid(host)).toBe(false);
    expect(controller.getState(host)).toEqual({ invalid: false });

    host.setAttribute('invalid', '');
    controller.sync();
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'field',
      state: { invalid: true },
    });
    expect(controller.isInvalid(host)).toBe(true);

    controller.sync();
    expect(heard.events).toHaveLength(1);

    host.removeAttribute('invalid');
    controller.sync();
    expect(heard.events).toHaveLength(2);
    expect(controller.getState(host)).toEqual({ invalid: false });

    heard.stop();
    controller.destroy();
  });

  it('reads input, select, and textarea values without juice:change', () => {
    document.body.innerHTML = `
      <input input id="name" value="ada" />
      <select select id="color">
        <option value="red">Red</option>
        <option value="blue" selected>Blue</option>
      </select>
      <textarea textarea id="note">Hello</textarea>
    `;
    stopInputRuntime();
    stopSelectRuntime();
    stopTextareaRuntime();
    const input = createInput({ root: document.body });
    const select = createSelect({ root: document.body });
    const textarea = createTextarea({ root: document.body });
    const heard = listen();

    const name = document.getElementById('name') as HTMLInputElement;
    const color = document.getElementById('color') as HTMLSelectElement;
    const note = document.getElementById('note') as HTMLTextAreaElement;

    expect(input.getState(name)).toEqual({ value: 'ada' });
    expect(select.getState(color)).toEqual({ value: 'blue' });
    expect(textarea.getState(note)).toEqual({ value: 'Hello' });

    name.value = 'grace';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    name.dispatchEvent(new Event('change', { bubbles: true }));
    color.value = 'red';
    color.dispatchEvent(new Event('change', { bubbles: true }));
    note.value = 'Updated';
    note.dispatchEvent(new Event('input', { bubbles: true }));

    expect(heard.events).toHaveLength(0);
    expect(input.getState(name)).toEqual({ value: 'grace' });
    expect(select.getState(color)).toEqual({ value: 'red' });
    expect(textarea.getState(note)).toEqual({ value: 'Updated' });

    heard.stop();
    input.destroy();
    select.destroy();
    textarea.destroy();
  });

  it('dispatches one icon-button event per real pressed change', () => {
    document.body.innerHTML =
      '<button type="button" icon-button toggle id="bold" aria-label="Bold"></button>';
    stopIconButtonRuntime();
    const controller = createIconButton({ root: document.body });
    const host = document.getElementById('bold')!;
    const heard = listen();

    expect(controller.getState(host)).toEqual({
      pressed: false,
      disabled: false,
      named: true,
    });

    controller.toggle(host);
    controller.toggle(host);
    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(heard.events).toHaveLength(3);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'icon-button',
      state: { pressed: true, disabled: false, named: true },
    });
    expect(heard.events[2]?.detail.state).toEqual({
      pressed: true,
      disabled: false,
      named: true,
    });
    expect(controller.getState(host)?.pressed).toBe(true);

    controller.toggle(host);
    expect(heard.events).toHaveLength(4);
    expect(controller.getState()).toEqual({
      pressed: false,
      disabled: false,
      named: true,
    });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one avatar event per real image change', () => {
    document.body.innerHTML =
      '<span avatar id="face">AL<img id="photo" alt="Ada" src="ada.png"></span>';
    const photo = document.getElementById('photo') as HTMLImageElement;
    Object.defineProperty(photo, 'complete', {
      configurable: true,
      get: () => false,
    });
    Object.defineProperty(photo, 'naturalWidth', {
      configurable: true,
      get: () => 0,
    });
    stopAvatarRuntime();
    const controller = createAvatar({ root: document.body });
    const host = document.getElementById('face')!;
    const heard = listen();

    expect(controller.getState(host)).toEqual({
      loaded: false,
      fallback: false,
      hasImage: true,
    });

    photo.dispatchEvent(new Event('error'));
    photo.dispatchEvent(new Event('error'));
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.bubbles).toBe(true);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'avatar',
      state: { loaded: false, fallback: true, hasImage: true },
    });

    photo.dispatchEvent(new Event('load'));
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail.state).toEqual({
      loaded: true,
      fallback: false,
      hasImage: true,
    });
    expect(controller.getState()).toEqual({
      loaded: true,
      fallback: false,
      hasImage: true,
    });
    expect(photo.getAttribute('alt')).toBe('Ada');
    expect(host.textContent).toContain('AL');

    heard.stop();
    controller.destroy();
  });

  it('dispatches one table event per real sort change', () => {
    document.body.innerHTML = `
      <table table id="people">
        <thead><tr><th sortable id="name">Name</th></tr></thead>
        <tbody>
          <tr id="b"><td>B</td></tr>
          <tr id="a"><td>A</td></tr>
        </tbody>
      </table>
    `;
    stopTableRuntime();
    const controller = createTable({ root: document.body });
    const host = document.getElementById('people')!;
    const heard = listen();

    expect(controller.getState(host)).toEqual({ column: null, direction: 'none' });

    document.querySelector('#name button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(Array.from(host.querySelectorAll('tbody tr')).map((row) => row.id)).toEqual(['a', 'b']);
    document.querySelector('#name button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(heard.events).toHaveLength(2);
    expect(heard.events[0]?.bubbles).toBe(true);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'table',
      state: { column: 0, direction: 'ascending' },
    });
    expect(heard.events[1]?.detail).toEqual({
      runtime: 'table',
      state: { column: 0, direction: 'descending' },
    });
    expect(controller.getState()).toEqual({ column: 0, direction: 'descending' });
    expect(Array.from(host.querySelectorAll('tbody tr')).map((row) => row.id)).toEqual(['b', 'a']);

    document.querySelector('#name button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(heard.events).toHaveLength(3);
    expect(heard.events[2]?.detail.state).toEqual({ column: null, direction: 'none' });
    expect(Array.from(host.querySelectorAll('tbody tr')).map((row) => row.id)).toEqual(['b', 'a']);

    heard.stop();
    controller.destroy();
  });

  it('dispatches one pressable event per real press', () => {
    document.body.innerHTML = '<button type="button" pressable id="go">Go</button>';
    stopPressableRuntime();
    const controller = createPressable({ root: document.body });
    const host = document.getElementById('go')!;
    const heard = listen();

    expect(controller.getState(host)).toEqual({ pressed: false, longPressed: false });

    host.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      })
    );
    host.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      })
    );
    expect(heard.events).toHaveLength(1);
    expect(heard.events[0]?.bubbles).toBe(true);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'pressable',
      state: { pressed: true, longPressed: false },
    });

    host.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      })
    );
    expect(heard.events).toHaveLength(2);
    expect(heard.events[1]?.detail).toEqual({
      runtime: 'pressable',
      state: { pressed: false, longPressed: false },
    });
    expect(controller.getState()).toEqual({ pressed: false, longPressed: false });

    heard.stop();
    controller.destroy();
  });

  it('dispatches one touchable-row event per real selection change', () => {
    document.body.innerHTML = '<div touchable-row="select" id="row">Row</div>';
    stopTouchableRowRuntime();
    const controller = createTouchableRow({ root: document.body });
    const host = document.getElementById('row')!;
    const heard = listen();

    expect(controller.getState(host)).toEqual({ selected: false, disabled: false });

    host.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    host.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(heard.events).toHaveLength(2);
    expect(heard.events[0]?.bubbles).toBe(true);
    expect(heard.events[0]?.target).toBe(host);
    expect(heard.events[0]?.detail).toEqual({
      runtime: 'touchable-row',
      state: { selected: true, disabled: false },
    });
    expect(heard.events[1]?.detail).toEqual({
      runtime: 'touchable-row',
      state: { selected: false, disabled: false },
    });
    expect(controller.getState()).toEqual({ selected: false, disabled: false });

    heard.stop();
    controller.destroy();
  });
});
