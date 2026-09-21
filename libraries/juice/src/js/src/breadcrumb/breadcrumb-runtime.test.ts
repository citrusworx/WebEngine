// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createBreadcrumb,
  startBreadcrumbRuntime,
  stopBreadcrumbRuntime,
} from './breadcrumb-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const trailMarkup = `
  <nav breadcrumb id="trail">
    <span breadcrumb-item><a href="/" id="home">Home</a></span>
    <span breadcrumb-item><a href="/docs" id="docs">Docs</a></span>
    <span breadcrumb-item><a href="/docs/breadcrumb" id="current">Breadcrumb</a></span>
  </nav>
`;

afterEach(() => {
  stopBreadcrumbRuntime();
  resetDom();
});

describe('createBreadcrumb', () => {
  it('syncs aria-current="page" onto the last crumb link', () => {
    document.body.innerHTML = trailMarkup;
    stopBreadcrumbRuntime();

    const controller = createBreadcrumb({ root: document.body });
    const trail = document.getElementById('trail');
    const current = document.getElementById('current');
    const home = document.getElementById('home');

    expect(trail?.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(trail?.hasAttribute('role')).toBe(false);
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(current?.getAttribute('href')).toBe('/docs/breadcrumb');
    expect(current?.hasAttribute('aria-disabled')).toBe(false);
    expect(home?.hasAttribute('aria-current')).toBe(false);
    expect(current?.parentElement?.hasAttribute('aria-current')).toBe(false);

    controller.sync();
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(
      trail?.querySelectorAll('[aria-current="page"]').length
    ).toBe(1);

    controller.destroy();
  });

  it('marks the last crumb element when it has no link', () => {
    document.body.innerHTML = `
      <nav breadcrumb id="trail">
        <span breadcrumb-item><a href="/">Home</a></span>
        <span breadcrumb-item id="current">Breadcrumb</span>
      </nav>
    `;
    stopBreadcrumbRuntime();

    const controller = createBreadcrumb({ root: document.body });
    expect(document.getElementById('current')?.getAttribute('aria-current')).toBe(
      'page'
    );

    controller.destroy();
  });

  it('marks the last direct link when the trail has no items', () => {
    document.body.innerHTML = `
      <nav breadcrumb id="trail">
        <a href="/" id="home">Home</a>
        <a href="/docs" id="docs">Docs</a>
      </nav>
    `;
    stopBreadcrumbRuntime();

    const controller = createBreadcrumb({ root: document.body });
    expect(document.getElementById('docs')?.getAttribute('aria-current')).toBe(
      'page'
    );
    expect(document.getElementById('home')?.hasAttribute('aria-current')).toBe(
      false
    );

    controller.destroy();
  });

  it('keeps an author current exclusive', () => {
    document.body.innerHTML = `
      <nav breadcrumb id="trail" aria-label="You are here">
        <span breadcrumb-item><a href="/" id="home" aria-current="page">Home</a></span>
        <span breadcrumb-item><a href="/docs" id="docs" aria-current="page">Docs</a></span>
        <span breadcrumb-item><a href="/docs/breadcrumb" id="current">Breadcrumb</a></span>
      </nav>
    `;
    stopBreadcrumbRuntime();

    const controller = createBreadcrumb({ root: document.body });
    const trail = document.getElementById('trail');

    expect(trail?.getAttribute('aria-label')).toBe('You are here');
    expect(document.getElementById('home')?.getAttribute('aria-current')).toBe(
      'page'
    );
    expect(document.getElementById('docs')?.hasAttribute('aria-current')).toBe(
      false
    );
    expect(
      document.getElementById('current')?.hasAttribute('aria-current')
    ).toBe(false);
    expect(trail?.querySelectorAll('[aria-current="page"]').length).toBe(1);

    controller.destroy();
  });

  it('does not invent a landmark on a list root or a labeled nav', () => {
    document.body.innerHTML = `
      <ol breadcrumb id="list">
        <li breadcrumb-item><a href="/" id="home">Home</a></li>
        <li breadcrumb-item id="current">Page</li>
      </ol>
      <nav breadcrumb id="named" aria-labelledby="trail-name" title="">
        <span id="trail-name">Trail</span>
        <span breadcrumb-item id="named-current">Page</span>
      </nav>
      <nav breadcrumb id="titled" title="Section trail">
        <span breadcrumb-item id="titled-current">Page</span>
      </nav>
      <div breadcrumb id="region" role="group">
        <span breadcrumb-item id="group-current">Page</span>
      </div>
      <div breadcrumb id="plain">
        <span breadcrumb-item id="plain-current">Page</span>
      </div>
      <nav type="breadcrumb" id="legacy">
        <a href="/legacy">Legacy</a>
      </nav>
    `;
    stopBreadcrumbRuntime();

    const controller = createBreadcrumb({ root: document.body });
    const list = document.getElementById('list');
    const named = document.getElementById('named');
    const titled = document.getElementById('titled');
    const region = document.getElementById('region');
    const plain = document.getElementById('plain');
    const legacy = document.getElementById('legacy');

    expect(list?.hasAttribute('role')).toBe(false);
    expect(list?.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById('current')?.getAttribute('aria-current')).toBe(
      'page'
    );

    expect(named?.hasAttribute('aria-label')).toBe(false);
    expect(named?.getAttribute('aria-labelledby')).toBe('trail-name');
    expect(titled?.hasAttribute('aria-label')).toBe(false);
    expect(titled?.getAttribute('title')).toBe('Section trail');

    expect(region?.getAttribute('role')).toBe('group');
    expect(region?.hasAttribute('aria-label')).toBe(false);

    expect(plain?.getAttribute('role')).toBe('navigation');
    expect(plain?.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(
      document.getElementById('plain-current')?.getAttribute('aria-current')
    ).toBe('page');

    expect(legacy?.hasAttribute('aria-label')).toBe(false);
    expect(legacy?.querySelector('[aria-current="page"]')).toBeNull();

    controller.destroy();
  });

  it('moves the current crumb with setCurrent and leaves it there', async () => {
    document.body.innerHTML = trailMarkup;
    stopBreadcrumbRuntime();

    const controller = createBreadcrumb({ root: document.body });
    const docs = document.getElementById('docs');
    const current = document.getElementById('current');

    controller.setCurrent(1);
    await flushRuntime();

    expect(docs?.getAttribute('aria-current')).toBe('page');
    expect(current?.hasAttribute('aria-current')).toBe(false);

    controller.setCurrent(docs!);
    await flushRuntime();
    expect(docs?.getAttribute('aria-current')).toBe('page');
    expect(
      document.getElementById('trail')?.querySelectorAll('[aria-current="page"]')
        .length
    ).toBe(1);

    controller.setCurrent(99);
    await flushRuntime();
    expect(docs?.getAttribute('aria-current')).toBe('page');

    controller.destroy();
  });

  it('syncs a trail rendered after init', async () => {
    stopBreadcrumbRuntime();
    const controller = createBreadcrumb({ root: document.body });

    document.body.innerHTML = trailMarkup;
    await flushRuntime();

    const current = document.getElementById('current');
    const trail = document.getElementById('trail');
    expect(trail?.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(current?.getAttribute('href')).toBe('/docs/breadcrumb');

    controller.destroy();
  });

  it('does not enhance markup rendered after destroy', async () => {
    stopBreadcrumbRuntime();
    const controller = createBreadcrumb({ root: document.body });
    controller.destroy();

    document.body.innerHTML = trailMarkup;
    await flushRuntime();

    const trail = document.getElementById('trail');
    expect(trail?.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById('current')?.hasAttribute('aria-current')).toBe(
      false
    );
  });
});

describe('startBreadcrumbRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = trailMarkup;
    stopBreadcrumbRuntime();

    const first = startBreadcrumbRuntime();
    const second = startBreadcrumbRuntime();
    const current = document.getElementById('current');

    expect(first).toBe(second);
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('trail')?.getAttribute('aria-label')).toBe(
      'Breadcrumb'
    );
  });

  it('does not auto-start on DOMContentLoaded after stopBreadcrumbRuntime', async () => {
    stopBreadcrumbRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./breadcrumb-runtime.js');
    document.body.innerHTML = trailMarkup;
    mod.stopBreadcrumbRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('current')?.hasAttribute('aria-current')).toBe(
      false
    );
    expect(document.getElementById('trail')?.hasAttribute('aria-label')).toBe(
      false
    );

    mod.startBreadcrumbRuntime();
    expect(document.getElementById('current')?.getAttribute('aria-current')).toBe(
      'page'
    );
    mod.stopBreadcrumbRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
