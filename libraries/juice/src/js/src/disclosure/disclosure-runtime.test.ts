// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAccordion,
  stopAccordionRuntime,
} from '../accordion/accordion-runtime.js';
import {
  createDisclosure,
  startDisclosureRuntime,
  stopDisclosureRuntime,
} from './disclosure-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const notesMarkup = `
  <section disclosure name="shift-notes">
    <button type="button" id="shift-notes-trigger" disclosure-trigger aria-expanded="false" aria-controls="shift-notes-panel">
      Shift notes
    </button>
    <div id="shift-notes-panel" disclosure-panel role="region" aria-labelledby="shift-notes-trigger" hidden>
      Gate B closes at 9.
    </div>
  </section>
`;

afterEach(() => {
  stopDisclosureRuntime();
  stopAccordionRuntime();
  resetDom();
});

describe('createDisclosure', () => {
  it('wires a trigger to its panel and toggles expanded state', () => {
    document.body.innerHTML = notesMarkup;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = document.querySelector<HTMLElement>('[disclosure-panel]');

    expect(trigger?.getAttribute('aria-controls')).toBe('shift-notes-panel');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.id).toBe('shift-notes-panel');
    expect(panel?.getAttribute('aria-labelledby')).toBe('shift-notes-trigger');
    expect(panel?.getAttribute('aria-hidden')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('content')).toBeNull();
    expect(trigger?.getAttribute('content')).toBeNull();

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.getAttribute('aria-hidden')).toBe('false');
    expect(panel?.getAttribute('content')).toBeNull();

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('aria-hidden')).toBe('true');
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('fills missing ids, aria-controls, and region labeling', () => {
    document.body.innerHTML = `
      <section disclosure name="shift-seats">
        <button type="button" disclosure-trigger>Seats</button>
        <div disclosure-panel hidden>Two seats left.</div>
      </section>
    `;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = trigger?.nextElementSibling as HTMLElement | null;

    expect(trigger?.id).toBe('shift-seats-trigger');
    expect(panel?.id).toBe('shift-seats-panel');
    expect(trigger?.getAttribute('aria-controls')).toBe('shift-seats-panel');
    expect(panel?.getAttribute('role')).toBe('region');
    expect(panel?.getAttribute('aria-labelledby')).toBe('shift-seats-trigger');
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('pairs a trigger with an unmarked next panel sibling', () => {
    document.body.innerHTML = `
      <section disclosure name="shift-gate">
        <button type="button" disclosure-trigger>Gate</button>
        <div hidden>Use gate C.</div>
      </section>
    `;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = trigger?.nextElementSibling as HTMLElement | null;

    expect(trigger?.getAttribute('aria-controls')).toBe('shift-gate-panel');
    expect(panel?.id).toBe('shift-gate-panel');
    expect(panel?.getAttribute('role')).toBe('region');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('does not enhance orphan disclosure markup', () => {
    document.body.innerHTML = `
      <button type="button" disclosure-trigger aria-expanded="false">Orphan</button>
      <div id="orphan-panel" disclosure-panel hidden>Should stay closed.</div>
    `;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = document.getElementById('orphan-panel');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.id).toBe('');
    expect(trigger?.getAttribute('aria-controls')).toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('role')).toBeNull();
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('keeps disclosures independent and does not exclusive-close', () => {
    document.body.innerHTML = `
      <section disclosure name="one">
        <button type="button" disclosure-trigger>One</button>
        <div disclosure-panel hidden>First</div>
      </section>
      <section disclosure name="two">
        <button type="button" disclosure-trigger>Two</button>
        <div disclosure-panel hidden>Second</div>
      </section>
    `;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[disclosure-trigger]');
    const panels = document.querySelectorAll<HTMLElement>('[disclosure-panel]');

    triggers[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggers[0]?.getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1]?.getAttribute('aria-expanded')).toBe('true');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);
    expect(triggers[0]?.getAttribute('tabindex')).toBeNull();
    expect(triggers[1]?.getAttribute('tabindex')).toBeNull();

    controller.destroy();
  });

  it('supports keyboard activation for non-button triggers without arrow roving', () => {
    document.body.innerHTML = `
      <section disclosure name="shift-keyboard">
        <div disclosure-trigger>Open me</div>
        <div disclosure-panel hidden>Panel</div>
      </section>
    `;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = trigger?.nextElementSibling as HTMLElement | null;

    expect(trigger?.getAttribute('role')).toBe('button');
    expect(trigger?.getAttribute('tabindex')).toBe('0');

    const arrow = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowDown',
    });
    trigger?.dispatchEvent(arrow);

    expect(arrow.defaultPrevented).toBe(false);
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.getAttribute('tabindex')).toBe('0');
    expect(panel?.hasAttribute('hidden')).toBe(true);

    trigger?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.getAttribute('content')).toBeNull();

    trigger?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    );

    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('leaves Enter on a button to the click path', () => {
    document.body.innerHTML = notesMarkup;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = document.querySelector<HTMLElement>('[disclosure-panel]');

    const enter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    });
    trigger?.dispatchEvent(enter);

    expect(enter.defaultPrevented).toBe(false);
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('closes the focused disclosure on Escape and returns focus', () => {
    document.body.innerHTML = notesMarkup;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = document.querySelector<HTMLElement>('[disclosure-panel]');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);

    panel?.setAttribute('tabindex', '-1');
    panel?.focus();
    expect(document.activeElement).toBe(panel);

    panel?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('Escape collapses only the focused or last-opened disclosure', () => {
    document.body.innerHTML = `
      <section disclosure name="one">
        <button type="button" id="one-trigger" disclosure-trigger>One</button>
        <div id="one-panel" disclosure-panel hidden>First</div>
      </section>
      <section disclosure name="two">
        <button type="button" id="two-trigger" disclosure-trigger>Two</button>
        <div id="two-panel" disclosure-panel hidden>Second</div>
      </section>
    `;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const firstTrigger = document.getElementById('one-trigger');
    const secondTrigger = document.getElementById('two-trigger');
    const firstPanel = document.getElementById('one-panel');
    const secondPanel = document.getElementById('two-panel');

    firstTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    secondTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    secondPanel?.setAttribute('tabindex', '-1');
    secondPanel?.focus();
    secondPanel?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(secondPanel?.hasAttribute('hidden')).toBe(true);
    expect(secondTrigger?.getAttribute('aria-expanded')).toBe('false');
    expect(firstPanel?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).toBe(secondTrigger);

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
    );

    expect(firstPanel?.hasAttribute('hidden')).toBe(true);
    expect(firstTrigger?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('yields Escape to an open modal, drawer, or popover', () => {
    document.body.innerHTML = `
      ${notesMarkup}
      <div modal-overlay id="yield-modal" hidden></div>
      <div drawer-overlay id="yield-drawer" hidden></div>
      <div popover-root id="yield-pop" hidden></div>
    `;
    stopDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = document.querySelector<HTMLElement>('[disclosure-panel]');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel?.hasAttribute('hidden')).toBe(false);

    const pressEscape = () => {
      panel?.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Escape',
        })
      );
    };

    document.getElementById('yield-modal')?.removeAttribute('hidden');
    pressEscape();
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');

    document.getElementById('yield-modal')?.setAttribute('hidden', '');
    document.getElementById('yield-drawer')?.removeAttribute('hidden');
    pressEscape();
    expect(panel?.hasAttribute('hidden')).toBe(false);

    document.getElementById('yield-drawer')?.setAttribute('hidden', '');
    document.getElementById('yield-pop')?.removeAttribute('hidden');
    pressEscape();
    expect(panel?.hasAttribute('hidden')).toBe(false);

    document.getElementById('yield-pop')?.setAttribute('hidden', '');
    pressEscape();
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    controller.destroy();
  });

  it('syncs late-rendered disclosure markup', async () => {
    stopDisclosureRuntime();
    const controller = createDisclosure({ root: document.body });

    document.body.innerHTML = `
      <section disclosure name="shift-late">
        <button type="button" disclosure-trigger>Late notes</button>
        <div disclosure-panel hidden>Arrived after boot</div>
      </section>
    `;

    await flushRuntime();

    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = trigger?.nextElementSibling as HTMLElement | null;

    expect(trigger?.id).toBe('shift-late-trigger');
    expect(panel?.id).toBe('shift-late-panel');
    expect(trigger?.getAttribute('aria-controls')).toBe('shift-late-panel');
    expect(panel?.getAttribute('aria-labelledby')).toBe('shift-late-trigger');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('toggles once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = notesMarkup;
    startDisclosureRuntime();

    const controller = createDisclosure({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = document.querySelector<HTMLElement>('[disclosure-panel]');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('coexists with accordion without cross-toggling', () => {
    document.body.innerHTML = `
      <section accordion name="faq-account">
        <button type="button" id="faq-trigger" accordion-item aria-expanded="false" aria-controls="faq-panel">
          How do I update billing?
        </button>
        <div id="faq-panel" role="region" aria-labelledby="faq-trigger" hidden>
          Update billing from the account dashboard.
        </div>
      </section>
      ${notesMarkup}
      <button type="button" id="orphan-trigger" disclosure-trigger aria-expanded="false">Orphan</button>
    `;
    stopDisclosureRuntime();
    stopAccordionRuntime();

    const accordion = createAccordion({ root: document.body });
    const disclosure = createDisclosure({ root: document.body });
    const accordionTrigger = document.getElementById('faq-trigger');
    const accordionPanel = document.getElementById('faq-panel');
    const disclosureTrigger = document.getElementById('shift-notes-trigger');
    const disclosurePanel = document.getElementById('shift-notes-panel');
    const orphan = document.getElementById('orphan-trigger');

    disclosureTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(disclosureTrigger?.getAttribute('aria-expanded')).toBe('true');
    expect(disclosurePanel?.hasAttribute('hidden')).toBe(false);
    expect(accordionTrigger?.getAttribute('aria-expanded')).toBe('false');
    expect(accordionPanel?.hasAttribute('hidden')).toBe(true);
    expect(accordionPanel?.getAttribute('content')).toBeNull();
    expect(disclosurePanel?.getAttribute('content')).toBeNull();

    accordionTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(accordionTrigger?.getAttribute('aria-expanded')).toBe('true');
    expect(accordionPanel?.hasAttribute('hidden')).toBe(false);
    expect(disclosureTrigger?.getAttribute('aria-expanded')).toBe('true');
    expect(disclosurePanel?.hasAttribute('hidden')).toBe(false);

    orphan?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(orphan?.getAttribute('aria-expanded')).toBe('false');
    expect(orphan?.getAttribute('aria-controls')).toBeNull();

    disclosure.destroy();
    accordion.destroy();
  });
});

describe('startDisclosureRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = notesMarkup;
    stopDisclosureRuntime();

    const first = startDisclosureRuntime();
    const second = startDisclosureRuntime();
    const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
    const panel = document.querySelector<HTMLElement>('[disclosure-panel]');

    expect(first).toBe(second);

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.getAttribute('content')).toBeNull();
  });

  it('does not auto-start on DOMContentLoaded after stopDisclosureRuntime', async () => {
    stopDisclosureRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    try {
      const mod = await import('./disclosure-runtime.js');
      document.body.innerHTML = notesMarkup;
      mod.stopDisclosureRuntime();
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const trigger = document.querySelector<HTMLElement>('[disclosure-trigger]');
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');

      mod.startDisclosureRuntime();
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
      mod.stopDisclosureRuntime();
    } finally {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => 'complete',
      });
    }
  });
});
