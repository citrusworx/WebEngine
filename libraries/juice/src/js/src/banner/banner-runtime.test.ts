// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createBanner,
  startBannerRuntime,
  stopBannerRuntime,
} from './banner-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const resetStorage = () => {
  sessionStorage.clear();
  localStorage.clear();
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const bannerMarkup = `
  <div banner id="demo-banner">
    <div banner-body>Scheduled maintenance tonight.</div>
    <button type="button" banner-close aria-label="Dismiss">×</button>
  </div>
`;

afterEach(() => {
  stopBannerRuntime();
  resetDom();
  resetStorage();
});

describe('createBanner', () => {
  it('fills status role without becoming a dialog', () => {
    document.body.innerHTML = bannerMarkup;
    stopBannerRuntime();

    const controller = createBanner({ root: document.body });
    const banner = document.getElementById('demo-banner');

    expect(banner?.getAttribute('role')).toBe('status');
    expect(banner?.getAttribute('aria-modal')).toBeNull();
    expect(banner?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('uses role="alert" for error and warning tones', () => {
    document.body.innerHTML = `
      <div banner banner-tone="error" id="error-banner">
        <div banner-body>Could not save.</div>
        <button type="button" banner-close></button>
      </div>
      <div banner banner-tone="warning" id="warning-banner">
        <div banner-body>Check your input.</div>
      </div>
      <div banner banner-tone="info" id="info-banner">
        <div banner-body>Heads up.</div>
      </div>
      <div banner banner-tone="success" id="success-banner">
        <div banner-body>Saved.</div>
      </div>
      <div banner="full" id="full-banner">
        <div banner-body>Neutral full-width.</div>
      </div>
    `;
    stopBannerRuntime();

    const controller = createBanner({ root: document.body });
    const close = document.querySelector<HTMLElement>('[banner-close]');

    expect(document.getElementById('error-banner')?.getAttribute('role')).toBe(
      'alert'
    );
    expect(document.getElementById('warning-banner')?.getAttribute('role')).toBe(
      'alert'
    );
    expect(document.getElementById('info-banner')?.getAttribute('role')).toBe(
      'status'
    );
    expect(document.getElementById('success-banner')?.getAttribute('role')).toBe(
      'status'
    );
    expect(document.getElementById('full-banner')?.getAttribute('role')).toBe(
      'status'
    );
    expect(close?.getAttribute('aria-label')).toBe('Dismiss');

    controller.destroy();
  });

  it('dismisses on close click and exposes show / dismiss', () => {
    document.body.innerHTML = `
      <div banner id="demo-banner" hidden>
        <div banner-body>Scheduled maintenance tonight.</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
    `;
    stopBannerRuntime();

    const controller = createBanner({ root: document.body });
    const banner = document.getElementById('demo-banner');

    controller.show(banner);
    expect(banner?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).not.toBe(
      document.querySelector('[banner-close]')
    );

    document
      .querySelector<HTMLElement>('[banner-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(banner?.hasAttribute('hidden')).toBe(true);

    controller.show(banner);
    expect(banner?.hasAttribute('hidden')).toBe(false);
    controller.dismiss(banner);
    expect(banner?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('keeps sibling banners visible when one is dismissed', () => {
    document.body.innerHTML = `
      <div banner id="first-banner">
        <div banner-body>First</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
      <div banner="full" id="second-banner">
        <div banner-body>Second</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
    `;
    stopBannerRuntime();

    const controller = createBanner({ root: document.body });
    const first = document.getElementById('first-banner');
    const second = document.getElementById('second-banner');

    first
      ?.querySelector<HTMLElement>('[banner-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(first?.hasAttribute('hidden')).toBe(true);
    expect(second?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('supports keyboard activation for non-button close controls', () => {
    document.body.innerHTML = `
      <div banner id="plain-banner">
        <div banner-body>Scheduled maintenance tonight.</div>
        <div banner-close></div>
      </div>
    `;
    stopBannerRuntime();

    const controller = createBanner({ root: document.body });
    const banner = document.getElementById('plain-banner');
    const close = document.querySelector<HTMLElement>('[banner-close]');

    expect(close?.getAttribute('role')).toBe('button');
    expect(close?.getAttribute('tabindex')).toBe('0');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss');

    close?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );
    expect(banner?.hasAttribute('hidden')).toBe(true);

    controller.show(banner);
    close?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    );
    expect(banner?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('does not dismiss on Escape', () => {
    document.body.innerHTML = bannerMarkup;
    stopBannerRuntime();

    const controller = createBanner({ root: document.body });
    const banner = document.getElementById('demo-banner');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );
    expect(banner?.hasAttribute('hidden')).toBe(false);

    banner
      ?.querySelector<HTMLElement>('[banner-close]')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
      );
    expect(banner?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('remembers dismiss in sessionStorage when banner-persist="session"', () => {
    document.body.innerHTML = `
      <div banner id="notice" name="maintenance" banner-persist="session">
        <div banner-body>Scheduled maintenance tonight.</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
    `;
    stopBannerRuntime();

    const first = createBanner({ root: document.body });
    const banner = document.getElementById('notice');

    document
      .querySelector<HTMLElement>('[banner-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(banner?.hasAttribute('hidden')).toBe(true);
    expect(sessionStorage.getItem('juice-banner:maintenance')).toBe('1');
    expect(localStorage.getItem('juice-banner:maintenance')).toBeNull();

    first.destroy();
    banner?.removeAttribute('hidden');

    const second = createBanner({ root: document.body });
    expect(banner?.hasAttribute('hidden')).toBe(true);

    second.show(banner);
    expect(banner?.hasAttribute('hidden')).toBe(false);
    expect(sessionStorage.getItem('juice-banner:maintenance')).toBeNull();

    second.destroy();
  });

  it('remembers dismiss in localStorage when banner-persist="local"', () => {
    document.body.innerHTML = `
      <div banner id="cookie-notice" banner-persist="local">
        <div banner-body>We use cookies.</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
    `;
    stopBannerRuntime();

    const first = createBanner({ root: document.body });
    const banner = document.getElementById('cookie-notice');

    first.dismiss(banner);
    expect(localStorage.getItem('juice-banner:cookie-notice')).toBe('1');
    expect(sessionStorage.getItem('juice-banner:cookie-notice')).toBeNull();

    first.destroy();
    banner?.removeAttribute('hidden');

    const second = createBanner({ root: document.body });
    expect(banner?.hasAttribute('hidden')).toBe(true);
    second.destroy();
  });

  it('skips persistence without a name or id key', () => {
    document.body.innerHTML = `
      <div banner banner-persist="session">
        <div banner-body>Ephemeral notice.</div>
        <button type="button" banner-close aria-label="Dismiss">×</button>
      </div>
    `;
    stopBannerRuntime();

    const controller = createBanner({ root: document.body });
    const banner = document.querySelector<HTMLElement>('[banner]');

    controller.dismiss(banner);
    expect(banner?.hasAttribute('hidden')).toBe(true);
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);

    controller.destroy();
  });

  it('syncs late-rendered banner markup', async () => {
    stopBannerRuntime();
    const controller = createBanner({ root: document.body });

    document.body.innerHTML = `
      <div banner id="late-banner" banner-tone="error">
        <div banner-body>Late</div>
        <button type="button" banner-close></button>
      </div>
    `;

    await flushRuntime();

    const banner = document.getElementById('late-banner');
    const close = document.querySelector<HTMLElement>('[banner-close]');

    expect(banner?.getAttribute('role')).toBe('alert');
    expect(close?.getAttribute('aria-label')).toBe('Dismiss');

    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(banner?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('dismisses once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = bannerMarkup;
    startBannerRuntime();

    const controller = createBanner({ root: document.body });
    const banner = document.getElementById('demo-banner');

    document
      .querySelector<HTMLElement>('[banner-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(banner?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });
});

describe('startBannerRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = bannerMarkup;
    stopBannerRuntime();

    const first = startBannerRuntime();
    const second = startBannerRuntime();
    const banner = document.getElementById('demo-banner');

    expect(first).toBe(second);
    expect(banner?.getAttribute('role')).toBe('status');

    document
      .querySelector<HTMLElement>('[banner-close]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(banner?.hasAttribute('hidden')).toBe(true);
  });

  it('does not auto-start on DOMContentLoaded after stopBannerRuntime', async () => {
    stopBannerRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./banner-runtime.js');
    document.body.innerHTML = bannerMarkup;
    mod.stopBannerRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const close = document.querySelector<HTMLElement>('[banner-close]');
    const banner = document.getElementById('demo-banner');
    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(banner?.hasAttribute('hidden')).toBe(false);

    mod.startBannerRuntime();
    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(banner?.hasAttribute('hidden')).toBe(true);
    mod.stopBannerRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
