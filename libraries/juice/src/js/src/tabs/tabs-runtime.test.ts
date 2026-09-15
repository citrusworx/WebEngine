// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createTabs,
  startTabsRuntime,
  stopTabsRuntime,
} from './tabs-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const tabsMarkup = `
  <div tabs name="settings">
    <div tabs-list>
      <button type="button" tab active>Account</button>
      <button type="button" tab>Billing</button>
    </div>
    <div tab-panel>Account panel</div>
    <div tab-panel hidden>Billing panel</div>
  </div>
`;

afterEach(() => {
  stopTabsRuntime();
  resetDom();
});

describe('createTabs', () => {
  it('wires triggers to exclusive panels with dual-write selected state', () => {
    document.body.innerHTML = tabsMarkup;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    expect(triggers[0]?.getAttribute('role')).toBe('tab');
    expect(triggers[0]?.getAttribute('aria-selected')).toBe('true');
    expect(triggers[0]?.hasAttribute('active')).toBe(true);
    expect(triggers[0]?.getAttribute('tabindex')).toBe('0');
    expect(triggers[1]?.getAttribute('aria-selected')).toBe('false');
    expect(triggers[1]?.hasAttribute('active')).toBe(false);
    expect(triggers[1]?.getAttribute('tabindex')).toBe('-1');
    expect(panels[0]?.getAttribute('role')).toBe('tabpanel');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);
    expect(panels[1]?.hasAttribute('hidden')).toBe(true);
    expect(panels[0]?.getAttribute('content')).toBeNull();
    expect(panels[1]?.getAttribute('content')).toBeNull();

    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggers[0]?.getAttribute('aria-selected')).toBe('false');
    expect(triggers[0]?.hasAttribute('active')).toBe(false);
    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    expect(triggers[1]?.hasAttribute('active')).toBe(true);
    expect(panels[0]?.hasAttribute('hidden')).toBe(true);
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);
    expect(panels[1]?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('fills missing ids, tablist, and panel labeling', () => {
    document.body.innerHTML = `
      <div tabs name="profile">
        <div tabs-list>
          <button type="button" tab>One</button>
          <button type="button" tab>Two</button>
        </div>
        <div tab-panel>First</div>
        <div tab-panel hidden>Second</div>
      </div>
    `;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const list = document.querySelector<HTMLElement>('[tabs-list]');
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    expect(list?.getAttribute('role')).toBe('tablist');
    expect(list?.getAttribute('aria-label')).toBe('profile');
    expect(triggers[0]?.id).toBe('profile-tab-1');
    expect(triggers[1]?.id).toBe('profile-tab-2');
    expect(panels[0]?.id).toBe('profile-panel-1');
    expect(panels[1]?.id).toBe('profile-panel-2');
    expect(triggers[0]?.getAttribute('aria-controls')).toBe('profile-panel-1');
    expect(panels[0]?.getAttribute('aria-labelledby')).toBe('profile-tab-1');
    expect(triggers[0]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[1]?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('does not enhance orphan tab markup', () => {
    document.body.innerHTML = `
      <button type="button" tab active>Orphan</button>
      <div tab-panel>Should stay untouched.</div>
    `;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[tab]');
    const panel = document.querySelector<HTMLElement>('[tab-panel]');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.id).toBe('');
    expect(trigger?.getAttribute('role')).toBeNull();
    expect(trigger?.getAttribute('aria-controls')).toBeNull();
    expect(panel?.getAttribute('role')).toBeNull();
    expect(panel?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('ignores buttons inside panels and keeps panels exclusive', () => {
    document.body.innerHTML = `
      <div tabs name="docs">
        <div tabs-list>
          <button type="button" tab>Readme</button>
          <button type="button" tab>API</button>
        </div>
        <div tab-panel>
          <button type="button">Copy</button>
          Readme body
        </div>
        <div tab-panel hidden>API body</div>
      </div>
    `;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const copy = document.querySelector<HTMLElement>('[tab-panel] button');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');

    copy?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggers[0]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);
    expect(panels[1]?.hasAttribute('hidden')).toBe(true);
    expect(copy?.getAttribute('role')).not.toBe('tab');

    controller.destroy();
  });

  it('moves focus and selection together on horizontal arrows', () => {
    document.body.innerHTML = tabsMarkup;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    triggers[0]?.focus();
    triggers[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );

    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    expect(triggers[1]?.hasAttribute('active')).toBe(true);
    expect(document.activeElement).toBe(triggers[1]);
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);
    expect(panels[0]?.hasAttribute('hidden')).toBe(true);

    triggers[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );

    expect(triggers[0]?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(triggers[0]);

    controller.destroy();
  });

  it('selects first and last tabs with Home and End', () => {
    document.body.innerHTML = tabsMarkup;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');

    triggers[0]?.focus();
    triggers[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'End' })
    );
    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(triggers[1]);

    triggers[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Home' })
    );
    expect(triggers[0]?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(triggers[0]);

    controller.destroy();
  });

  it('does not handle Escape or vertical arrows', () => {
    document.body.innerHTML = tabsMarkup;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    triggers[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    triggers[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );

    expect(triggers[0]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);
    expect(panels[1]?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('supports keyboard activation for non-button triggers', () => {
    document.body.innerHTML = `
      <div tabs name="plain">
        <div tabs-list>
          <div tab>One</div>
          <div tab>Two</div>
        </div>
        <div tab-panel>First</div>
        <div tab-panel hidden>Second</div>
      </div>
    `;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    expect(triggers[0]?.getAttribute('role')).toBe('tab');
    expect(triggers[0]?.getAttribute('tabindex')).toBe('0');

    triggers[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);
    expect(panels[0]?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('enhances legacy strip markup and direct-child buttons', () => {
    document.body.innerHTML = `
      <div tabs name="legacy">
        <button type="button" active>One</button>
        <button type="button">Two</button>
        <div tab-panel>First</div>
        <div tab-panel hidden>Second</div>
      </div>
    `;
    stopTabsRuntime();

    const controller = createTabs({ root: document.body });
    const buttons = document.querySelectorAll<HTMLElement>('[tabs] > button');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    expect(buttons[0]?.getAttribute('role')).toBe('tab');
    expect(buttons[0]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);

    buttons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(buttons[1]?.hasAttribute('active')).toBe(true);
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);
    expect(panels[0]?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('syncs late-rendered tabs markup', async () => {
    stopTabsRuntime();
    const controller = createTabs({ root: document.body });

    document.body.innerHTML = `
      <div tabs name="late">
        <div tabs-list>
          <button type="button" tab>Late</button>
          <button type="button" tab>Later</button>
        </div>
        <div tab-panel>Arrived after boot</div>
        <div tab-panel hidden>Second</div>
      </div>
    `;

    await flushRuntime();

    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    expect(triggers[0]?.id).toBe('late-tab-1');
    expect(panels[0]?.id).toBe('late-panel-1');
    expect(triggers[0]?.getAttribute('aria-selected')).toBe('true');

    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('selects once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = tabsMarkup;
    startTabsRuntime();

    const controller = createTabs({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    expect(triggers[0]?.getAttribute('aria-selected')).toBe('false');
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });
});

describe('startTabsRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = tabsMarkup;
    stopTabsRuntime();

    const first = startTabsRuntime();
    const second = startTabsRuntime();
    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    const panels = document.querySelectorAll<HTMLElement>('[tab-panel]');

    expect(first).toBe(second);

    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopTabsRuntime', async () => {
    stopTabsRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./tabs-runtime.js');
    document.body.innerHTML = tabsMarkup;
    mod.stopTabsRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const triggers = document.querySelectorAll<HTMLElement>('[tab]');
    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(triggers[1]?.getAttribute('aria-selected')).toBeNull();

    mod.startTabsRuntime();
    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(triggers[1]?.getAttribute('aria-selected')).toBe('true');
    mod.stopTabsRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
