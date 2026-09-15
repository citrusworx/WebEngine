// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { Accordion } from '../../../components/accordion/accordion.js';
import {
  createAccordion,
  startAccordionRuntime,
  stopAccordionRuntime,
} from './accordion-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const faqMarkup = `
  <section accordion name="faq-account">
    <button type="button" id="faq-account-trigger" accordion-item aria-expanded="false" aria-controls="faq-account-panel">
      How do I update billing?
    </button>
    <div id="faq-account-panel" role="region" aria-labelledby="faq-account-trigger" hidden>
      Update billing from the account dashboard.
    </div>
  </section>
`;

afterEach(() => {
  stopAccordionRuntime();
  resetDom();
});

describe('createAccordion', () => {
  it('wires triggers to panels with accessible state', () => {
    document.body.innerHTML = faqMarkup;
    stopAccordionRuntime();

    const controller = createAccordion({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[accordion-item]');
    const panel = document.querySelector<HTMLElement>('[role="region"]');

    expect(trigger?.getAttribute('aria-controls')).toBe('faq-account-panel');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.id).toBe('faq-account-panel');
    expect(panel?.getAttribute('aria-labelledby')).toBe('faq-account-trigger');
    expect(panel?.getAttribute('aria-hidden')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('content')).toBeNull();

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.getAttribute('aria-hidden')).toBe('false');
    expect(panel?.getAttribute('content')).toBeNull();

    controller.destroy();
  });

  it('fills missing ids, aria-controls, and region labeling', () => {
    document.body.innerHTML = `
      <section accordion name="faq-seats">
        <button type="button" accordion-item>Can I add seats?</button>
        <div hidden>Yes. New seats are prorated.</div>
      </section>
    `;
    stopAccordionRuntime();

    const controller = createAccordion({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[accordion-item]');
    const panel = trigger?.nextElementSibling as HTMLElement | null;

    expect(trigger?.id).toBe('faq-seats-trigger');
    expect(panel?.id).toBe('faq-seats-panel');
    expect(trigger?.getAttribute('aria-controls')).toBe('faq-seats-panel');
    expect(panel?.getAttribute('role')).toBe('region');
    expect(panel?.getAttribute('aria-labelledby')).toBe('faq-seats-trigger');

    controller.destroy();
  });

  it('does not enhance orphan accordion-item markup', () => {
    document.body.innerHTML = `
      <button type="button" accordion-item aria-expanded="false">Orphan</button>
      <div id="orphan-panel" hidden>Should stay closed.</div>
    `;
    stopAccordionRuntime();

    const controller = createAccordion({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[accordion-item]');
    const panel = document.getElementById('orphan-panel');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(trigger?.id).toBe('');
    expect(trigger?.getAttribute('aria-controls')).toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('keeps multiple items open by default', () => {
    document.body.innerHTML = `
      <section accordion name="faq">
        <button type="button" accordion-item aria-expanded="false">One</button>
        <div hidden>First</div>
        <button type="button" accordion-item aria-expanded="false">Two</button>
        <div hidden>Second</div>
      </section>
    `;
    stopAccordionRuntime();

    const controller = createAccordion({ root: document.body });
    const triggers = document.querySelectorAll<HTMLElement>('[accordion-item]');
    const panels = [
      triggers[0]?.nextElementSibling as HTMLElement,
      triggers[1]?.nextElementSibling as HTMLElement,
    ];

    triggers[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    triggers[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggers[0]?.getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1]?.getAttribute('aria-expanded')).toBe('true');
    expect(panels[0]?.hasAttribute('hidden')).toBe(false);
    expect(panels[1]?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('supports keyboard activation for non-button triggers', () => {
    document.body.innerHTML = `
      <section accordion name="faq-keyboard">
        <div accordion-item>Open me</div>
        <div hidden>Panel</div>
      </section>
    `;
    stopAccordionRuntime();

    const controller = createAccordion({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[accordion-item]');
    const panel = trigger?.nextElementSibling as HTMLElement | null;

    expect(trigger?.getAttribute('role')).toBe('button');
    expect(trigger?.getAttribute('tabindex')).toBe('0');

    trigger?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('closes the focused or last open item on Escape and returns focus', () => {
    document.body.innerHTML = faqMarkup;
    stopAccordionRuntime();

    const controller = createAccordion({ root: document.body });
    const trigger = document.querySelector<HTMLElement>('[accordion-item]');
    const panel = document.querySelector<HTMLElement>('[role="region"]');

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

    controller.destroy();
  });

  it('syncs late-rendered accordion markup', async () => {
    stopAccordionRuntime();
    const controller = createAccordion({ root: document.body });

    document.body.innerHTML = `
      <section accordion name="faq-late">
        <button type="button" accordion-item>Late item</button>
        <div hidden>Arrived after boot</div>
      </section>
    `;

    await flushRuntime();

    const trigger = document.querySelector<HTMLElement>('[accordion-item]');
    const panel = trigger?.nextElementSibling as HTMLElement | null;

    expect(trigger?.id).toBe('faq-late-trigger');
    expect(panel?.id).toBe('faq-late-panel');
    expect(trigger?.getAttribute('aria-controls')).toBe('faq-late-panel');
    expect(panel?.getAttribute('aria-labelledby')).toBe('faq-late-trigger');

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('does not double-toggle Accordion factory markup', () => {
    stopAccordionRuntime();

    const accordion = Accordion({
      name: 'FAQ Item',
      attributes: {},
    });
    document.body.append(accordion);

    const controller = createAccordion({ root: document.body });
    const button = accordion.querySelector('button');
    const panel = accordion.querySelector('div');

    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('content')).toBeNull();

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.getAttribute('aria-hidden')).toBe('false');
    expect(panel?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });
});

describe('startAccordionRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = faqMarkup;
    stopAccordionRuntime();

    const first = startAccordionRuntime();
    const second = startAccordionRuntime();
    const trigger = document.querySelector<HTMLElement>('[accordion-item]');
    const panel = document.querySelector<HTMLElement>('[role="region"]');

    expect(first).toBe(second);

    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
  });
});
