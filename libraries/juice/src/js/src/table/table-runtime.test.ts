// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JUICE_CHANGE_EVENT } from '../shared/change.js';
import {
  createTable,
  initTable,
  startTableRuntime,
  stopTableRuntime,
  type TableController,
} from './table-runtime.js';

type SortEvent = CustomEvent<{ column: number; direction: string }>;
type ChangeEvent = CustomEvent<{ runtime: string; state: { column: number | null; direction: string } }>;

let active: TableController | null = null;

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const mount = (markup: string) => {
  stopTableRuntime();
  active?.destroy();
  document.body.innerHTML = markup;
  active = createTable({ root: document.body });
  return active;
};

const buttonIn = (id: string) => {
  const host = document.getElementById(id);
  const button = host?.querySelector(':scope > button');
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`missing sort button in #${id}`);
  }
  return button;
};

const press = (id: string) => {
  buttonIn(id).click();
};

const rowIds = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  if (!(section instanceof HTMLTableSectionElement)) return [];
  return Array.from(section.rows).map((row) => row.id);
};

const listen = (type: string) => {
  const events: Event[] = [];
  const onEvent = (event: Event) => {
    events.push(event);
  };
  document.body.addEventListener(type, onEvent);
  return {
    events,
    stop: () => document.body.removeEventListener(type, onEvent),
  };
};

const people = `
  <table table id="people">
    <caption>People</caption>
    <thead>
      <tr>
        <th sortable id="name"><span id="name-label">Name</span></th>
        <th sortable id="age" numeric table-align="end">Age</th>
      </tr>
    </thead>
    <tbody id="body">
      <tr id="grace"><td>Grace</td><td>85</td></tr>
      <tr id="ada"><td>Ada</td><td>36</td></tr>
      <tr id="alan"><td>Alan</td><td>20</td></tr>
    </tbody>
    <tfoot>
      <tr id="total"><td>Total</td><td>162</td></tr>
    </tfoot>
  </table>
`;

afterEach(() => {
  active?.destroy();
  active = null;
  stopTableRuntime();
  resetDom();
  vi.restoreAllMocks();
});

describe('createTable', () => {
  it('is the same function as initTable', () => {
    expect(initTable).toBe(createTable);
  });

  it('wraps sortable headers once and reports an unsorted state', () => {
    const heard = listen(JUICE_CHANGE_EVENT);
    const controller = mount(people);
    const name = document.getElementById('name');
    const age = document.getElementById('age');
    const label = document.getElementById('name-label');
    const button = buttonIn('name');

    expect(button.type).toBe('button');
    expect(button.tabIndex).toBe(0);
    expect(label?.parentElement).toBe(button);
    expect(name?.getAttribute('aria-sort')).toBe('none');
    expect(age?.getAttribute('aria-sort')).toBe('none');
    expect(controller.getState()).toEqual({ column: null, direction: 'none' });
    expect(controller.getState(document.getElementById('ada'))).toEqual({
      column: null,
      direction: 'none',
    });
    expect(heard.events).toHaveLength(0);
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);

    controller.sync();
    expect(name?.querySelectorAll('button')).toHaveLength(1);
    expect(document.getElementById('name-label')?.parentElement).toBe(button);
    expect(heard.events).toHaveLength(0);

    heard.stop();
  });

  it('cycles aria-sort on one column and leaves the other sortable header at none', () => {
    const controller = mount(people);
    const heard = listen(JUICE_CHANGE_EVENT);
    const name = document.getElementById('name');
    const age = document.getElementById('age');
    const table = document.getElementById('people');

    press('name');
    expect(name?.getAttribute('aria-sort')).toBe('ascending');
    expect(age?.getAttribute('aria-sort')).toBe('none');
    expect(controller.getState(table)).toEqual({ column: 0, direction: 'ascending' });
    expect(rowIds('body')).toEqual(['ada', 'alan', 'grace']);
    expect(document.querySelector('tfoot tr')?.id).toBe('total');

    press('name');
    expect(name?.getAttribute('aria-sort')).toBe('descending');
    expect(age?.getAttribute('aria-sort')).toBe('none');
    expect(controller.getState()).toEqual({ column: 0, direction: 'descending' });
    expect(rowIds('body')).toEqual(['grace', 'alan', 'ada']);

    press('name');
    expect(name?.getAttribute('aria-sort')).toBe('none');
    expect(controller.getState()).toEqual({ column: null, direction: 'none' });
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);

    const changes = heard.events as ChangeEvent[];
    expect(changes).toHaveLength(3);
    expect(changes.every((event) => event.bubbles && event.composed)).toBe(true);
    expect(changes.map((event) => event.target)).toEqual([table, table, table]);
    expect(changes.map((event) => event.detail)).toEqual([
      { runtime: 'table', state: { column: 0, direction: 'ascending' } },
      { runtime: 'table', state: { column: 0, direction: 'descending' } },
      { runtime: 'table', state: { column: null, direction: 'none' } },
    ]);

    heard.stop();
  });

  it('sorts a second column alone', () => {
    const controller = mount(people);

    press('age');
    expect(document.getElementById('age')?.getAttribute('aria-sort')).toBe('ascending');
    expect(document.getElementById('name')?.getAttribute('aria-sort')).toBe('none');
    expect(controller.getState()).toEqual({ column: 1, direction: 'ascending' });
    expect(rowIds('body')).toEqual(['alan', 'ada', 'grace']);

    press('name');
    expect(document.getElementById('name')?.getAttribute('aria-sort')).toBe('ascending');
    expect(document.getElementById('age')?.getAttribute('aria-sort')).toBe('none');
    expect(rowIds('body')).toEqual(['ada', 'alan', 'grace']);
  });

  it('sorts text with a base numeric collator and keeps equal keys stable', () => {
    const controller = mount(`
      <table table id="items">
        <thead>
          <tr><th sortable id="label">Label</th></tr>
        </thead>
        <tbody id="body">
          <tr id="ten"><td>item10</td></tr>
          <tr id="apple"><td>Apple</td></tr>
          <tr id="two"><td>item2</td></tr>
          <tr id="apple-2"><td>apple</td></tr>
          <tr id="banana"><td>banana</td></tr>
        </tbody>
      </table>
    `);

    press('label');
    expect(controller.getState()?.direction).toBe('ascending');
    expect(rowIds('body')).toEqual(['apple', 'apple-2', 'banana', 'two', 'ten']);

    press('label');
    expect(rowIds('body')).toEqual(['ten', 'two', 'banana', 'apple', 'apple-2']);
  });

  it('sorts numeric columns by value, including negatives, decimals, and unparseable cells', () => {
    mount(`
      <table table>
        <thead>
          <tr><th sortable numeric id="n">N</th></tr>
        </thead>
        <tbody id="body">
          <tr id="ten"><td>10</td></tr>
          <tr id="neg"><td>-2</td></tr>
          <tr id="one"><td>1.10</td></tr>
          <tr id="bad"><td>n/a</td></tr>
          <tr id="two"><td>1.2</td></tr>
        </tbody>
      </table>
    `);

    press('n');
    expect(rowIds('body')).toEqual(['neg', 'one', 'two', 'ten', 'bad']);

    press('n');
    expect(rowIds('body')).toEqual(['ten', 'two', 'one', 'neg', 'bad']);
  });

  it('treats the column as numeric when a body cell has [numeric]', () => {
    mount(`
      <table table>
        <thead>
          <tr><th sortable id="n">N</th></tr>
        </thead>
        <tbody id="body">
          <tr id="ten"><td numeric>1,000</td></tr>
          <tr id="two"><td numeric>2</td></tr>
          <tr id="bad"><td>n/a</td></tr>
        </tbody>
      </table>
    `);

    press('n');
    expect(rowIds('body')).toEqual(['two', 'ten', 'bad']);
  });

  it('prefers data-sort-value over visible text', () => {
    mount(`
      <table table>
        <thead>
          <tr><th sortable id="name">Name</th></tr>
        </thead>
        <tbody id="body">
          <tr id="zebra"><td data-sort-value="a">Zebra</td></tr>
          <tr id="apple"><td data-sort-value="c">Apple</td></tr>
          <tr id="mango"><td data-sort-value="b">Mango</td></tr>
        </tbody>
      </table>
    `);

    press('name');
    expect(rowIds('body')).toEqual(['zebra', 'mango', 'apple']);
  });

  it('parses data-sort-value when the column is numeric', () => {
    mount(`
      <table table>
        <thead>
          <tr><th sortable numeric id="n">N</th></tr>
        </thead>
        <tbody id="body">
          <tr id="ten"><td data-sort-value="10">ten</td></tr>
          <tr id="two"><td data-sort-value="2">two</td></tr>
        </tbody>
      </table>
    `);

    press('n');
    expect(rowIds('body')).toEqual(['two', 'ten']);
  });

  it('sorts each tbody on its own', () => {
    mount(`
      <table table>
        <thead>
          <tr><th sortable id="name">Name</th></tr>
        </thead>
        <tbody id="one">
          <tr id="c"><td>C</td></tr>
          <tr id="a"><td>A</td></tr>
        </tbody>
        <tbody id="two">
          <tr id="b"><td>B</td></tr>
          <tr id="a2"><td>A</td></tr>
        </tbody>
      </table>
    `);

    press('name');
    expect(rowIds('one')).toEqual(['a', 'c']);
    expect(rowIds('two')).toEqual(['a2', 'b']);

    press('name');
    press('name');
    expect(rowIds('one')).toEqual(['c', 'a']);
    expect(rowIds('two')).toEqual(['b', 'a2']);
  });

  it('maps cells by cellIndex when a header uses colspan', () => {
    mount(`
      <table table>
        <thead>
          <tr>
            <th sortable colspan="2" id="name">Name</th>
            <th sortable id="age">Age</th>
          </tr>
        </thead>
        <tbody id="body">
          <tr id="ada"><td>Ada</td><td>Lovelace</td><td>36</td></tr>
          <tr id="grace"><td>Grace</td><td>Hopper</td><td>85</td></tr>
        </tbody>
      </table>
    `);

    const age = document.getElementById('age');
    expect(age?.cellIndex).toBe(1);

    press('age');
    expect(rowIds('body')).toEqual(['grace', 'ada']);
  });

  it('adopts an author aria-sort without reordering until the next activation', () => {
    const controller = mount(`
      <table table id="people">
        <thead>
          <tr>
            <th sortable id="name" aria-sort="ascending">Name</th>
            <th sortable id="age">Age</th>
          </tr>
        </thead>
        <tbody id="body">
          <tr id="ada"><td>Ada</td></tr>
          <tr id="zoe"><td>Zoe</td></tr>
        </tbody>
      </table>
    `);

    expect(controller.getState()).toEqual({ column: 0, direction: 'ascending' });
    expect(document.getElementById('age')?.getAttribute('aria-sort')).toBe('none');
    expect(rowIds('body')).toEqual(['ada', 'zoe']);

    press('name');
    expect(controller.getState()).toEqual({ column: 0, direction: 'descending' });
    expect(rowIds('body')).toEqual(['zoe', 'ada']);
  });

  it('does not reorder when juice:sort is canceled', () => {
    const controller = mount(people);
    const table = document.getElementById('people');
    const sorts: SortEvent[] = [];
    const changes = listen(JUICE_CHANGE_EVENT);
    const onSort = (event: Event) => {
      sorts.push(event as SortEvent);
      event.preventDefault();
    };
    table?.addEventListener('juice:sort', onSort);

    press('name');

    expect(sorts).toHaveLength(1);
    expect(sorts[0]?.bubbles).toBe(true);
    expect(sorts[0]?.cancelable).toBe(true);
    expect(sorts[0]?.defaultPrevented).toBe(true);
    expect(sorts[0]?.detail).toEqual({ column: 0, direction: 'ascending' });
    expect(document.getElementById('name')?.getAttribute('aria-sort')).toBe('ascending');
    expect(document.getElementById('age')?.getAttribute('aria-sort')).toBe('none');
    expect(controller.getState()).toEqual({ column: 0, direction: 'ascending' });
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);
    expect((changes.events[0] as ChangeEvent).detail).toEqual({
      runtime: 'table',
      state: { column: 0, direction: 'ascending' },
    });

    press('name');
    expect(sorts[1]?.detail).toEqual({ column: 0, direction: 'descending' });
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);
    expect(controller.getState()?.direction).toBe('descending');

    table?.removeEventListener('juice:sort', onSort);
    press('name');
    expect(controller.getState()).toEqual({ column: null, direction: 'none' });
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);

    press('age');
    expect(rowIds('body')).toEqual(['alan', 'ada', 'grace']);
    expect(controller.getState()).toEqual({ column: 1, direction: 'ascending' });

    changes.stop();
  });

  it('re-sorts rows added later and appends them to the original order', async () => {
    const controller = mount(`
      <table table>
        <thead>
          <tr><th sortable id="name">Name</th></tr>
        </thead>
        <tbody id="body">
          <tr id="c"><td>C</td></tr>
          <tr id="a"><td>A</td></tr>
        </tbody>
      </table>
    `);

    press('name');
    expect(rowIds('body')).toEqual(['a', 'c']);

    document.getElementById('body')?.insertAdjacentHTML(
      'afterbegin',
      '<tr id="b"><td>B</td></tr>'
    );
    controller.sync();
    expect(rowIds('body')).toEqual(['a', 'b', 'c']);

    press('name');
    press('name');
    expect(rowIds('body')).toEqual(['c', 'a', 'b']);

    document.getElementById('body')?.insertAdjacentHTML(
      'beforeend',
      '<tr id="d"><td>D</td></tr>'
    );
    await flushRuntime();
    expect(rowIds('body')).toEqual(['c', 'a', 'b', 'd']);
  });

  it('picks up a header added before sync', () => {
    const controller = mount(`
      <table table>
        <thead>
          <tr id="head"><th id="name">Name</th></tr>
        </thead>
        <tbody id="body">
          <tr id="b"><td>B</td></tr>
          <tr id="a"><td>A</td></tr>
        </tbody>
      </table>
    `);

    expect(document.getElementById('name')?.querySelector('button')).toBeNull();

    document.getElementById('name')?.setAttribute('sortable', '');
    controller.sync();

    press('name');
    expect(document.getElementById('name')?.getAttribute('aria-sort')).toBe('ascending');
    expect(rowIds('body')).toEqual(['a', 'b']);
  });

  it('leaves tables without [table] and loose sortable headers alone', () => {
    const controller = mount(`
      <table id="plain">
        <tr><th sortable id="loose">Loose</th></tr>
      </table>
      <div table id="fake">No</div>
      <table table id="real">
        <tbody id="body"><tr id="only"><td>Only</td></tr></tbody>
      </table>
    `);

    expect(document.getElementById('loose')?.querySelector('button')).toBeNull();
    expect(document.getElementById('fake')?.querySelector('button')).toBeNull();
    expect(controller.getState(document.getElementById('plain'))).toBeNull();
    expect(controller.getState(document.getElementById('fake'))).toBeNull();
    expect(controller.getState(document.getElementById('real'))).toEqual({
      column: null,
      direction: 'none',
    });
    expect(controller.getState(document.body)).toBeNull();
  });

  it('keeps a second table on its own state', () => {
    const controller = mount(`
      <table table id="first">
        <thead><tr><th sortable id="a">A</th></tr></thead>
        <tbody id="body-a">
          <tr id="b"><td>B</td></tr>
          <tr id="a-row"><td>A</td></tr>
        </tbody>
      </table>
      <table table id="second">
        <thead><tr><th sortable id="b-head">B</th></tr></thead>
        <tbody id="body-b">
          <tr id="z"><td>Z</td></tr>
          <tr id="m"><td>M</td></tr>
        </tbody>
      </table>
    `);

    press('a');
    expect(controller.getState(document.getElementById('first'))).toEqual({
      column: 0,
      direction: 'ascending',
    });
    expect(controller.getState(document.getElementById('second'))).toEqual({
      column: null,
      direction: 'none',
    });
    expect(rowIds('body-a')).toEqual(['a-row', 'b']);
    expect(rowIds('body-b')).toEqual(['z', 'm']);
    expect(controller.getState()).toEqual({ column: 0, direction: 'ascending' });
  });

  it('does not sort from Enter alone, and ignores a disabled header button', () => {
    const controller = mount(people);
    const button = buttonIn('name');

    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
    expect(controller.getState()?.direction).toBe('none');
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);

    button.disabled = true;
    button.click();
    expect(controller.getState()?.direction).toBe('none');

    button.disabled = false;
    button.setAttribute('aria-disabled', 'true');
    button.click();
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);
  });

  it('restores header contents, author aria-sort, and row order on destroy', () => {
    const controller = mount(`
      <table table id="people">
        <thead>
          <tr>
            <th sortable id="name" aria-sort="ascending"><span id="name-label">Name</span></th>
          </tr>
        </thead>
        <tbody id="body">
          <tr id="ada"><td>Ada</td></tr>
          <tr id="zoe"><td>Zoe</td></tr>
        </tbody>
      </table>
    `);
    const name = document.getElementById('name');
    const label = document.getElementById('name-label');

    press('name');
    expect(rowIds('body')).toEqual(['zoe', 'ada']);
    expect(name?.getAttribute('aria-sort')).toBe('descending');

    controller.destroy();
    controller.sync();
    name?.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(name?.querySelector('button')).toBeNull();
    expect(label?.parentElement).toBe(name);
    expect(name?.getAttribute('aria-sort')).toBe('ascending');
    expect(rowIds('body')).toEqual(['ada', 'zoe']);
    expect(controller.getState()).toBeNull();
    expect(controller.destroy()).toBeUndefined();
  });

  it('sorts once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = people;
    startTableRuntime();
    active = createTable({ root: document.body });

    press('name');
    expect(document.getElementById('name')?.getAttribute('aria-sort')).toBe('ascending');
    expect(rowIds('body')).toEqual(['ada', 'alan', 'grace']);
    expect(document.querySelectorAll('#name button')).toHaveLength(1);
  });
});

describe('startTableRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = people;
    stopTableRuntime();

    const first = startTableRuntime();
    const second = startTableRuntime();

    expect(first).toBe(second);
    expect(buttonIn('name').type).toBe('button');
    expect(document.getElementById('name')?.getAttribute('aria-sort')).toBe('none');

    press('name');
    expect(second?.getState(document.getElementById('people'))).toEqual({
      column: 0,
      direction: 'ascending',
    });
    expect(rowIds('body')).toEqual(['ada', 'alan', 'grace']);

    stopTableRuntime();
    expect(document.getElementById('name')?.querySelector('button')).toBeNull();
    expect(rowIds('body')).toEqual(['grace', 'ada', 'alan']);

    startTableRuntime();
    expect(buttonIn('name').textContent).toBe('Name');
  });

  it('does not auto-start on DOMContentLoaded after stopTableRuntime', async () => {
    stopTableRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./table-runtime.js');
      document.body.innerHTML = people;
      mod.stopTableRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const name = document.getElementById('name');
      expect(name?.querySelector('button')).toBeNull();
      expect(name?.hasAttribute('aria-sort')).toBe(false);

      mod.startTableRuntime();
      expect(name?.querySelector('button')?.textContent).toBe('Name');
      name?.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(name?.getAttribute('aria-sort')).toBe('ascending');
      expect(rowIds('body')).toEqual(['ada', 'alan', 'grace']);
      mod.stopTableRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
