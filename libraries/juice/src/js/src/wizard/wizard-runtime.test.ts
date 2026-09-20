// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createWizard,
  startWizardRuntime,
  stopWizardRuntime,
} from './wizard-runtime.js';

const resetDom = () => {
  document.body.innerHTML = '';
};

const flushRuntime = async () => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const wizardMarkup = `
  <div wizard-shell name="onboard">
    <aside wizard-rail="left">
      <nav step-tracker>
        <ol steps>
          <li step="active" data-step="welcome">Welcome</li>
          <li step="pending" data-step="domain">Domain</li>
          <li step="pending" data-step="plan">Plan</li>
        </ol>
      </nav>
    </aside>
    <main wizard-content>
      <section step-page="welcome">Welcome page</section>
      <section step-page="domain" hidden>Domain page</section>
      <section step-page="plan" hidden>Plan page</section>
      <div step-nav>
        <button type="button" wizard-prev>Back</button>
        <button type="button" wizard-next>Continue</button>
      </div>
    </main>
  </div>
`;

afterEach(() => {
  stopWizardRuntime();
  resetDom();
});

describe('createWizard', () => {
  it('syncs tracker paint and shows only the active page via hidden', () => {
    document.body.innerHTML = wizardMarkup;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const steps = document.querySelectorAll<HTMLElement>('[steps] > [step]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(steps[0]?.getAttribute('step')).toBe('active');
    expect(steps[1]?.getAttribute('step')).toBe('pending');
    expect(steps[2]?.getAttribute('step')).toBe('pending');
    expect(steps[0]?.getAttribute('aria-current')).toBe('step');
    expect(steps[1]?.hasAttribute('aria-current')).toBe(false);
    expect(pages[0]?.hasAttribute('hidden')).toBe(false);
    expect(pages[1]?.hasAttribute('hidden')).toBe(true);
    expect(pages[2]?.hasAttribute('hidden')).toBe(true);
    expect(pages[0]?.getAttribute('content')).toBeNull();
    expect(pages[1]?.getAttribute('content')).toBeNull();

    controller.next();

    expect(steps[0]?.getAttribute('step')).toBe('completed');
    expect(steps[1]?.getAttribute('step')).toBe('active');
    expect(steps[2]?.getAttribute('step')).toBe('pending');
    expect(steps[1]?.getAttribute('aria-current')).toBe('step');
    expect(pages[0]?.hasAttribute('hidden')).toBe(true);
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(pages[1]?.getAttribute('content')).toBeNull();
    expect(document.querySelector('[wizard-content]')?.getAttribute('data-step')).toBe(
      'domain'
    );

    controller.destroy();
  });

  it('pairs pages by data-step / named step-page and fills missing ids', () => {
    document.body.innerHTML = wizardMarkup;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const steps = document.querySelectorAll<HTMLElement>('[steps] > [step]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(steps[0]?.id).toBe('onboard-step-1');
    expect(steps[1]?.id).toBe('onboard-step-2');
    expect(pages[0]?.id).toBe('onboard-page-1');
    expect(pages[1]?.id).toBe('onboard-page-2');
    expect(steps[0]?.getAttribute('aria-controls')).toBe('onboard-page-1');
    expect(pages[0]?.getAttribute('role')).toBe('region');
    expect(pages[0]?.getAttribute('aria-labelledby')).toBe('onboard-step-1');

    controller.destroy();
  });

  it('pairs by aria-controls even when document order differs', () => {
    document.body.innerHTML = `
      <div wizard-shell>
        <ol steps>
          <li step="active" aria-controls="plan-page">Plan</li>
          <li step="pending" aria-controls="welcome-page">Welcome</li>
        </ol>
        <section step-page id="welcome-page" hidden>Welcome</section>
        <section step-page id="plan-page">Plan</section>
      </div>
    `;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(pages[0]?.hasAttribute('hidden')).toBe(true);
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);

    controller.next();
    expect(pages[0]?.hasAttribute('hidden')).toBe(false);
    expect(pages[1]?.hasAttribute('hidden')).toBe(true);

    controller.destroy();
  });

  it('wires marked next/prev and disables them at the ends', () => {
    document.body.innerHTML = wizardMarkup;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const prev = document.querySelector<HTMLButtonElement>('[wizard-prev]');
    const next = document.querySelector<HTMLButtonElement>('[wizard-next]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(prev?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);

    next?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(prev?.disabled).toBe(false);

    next?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[2]?.hasAttribute('hidden')).toBe(false);
    expect(next?.disabled).toBe(true);
    expect(controller.current()).toBe(2);

    prev?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(next?.disabled).toBe(false);

    controller.destroy();
  });

  it('discovers unmarked buttons in [step-nav]', () => {
    document.body.innerHTML = `
      <div wizard-shell>
        <ol steps>
          <li step="active">One</li>
          <li step="pending">Two</li>
        </ol>
        <section step-page>First</section>
        <section step-page hidden>Second</section>
        <div step-nav>
          <button type="button">Back</button>
          <button type="button">Continue</button>
        </div>
      </div>
    `;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const buttons = document.querySelectorAll<HTMLButtonElement>('[step-nav] button');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(buttons[0]?.disabled).toBe(true);
    expect(buttons[1]?.disabled).toBe(false);

    buttons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(buttons[0]?.disabled).toBe(false);
    expect(buttons[1]?.disabled).toBe(true);

    buttons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[0]?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('default mode jumps to completed steps but not pending', () => {
    document.body.innerHTML = wizardMarkup;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const steps = document.querySelectorAll<HTMLElement>('[steps] > [step]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    steps[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[0]?.hasAttribute('hidden')).toBe(false);
    expect(pages[2]?.hasAttribute('hidden')).toBe(true);

    controller.next();
    controller.next();
    expect(pages[2]?.hasAttribute('hidden')).toBe(false);

    steps[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[0]?.hasAttribute('hidden')).toBe(false);
    expect(steps[0]?.getAttribute('step')).toBe('active');
    expect(steps[1]?.getAttribute('step')).toBe('pending');

    controller.destroy();
  });

  it('linear mode ignores tracker clicks and still allows next/prev', () => {
    document.body.innerHTML = wizardMarkup.replace(
      'wizard-shell name="onboard"',
      'wizard-shell="linear" name="onboard"'
    );
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const steps = document.querySelectorAll<HTMLElement>('[steps] > [step]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    controller.next();
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);

    steps[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(steps[1]?.getAttribute('step')).toBe('active');

    controller.prev();
    expect(pages[0]?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('free mode jumps to any step from the tracker', () => {
    document.body.innerHTML = wizardMarkup.replace(
      'wizard-shell name="onboard"',
      'wizard-shell="free" name="onboard"'
    );
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const steps = document.querySelectorAll<HTMLElement>('[steps] > [step]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    steps[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[2]?.hasAttribute('hidden')).toBe(false);
    expect(steps[2]?.getAttribute('step')).toBe('active');
    expect(steps[0]?.getAttribute('step')).toBe('completed');
    expect(controller.current()).toBe(2);

    controller.destroy();
  });

  it('goTo accepts an index or a pairing token', () => {
    document.body.innerHTML = wizardMarkup;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    controller.goTo('plan');
    expect(pages[2]?.hasAttribute('hidden')).toBe(false);
    expect(controller.current()).toBe(2);

    controller.goTo(0);
    expect(pages[0]?.hasAttribute('hidden')).toBe(false);
    expect(controller.current()).toBe(0);

    controller.destroy();
  });

  it('does not enhance orphan wizard markup', () => {
    document.body.innerHTML = `
      <ol steps>
        <li step="active" data-step="welcome">Welcome</li>
      </ol>
      <section step-page="welcome">Should stay untouched.</section>
      <div step-nav>
        <button type="button" wizard-next>Continue</button>
      </div>
    `;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const step = document.querySelector<HTMLElement>('[step]');
    const page = document.querySelector<HTMLElement>('[step-page]');
    const next = document.querySelector<HTMLButtonElement>('[wizard-next]');

    next?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    step?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(step?.id).toBe('');
    expect(step?.getAttribute('aria-controls')).toBeNull();
    expect(page?.getAttribute('role')).toBeNull();
    expect(page?.hasAttribute('hidden')).toBe(false);
    expect(next?.disabled).toBe(false);

    controller.destroy();
  });

  it('ignores buttons inside pages when discovering tracker steps', () => {
    document.body.innerHTML = `
      <div wizard-shell>
        <ol steps>
          <li step="active">One</li>
          <li step="pending">Two</li>
        </ol>
        <section step-page>
          <button type="button">Copy</button>
          First
        </section>
        <section step-page hidden>Second</section>
        <div step-nav>
          <button type="button" wizard-next>Continue</button>
        </div>
      </div>
    `;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const copy = document.querySelector<HTMLElement>('[step-page] button');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    copy?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(pages[0]?.hasAttribute('hidden')).toBe(false);
    expect(pages[1]?.hasAttribute('hidden')).toBe(true);
    expect(copy?.getAttribute('aria-controls')).toBeNull();

    controller.destroy();
  });

  it('activates a completed step from the keyboard on non-button items', () => {
    document.body.innerHTML = wizardMarkup;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const steps = document.querySelectorAll<HTMLElement>('[steps] > [step]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    controller.goTo(2);
    expect(steps[0]?.getAttribute('tabindex')).toBe('0');

    steps[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    );

    expect(pages[0]?.hasAttribute('hidden')).toBe(false);
    expect(steps[0]?.getAttribute('step')).toBe('active');

    controller.destroy();
  });

  it('enables [wizard-complete] only on the last step', () => {
    document.body.innerHTML = `
      <div wizard-shell>
        <ol steps>
          <li step="active">One</li>
          <li step="pending">Two</li>
        </ol>
        <section step-page>First</section>
        <section step-page hidden>Second</section>
        <div step-nav>
          <button type="button" wizard-next>Continue</button>
          <button type="button" wizard-complete>Finish</button>
        </div>
      </div>
    `;
    stopWizardRuntime();

    const controller = createWizard({ root: document.body });
    const complete = document.querySelector<HTMLButtonElement>('[wizard-complete]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(complete?.disabled).toBe(true);

    controller.next();
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(complete?.disabled).toBe(false);

    complete?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(controller.current()).toBe(1);

    controller.destroy();
  });

  it('syncs late-rendered wizard markup', async () => {
    stopWizardRuntime();
    const controller = createWizard({ root: document.body });

    document.body.innerHTML = `
      <div wizard-shell name="late">
        <ol steps>
          <li step="active" data-step="one">One</li>
          <li step="pending" data-step="two">Two</li>
        </ol>
        <section step-page="one">Arrived after boot</section>
        <section step-page="two" hidden>Second</section>
        <div step-nav>
          <button type="button" wizard-next>Continue</button>
        </div>
      </div>
    `;

    await flushRuntime();

    const steps = document.querySelectorAll<HTMLElement>('[steps] > [step]');
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(steps[0]?.id).toBe('late-step-1');
    expect(pages[0]?.id).toBe('late-page-1');
    expect(steps[0]?.getAttribute('step')).toBe('active');

    document
      .querySelector('[wizard-next]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);

    controller.destroy();
  });

  it('advances once when a manual controller coexists with the auto runtime', () => {
    document.body.innerHTML = wizardMarkup;
    startWizardRuntime();

    const controller = createWizard({ root: document.body });
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    document
      .querySelector('[wizard-next]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    expect(pages[0]?.hasAttribute('hidden')).toBe(true);
    expect(controller.current()).toBe(1);

    controller.destroy();
  });
});

describe('startWizardRuntime', () => {
  it('is an idempotent singleton that auto-enhances imported markup', () => {
    document.body.innerHTML = wizardMarkup;
    stopWizardRuntime();

    const first = startWizardRuntime();
    const second = startWizardRuntime();
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');

    expect(first).toBe(second);

    document
      .querySelector('[wizard-next]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
  });

  it('does not auto-start on DOMContentLoaded after stopWizardRuntime', async () => {
    stopWizardRuntime();
    vi.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const mod = await import('./wizard-runtime.js');
    document.body.innerHTML = wizardMarkup;
    mod.stopWizardRuntime();
    document.dispatchEvent(new Event('DOMContentLoaded'));

    document
      .querySelector('[wizard-next]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const pages = document.querySelectorAll<HTMLElement>('[step-page]');
    expect(pages[1]?.hasAttribute('hidden')).toBe(true);

    mod.startWizardRuntime();
    document
      .querySelector('[wizard-next]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pages[1]?.hasAttribute('hidden')).toBe(false);
    mod.stopWizardRuntime();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });
  });
});
