// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createRadio,
  startRadioRuntime,
  stopRadioRuntime,
} from './radio-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const radioMarkup = `
  <div radiogroup aria-label="Shipment" id="ship">
    <button radio aria-label="Ground" id="ground"></button>
    <button radio aria-label="Air" id="air"></button>
    <button radio aria-label="Sea" id="sea"></button>
  </div>
`;

const click = (id: string) => {
  document.getElementById(id)?.dispatchEvent(
    new MouseEvent('click', { bubbles: true })
  );
};

const key = (id: string, keyName: string) => {
  document.getElementById(id)?.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key: keyName })
  );
};

const checkedState = (id: string) =>
  document.getElementById(id)?.getAttribute('aria-checked');

afterEach(() => {
  stopRadioRuntime();
  resetDom();
});

describe('createRadio', () => {
  it('syncs radiogroup and radio ARIA with one tab stop and no invented name', () => {
    document.body.innerHTML = `
      <div radiogroup id="ship">
        <button radio id="ground">Ground</button>
        <button radio aria-label="Air" id="air"></button>
      </div>
    `;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });
    const group = document.getElementById('ship');
    const ground = document.getElementById('ground');
    const air = document.getElementById('air');

    expect(group?.getAttribute('role')).toBe('radiogroup');
    expect(group?.hasAttribute('aria-label')).toBe(false);
    expect(group?.getAttribute('aria-modal')).toBeNull();

    expect(ground?.getAttribute('role')).toBe('radio');
    expect(ground?.getAttribute('aria-checked')).toBe('false');
    expect(ground?.getAttribute('type')).toBe('button');
    expect(ground?.getAttribute('tabindex')).toBe('0');
    expect(ground?.hasAttribute('aria-label')).toBe(false);
    expect(ground?.textContent?.trim()).toBe('Ground');

    expect(air?.getAttribute('role')).toBe('radio');
    expect(air?.getAttribute('aria-label')).toBe('Air');
    expect(air?.getAttribute('aria-checked')).toBe('false');
    expect(air?.getAttribute('tabindex')).toBe('-1');

    controller.destroy();
  });

  it('keeps one author-checked radio and coerces mixed', () => {
    document.body.innerHTML = `
      <div radiogroup aria-label="Shipment" id="ship">
        <button type="button" radio aria-checked="mixed" aria-label="Ground" id="ground"></button>
        <button type="button" radio aria-checked="true" aria-label="Air" id="air"></button>
        <button type="button" radio aria-checked="true" aria-label="Sea" id="sea"></button>
      </div>
    `;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });

    expect(checkedState('ground')).toBe('false');
    expect(checkedState('air')).toBe('true');
    expect(checkedState('sea')).toBe('false');
    expect(document.getElementById('air')?.getAttribute('tabindex')).toBe('0');
    expect(document.getElementById('ground')?.getAttribute('tabindex')).toBe(
      '-1'
    );
    expect(controller.getChecked(document.getElementById('ship'))?.id).toBe(
      'air'
    );

    controller.destroy();
  });

  it('selects on click and keeps the group exclusive', () => {
    document.body.innerHTML = radioMarkup;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });

    click('air');
    expect(checkedState('ground')).toBe('false');
    expect(checkedState('air')).toBe('true');
    expect(checkedState('sea')).toBe('false');
    expect(document.getElementById('air')?.getAttribute('tabindex')).toBe('0');
    expect(document.getElementById('ground')?.getAttribute('tabindex')).toBe(
      '-1'
    );
    expect(controller.getChecked()?.id).toBe('air');

    controller.select(document.getElementById('sea'));
    expect(checkedState('air')).toBe('false');
    expect(checkedState('sea')).toBe('true');
    expect(controller.getChecked(document.getElementById('sea'))?.id).toBe(
      'sea'
    );

    controller.destroy();
  });

  it('moves selection with arrow keys, wrapping and skipping disabled radios', () => {
    document.body.innerHTML = `
      <div radiogroup aria-label="Plan" id="plan">
        <button type="button" radio aria-label="Free" id="free"></button>
        <button type="button" radio disabled aria-label="Pro" id="pro"></button>
        <button type="button" radio aria-disabled="true" aria-label="Hidden" id="hidden"></button>
        <button type="button" radio aria-label="Team" id="team"></button>
      </div>
    `;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });

    key('free', 'ArrowRight');
    expect(checkedState('free')).toBe('false');
    expect(checkedState('pro')).toBe('false');
    expect(checkedState('hidden')).toBe('false');
    expect(checkedState('team')).toBe('true');
    expect(document.activeElement?.id).toBe('team');

    key('team', 'ArrowDown');
    expect(checkedState('free')).toBe('true');
    expect(checkedState('team')).toBe('false');
    expect(document.activeElement?.id).toBe('free');

    key('free', 'ArrowLeft');
    expect(checkedState('team')).toBe('true');
    expect(document.activeElement?.id).toBe('team');

    key('team', 'ArrowUp');
    expect(checkedState('free')).toBe('true');
    expect(document.activeElement?.id).toBe('free');

    click('pro');
    key('pro', ' ');
    controller.select(document.getElementById('hidden'));
    expect(checkedState('pro')).toBe('false');
    expect(checkedState('hidden')).toBe('false');
    expect(checkedState('free')).toBe('true');

    controller.destroy();
  });

  it('selects the focused radio on Space and Enter and ignores Escape and Tab', () => {
    document.body.innerHTML = radioMarkup;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });

    key('ground', ' ');
    expect(checkedState('ground')).toBe('true');

    key('air', 'Enter');
    expect(checkedState('ground')).toBe('false');
    expect(checkedState('air')).toBe('true');

    key('air', 'Escape');
    key('sea', 'Tab');
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(checkedState('air')).toBe('true');
    expect(checkedState('sea')).toBe('false');
    expect(document.getElementById('ship')?.getAttribute('aria-modal')).toBeNull();

    controller.destroy();
  });

  it('keeps native radios in lockstep and exclusive inside the group', () => {
    document.body.innerHTML = `
      <fieldset radiogroup aria-label="Payment" id="pay">
        <input type="radio" radio aria-label="Card" id="card" />
        <input type="radio" radio aria-checked="true" aria-label="Cash" id="cash" />
        <button type="button" radio aria-label="Wire" id="wire"></button>
      </fieldset>
    `;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });
    const card = document.getElementById('card') as HTMLInputElement | null;
    const cash = document.getElementById('cash') as HTMLInputElement | null;

    expect(document.getElementById('pay')?.getAttribute('role')).toBe(
      'radiogroup'
    );
    expect(card?.getAttribute('role')).toBe('radio');
    expect(card?.checked).toBe(false);
    expect(card?.getAttribute('aria-checked')).toBe('false');
    expect(card?.getAttribute('tabindex')).toBe('-1');
    expect(cash?.checked).toBe(true);
    expect(cash?.getAttribute('aria-checked')).toBe('true');
    expect(cash?.getAttribute('tabindex')).toBe('0');

    card?.click();
    expect(card?.checked).toBe(true);
    expect(card?.getAttribute('aria-checked')).toBe('true');
    expect(cash?.checked).toBe(false);
    expect(cash?.getAttribute('aria-checked')).toBe('false');

    click('wire');
    expect(checkedState('wire')).toBe('true');
    expect(card?.checked).toBe(false);
    expect(card?.getAttribute('aria-checked')).toBe('false');
    expect(cash?.checked).toBe(false);

    controller.destroy();
  });

  it('puts the tab stop on the first enabled radio when the checked radio is disabled', () => {
    document.body.innerHTML = `
      <div radiogroup aria-label="Plan" id="plan">
        <button type="button" radio disabled aria-checked="true" aria-label="Legacy" id="legacy"></button>
        <button type="button" radio aria-label="Current" id="current"></button>
      </div>
    `;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });

    expect(checkedState('legacy')).toBe('true');
    expect(document.getElementById('legacy')?.getAttribute('tabindex')).toBe(
      '-1'
    );
    expect(document.getElementById('current')?.getAttribute('tabindex')).toBe(
      '0'
    );

    key('current', ' ');
    expect(checkedState('legacy')).toBe('false');
    expect(checkedState('current')).toBe('true');

    controller.destroy();
  });

  it('ignores orphan radios and non-button, non-radio hosts', () => {
    document.body.innerHTML = `
      <button radio aria-label="Orphan" id="orphan"></button>
      <div radiogroup aria-label="Size" id="size">
        <div radio aria-label="Bad" id="bad"></div>
        <input type="checkbox" radio aria-label="Box" id="box" />
        <button radio aria-label="Small" id="small"></button>
      </div>
    `;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });
    const orphan = document.getElementById('orphan');
    const bad = document.getElementById('bad');
    const box = document.getElementById('box');

    expect(orphan?.getAttribute('role')).toBeNull();
    expect(orphan?.getAttribute('aria-checked')).toBeNull();
    expect(bad?.getAttribute('role')).toBeNull();
    expect(box?.getAttribute('role')).toBeNull();
    expect(document.getElementById('small')?.getAttribute('role')).toBe('radio');

    click('orphan');
    click('bad');
    expect(orphan?.getAttribute('aria-checked')).toBeNull();
    expect(bad?.getAttribute('aria-checked')).toBeNull();

    controller.destroy();
  });

  it('keeps nested radiogroups independent', () => {
    document.body.innerHTML = `
      <div radiogroup aria-label="Outer" id="outer">
        <button type="button" radio aria-label="Outer A" id="outer-a"></button>
        <div radiogroup aria-label="Inner" id="inner">
          <button type="button" radio aria-label="Inner A" id="inner-a"></button>
          <button type="button" radio aria-label="Inner B" id="inner-b"></button>
        </div>
        <button type="button" radio aria-label="Outer B" id="outer-b"></button>
      </div>
    `;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });

    controller.select(document.getElementById('outer-a'));
    controller.select(document.getElementById('inner-b'));

    expect(checkedState('outer-a')).toBe('true');
    expect(checkedState('outer-b')).toBe('false');
    expect(checkedState('inner-a')).toBe('false');
    expect(checkedState('inner-b')).toBe('true');
    expect(controller.getChecked(document.getElementById('outer'))?.id).toBe(
      'outer-a'
    );
    expect(controller.getChecked(document.getElementById('inner'))?.id).toBe(
      'inner-b'
    );

    key('inner-b', 'ArrowLeft');
    expect(checkedState('inner-a')).toBe('true');
    expect(checkedState('outer-a')).toBe('true');

    controller.destroy();
  });

  it('selects once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = radioMarkup;
    startRadioRuntime();

    const controller = createRadio({ root: document.body });

    click('air');
    expect(checkedState('air')).toBe('true');
    expect(checkedState('ground')).toBe('false');

    controller.destroy();
  });

  it('stops handling after destroy', () => {
    document.body.innerHTML = radioMarkup;
    stopRadioRuntime();

    const controller = createRadio({ root: document.body });
    controller.destroy();

    click('air');
    key('ground', 'ArrowRight');
    expect(checkedState('air')).toBe('false');
    expect(document.getElementById('air')?.getAttribute('role')).toBe('radio');
  });

  it('syncs late-rendered radiogroup markup', async () => {
    stopRadioRuntime();
    const controller = createRadio({ root: document.body });

    document.body.innerHTML = radioMarkup;
    await flushRuntime();

    const air = document.getElementById('air');
    expect(document.getElementById('ship')?.getAttribute('role')).toBe(
      'radiogroup'
    );
    expect(air?.getAttribute('role')).toBe('radio');
    expect(air?.getAttribute('aria-checked')).toBe('false');
    expect(document.getElementById('ground')?.getAttribute('tabindex')).toBe(
      '0'
    );

    click('air');
    expect(checkedState('air')).toBe('true');

    controller.destroy();
  });
});

describe('startRadioRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = radioMarkup;
    stopRadioRuntime();

    const first = startRadioRuntime();
    const second = startRadioRuntime();

    expect(first).toBe(second);
    expect(document.getElementById('ship')?.getAttribute('role')).toBe(
      'radiogroup'
    );
    expect(checkedState('ground')).toBe('false');

    click('sea');
    expect(checkedState('sea')).toBe('true');
    expect(first?.getChecked()?.id).toBe('sea');
  });

  it('does not auto-start on DOMContentLoaded after stopRadioRuntime', async () => {
    stopRadioRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./radio-runtime.js');
    document.body.innerHTML = radioMarkup;
    mod.stopRadioRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    click('air');
    expect(checkedState('air')).toBeNull();

    mod.startRadioRuntime();
    click('air');
    expect(checkedState('air')).toBe('true');
    mod.stopRadioRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
