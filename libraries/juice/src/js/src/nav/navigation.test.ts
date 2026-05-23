// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { createNavigation, stopNavigationRuntime } from './navigation.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

afterEach(() => {
  stopNavigationRuntime();
  resetDom();
});

describe('createNavigation', () => {
  it('connects mobile toggles to sidebars with accessible state', () => {
    document.body.innerHTML = `
      <div>
        <nav type="mobile"></nav>
        <nav type="sidebar" hidden></nav>
      </div>
    `;
    stopNavigationRuntime();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 480,
    });

    const controller = createNavigation({ root: document.body });
    const toggle = document.querySelector<HTMLElement>('nav[type="mobile"]');
    const sidebar = document.querySelector<HTMLElement>('nav[type="sidebar"]');

    expect(toggle).not.toBeNull();
    expect(sidebar).not.toBeNull();
    expect(sidebar?.id).toMatch(/^juice-sidebar-\d+$/);
    expect(toggle?.getAttribute('aria-controls')).toBe(sidebar?.id);
    expect(toggle?.getAttribute('data-nav-toggle-icon')).toBe('default');
    expect(toggle?.getAttribute('role')).toBe('button');
    expect(toggle?.getAttribute('tabindex')).toBe('0');
    expect(toggle?.getAttribute('aria-label')).toBe('Toggle navigation menu');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(sidebar?.getAttribute('aria-hidden')).toBe('true');

    toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(sidebar?.hasAttribute('hidden')).toBe(false);
    expect(sidebar?.getAttribute('aria-hidden')).toBe('false');

    controller.destroy();
  });

  it('supports keyboard activation for non-button mobile toggles', () => {
    document.body.innerHTML = `
      <div>
        <nav type="mobile"></nav>
        <nav type="sidebar" hidden></nav>
      </div>
    `;
    stopNavigationRuntime();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 480,
    });

    const controller = createNavigation({ root: document.body });
    const toggle = document.querySelector<HTMLElement>('nav[type="mobile"]');
    const sidebar = document.querySelector<HTMLElement>('nav[type="sidebar"]');

    toggle?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(sidebar?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('closes an open mobile sidebar on Escape and returns focus to the toggle', () => {
    document.body.innerHTML = `
      <div>
        <nav type="mobile"></nav>
        <nav type="sidebar" hidden>
          <a href="#item">Item</a>
        </nav>
      </div>
    `;
    stopNavigationRuntime();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 480,
    });

    const controller = createNavigation({ root: document.body });
    const toggle = document.querySelector<HTMLElement>('nav[type="mobile"]');
    const sidebar = document.querySelector<HTMLElement>('nav[type="sidebar"]');

    toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(sidebar?.hasAttribute('hidden')).toBe(false);

    const link = sidebar?.querySelector<HTMLAnchorElement>('a');
    link?.focus();
    expect(document.activeElement).toBe(link);

    link?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(sidebar?.getAttribute('aria-hidden')).toBe('true');
    expect(sidebar?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(toggle);

    controller.destroy();
  });
});
