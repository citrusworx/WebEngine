// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createMenu,
  startMenuRuntime,
  stopMenuRuntime,
} from './menu-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const menuMarkup = `
  <div menu-root name="file">
    <button type="button" menu-button id="file-open">File</button>
    <div menu hidden>
      <button type="button" menuitem>New</button>
      <button type="button" menuitem>Open…</button>
      <div menu-separator></div>
      <div menu-label>Recent</div>
      <button type="button" menuitem>Report.pdf</button>
    </div>
  </div>
`;

afterEach(() => {
  stopMenuRuntime();
  resetDom();
  vi.restoreAllMocks();
});

describe('createMenu', () => {
  it('fills roles, ids, and opener pairing on sync', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const root = document.querySelector<HTMLElement>('[menu-root]');
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const items = document.querySelectorAll<HTMLElement>('[menuitem]');
    const separator = document.querySelector<HTMLElement>('[menu-separator]');

    expect(panel?.id).toBe('file-menu');
    expect(panel?.getAttribute('role')).toBe('menu');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('aria-modal')).toBeNull();
    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-haspopup')).toBe('menu');
    expect(opener?.getAttribute('aria-controls')).toBe('file-menu');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');
    expect(separator?.getAttribute('role')).toBe('separator');
    expect(items[0]?.id).toBe('file-item-1');
    expect(items[0]?.getAttribute('role')).toBe('menuitem');
    expect(items[0]?.getAttribute('tabindex')).toBe('-1');
    expect(items[1]?.id).toBe('file-item-2');
    expect(items[2]?.id).toBe('file-item-3');

    controller.destroy();
  });

  it('exposes open, close, toggle, and select on the controller', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const root = document.querySelector<HTMLElement>('[menu-root]');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const opener = document.getElementById('file-open');
    const item = document.querySelector<HTMLElement>('[menuitem]');
    const onClick = vi.fn();
    item?.addEventListener('click', onClick);

    controller.open(root);
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    controller.close(root);
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    controller.toggle(root);
    expect(panel?.hasAttribute('hidden')).toBe(false);
    controller.toggle(root);
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.open(root);
    controller.select(item);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('toggles from the opener click and keeps hidden on the panel', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const root = document.querySelector<HTMLElement>('[menu-root]');
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(root?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('uses a plain button inside the root when menu-button is omitted', () => {
    document.body.innerHTML = `
      <div menu-root>
        <button type="button" id="cta-open">Actions</button>
        <div menu hidden>
          <button type="button" menuitem>Edit</button>
        </div>
      </div>
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('cta-open');
    const panel = document.querySelector<HTMLElement>('[menu]');

    expect(opener?.getAttribute('aria-haspopup')).toBe('menu');
    expect(opener?.getAttribute('aria-controls')).toBe(panel?.id ?? '');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    controller.destroy();
  });

  it('moves menuitem="active" with arrows, Home, and End using roving tabindex', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const items = document.querySelectorAll<HTMLElement>('[menuitem]');

    opener?.focus();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(items[0]?.getAttribute('menuitem')).toBe('active');
    expect(items[0]?.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(items[0]);
    expect(items[1]?.getAttribute('tabindex')).toBe('-1');

    items[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    expect(items[1]?.getAttribute('menuitem')).toBe('active');
    expect(items[0]?.getAttribute('menuitem')).not.toBe('active');
    expect(document.activeElement).toBe(items[1]);

    items[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'End' })
    );
    expect(items[2]?.getAttribute('menuitem')).toBe('active');
    expect(document.activeElement).toBe(items[2]);

    items[2]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Home' })
    );
    expect(items[0]?.getAttribute('menuitem')).toBe('active');
    expect(document.activeElement).toBe(items[0]);

    controller.destroy();
  });

  it('wraps arrow movement and skips disabled items', () => {
    document.body.innerHTML = `
      <div menu-root>
        <button type="button" menu-button id="edit-open">Edit</button>
        <div menu hidden>
          <button type="button" menuitem>Cut</button>
          <button type="button" menuitem aria-disabled="true">Locked</button>
          <button type="button" menuitem>Paste</button>
        </div>
      </div>
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('edit-open');
    const items = document.querySelectorAll<HTMLElement>('[menuitem]');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(items[0]?.getAttribute('menuitem')).toBe('active');

    items[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    expect(items[2]?.getAttribute('menuitem')).toBe('active');
    expect(items[1]?.getAttribute('menuitem')).not.toBe('active');
    expect(document.activeElement).toBe(items[2]);

    items[2]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    expect(items[0]?.getAttribute('menuitem')).toBe('active');

    items[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' })
    );
    expect(items[2]?.getAttribute('menuitem')).toBe('active');

    controller.destroy();
  });

  it('activates the focused menuitem on Enter and restores opener focus', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const item = document.querySelector<HTMLElement>('[menuitem]');
    const onClick = vi.fn();
    item?.addEventListener('click', onClick);

    opener?.focus();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.activeElement).toBe(item);

    item?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(opener);

    controller.destroy();
  });

  it('closes on Tab without activating the item', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const item = document.querySelector<HTMLElement>('[menuitem]');
    const onClick = vi.fn();
    item?.addEventListener('click', onClick);

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    item?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' })
    );

    expect(onClick).not.toHaveBeenCalled();
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(item?.getAttribute('menuitem')).not.toBe('active');

    controller.destroy();
  });

  it('closes on Escape and restores focus to the opener', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const item = document.querySelector<HTMLElement>('[menuitem]');

    opener?.focus();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).toBe(item);

    item?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(opener?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(opener);

    controller.destroy();
  });

  it('does not steal Escape from an open modal or drawer overlay', () => {
    document.body.innerHTML = `
      <div modal-overlay id="open-modal">
        <div modal><h2>Account</h2></div>
      </div>
      ${menuMarkup}
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('open-modal')?.hasAttribute('hidden')).toBe(
      false
    );

    document.getElementById('open-modal')?.setAttribute('hidden', '');
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div drawer-overlay id="open-drawer"><div drawer><h2>Filters</h2></div></div>`
    );

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(panel?.hasAttribute('hidden')).toBe(false);

    document.getElementById('open-drawer')?.setAttribute('hidden', '');
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('closes on outside click without restoring focus', () => {
    document.body.innerHTML = `
      ${menuMarkup}
      <button type="button" id="outside">Outside</button>
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const outside = document.getElementById('outside');

    opener?.focus();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);

    outside?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).not.toBe(opener);

    controller.destroy();
  });

  it('closes other open menus when one opens and leaves modal/drawer alone', () => {
    document.body.innerHTML = `
      <div modal-overlay id="open-modal">
        <div modal><h2>Account</h2></div>
      </div>
      <div menu-root id="one">
        <button type="button" menu-button id="one-open">One</button>
        <div menu hidden>
          <button type="button" menuitem>Alpha</button>
        </div>
      </div>
      <div menu-root id="two">
        <button type="button" menu-button id="two-open">Two</button>
        <div menu hidden>
          <button type="button" menuitem>Beta</button>
        </div>
      </div>
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const firstPanel = document.querySelector('#one [menu]');
    const secondPanel = document.querySelector('#two [menu]');

    document.getElementById('one-open')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    expect(firstPanel?.hasAttribute('hidden')).toBe(false);

    document.getElementById('two-open')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    expect(secondPanel?.hasAttribute('hidden')).toBe(false);
    expect(firstPanel?.hasAttribute('hidden')).toBe(true);
    expect(document.getElementById('open-modal')?.hasAttribute('hidden')).toBe(
      false
    );

    controller.destroy();
  });

  it('ignores orphan panels and items outside a menu-root', () => {
    document.body.innerHTML = `
      <div menu id="orphan-menu">
        <button type="button" menuitem id="orphan-item">Orphan</button>
      </div>
      ${menuMarkup}
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const orphan = document.getElementById('orphan-menu');
    const orphanItem = document.getElementById('orphan-item');
    const panel = document.querySelector('[menu-root] [menu]');

    expect(orphan?.getAttribute('role')).toBeNull();
    expect(orphanItem?.getAttribute('role')).toBeNull();

    orphanItem?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(orphan?.hasAttribute('hidden')).toBe(false);
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('reopens onto the previously active item', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const items = document.querySelectorAll<HTMLElement>('[menuitem]');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    items[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })
    );
    expect(items[1]?.getAttribute('menuitem')).toBe('active');

    items[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(items[1]?.getAttribute('menuitem')).toBe('active');
    expect(document.activeElement).toBe(items[1]);

    controller.destroy();
  });

  it('opens onto the last item from ArrowUp on the opener', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const items = document.querySelectorAll<HTMLElement>('[menuitem]');

    opener?.focus();
    opener?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' })
    );

    expect(items[2]?.getAttribute('menuitem')).toBe('active');
    expect(document.activeElement).toBe(items[2]);

    controller.destroy();
  });

  it('does not activate a disabled item from select or click', () => {
    document.body.innerHTML = `
      <div menu-root>
        <button type="button" menu-button id="edit-open">Edit</button>
        <div menu hidden>
          <button type="button" menuitem aria-disabled="true">Locked</button>
          <button type="button" menuitem>Paste</button>
        </div>
      </div>
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('edit-open');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const locked = document.querySelector<HTMLElement>(
      '[menuitem][aria-disabled="true"]'
    );
    const onClick = vi.fn();
    locked?.addEventListener('click', onClick);

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(locked?.getAttribute('menuitem')).not.toBe('active');

    locked?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);

    controller.select(locked);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(panel?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('syncs late-rendered menu markup', async () => {
    stopMenuRuntime();
    const controller = createMenu({ root: document.body });

    document.body.innerHTML = `
      <div menu-root name="late">
        <button type="button" menu-button>Late</button>
        <div menu hidden>
          <button type="button" menuitem>Later</button>
        </div>
      </div>
    `;

    await flushRuntime();

    const opener = document.querySelector<HTMLElement>('[menu-button]');
    const panel = document.querySelector<HTMLElement>('[menu]');
    const item = document.querySelector<HTMLElement>('[menuitem]');

    expect(panel?.id).toBe('late-menu');
    expect(item?.id).toBe('late-item-1');
    expect(opener?.getAttribute('aria-haspopup')).toBe('menu');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('gives unique ids to nameless menus across scoped controllers', () => {
    document.body.innerHTML = `
      <div id="host-a">
        <div menu-root>
          <button type="button" menu-button>A</button>
          <div menu hidden>
            <button type="button" menuitem>Alpha</button>
          </div>
        </div>
      </div>
      <div id="host-b">
        <div menu-root>
          <button type="button" menu-button>B</button>
          <div menu hidden>
            <button type="button" menuitem>Beta</button>
          </div>
        </div>
      </div>
    `;
    stopMenuRuntime();

    const first = createMenu({
      root: document.getElementById('host-a') ?? document.body,
    });
    const second = createMenu({
      root: document.getElementById('host-b') ?? document.body,
    });

    const panels = document.querySelectorAll<HTMLElement>('[menu]');
    const items = document.querySelectorAll<HTMLElement>('[menuitem]');

    expect(panels[0]?.id).toBeTruthy();
    expect(panels[1]?.id).toBeTruthy();
    expect(panels[0]?.id).not.toBe(panels[1]?.id);
    expect(items[0]?.id).not.toBe(items[1]?.id);
    expect(document.querySelectorAll(`#${panels[0]?.id}`)).toHaveLength(1);
    expect(document.querySelectorAll(`#${panels[1]?.id}`)).toHaveLength(1);

    first.destroy();
    second.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = menuMarkup;
    startMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('toggles a non-native opener with Enter and Space', () => {
    document.body.innerHTML = `
      <div menu-root>
        <div menu-button id="plain-open">File</div>
        <div menu hidden>
          <button type="button" menuitem>New</button>
        </div>
      </div>
    `;
    stopMenuRuntime();

    const controller = createMenu({ root: document.body });
    const opener = document.getElementById('plain-open');
    const panel = document.querySelector<HTMLElement>('[menu]');

    expect(opener?.getAttribute('role')).toBe('button');
    expect(opener?.getAttribute('tabindex')).toBe('0');

    opener?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );
    expect(panel?.hasAttribute('hidden')).toBe(false);

    opener?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    );
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });
});

describe('startMenuRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = menuMarkup;
    stopMenuRuntime();

    const first = startMenuRuntime();
    const second = startMenuRuntime();
    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');

    expect(first).toBe(second);

    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopMenuRuntime', async () => {
    stopMenuRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./menu-runtime.js');
    document.body.innerHTML = menuMarkup;
    mod.stopMenuRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const opener = document.getElementById('file-open');
    const panel = document.querySelector<HTMLElement>('[menu]');
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(true);

    mod.startMenuRuntime();
    opener?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    mod.stopMenuRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
