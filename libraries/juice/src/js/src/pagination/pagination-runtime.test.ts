// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createPagination,
  startPaginationRuntime,
  stopPaginationRuntime,
} from './pagination-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const pageMarkup = `
  <nav pagination id="pages">
    <a pagination-prev href="?p=1" id="prev">Prev</a>
    <a href="?p=1" id="p1">1</a>
    <a href="?p=2" id="p2">2</a>
    <a href="?p=3" id="p3">3</a>
    <a pagination-next href="?p=2" id="next">Next</a>
  </nav>
`;

const keydown = (key: string, extras: KeyboardEventInit = {}) =>
  new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...extras });

afterEach(() => {
  stopPaginationRuntime();
  resetDom();
});

describe('createPagination', () => {
  it('names an unlabeled nav, keeps one current, and disables prev on the first page', () => {
    document.body.innerHTML = pageMarkup;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });
    const pages = document.getElementById('pages');
    const prev = document.getElementById('prev');
    const p1 = document.getElementById('p1');
    const next = document.getElementById('next');

    expect(pages?.getAttribute('aria-label')).toBe('Pagination');
    expect(pages?.hasAttribute('role')).toBe(false);
    expect(p1?.getAttribute('aria-current')).toBe('page');
    expect(p1?.getAttribute('href')).toBe('?p=1');
    expect(p1?.hasAttribute('tabindex')).toBe(false);
    expect(pages?.querySelectorAll('[aria-current="page"]').length).toBe(1);
    expect(prev?.getAttribute('aria-disabled')).toBe('true');
    expect(prev?.hasAttribute('disabled')).toBe(false);
    expect(prev?.getAttribute('href')).toBe('?p=1');
    expect(next?.hasAttribute('aria-disabled')).toBe(false);
    expect(pages?.getAttribute('aria-modal')).toBeNull();

    controller.sync();
    expect(pages?.querySelectorAll('[aria-current="page"]').length).toBe(1);

    controller.destroy();
  });

  it('keeps the first author current and drops the rest', () => {
    document.body.innerHTML = `
      <nav pagination id="pages" aria-label="Pages">
        <a pagination-prev href="?p=1" id="prev">Prev</a>
        <a href="?p=2" id="p2" aria-current="page">2</a>
        <a href="?p=3" id="p3" aria-current="page">3</a>
        <a pagination-next href="?p=3" id="next">Next</a>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });
    const pages = document.getElementById('pages');

    expect(pages?.getAttribute('aria-label')).toBe('Pages');
    expect(document.getElementById('p2')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('p3')?.hasAttribute('aria-current')).toBe(false);
    expect(document.getElementById('prev')?.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById('next')?.hasAttribute('aria-disabled')).toBe(false);
    expect(pages?.querySelectorAll('[aria-current="page"]').length).toBe(1);

    controller.destroy();
  });

  it('disables next on the last page and keeps an author-disabled prev', () => {
    document.body.innerHTML = `
      <nav pagination id="pages">
        <button pagination-prev id="prev" aria-disabled="true" type="button">Prev</button>
        <button type="button" id="p1">1</button>
        <button type="button" id="p2" aria-current="page">2</button>
        <button pagination-next id="next" type="button">Next</button>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });
    const prev = document.getElementById('prev') as HTMLButtonElement;
    const next = document.getElementById('next') as HTMLButtonElement;

    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(prev.disabled).toBe(false);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(next.disabled).toBe(true);

    controller.setCurrent(0);
    expect(document.getElementById('p1')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('p2')?.hasAttribute('aria-current')).toBe(false);
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(prev.disabled).toBe(false);
    expect(next.hasAttribute('aria-disabled')).toBe(false);
    expect(next.disabled).toBe(false);

    controller.destroy();
  });

  it('clears runtime disabled when setCurrent leaves the end', async () => {
    document.body.innerHTML = `
      <nav pagination id="pages">
        <button pagination-prev id="prev" type="button">Prev</button>
        <button type="button" id="p1">1</button>
        <button type="button" id="p2">2</button>
        <button pagination-next id="next" type="button">Next</button>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });
    const prev = document.getElementById('prev') as HTMLButtonElement;
    const next = document.getElementById('next') as HTMLButtonElement;
    const p2 = document.getElementById('p2');

    expect(document.getElementById('p1')?.getAttribute('aria-current')).toBe('page');
    expect(prev.disabled).toBe(true);
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(next.disabled).toBe(false);

    controller.setCurrent(p2!);
    await flushRuntime();

    expect(p2?.getAttribute('aria-current')).toBe('page');
    expect(prev.disabled).toBe(false);
    expect(prev.hasAttribute('aria-disabled')).toBe(false);
    expect(next.disabled).toBe(true);
    expect(next.getAttribute('aria-disabled')).toBe('true');

    controller.setCurrent(99);
    await flushRuntime();
    expect(p2?.getAttribute('aria-current')).toBe('page');

    controller.destroy();
  });

  it('uses ellipsis to decide the ends and treats page 1 as the start', () => {
    document.body.innerHTML = `
      <nav pagination id="leading">
        <a pagination-prev href="?p=4" id="lead-prev">Prev</a>
        <span pagination-ellipsis>…</span>
        <a href="?p=5" id="lead-5">5</a>
        <a href="?p=6" id="lead-6" aria-current="page">6</a>
        <a href="?p=7" id="lead-7">7</a>
        <a pagination-next href="?p=7" id="lead-next">Next</a>
      </nav>
      <nav pagination id="trailing">
        <a pagination-prev href="?p=1" id="trail-prev">Prev</a>
        <a href="?p=1" id="trail-1" aria-current="page">1</a>
        <a href="?p=2" id="trail-2">2</a>
        <span pagination-ellipsis>…</span>
        <a href="?p=9" id="trail-9">9</a>
        <a pagination-next href="?p=2" id="trail-next">Next</a>
      </nav>
      <nav pagination id="numbered">
        <a pagination-prev href="?p=1" id="num-prev">Prev</a>
        <span pagination-ellipsis>…</span>
        <a href="?p=1" id="num-1" aria-current="page">1</a>
        <a href="?p=2" id="num-2">2</a>
        <a pagination-next href="?p=2" id="num-next">Next</a>
      </nav>
      <nav pagination id="last">
        <a pagination-prev href="?p=8" id="last-prev">Prev</a>
        <a href="?p=1" id="last-1">1</a>
        <span pagination-ellipsis>…</span>
        <a href="?p=9" id="last-9" aria-current="page">9</a>
        <a pagination-next href="?p=9" id="last-next">Next</a>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });

    expect(document.getElementById('lead-prev')?.hasAttribute('aria-disabled')).toBe(false);
    expect(document.getElementById('lead-next')?.hasAttribute('aria-disabled')).toBe(false);
    expect(document.getElementById('lead-5')?.hasAttribute('aria-current')).toBe(false);

    expect(document.getElementById('trail-prev')?.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById('trail-next')?.hasAttribute('aria-disabled')).toBe(false);

    expect(document.getElementById('num-prev')?.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById('num-next')?.hasAttribute('aria-disabled')).toBe(false);

    expect(document.getElementById('last-prev')?.hasAttribute('aria-disabled')).toBe(false);
    expect(document.getElementById('last-next')?.getAttribute('aria-disabled')).toBe('true');

    controller.destroy();
  });

  it('does not invent a landmark name on a list, a labeled nav, or an author role', () => {
    document.body.innerHTML = `
      <ol pagination id="list">
        <li pagination-item><a pagination-prev href="?p=1" id="list-prev">Prev</a></li>
        <li pagination-item><a href="?p=1" id="list-1">1</a></li>
        <li pagination-item><a href="?p=2" id="list-2" aria-current="page">2</a></li>
        <li pagination-item><a pagination-next href="?p=3" id="list-next">Next</a></li>
      </ol>
      <nav pagination id="named" aria-labelledby="page-name" title="">
        <span id="page-name">Pages</span>
        <a href="?p=1" id="named-1" aria-current="page">1</a>
      </nav>
      <nav pagination id="titled" title="Result pages">
        <a href="?p=1" id="titled-1">1</a>
      </nav>
      <div pagination id="region" role="group">
        <a href="?p=1" id="group-1">1</a>
      </div>
      <div pagination id="plain">
        <a href="?p=1" id="plain-1">1</a>
      </div>
      <nav type="pagination" id="legacy" aria-label="Site">
        <a href="/legacy" id="legacy-link">Legacy</a>
      </nav>
      <nav aria-label="Site" id="ancestor">
        <nav pagination id="nested">
          <a href="?p=1" id="nested-1">1</a>
          <a href="?p=2" id="nested-2">2</a>
        </nav>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });

    expect(document.getElementById('list')?.hasAttribute('role')).toBe(false);
    expect(document.getElementById('list')?.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById('list-2')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('list-1')?.hasAttribute('aria-current')).toBe(false);

    expect(document.getElementById('named')?.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById('named')?.getAttribute('aria-labelledby')).toBe('page-name');
    expect(document.getElementById('titled')?.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById('titled')?.getAttribute('title')).toBe('Result pages');
    expect(document.getElementById('titled-1')?.getAttribute('aria-current')).toBe('page');

    expect(document.getElementById('region')?.getAttribute('role')).toBe('group');
    expect(document.getElementById('region')?.hasAttribute('aria-label')).toBe(false);

    expect(document.getElementById('plain')?.getAttribute('role')).toBe('navigation');
    expect(document.getElementById('plain')?.getAttribute('aria-label')).toBe('Pagination');

    expect(document.getElementById('legacy')?.getAttribute('aria-label')).toBe('Site');
    expect(document.getElementById('legacy-link')?.hasAttribute('aria-current')).toBe(false);

    expect(document.getElementById('ancestor')?.getAttribute('aria-label')).toBe('Site');
    expect(document.getElementById('nested')?.getAttribute('aria-label')).toBe('Pagination');
    expect(document.getElementById('nested')?.hasAttribute('role')).toBe(false);
    expect(document.getElementById('nested-1')?.getAttribute('aria-current')).toBe('page');

    controller.destroy();
  });

  it('disables both ends on a single page and ignores status text', () => {
    document.body.innerHTML = `
      <nav pagination id="solo">
        <a pagination-prev href="?p=1" id="solo-prev">Prev</a>
        <span pagination-status id="status">Page 1 of 1</span>
        <a href="?p=1" id="solo-1">1</a>
        <a pagination-next href="?p=1" id="solo-next">Next</a>
      </nav>
      <nav pagination id="bare">
        <a pagination-prev href="?p=1" id="bare-prev">Prev</a>
        <a pagination-next href="?p=2" id="bare-next">Next</a>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });

    expect(document.getElementById('solo-prev')?.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById('solo-next')?.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById('solo-1')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('status')?.hasAttribute('aria-current')).toBe(false);
    expect(document.getElementById('status')?.hasAttribute('aria-disabled')).toBe(false);

    expect(document.getElementById('bare')?.querySelector('[aria-current="page"]')).toBeNull();
    expect(document.getElementById('bare-prev')?.hasAttribute('aria-disabled')).toBe(false);
    expect(document.getElementById('bare-next')?.hasAttribute('aria-disabled')).toBe(false);

    controller.destroy();
  });

  it('moves focus with Arrow, Home, and End among enabled controls', () => {
    document.body.innerHTML = `
      <nav pagination id="pages">
        <a pagination-prev href="?p=1" id="prev">Prev</a>
        <a href="?p=1" id="p1">1</a>
        <a href="?p=2" id="p2" aria-disabled="true">2</a>
        <a href="?p=3" id="p3">3</a>
        <a pagination-next href="?p=2" id="next">Next</a>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });
    const prev = document.getElementById('prev');
    const p1 = document.getElementById('p1');
    const p2 = document.getElementById('p2');
    const p3 = document.getElementById('p3');
    const next = document.getElementById('next');

    expect(prev?.getAttribute('aria-disabled')).toBe('true');
    expect(p2?.getAttribute('aria-disabled')).toBe('true');

    p1?.focus();
    const left = keydown('ArrowLeft');
    p1?.dispatchEvent(left);
    expect(left.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(p1);

    const right = keydown('ArrowRight');
    p1?.dispatchEvent(right);
    expect(right.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(p3);

    const end = keydown('End');
    p3?.dispatchEvent(end);
    expect(document.activeElement).toBe(next);

    const home = keydown('Home');
    next?.dispatchEvent(home);
    expect(document.activeElement).toBe(p1);

    const shift = keydown('ArrowRight', { shiftKey: true });
    p1?.dispatchEvent(shift);
    expect(shift.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(p1);

    const enter = keydown('Enter');
    p1?.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);

    const space = keydown(' ');
    p1?.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);

    const atEnd = keydown('ArrowRight');
    next?.focus();
    next?.dispatchEvent(atEnd);
    expect(atEnd.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(next);

    controller.destroy();
    p1?.focus();
    p1?.dispatchEvent(keydown('ArrowRight'));
    expect(document.activeElement).toBe(p1);
  });

  it('cancels a disabled link click and leaves an enabled control alone', () => {
    document.body.innerHTML = `
      <nav pagination id="pages">
        <a pagination-prev href="?p=1" id="prev">Prev</a>
        <button type="button" id="p1">1</button>
        <button type="button" id="p2">2</button>
        <a pagination-next href="?p=2" id="next">Next</a>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });
    const prev = document.getElementById('prev');
    const p2 = document.getElementById('p2');

    const blocked = new MouseEvent('click', { bubbles: true, cancelable: true });
    prev?.dispatchEvent(blocked);
    expect(blocked.defaultPrevented).toBe(true);

    const allowed = new MouseEvent('click', { bubbles: true, cancelable: true });
    p2?.dispatchEvent(allowed);
    expect(allowed.defaultPrevented).toBe(false);

    controller.destroy();
  });

  it('keeps nested paginations and item wrappers independent', () => {
    document.body.innerHTML = `
      <nav pagination id="outer" aria-label="Outer pages">
        <a href="?p=1" id="o1" aria-current="page">1</a>
        <a href="?p=2" id="o2">2</a>
        <nav pagination id="inner">
          <span pagination-item><a pagination-prev href="?p=1" id="i-prev">Prev</a></span>
          <span pagination-item><span pagination-ellipsis>…</span></span>
          <span pagination-item><a href="?p=2" id="i2" aria-current="page">2</a></span>
          <span pagination-item><a href="?p=3" id="i3" aria-current="page">3</a></span>
          <span pagination-item><a pagination-next href="?p=3" id="i-next">Next</a></span>
        </nav>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });

    expect(document.getElementById('outer')?.getAttribute('aria-label')).toBe('Outer pages');
    expect(document.getElementById('o1')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('o2')?.hasAttribute('aria-current')).toBe(false);
    expect(document.getElementById('inner')?.getAttribute('aria-label')).toBe('Pagination');
    expect(document.getElementById('i2')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('i3')?.hasAttribute('aria-current')).toBe(false);
    expect(document.getElementById('i-prev')?.hasAttribute('aria-disabled')).toBe(false);
    expect(document.getElementById('i-next')?.hasAttribute('aria-disabled')).toBe(false);

    controller.destroy();
  });

  it('syncs a page set rendered after init', async () => {
    stopPaginationRuntime();
    const controller = createPagination({ root: document.body });

    document.body.innerHTML = pageMarkup;
    await flushRuntime();

    const pages = document.getElementById('pages');
    expect(pages?.getAttribute('aria-label')).toBe('Pagination');
    expect(document.getElementById('p1')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('prev')?.getAttribute('aria-disabled')).toBe('true');

    controller.destroy();
  });

  it('does not enhance markup rendered after destroy', async () => {
    stopPaginationRuntime();
    const controller = createPagination({ root: document.body });
    controller.destroy();

    document.body.innerHTML = pageMarkup;
    await flushRuntime();

    expect(document.getElementById('pages')?.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById('p1')?.hasAttribute('aria-current')).toBe(false);
    expect(document.getElementById('prev')?.hasAttribute('aria-disabled')).toBe(false);
  });

  it('ignores arrows from an editable control inside the page set', () => {
    document.body.innerHTML = `
      <nav pagination id="pages">
        <input id="filter" />
        <a href="?p=1" id="p1">1</a>
        <a href="?p=2" id="p2">2</a>
      </nav>
    `;
    stopPaginationRuntime();

    const controller = createPagination({ root: document.body });
    const filter = document.getElementById('filter');
    filter?.focus();
    const right = keydown('ArrowRight');
    filter?.dispatchEvent(right);

    expect(right.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(filter);

    controller.destroy();
  });
});

describe('startPaginationRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = pageMarkup;
    stopPaginationRuntime();

    const first = startPaginationRuntime();
    const second = startPaginationRuntime();

    expect(first).toBe(second);
    expect(document.getElementById('p1')?.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById('pages')?.getAttribute('aria-label')).toBe('Pagination');
    expect(document.getElementById('prev')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not auto-start on DOMContentLoaded after stopPaginationRuntime', async () => {
    stopPaginationRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./pagination-runtime.js');
      document.body.innerHTML = pageMarkup;
      mod.stopPaginationRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.getElementById('p1')?.hasAttribute('aria-current')).toBe(false);
      expect(document.getElementById('pages')?.hasAttribute('aria-label')).toBe(false);

      mod.startPaginationRuntime();
      expect(document.getElementById('p1')?.getAttribute('aria-current')).toBe('page');
      mod.stopPaginationRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
